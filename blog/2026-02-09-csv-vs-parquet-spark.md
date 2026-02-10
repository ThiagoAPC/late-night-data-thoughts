---
title: "Benchmarks úteis do Spark, por que você deve saber disso?"
description: "Através destes benchmarks simples do spark eu pretendo ilustrar conceitos relativamente básicos sobre estratégias de leitura de dados, porém que vão te auxiliar a enxergar a arquitetura de processamento de dados com um olhar um pouco mais pragmático."
date: 2026-02-09
tags: [spark, python, performance, bigdata, data-engineering]
slug: benchmarks-spark
authors: [thiago]
---

Basicamente um dos pontos iniciais na carreira de todo engenheiro de dados é conhecer, entender, experimentar e dominar frameworks de processamento de dados para Big Data, isso por que as necessidades de dados das grandes empresas aumentam exponencialmente conforme seus negócios crescem, o foco aqui não é te ensinar do básico o que é Spark e pra que ele serve, eu quero apenas ilustrar uma série de cenários onde certas práticas fazem diferença na hora de utilizar o Spark e talvez me incentivar a ter mais cuidado na hora de planejar como eu farei uso dessa tecnologia, tendo um olhar mais crítico sobre o processo inteiro como um todo.

## Benchmark 1 - CSV vs Parquet, na prática o que muda?

Essa primeira ideia de benchmark me veio na cabeça por que uma vez em uma entrevista me perguntaram qual a diferença entre ambos, e POR QUÊ eles são diferentes, eu respondi mecanicamente que Parquet era um formato de armazenamento colunar mas não tinha um conhecimento mais aprofundado pra dizer o que seria isso e como impacta em uma ETL em relação ao CSV (acho que eu me queimei já nessa pergunta :p), porém quero fixar isso na cabeça então vamos lá:

### Antes de rodar, vamos entender a teoria

**CSV (Comma-Separated Values):**
- Formato **orientado a linhas** - cada linha contém todos os campos do registro
- Texto puro, legível por humanos
- Não guarda informação de tipos (tudo é string)
- Para ler uma coluna específica, precisa ler a linha inteira

**Parquet:**
- Formato **orientado a colunas** - dados da mesma coluna ficam juntos (é estranho pensar nisso a princípio porém tente enxergar como o ato de "tombar" a tabela)
- Binário, comprimido, não legível diretamente
- Guarda metadados com tipos, estatísticas, etc.
- Para ler uma coluna, lê só aquela coluna (projection pruning)

Imagina uma tabela assim:

```
| id | nome   | idade |
|----|--------|-------|
| 1  | Ana    | 25    |
| 2  | Bruno  | 30    |
| 3  | Carla  | 28    |
```

No **CSV**, os dados ficam assim no disco:
```
1,Ana,25
2,Bruno,30
3,Carla,28
```

No **Parquet**, conceptualmente:
```
[1, 2, 3]           # coluna id
[Ana, Bruno, Carla] # coluna nome
[25, 30, 28]        # coluna idade
```

Isso muda TUDO quando você quer fazer uma query tipo `SELECT avg(idade) FROM tabela`. Porque pensa bem, você direciona a engine do Spark a ler DIRETAMENTE o que você precisa (idade, nesse caso), sem precisar varrer todas as linhas, ou seja, ao invés de ler 1 milhão de linhas são apenas as que contém as colunas desejadas. 

### E a consistência dos dados?

Esse é um ponto que muita gente ignora mas que podem te perguntar na entrevista, na hora de listar pontos positivos e negativos entre os dois, e a resposta mais exata é: **CSV não garante consistência de tipos**.

No CSV, tudo é texto. Uma coluna "idade" pode ter:
```
25
30
N/A
vinte e oito
-1
```

O Spark só vai descobrir esse problema quando tentar converter pra número - e aí você tem nulls inesperados, erros silenciosos ou jobs que quebram no meio, gerando dor de cabeça.

Já o **Parquet tem schema embutido**. Os tipos são definidos na escrita e validados na leitura. Se você tenta escrever uma string numa coluna INTEGER, o erro acontece antes, na escrita - não depois, quando o BI já tá mostrando dados errados pro negócio.

Isso é especialmente relevante em pipelines de dados onde:
- Dados vêm de fontes externas (APIs, parceiros, uploads manuais)
- Múltiplos times escrevem no mesmo dataset
- Você precisa garantir qualidade de dados pra downstream (BI, ML)

A [documentação oficial do Parquet](https://parquet.apache.org/docs/file-format/) explica como o schema é armazenado nos metadados do arquivo, garantindo que leituras futuras respeitem os tipos originais.

### Um experimento prático sobre o assunto

Pra ter um exemplo mais interessante e aplicável em situação de negócios, eu usei o dataset **NYC Taxi Trip Duration** do Kaggle (~1.5 milhões de viagens, 192MB em CSV) e rodei os seguintes testes:

1. Ler CSV com schema **inferido** (Spark adivinha os tipos)
2. Ler CSV com schema **definido** (eu passo os tipos)
3. Converter para Parquet e ler
4. Fazer queries simples em ambos

### Os Resultados

Aqui é onde a coisa fica interessante:

| Teste | Tempo | Observação |
|-------|-------|------------|
| CSV - Schema Inferido | **4.71s** | 😱 Spark leu o arquivo 2x |
| CSV - Schema Definido | **0.60s** | 8x mais rápido! |
| Parquet - Leitura | **0.55s** | Ainda mais rápido |
| Parquet - Query agregação | **0.31s** | 2x mais rápido que CSV |
| Parquet - Query com filtro | **0.34s** | Predicate pushdown |
| Parquet - Lendo 2 de 11 colunas | **0.42s** | Projection pruning |

E o tamanho em disco?

```
CSV:     191.30 MB
Parquet:  57.93 MB  → 70% menor!
```

### O que da pra tirar de lição com isso?

**1. Schema inferido: cilada ou praticidade**

Quando você faz `spark.read.csv("arquivo.csv", inferSchema=True)`, o Spark precisa:
1. Ler o arquivo inteiro uma vez só pra descobrir os tipos (se é string, double, int e etc)
2. Ler de novo pra realmente carregar os dados

São 4.71s vs 0.60s - quase **8x de diferença**. Em produção com TBs de dados, isso é a diferença entre uma pipeline de 1 hora e uma de 8 horas. Ou seja custos de 1 hora vs custos de 8 horas, deu pra entender como isso dói no bolso e gera menos valor ao cliente.

Mas calma - isso não significa que inferir é sempre ruim. A decisão depende do contexto:

**Quando vale a pena inferir:**
- Exploração inicial de dados (você ainda não conhece o schema)
- Datasets pequenos onde o overhead é irrelevante
- Prototipagem rápida e one-offs
- Quando o schema muda frequentemente e você quer flexibilidade pra se adaptar às mudanças

**Quando NÃO vale:**
- Pipelines de produção que rodam recorrentemente
- Datasets gigantes (GBs/TBs)
- Quando você já conhece a regra de negócio e o schema é estável
- Quando custo de cloud é uma preocupação

**Lição:** Avalie o trade-off. Definir schema explícito deixa código mais verboso e "acoplado", mas em produção com dados grandes, o ganho de performance compensa. Pra exploração e prototipagem, infer dá pra usar tranquilo.

```python
# Em produção com schema estável:
df = spark.read.schema(schema).csv("arquivo.csv", header=True)

# Em exploração ou dados pequenos:
df = spark.read.csv("arquivo.csv", header=True, inferSchema=True)
```

**2. Parquet comprime absurdamente bem**

70% de redução não é coincidência. Como os dados da mesma coluna ficam juntos, a compressão funciona muito melhor. Uma coluna de `vendor_id` que só tem valores 1 e 2 comprime pra quase nada. No CSV, esses valores estão espalhados em linhas e mais linhas dizendo pouca coisa várias vezes diferentes.

No nosso exemplo, tivemos o seguinte resultado:

Convertendo CSV para Parquet...
----------------------------------------
  Tempo conversão: 4.74s
  Tamanho CSV: 191.30 MB
  Tamanho Parquet: 57.93 MB
  Compressão: 69.7% menor

Repare o tamanho do arquivo antes e depois da conversão, você economiza espaço e ganha mais performance!

**Lição:** Se possível converta seus dados para Parquet na primeira etapa do pipeline.

**3. Predicate Pushdown é mágica**

Quando fiz uma query com filtro (`passenger_count > 2 AND trip_duration > 600`), o Parquet não precisou ler todos os 1.4 milhões de registros no dataset. Ele usa as estatísticas armazenadas nos metadados (min/max de cada bloco) para pular blocos inteiros que não atendem o filtro.

Teste adicional: Query com filtro (predicate pushdown)
  Linhas filtradas: 121,168
  Tempo: 0.34s

**4. Projection Pruning em ação**

Quando li só 2 colunas de 11:
- CSV: precisa ler a linha inteira, depois descartar 9 colunas
- Parquet: lê fisicamente só as 2 colunas necessárias

### Então quando da pra usar cada um?

| Situação | Use |
|----------|-----|
| Dados de entrada de sistemas legados | CSV (é o que você provavelmente vai receber pra ETL) |
| Troca com ferramentas que não suportam Parquet | CSV |
| Armazenamento intermediário/final | **Parquet** |
| Dados que serão lidos várias vezes | **Parquet** |
| Queries analíticas (BI, relatórios) | **Parquet** |

### Conclusão

O takeaway principal é: **CSV é pra entrada, Parquet é pra processamento**.

Se você tá lendo CSV direto do seu data lake em cada etapa do pipeline, você tá literalmente jogando performance (e dinheiro de cloud) no lixo. Converta pra Parquet logo na ingestão e colha os benefícios em todas as etapas seguintes.

Nos próximos posts vou explorar outros benchmarks: cache/persist, particionamento, estratégias de join e AQE. Valeu!

