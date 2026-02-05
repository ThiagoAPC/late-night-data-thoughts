# Copilot Instructions  Blog Técnico com GitHub Pages (Sem SaaS)

##  Objetivo do Projeto

Construir um **blog técnico minimalista**, hospedado **gratuitamente no GitHub Pages**, com:

- Publicação fácil via Markdown
- Layout limpo e focado em leitura
- Conteúdo técnico (programação, IA, ferramentas, experimentos)
- Automação máxima
- Controle total do código e do deploy
- IA usada apenas como **assistente**, nunca como plataforma

---

##  Restrições Importantes

-  NÃO usar Hextra
-  NÃO usar plataformas SaaS de blog
-  NÃO usar serviços pagos (Algolia, CMS externo etc.)
-  NÃO depender de backend
-  NÃO criar soluções overengineered

Tudo deve funcionar com:

- GitHub
- GitHub Pages
- GitHub Actions
- Código estático

---

##  Stack Obrigatória

- **Framework:** Docusaurus
- **Conteúdo:** Markdown / MDX
- **Hospedagem:** GitHub Pages
- **Deploy:** GitHub Actions
- **Busca:** Local (Ctrl + K)
- **Tema:** Customizado via CSS
- **Dark mode:** Obrigatório
- **SEO:** Básico e funcional

---

##  Referência de Layout

O blog deve seguir este padrão visual:

### Header

- Nome do blog à esquerda
- Link `About`
- Ícone do GitHub
- Campo de busca com hint `Ctrl + K`
- Ícone de RSS
- Toggle Light/Dark

### Home

- Título grande central (ex: "MeuBlog''s Blog")
- Lista de posts **agrupados por Ano + Mês**
- Cada grupo com heading próprio
- Links em formato bullet
- Sidebar direita:
  - "On this page"
  - Âncoras automáticas para cada Ano/Mês
  - Scroll sincronizado

### Página de Post

- Leitura confortável
- TOC automático
- Code blocks bem destacados
- Suporte a tabelas, listas e snippets

---

##  Estrutura Esperada

```
/
 blog/
   2026-02-post.md
   ...
 src/
   pages/
     index.tsx       # Home custom (ano/mês)
   components/
   css/
      custom.css
 static/
 .github/
   workflows/
      deploy.yml
 docusaurus.config.ts
 sidebars.ts
 package.json
 README.md
```

---

##  Regras de Comportamento para a IA

### Geral

- Atuar como **engenheiro de software experiente**
- Sempre priorizar **simplicidade**
- Explicar brevemente o *porquê* de cada decisão
- Não sugerir bibliotecas desnecessárias
- Preferir soluções nativas do Docusaurus

### Código

- Antes de editar arquivos: explicar intenção
- Ao sugerir mudanças:
  - Fornecer o **arquivo completo**
  - Informar exatamente **onde salvar**
- Sempre considerar:
  - `baseUrl` correto do GitHub Pages
  - `trailingSlash`
  - Build estático compatível

---

##  Fases Obrigatórias do Desenvolvimento

### 1 Scaffold Inicial

- Gerar projeto Docusaurus
- Configurar `url` e `baseUrl`
- Garantir que rode localmente
- Subir para GitHub

### 2 Deploy Automático

- Criar GitHub Action que:
  - Instala dependências
  - Faz build
  - Publica no branch `gh-pages`
- Push na `main` deve publicar automaticamente

### 3 Tema e Estilo

- Customizar:
  - Navbar
  - Tipografia
  - Espaçamentos
- Implementar dark mode elegante
- Estilo minimalista (documentação/blog técnico)

### 4 Home Customizada

- Criar página React que:
  - Consome metadados do blog
  - Agrupa posts por Ano/Mês
  - Ordena do mais recente para o mais antigo
  - Gera anchors estáveis (`2026-february`)
- Implementar sidebar direita "On this page"

### 5 Busca Local

- Implementar busca local
- Atalho `Ctrl + K`
- Indexar posts e páginas
- Sem serviços externos

### 6 Conteúdo e Blog

- Criar template padrão de post
- Fluxo ideal:
  - Criar Markdown
  - Commit
  - Push
  - Publicado automaticamente

### 7 SEO Básico

- Sitemap
- RSS / Atom
- Canonical URL
- OpenGraph / Twitter Cards

### 8 Página About

- Texto curto e profissional
- Links essenciais
- Visual consistente com o blog

---

##  Template Obrigatório de Frontmatter

```yaml
---
title: "Título do Post"
description: "Resumo curto e objetivo"
date: 2026-02-01
tags: [programacao, ia, ferramentas]
slug: titulo-do-post
---
```

---

##  Checklist Antes de Publicar

- [ ] `npm start` funciona
- [ ] Build funciona localmente
- [ ] Home agrupa por Ano/Mês corretamente
- [ ] Sidebar "On this page" funciona
- [ ] `Ctrl+K` abre busca
- [ ] Dark mode OK
- [ ] RSS acessível
- [ ] Sitemap gerado
- [ ] Deploy automático funcionando

---

##  Anti-Padrões

- Overengineering
- Dependência de SaaS
- Plugins não mantidos
- CSS excessivamente complexo
- Layout que prejudica leitura

---

##  Filosofia

> "Publicar deve ser fácil.  
> Ler deve ser confortável.  
> Manter deve ser simples."

A IA faz o **heavy lifting** técnico.  
O humano foca em **ideias**, **escrita** e **curadoria**.

---

##  Resultado Esperado

Um blog:

- Rápido
- Minimalista
- Técnico
- Gratuito
- Totalmente sob controle do repositório
- Fácil de manter e evoluir

**Sempre otimizar para menos fricção e mais publicação.**

---

##  Próximo Passo (Recomendo MUITO)

Posso agora:

1 Ajustar isso especificamente para **Copilot Chat vs Claude Code**  
2 Criar o **prompt padrão de criação de posts técnicos**  
3 Gerar o **deploy.yml** pronto  
4 Criar o **index.tsx** da home agrupada por Ano/Mês  
5 Criar o **custom.css** inicial
