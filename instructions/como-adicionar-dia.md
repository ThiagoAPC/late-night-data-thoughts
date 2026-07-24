# Como adicionar um novo dia na Jornada SQL

Guia rápido para adicionar posts de novos dias sem precisar lembrar de nada.

---

## Estrutura de pastas

```
blog/
├── 2026-07-24-jornada-sql.md        ← Hub (índice da série)
└── jornada-sql/
    ├── dia-01/
    │   ├── index.md                 ← Post do dia 1
    │   └── imagem.png               ← Imagens do dia 1 ficam aqui
    ├── dia-02/
    │   └── index.md
    └── ...
```

---

## Passo a passo: Adicionando o Dia 6 (exemplo)

### 1. Criar a pasta e o arquivo

Crie a pasta `blog/jornada-sql/dia-06/` e dentro dela o arquivo `index.md`.

### 2. Copiar este template para o `index.md`

```markdown
---
title: "Dia 6: TÍTULO DO DIA AQUI"
description: "Descrição curta do que foi feito no dia."
date: 2026-07-30
tags: [sql, databases, jornada-sql]
slug: jornada-sql/dia-06
authors: [thiago]
---

[← Voltar para a Jornada](/blog/jornada-sql)

<!--truncate-->

COLE O CONTEÚDO DO DIA AQUI

---

[← Dia 5](/blog/jornada-sql/dia-05) · **[Dia 7 →](/blog/jornada-sql/dia-07)**
```

> **Atenção:** Remova o link "→ Dia 7" se o dia seguinte ainda não existir — o build vai falhar com `onBrokenLinks: 'throw'`.

### 3. Atualizar o hub (`blog/2026-07-24-jornada-sql.md`)

Adicione uma linha na lista de capítulos:

```markdown
* [📄 Dia 6: TÍTULO DO DIA](/blog/jornada-sql/dia-06)
```

### 4. Atualizar o link do dia anterior

Abra `blog/jornada-sql/dia-05/index.md` e adicione o link para o dia 6 no rodapé:

```markdown
[← Dia 4](/blog/jornada-sql/dia-04) · **[Dia 6 →](/blog/jornada-sql/dia-06)**
```

---

## Adicionando imagens

1. Coloque a imagem na **mesma pasta** do `index.md` do dia.
   ```
   blog/jornada-sql/dia-06/
   ├── index.md
   ├── diagrama-query.png
   └── resultado-consulta.png
   ```

2. Referencie no markdown com caminho relativo:
   ```markdown
   ![Descrição da imagem](./diagrama-query.png)
   ```

As imagens são **centralizadas automaticamente** via CSS — não precisa fazer nada além disso.

---

## Rodando localmente para visualizar

```bash
# Com Node diretamente
npm start

# Com Docker
docker compose up
```

O site fica disponível em `http://localhost:3000/late-night-data-thoughts/`.

---

## Deploy

O deploy é **automático**. Basta fazer push para a branch `main`:

```bash
git add .
git commit -m "feat: adiciona dia 6 da jornada SQL"
git push origin main
```

O GitHub Actions (`deploy.yml`) detecta o push, faz o build e publica no GitHub Pages automaticamente. Normalmente leva 1-2 minutos.

---

## Checklist rápido antes de dar push

- [ ] Novo arquivo `blog/jornada-sql/dia-XX/index.md` criado
- [ ] `slug` no frontmatter está correto (`jornada-sql/dia-XX`)
- [ ] `date` atualizada para o dia real
- [ ] Hub (`2026-07-24-jornada-sql.md`) atualizado com o novo link
- [ ] Dia anterior atualizado com link para o novo dia
- [ ] Links de navegação apontam apenas para dias que **existem**
- [ ] Imagens estão na pasta do dia (se houver)
