---
title: "Particionamento e Shuffle no Spark: O guia definitivo para não fazer besteira"
description: "Particionar tudo não vai salvar sua performance. Entenda quando repartition ajuda, quando atrapalha, e por que seu partitionBy pode estar te sabotando."
date: 2026-02-24
tags: [spark, python, performance, partitioning]
slug: spark-partitioning-shuffle-benchmark
authors: [thiago]
---

Você já ouviu aquele conselho: "particione seus dados pro Spark processar mais rápido"? Pois é, eu também. E na teoria faz todo sentido - mais partições = mais paralelismo = mais rápido, certo? **ERRADO.**

Na prática, particionar errado pode fazer seu job ficar **3x mais lento**. E aquele `partitionBy()` que todo mundo usa no write pode estar criando um problema de performance ao invés de resolver. Nesse benchmark eu testei 5 cenários diferentes pra mostrar quando particionar ajuda, quando atrapalha, e como não cair nas armadilhas clássicas. 

**Plot twist:** A maioria das "otimizações clássicas" **piorou a performance** nesse experimento. E isso não é falha - é o aprendizado mais valioso! Descobri na prática que contexto importa mais que receitas prontas. Dataset pequeno (192MB) + ambiente local + baixa cardinalidade = cenário onde overhead supera benefício. Os mesmos conceitos brilhariam com GBs de dados em cluster distribuído.

Spoiler: o padrão de 200 partições do Spark não é mágico, e `repartition()` antes de `groupBy` raramente é boa ideia.

## Benchmark 3 - Particionamento e Shuffle: A verdade que ninguém te conta

### Antes de quebrar tudo, vamos entender o básico

**O que diabos é uma partição?**

Na verdade essa é uma das partes mais importantes de entender, no Spark, seus dados não ficam todos juntos num único lugar. Eles são divididos em pedaços chamados **partições**. Cada partição é processada por uma **task** em paralelo, e cada task roda em um **core** da CPU.

A matemática é simples:
- 1 partição = 1 task = 1 core trabalhando
- 16 partições em uma máquina de 8 cores = 1ª rodada processa 8, depois outras 8
- 4 partições em uma máquina de 16 cores = só usa 4 cores, desperdício!

**O problema:** Particionar demais ou de menos causa problemas diferentes:

| Situação | Problema | Sintoma |
|----------|----------|---------|
| Muitas partições pequenas | Overhead de scheduling | Spark gasta mais tempo organizando tasks do que processando |
| Poucas partições grandes | Falta de paralelismo | Alguns cores trabalham, outros ficam ociosos |
| Partições desbalanceadas (skew) | Um executor faz tudo | Job termina quando o mais lento acabar |

**E o shuffle? O que é isso?**

Shuffle é quando o Spark precisa **redistribuir dados entre executors**. Imagine que você tem dados assim:

```
Executor 1: [user_id=1, user_id=3, user_id=5]
Executor 2: [user_id=1, user_id=2, user_id=5]
Executor 3: [user_id=2, user_id=3, user_id=4]
```

Você faz um `groupBy("user_id")`. O Spark precisa juntar todos os `user_id=1` no mesmo lugar, todos os `user_id=2` juntos, etc. Isso envolve:

1. **Serializar** dados na memória → bytes
2. **Enviar** pela rede para outros executors
3. **Escrever** temporariamente no disco
4. **Ler** de volta
5. **Desserializar** bytes → objetos

Percebe o número de operações só pra fazer isso? É **CARO**. E acontece toda vez que você faz: `groupBy()`, `join()`, `orderBy()`, `repartition()`, `distinct()`.

**A pegadinha:** Adicionar `repartition()` "pra melhorar performance" muitas vezes adiciona um shuffle extra sem necessidade. É tipo você colocar mais etapas numa corrida de revezamento achando que vai ficar mais rápido - não vai.

### O Dataset de Teste

Usei o mesmo dataset que estou usando pra esses testes o NYC Taxi (1.5M registros, ~192MB em CSV, ~40MB em Parquet). Dados esses que JÁ estavam em 16 partições após a leitura. Cluster local com memória limitada - perfeito pra ver os problemas aparecerem.

As transformações envolvem `groupBy` pesado com múltiplas agregações - operação que SEMPRE causa shuffle, então é uma boa base pra testes.

---

## Os 5 Experimentos Explicados

### **Experimento 1: spark.sql.shuffle.partitions - O ajuste que ninguém faz rs**

**Propósito:** Descobrir se o padrão de 200 partições faz sentido.

**O que fiz:**
Rodei o mesmo `groupBy` complexo (pegando hora, dia da semana, vendor_id e calculando médias) variando o número de partições criadas **após o shuffle**:

```python
spark.conf.set("spark.sql.shuffle.partitions", N)
df.groupBy(hour(...), dayofweek(...), "vendor_id").agg(...)
```

Testei: 50, 100, 200, 400, 800 partições.

**Por que isso importa?**

Quando você faz `groupBy`, o Spark cria N partições novas. O padrão é 200. Mas se você tem:
- Dados pequenos + ambiente local = 200 é demais
- Dados gigantes + cluster grande = 200 é pouco

**Resultados:**

| shuffle.partitions | Tempo | Grupos resultantes |
|-------------------|-------|-------------------|
| 50 | 2.00s | 336 |
| **100** | **0.71s** ⚡ | 336 |
| 200 | 0.84s | 336 |
| 400 | 0.78s | 336 |
| 800 | 1.02s | 336 |

**Análise:**

- Com **50**: Poucas partições, tasks grandes, executors ficam na fila esperando
- Com **100**: Sweet spot perfeito pro tamanho do dataset e cores disponíveis
- Com **200** (padrão): Já começa a ter overhead, mas ainda razoável
- Com **800**: Overhead de gerenciar 800 tasks pequenas supera qualquer benefício de paralelismo

**Speedup:** 100 partições foi **2.8x mais rápido** que 50, e **1.4x mais rápido** que 800.

**Lição crítica:** O padrão de 200 foi pensado pra clusters grandes com TBs de dados. Se você tá rodando local ou com datasets menores, **ajuste isso**:

```python
# Regra prática: ~128MB por partição
tamanho_dados_mb = 1000
partitions = tamanho_dados_mb // 128
spark.conf.set("spark.sql.shuffle.partitions", partitions)
```

Pra uma entrevista, talvez seja legal, citar que você sempre faz o profile primeiro e ajusta baseado no tamanho real dos dados, não no padrão cego. Isso já vai mostrar que você se preocupa em enxergar o que os seus dados DE FATO precisam antes de mais nada.

---

### **Experimento 2: repartition() antes de groupBy - A otimização que piorou tudo**

**Propósito:** Testar se redistribuir dados antes de agregar melhora performance.

**O que fiz:**
Comparei 4 cenários:
1. `groupBy` direto (sem repartition)
2. `repartition(50)` → `groupBy`
3. `repartition(100)` → `groupBy`
4. `repartition(200)` → `groupBy`

**Lógica (errada):** "Se eu reparticionar antes, os dados vão estar mais balanceados e o groupBy vai ser mais rápido."

**Resultados:**

| Cenário | Tempo repartition | Tempo groupBy | Total |
|---------|------------------|---------------|-------|
| Sem repartition | - | 0.52s | **0.52s** ⚡ |
| repartition(50) | 0.43s | 1.50s | 1.93s |
| repartition(100) | 0.35s | 1.36s | 1.71s |
| repartition(200) | 0.42s | 1.80s | 2.22s |

**WTF?** Adicionar `repartition()` deixou tudo **até 4x mais lento!**

**Por que isso aconteceu?**

O `groupBy` **JÁ FAZ shuffle interno**. Quando você adiciona `repartition()` antes, você está fazendo:

1. Shuffle do `repartition()` (redistribuir dados uniformemente)
2. Shuffle do `groupBy` (agrupar por chave)

Acabou que eu adicionei um shuffle extra completamente desnecessário. É como se você organizasse seus livros por cor, depois organizasse de novo por tamanho - pra que fazer duas vezes?

**Quando eu acho que o repartition() antes de groupBy faria sentido?**

Só em um caso: **data skew severo**. Se 99% dos seus dados têm `vendor_id=1` e 1% têm `vendor_id=2`, o Spark vai criar uma partição gigante e outra minúscula. Um executor vai fazer todo o trabalho enquanto outros ficam ociosos.

Nesse caso, `repartition()` força redistribuição uniforme e pode ajudar. Mas nos meus dados, não havia skew, acho que essa massa de dados tava bonitinha demais pra esse teste - então foi desperdício puro.

**Lição crítica:** Não adicione `repartition()` "só por garantia". Meça primeiro se você tem skew, aí sim considere. E use `.repartition(col("chave"))` (por coluna), não `.repartition(N)` (número arbitrário).

---

### **Experimento 3: coalesce() vs repartition() - Quando menos shuffle é mais**

**Propósito:** Entender a diferença entre as duas formas de mudar o número de partições.

**O que fiz:**
Tentei reduzir de 16 → 20 partições com ambos os métodos.

**Diferença conceitual:**

| Método | Como funciona | Shuffle? |
|--------|---------------|----------|
| `coalesce(N)` | Combina partições existentes localmente | **NÃO** (quando reduz) |
| `repartition(N)` | Redistribui todos os dados uniformemente | **SIM, sempre** |

`coalesce()` é tipo você juntar duas caixas de livros numa só - rápido, sem reorganizar tudo. `repartition()` é jogar todos os livros no chão e montar as caixas do zero.

**Resultados:**

| Método | Tempo | Partições finais |
|--------|-------|-----------------|
| `coalesce(20)` | 0.20s | 16 |
| `repartition(20)` | 0.22s | 20 |

**Detalhe importante:** `coalesce()` ficou em **16 partições**, não 20!

**Por quê?**

`coalesce()` **não pode aumentar** partições, só diminuir. Como eu pedi 20 e tinha 16, ele não fez nada. O `repartition()` fez o shuffle e chegou em 20.

**Mas coalesce foi mais rápido mesmo fazendo "nada"?**

Sim, porque ele pelo menos contou as partições e confirmou que não precisava fazer nada. O `repartition()` fez todo o shuffle desnecessariamente.

**Quando usar cada um:**

```python
# ✅ Antes de salvar no disco (reduzir arquivos)
df.coalesce(1).write.parquet("output/")  # 1 arquivo só

# ✅ Quando precisa aumentar partições
df.repartition(200)  # Mais paralelismo

# ❌ NUNCA faça isso
df.repartition(10).write.parquet()  # Shuffle desnecessário antes de write
# Use coalesce(10) em vez disso!
```

**Lição crítica:** Em uma entrevista ou teste, explique que `coalesce()` é otimização de escrita (reduzir arquivos), e `repartition()` é pra aumentar paralelismo ou rebalancear skew. Não são intercambiáveis.

---

### **Experimento 4: repartition(col) - A otimização que não funcionou**

**Propósito:** Testar se particionar pela coluna do `groupBy` evita shuffle.

**O que fiz:**

```python
# Cenário 1: Normal
df.groupBy("vendor_id").agg(...)

# Cenário 2: Repartition pela chave primeiro
df.repartition("vendor_id").groupBy("vendor_id").agg(...)
```

**Lógica:** "Se eu particionar por `vendor_id` antes, todos os valores iguais vão estar na mesma partição, então o `groupBy` não vai precisar fazer shuffle!"

**Resultados:**

| Cenário | Tempo |
|---------|-------|
| GroupBy normal | **0.38s** ⚡ |
| repartition(col) + GroupBy | 0.47s |

**De novo mais lento!** Por que essa otimização inteligente não funciona?

**Motivo 1:** O Spark não é inteligente o suficiente pra detectar que você já particionou pela chave certa e pular o shuffle interno do `groupBy`. Então ele faz o shuffle mesmo assim :/

**Motivo 2:** Depois eu dei uma olhada e a coluna `vendor_id` tem apenas **2 valores únicos** (vendedor 1 e vendedor 2). Particionar por isso cria **2 partições gigantes** desbalanceadas. É péssimo pra paralelismo.

**Quando essa técnica funcionaria?**

Em cenários com **múltiplos groupBy pela mesma chave**:

```python
df_by_user = df.repartition("user_id")  # 1 shuffle aqui

# Agora os 3 groupBy não fazem shuffle, aproveitam o repartition
metrics1 = df_by_user.groupBy("user_id").agg(...)
metrics2 = df_by_user.groupBy("user_id").agg(...)  
metrics3 = df_by_user.groupBy("user_id").agg(...)
```

Você paga 1 shuffle no início, economiza 3 shuffles depois. Mas pro meu caso de uso (um único `groupBy`), foi overhead.

**Lição crítica:** `repartition(col)` só vale pra pipelines com múltiplas operações pela mesma chave. E a coluna precisa ter cardinalidade alta (milhares de valores únicos), não 2.

---

### **Experimento 5: partitionBy() no write - A cilada dos 2 arquivos**

**Propósito:** Testar se escrever dados organizados em pastas por coluna acelera leituras filtradas.

**O que fiz:**

```python
# Escrita 1: Normal
df.write.parquet("trips_normal/")

# Escrita 2: Particionada por vendor_id
df.write.partitionBy("vendor_id").parquet("trips_partitioned/")

# Depois, ler com filtro vendor_id=1
spark.read.parquet("trips_normal/").filter(col("vendor_id") == 1)
spark.read.parquet("trips_partitioned/").filter(col("vendor_id") == 1)
```

**Teoria:** Quando você usa `partitionBy()`, o Spark cria uma estrutura assim:

```
trips_partitioned/
  vendor_id=1/
    part-00000.parquet
    part-00001.parquet
  vendor_id=2/
    part-00000.parquet
    part-00001.parquet
```

Quando você filtra `vendor_id=1`, o Spark só lê a pasta `vendor_id=1/`, ignorando `vendor_id=2/`. Isso se chama **partition pruning** e deveria ser muito mais rápido.

**Resultados:**

| Operação | Tempo | Observação |
|----------|-------|------------|
| Write normal | 3.86s | Vários arquivos juntos |
| Write partitionBy | 5.99s | Criou pastas |
| Read normal + filter | **0.61s** ⚡ | Leu tudo, filtrou |
| Read partitioned + filter | 0.85s | Leu só 1 pasta... |

**WHAAAAT?** A leitura particionada foi **MAIS LENTA**? E a escrita particionada levou 55% mais tempo?

**O que deu errado?**

Três problemas clássicos:

**1. Cardinalidade baixa:** `vendor_id` tem apenas 2 valores. Criei 2 pastas apenas.

**2. Dataset pequeno:** 192MB não é "big data". O overhead de navegar estrutura de pastas, abrir múltiplos arquivos pequenos, e fazer I/O em disco supera o benefício de ler menos dados.

**3. Many small files problem:** Dentro de cada pasta, o Spark escreveu vários arquivos pequenos (um por task). Arquivos pequenos são ineficientes - há overhead de metadata, seek time, e system calls.

**Quando partitionBy() realmente ajuda?**

- **Dataset grande:** GBs ou TBs, não MBs
- **Cardinalidade adequada:** Centenas ou milhares de valores (anos/meses/estados), não 2
- **Queries frequentes filtradas:** Se você sempre filtra por essa coluna

**Exemplo bom:**

```python
# Dataset: 10TB de logs
# Coluna: date (365 valores únicos por ano)
# Query: sempre filtra últimos 7 dias

df.write.partitionBy("date").parquet("logs/")
# Resultado: Só lê 7 pastas, ignora outras 358
```

**Exemplo ruim (o meu caso):**

```python
# Dataset: 192MB
# Coluna: vendor_id (2 valores únicos)
# Query: nem sempre filtra por vendor_id

df.write.partitionBy("vendor_id").parquet("trips/")
# Resultado: Overhead > benefício
```

**Lição crítica:** Em entrevista, fale sobre os **3 critérios** pra usar `partitionBy()`:
1. Dados grandes (GBs+)
2. Coluna com boa cardinalidade (não booleano, não 2 valores)
3. Queries filtradas frequentemente por essa coluna

Se faltar algum, não use. Caso contrário, você tá criando problema.

---

## Resultados Consolidados - O que realmente importa

| Teste | Métrica | Resultado | Insight |
|-------|---------|-----------|---------|
| shuffle.partitions=100 vs 800 | Tempo | 0.71s vs 1.02s | **1.4x mais rápido** ajustando do padrão ❌ |
| Sem repartition vs repartition(50) | Tempo | 0.52s vs 1.93s | repartition deixou **3.7x mais lento** 🤯 |
| coalesce vs repartition | Shuffle | Sim vs Não | coalesce evita shuffle desnecessário ✅ |
| GroupBy normal vs repartition(col) | Tempo | 0.38s vs 0.47s | Otimização "inteligente" piorou 24% 😬 |
| Read partitionBy vs normal | Tempo | 0.85s vs 0.61s | partitionBy mais lento em dataset pequeno 📉 |

---

## O Guia Definitivo - Quando fazer o quê

### **1. Ajuste shuffle.partitions baseado nos seus dados**

```python
# ❌ Nunca deixe no padrão sem pensar
# spark.conf.get("spark.sql.shuffle.partitions")  # 200

# ✅ Calcule baseado no tamanho real
tamanho_gb = 10  # Seus dados pós-shuffle
partitions = (tamanho_gb * 1024) // 128  # ~128MB/partição
spark.conf.set("spark.sql.shuffle.partitions", partitions)
```

**Regra prática:**
- Dataset < 1GB → 50-100 partições
- Dataset 1-10GB → 100-200 partições  
- Dataset > 10GB → 200-500 partições
- Cluster grande → Múltiplo do número de cores × executors

### **2. Não adicione repartition() só porque sim**

```python
# ❌ Ruim - shuffle desnecessário
df.repartition(200).groupBy("col").agg(...)

# ✅ Bom - só se detectou skew
if has_skew(df, "col"):
    df = df.repartition("col")
df.groupBy("col").agg(...)
```

**Checklist antes de repartition:**
- [ ] Profilei e vi skew nos dados?
- [ ] Vou fazer múltiplas operações pela mesma chave?
- [ ] Tenho certeza que vai compensar o shuffle adicional?

Se respondeu "não" pra qualquer uma, **não use**.

### **3. Use coalesce() antes de write**

```python
# ❌ Gera muitos arquivos pequenos
df.write.parquet("output/")

# ✅ Controla número de arquivos
num_files = max(1, tamanho_mb // 128)  # 1 arquivo por 128MB
df.coalesce(num_files).write.parquet("output/")
```

Many small files problem é real. Cada arquivo tem overhead de metadata e I/O. Arquivos grandes (mas não gigantes) são mais eficientes.

### **4. partitionBy() com critério, não por padrão**

```python
# ❌ Ruim - cardinalidade baixa
df.write.partitionBy("is_fraud").parquet()  # True/False = 2 pastas

# ❌ Ruim - cardinalidade alta demais
df.write.partitionBy("user_id").parquet()  # 1M pastas = caos

# ✅ Bom - cardinalidade ideal
df.write.partitionBy("year", "month").parquet()  # ~12-24 pastas/ano
```

**Cardinalidade ideal:** 100-10.000 valores únicos.

### **5. Monitor shuffle size no Spark UI**

Depois de rodar um job, vá em `localhost:4040` (Spark UI):
- Stages → Shuffle Read/Write
- Se vê shuffle de GBs em dataset de MBs → tem problema
- Tabs SQL/Stages mostram onde aconteceu shuffle

---

## A Pergunta de Entrevista Clássica

**Entrevistador:** "Seu job Spark está lento. Você percebe que tem muitas operações de `groupBy`. Como você otimizaria?"

**Resposta ruim (mas comum):**
> "Eu adicionaria `repartition()` antes dos `groupBy` pra balancear os dados."

Por que é ruim? Você acabou de adicionar shuffle extra sem diagnosticar o problema real.

**Resposta boa:**

> "Primeiro eu abriria o Spark UI pra entender o bottleneck:
> 
> 1. **Shuffle size:** Se shuffle tá movendo muitos dados, o problema pode ser data skew. Eu checaria a distribuição com `df.groupBy("chave").count()`. Se 1 valor domina 90%, eu usaria salting ou repartition por coluna.
> 
> 2. **Número de partições:** Eu checaria `spark.sql.shuffle.partitions`. Se tá em 200 (padrão) mas meus dados pós-shuffle têm só 1GB, eu reduziria pra ~50-100 pra evitar overhead de scheduling.
> 
> 3. **Múltiplos groupBy encadeados:** Se eu faço vários `groupBy` pela mesma chave, eu consideraria cachear o resultado intermediário ou usar `repartition(col)` uma vez no início.
> 
> 4. **Spark 3.0+:** Eu checaria se AQE (Adaptive Query Execution) tá habilitado. Ele ajusta partições dinamicamente e faz coalesce automático, o que pode resolver sem intervenção manual.
>
> Só depois de profilear eu tomaria decisão. Não saio adicionando `repartition()` sem evidência."

**Bônus points:** Se você mencionar que conhece `skew join hints` (Spark 3.2+) ou `REBALANCE` operation, você vira senior na hora.

---

## Conclusão

Particionamento não é mágica. É trade-off:

- **Mais partições** = mais paralelismo, mas overhead de gerenciamento
- **Menos partições** = menos overhead, mas desperdício de cores ociosos
- **Shuffle** = redistribuição cara que você deve evitar quando possível

As lições mais importantes:

1. **Ajuste shuffle.partitions** baseado nos seus dados, não no padrão
2. **Não adicione repartition()** sem razão técnica clara
3. **Use coalesce()** pra reduzir partições, repartition() pra aumentar
4. **partitionBy() no write** só vale pra dados grandes com boa cardinalidade
5. **Profile primeiro**, otimize depois
---

## Por que os resultados foram "negativos" (e por que isso é valioso)

Você pode ter notado que a maioria das "otimizações" **piorou** a performance. Isso não é bug - é **feature**! Aqui está o contexto:

### **Fatores que limitaram os benefícios:**

| Fator | Impacto | Como seria diferente |
|-------|---------|---------------------|
| **Dataset pequeno (192MB)** | Overhead > benefício | Com 5-50GB, os ganhos apareceriam |
| **Ambiente local (Docker)** | Sem latência de rede | Em cluster AWS/GCP, shuffle otimizado faria diferença |
| **Cardinalidade baixa (vendor_id=2)** | partitionBy ineficiente | Com pickup_date (365 valores), speedup seria 10-50x |
| **Dados balanceados** | repartition() desnecessário | Com skew real (90% em 1 valor), rebalancear aceleraria |
| **Operações únicas** | Shuffle extra sem reuso | Com 5+ groupBy pela mesma chave, valeria a pena |

### **O valor real desse resultado**

Todo tutorial diz: "use repartition, use partitionBy, sempre funciona!" 

Esse benchmark prova: **NÃO SEMPRE**.

Em produção você precisa entender:
- Quando overhead compensa
- Qual o tamanho mínimo de dados pra técnica valer
- Como ambiente (local vs cluster) muda tudo

**Isso é conhecimento de senior**, não de júnior que aplica receitas sem pensar.

### **Quando as otimizações BRILHARIAM:**

```python
# Cenário ideal pro repartition():
large_df = spark.read.parquet("events/")  # 50GB, skewed
df_balanced = large_df.repartition("user_id")

result1 = df_balanced.groupBy("user_id").agg(...)
result2 = df_balanced.groupBy("user_id", "date").agg(...)  
result3 = df_balanced.join(users, "user_id")  # Co-located!
# 1 shuffle pagou por 3 operações pesadas

# Cenário ideal pro partitionBy():
huge_logs.write.partitionBy("year", "month", "day").parquet("s3://logs/")
# Dataset: 10TB, coluna com 1000+ dias
# Query: SELECT * WHERE date = '2026-02-20'
# Resultado: Lê 1 pasta, ignora 999 = 1000x mais rápido
```

### **Lição final**

Se você rodar esse benchmark no seu trabalho com dados reais (GBs+), os resultados seriam opostos - as otimizações ganhariam. Mas entender **por que não funcionou aqui** é mais valioso que só ver números verdes.

Na entrevista, quando te perguntarem "quando usar repartition?", você pode responder: 

> "Depende. Rodei benchmarks e descobri que em datasets < 1GB o overhead supera o benefício. Só vale com dados grandes, múltiplas operações pela mesma chave, ou quando há data skew comprovado. Não é receita - é trade-off."

Isso te separa de 90% dos candidatos que repetem o que leram sem entender o contexto.
No próximo post vou explorar joins e broadcast - outra área cheia de pegadinhas onde todo mundo erra. 🚀
