---
title: "Cache e Persist no Spark: Quando usar e quando não usar"
description: "Entenda na prática quando cache ajuda, quando atrapalha, e qual estratégia de persistência escolher. Spoiler: não é sempre que cachear é a melhor ideia."
date: 2026-02-10
tags: [Spark, Python, Performance]
slug: spark-cache-persist-benchmark
authors: [thiago]
---

Uma das primeiras otimizações que todo mundo aprende no Spark é o famoso `.cache()`. Mas quando realmente vale a pena usar? E qual a diferença entre `cache()` e `persist()`? Mais importante: **quando cache PIORA a performance ao invés de melhorar?**

Nesse benchmark, eu rodei 4 experimentos diferentes pra responder essas perguntas de forma prática, sem dogmas. Eu acho válido isso, especialmente porque no trabalho com certeza só cachear um df não vai garantir performance só por já estar na memória, infraestrutura tem custos, não existe "sempre faça X" - existe contexto, trade-offs e decisões.

## Benchmark 2 - Cache e Persist: O guia prático

### Antes de rodar, vamos entender a teoria

**O que é cache?**

Acho que a maior parte das pessoas, quando pensam em cache podem lembrar de "Ah limpa o cache do navegador, pra ver se arruma." Não? Ok, realmente não é um conhecimento usual pra quem não está familiarizado com conceitos de memória e etc, porém é mais simples do que parece, na verdade, o cache é uma camada de armazenamento temporário que guarda cópias de dados acessados frequentemente para que, na próxima vez, eles sejam entregues de forma muito mais rápida, evitando o esforço de buscá-los na fonte original. Quando você faz `.cache()` em um DataFrame, você só está dizendo pro Spark: "ei, esse dado aqui eu vou usar de novo, deixa ele na memória RAM em vez de recalcular toda vez".

Isso é importante pois o Spark é **lazy** - ele não executa transformações até você chamar uma **action** (como `.count()`, `.collect()`, `.show()`). Isso significa que: enquanto você escrever códigos que não tem relação com a **action** ele não vai executa-la, pode parecer estranho mas na verdade isso pode ser muito útil, pois você pode determinar a melhor hora pra poder começar a executar suas **actions** dentro de uma ETL, dentro de um plano otimizado e organizado, garantindo mais performance e velocidade, esse é o core do **lazy evaluation** do spark, garantir que tudo esteja distribuído da melhor maneira possível pra executar as tarefas mais rápido.

```python
df = spark.read.parquet("dados.parquet")
df_filtrado = df.filter(col("idade") > 18)  # ← Nada acontece ainda
df_filtrado.cache()                          # ← Ainda nada!
df_filtrado.count()                          # ← AGORA sim materializa e cacheia
```

No exemplo acima veja como foi organizado o código:

1 - Ele cria o dataframe com base no parquet.
2 - Ele define uma **Transformação**, algo que ele deve fazer, no caso, filtrar o df por idade > 18, e deixa anotado.
3 - Ele dita que nesse ponto é pra guardar o que foi feito anteriormente na memória, pra poder utilizar depois
4 - Aqui é onde ocorre a **Ação**, na primeira vez que rodar ele não vai ter o benefício do cache pois é a primeira vez que o Spark está executando o plano de ação, porém ele está contando e guardando na memória conforme o cache() solicitou, então na próxima vez, sabemos que foi sinalizado pra ele deixar na memória o filtro no df por idade > 18, então ele não precisa fazer tudo outra vez, pois os valores filtrados já estão na memória, dessa forma é só o spark ir no cache e pegar o que ele guardou anteriormente.

Deu pra entender como isso melhora a performance?  O "Gargalo" (Lentidão) é Ir até o disco, ler arquivos gigantes, converter formatos e aplicar filtros iniciais é a parte mais cara e demorada.

O "Pulo do Gato" é quando você dá o .cache(), você está dizendo: "Spark, depois de ter todo esse trabalho de ler e filtrar, não jogue isso fora! Segure na memória RAM". As Próximas Operações: Para todas as perguntas seguintes, o Spark pula a "etapa do disco" e trabalha direto com os dados que já estão mastigados na memória RAM, que é milhares de vezes mais rápida.

Em resumo: Você "sacrifica" um pouco de memória para ganhar muito tempo. Em um job de **batch** isso é muito recomendável, porque você sabe que os dados não vão mudar nos próximos minutos enquanto o seu script roda para aquele batch, isso é o que separa um código que demora 1 hora de um que demora 5 minutos.

Tentei focar bastante nessa parte porque pra mim era confuso entender isso, e ainda mais, saber onde colocar um cache() bem posicionado. Vamos falar agora de persist()

**Cache vs Persist: qual a diferença?**

Na prática, `cache()` é só um atalho:

```python
df.cache()  # ←  É a mesma coisa que...
df.persist(StorageLevel.MEMORY_ONLY)  # ← ...isso aqui
```

Mas o `persist()` te dá controle sobre **ONDE** guardar os dados, ele é mais customizável:

| Storage Level | Onde guarda? | Vantagem | Desvantagem |
|---------------|-------------|----------|-------------|
| **MEMORY_ONLY** | Só RAM | Máxima velocidade | Se RAM encher, perde dados |
| **MEMORY_AND_DISK** | RAM com backup em disco | Seguro, quase tão rápido | Usa disco |
| **DISK_ONLY** | Só disco | Não usa RAM | Mais lento que memória |
| **MEMORY_ONLY_SER** | RAM serializado | Usa menos RAM | CPU pra serializar/desserializar |
| **OFF_HEAP** | Memória fora da JVM | Não sofre GC pauses | Mais complexo |

**Por que isso importa?**

Imagine que você tem um pipeline de ML:

```python
df_features = prepare_features(df_raw)  # ← Transformações pesadas

# Treinar modelo = múltiplas passadas nos mesmos dados
for epoch in range(100):
    train_model(df_features)  # ← Sem cache, recalcula tudo 100x
```

Sem cache, o Spark recalcula `prepare_features()` **100 vezes**. Com cache, calcula **1 vez** e reutiliza.

Mas e se você vai usar os dados só **1 vez**? Aí cache vira overhead desnecessário, que muita gente vai tentar te convencer que é obrigatório pra ter performance mas não é.

### O Experimento

Usei o mesmo dataset que no benchmark anterior (NYC Taxi, 1.5M registros), mas dessa vez fiz transformações mais pesadas pra simular um cenário real de feature engineering:

- Cálculo de distância euclidiana entre coordenadas
- Detecção de horário de pico
- Classificação de viagens longas vs curtas
- Conversão de durações

Isso cria um DataFrame "caro de calcular" - perfeito pra testar cache.

### Os 4 Experimentos Explicados

#### **Experimento 1: Baseline - Múltiplas queries SEM cache**

**Propósito:** Entender o comportamento padrão do Spark sem otimizações.

**O que fiz:**
1. Carreguei os dados do Parquet
2. Apliquei transformações complexas (5 colunas derivadas)
3. Rodei 3 queries de agregação diferentes
4. **Repeti isso 3 vezes** pra ver consistência

**Por que testar isso?**
Precisava de um baseline pra comparar. Mas mais importante: queria ver se o Spark tem alguma otimização interna que simula cache entre execuções próximas.

**Resultado esperado:** Uns 2-3 segundos por rodada, consistente.

**Resultado real:**
```
Run 1: 2.24s
Run 2: 207.42s (WTF?!)
Run 3: 0.68s
Média: 70.11s
```

**O que aconteceu?**

Algumas inconsistências podem ter ocorrido aqui:
1. **Cold start**: primeira execução compila código, inicializa otimizações (Java JIT)
2. **Sistema operacional**: cache de disco do Windows pode ter ajudado no Run 3
3. **Garbage Collection**: JVM pode ter pausado durante Run 2
4. **Spark shuffle**: pode ter tido reorganização de partições entre runs

Isso prova que **sem cache explícito, você não tem controle sobre performance, e casos como esse segundo podem acontecer**. É loteria.

---

#### **Experimento 2: COM cache() - O speedup mágico**

**Propósito:** Ver o impacto real de cachear dados que são usados múltiplas vezes.

**O que fiz:**
```python
df_transformed.cache()
df_transformed.count()  # ← Força materialização
# Agora roda as mesmas 3 queries, 3 vezes
```

**Por que o `.count()` logo após `.cache()`?**

Porque cache é lazy! Se você não forçar uma action, o cache só vai acontecer quando você usar o DataFrame - e aí você perde a oportunidade de medir o tempo de cache separado do tempo de query.

**Resultado:**
```
Tempo pra cachear: 2.06s
Depois disso:
  Run 1: 0.30s
  Run 2: 0.55s  
  Run 3: 0.46s
  Média: 0.44s
```

**Analisando os números:**

- **70.11s → 0.44s** = **160x mais rápido!**
- Mas tem o overhead inicial de 2.06s pra materializar
- Total: 2.06 + (0.44 × 3) = **3.38s** pra 3 rodadas
- Sem cache: 210.34s pra 3 rodadas

**Ponto de equilíbrio:** Nesse caso, teoricamente, você precisa de pelo menos umas **2-3 queries** pro cache compensar. Se for usar o dado 1x só, o overhead de 2.06s não vai valer a pena.

---

#### **Experimento 3: Battle royale dos Storage Levels**

**Propósito:** Agora que vimos que o persist() é mais customizável que o cache, vamos descobrir qual estratégia de persist() é melhor no mundo real.

**O que fiz:**
Testei 3 storage levels diferentes, cada um com uma query de agregação:

1. **MEMORY_ONLY**: RAM pura, sem backup
2. **MEMORY_AND_DISK**: RAM com fallback pra disco
3. **DISK_ONLY**: Só disco

**Por que testar isso?**

Em produção, você nem sempre (quase nunca :p) tem RAM infinita. Se seu DataFrame é gigante e você usa `MEMORY_ONLY`, o Spark vai tentar cachear tudo na RAM. Se não couber, ele **descarta** partições antigas pra abrir espaço - e aí você perde o cache das primeiras partições quando tá processando as últimas, isso pode gerar inconsistências e perda de dados.

`MEMORY_AND_DISK` é mais seguro: se RAM encher, despeja pro disco. Você ainda tem o cache, só que mais lento pras partições que foram pro disco.

**Resultados:**

| Storage Level | Tempo de cache | Tempo de query | Total |
|---------------|----------------|----------------|-------|
| MEMORY_ONLY | 1.37s | 0.25s | 1.62s |
| MEMORY_AND_DISK | 1.23s | 0.15s | 1.38s |
| DISK_ONLY | 1.20s | 0.21s | 1.41s |

**Surpresa:** MEMORY_AND_DISK teve tempo de query **mais rápido!** Bom, isso significa que tudo que eu falei foi pro espaço? Não, vamos entender:

**Por quê?**

Duas razões:

1. **Serialização otimizada**: O Spark sabe que pode precisar despejar dados pro disco, então serializa de forma mais eficiente desde o início. Com MEMORY_ONLY, ele guarda objetos Java "crus", que ocupam mais espaço.

2. **Dataset pequeno**: Com apenas ~2GB em memória, tudo coube na RAM. Não houve spill pra disco. Mas ganhamos a serialização otimizada de graça!

**Lição:** Para datasets pequenos-médios (que cabem na RAM), `MEMORY_AND_DISK` não tem desvantagem prática e te dá segurança. É minha recomendação padrão.

---

#### **Experimento 4: O teste da query única**

**Propósito:** Responder a pergunta: "Vale cachear se vou usar os dados SÓ UMA VEZ?"

**O que fiz:**
Rodei uma única query de agregação de duas formas:
1. Sem cache - leitura direto do Parquet
2. Com cache - cache + query

**Resultado:**
```
Sem cache: 0.33s
Com cache: 1.12s (0.79s cache + 0.33s query)
```

**Análise:**

Cache adicionou **0.79s de overhead**. Para uma query única, você fica **2.4x mais lento**, então tá aí para quem fica falando que em tudo tem que colocar cache porque é uma "boa prática".

**Por que cache é mais lento aqui?**

Porque cache envolve:
1. Desserializar dados do Parquet
2. Aplicar transformações
3. Serializar e guardar na RAM
4. Desserializar da RAM pra executar a query

Sem cache, você pula o passo 3 e usa direto do Parquet (que já é otimizado e comprimido).

**Quando vale cachear então?**

Vamos fazer as contas. Se o overhead é 0.79s e cada query sem cache leva 0.33s:

```
Queries | Sem cache | Com cache | Vencedor
--------|-----------|-----------|----------
1       | 0.33s     | 1.12s     | SEM cache
2       | 0.66s     | 1.45s     | SEM cache  
3       | 0.99s     | 1.78s     | SEM cache
4       | 1.32s     | 2.11s     | SEM cache
5       | 1.65s     | 2.44s     | SEM cache
10      | 3.30s     | 4.09s     | SEM cache
20      | 6.60s     | 7.39s     | SEM cache
```

Espera... cache nunca ganha? 🤔

**Não!** Esse cálculo assume que "sem cache" sempre vai levar 0.33s. Mas lembra do Experimento 1? Sem cache é **inconsistente**. Em produção, você pode ter:
- Contenção de I/O (outros jobs lendo o mesmo storage)
- Network latency (se dados tão no S3)
- Cold cache do OS

E lá no Experimento 2, vimos que sem cache a média foi **70.11s** por rodada, não 0.33s.

**A verdade:** Query única em ambiente ideal = não precisa de cache. Query única em produção com dados grandes = depende do contexto.

---

### Os Resultados - Resumão

| Teste | Tempo | O que aprendi |
|-------|-------|---------------|
| Sem cache (3 runs) | 70.11s/run | Inconsistente, não confiável |
| Com cache (3 runs) | 0.44s/run | **160x speedup** |
| Overhead de cache | 2.06s | Precisa de 3+ queries pra compensar |
| MEMORY_ONLY | 0.25s | Rápido mas arriscado |
| MEMORY_AND_DISK | 0.15s | **Mais rápido** e seguro! |
| DISK_ONLY | 0.21s | OK, mas perde pra RAM |
| Query única s/ cache | 0.33s | Baseline |
| Query única c/ cache | 1.12s | 2.4x mais lento |

### O que dá para tirar de lição com isso?

#### **1. Cache não é grátis - tem overhead**

Toda vez que você faz `.cache()`, o Spark precisa:
- Serializar os dados
- Alocar memória
- Gerenciar o ciclo de vida do cache

Para datasets pequenos e queries simples, esse overhead pode custar mais do que recalcular.

**Na prática:**
```python
# Ruim - cache pra uso único
df.cache()
df.show(10)  # Só isso? Não vale

# Bom - cache pra reuso
df.cache()
df.count()  # Materializa
result1 = df.filter(...).agg(...)
result2 = df.groupBy(...).agg(...)
result3 = df.join(other_df, ...)
```

#### **2. MEMORY_AND_DISK é o sweet spot**

Achei que ia ser mais lento por causa do fallback pra disco. Mas a serialização otimizada compensou.

**Recomendação:**
```python
from pyspark import StorageLevel

# Use isso como padrão
df.persist(StorageLevel.MEMORY_AND_DISK)
```

Só use `MEMORY_ONLY` se:
- Você TEM CERTEZA que cabe na RAM
- Pode aceitar recomputação se houver eviction
- Está otimizando os últimos 5% de performance

#### **3. Sempre force a materialização**

```python
# Problema: cache é lazy
df.cache()
result = df.filter(...).collect()  # Cache acontece aqui, misturado com a query

# Solução: force agora
df.cache()
df.count()  # Materializa e descarta resultado
result = df.filter(...).collect()  # Agora usa cache
```

Isso te dá:
- Controle sobre quando o overhead acontece
- Métricas mais limpas (separar tempo de cache vs tempo de query)
- Previsibilidade em produção

#### **4. Unpersist quando terminar**

```python
df.cache()
# ... usa o dataframe várias vezes ...
df.unpersist()  # Libera memória
```

Se você não fizer isso, o Spark vai gerenciar automaticamente (LRU), mas você perde controle. Em pipelines longos, isso pode causar thrashing de memória.

#### **5. O mito das múltiplas queries**

Todo mundo fala: "só cacheia se vai usar múltiplas vezes". Mas quantas vezes?

**Nesse benchmark:** Precisou de **5+ queries** pro cache compensar o overhead em ambiente ideal.

**Em produção:** Pode ser diferente porque:
- Dados vêm de storage remoto (S3, GCS) - latência de rede
- Transformações complexas - recomputação cara
- Cluster compartilhado - contenção de recursos

**Regra prática:** Se você vai usar 3+ vezes E as transformações são caras (joins, window functions, UDFs), cacheia.

---

### Então quando da pra usar cache/persist?

| Situação | Cache? | Storage Level |
|----------|--------|---------------|
| ML training (múltiplas iterações) | SIM | MEMORY_AND_DISK |
| Exploração interativa (Jupyter) | SIM | MEMORY_AND_DISK |
| Pipeline com reuso de dados | SIM | MEMORY_AND_DISK |
| ETL linear (ler → transformar → escrever) | NÃO | - |
| Query única em dados pequenos | NÃO | - |
| Query única em dados grandes/remotos | DEPENDE | MEMORY_AND_DISK |
| Dados intermediários usados 2x | DEPENDE | Meça! |
| Dados intermediários usados 5x+ | SIM | MEMORY_AND_DISK |

### Quando o entrevistador te pedir exemplo real de quando usar e quando não usar:

Imagine um pipeline de recomendação:

```python
# 1. Leitura e limpeza (transformações caras)
user_events = spark.read.parquet("events/")
user_features = prepare_user_features(user_events)  # ← Caro: joins, aggregations

# 2. Vamos usar user_features em 4 lugares:
user_features.persist(StorageLevel.MEMORY_AND_DISK)
user_features.count()  # Materializa

# 3. Múltiplos consumos
popular_items = user_features.filter(...).groupBy(...)       # 1
user_segments = user_features.groupBy(...).agg(...)          # 2  
recommendations = user_features.join(item_embeddings, ...)   # 3
user_profile = user_features.agg(...)                        # 4

# 4. Limpeza
user_features.unpersist()
```

Sem cache, `prepare_user_features()` rodaria **4 vezes**. Com cache, roda **1 vez**.

### Um exemplo real de quando NÃO usar

```python
# ETL simples
df = spark.read.parquet("raw/")
df_clean = df.filter(col("status") == "valid")
df_clean.cache()  # Por quê?? Vai usar 1x só!
df_clean.write.parquet("clean/")
```

Aqui o cache só adiciona overhead. Melhor:

```python
df = spark.read.parquet("raw/")
df.filter(col("status") == "valid").write.parquet("clean/")  # Simples e direto
```

### Conclusão

Cache não é bala de prata. É uma ferramenta que:
- **Ajuda muito** quando você reutiliza dados caros de calcular
- **Atrapalha** quando você tenta optimizar queries únicas
- **Funciona melhor** com MEMORY_AND_DISK como padrão
- **Precisa ser medido** no seu contexto específico

A regra de ouro: **meça antes de otimizar**. Rode seu pipeline sem cache, veja onde tem recomputação, aí sim adicione cache estrategicamente.

No próximo post vou explorar particionamento e shuffle - outra área cheia de mitos e decisões ruins. Até lá!
