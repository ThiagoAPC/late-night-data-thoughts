---
title: "Configurando ESLint e Prettier em Projetos JavaScript"
description: "Aprenda a configurar ESLint e Prettier para manter seu código limpo, consistente e livre de erros comuns em projetos JavaScript e TypeScript."
date: 2025-12-20
tags: [javascript, ferramentas, linting]
slug: eslint-prettier-configuracao
authors: [thiago]
---

Aprenda a configurar ESLint e Prettier para manter seu código limpo, consistente e livre de erros comuns em projetos JavaScript e TypeScript.

<!-- truncate -->

## Por que usar ESLint e Prettier?

Manter código consistente em equipes é desafiador. ESLint e Prettier automatizam essa tarefa:

- **ESLint**: Encontra e corrige problemas no código JavaScript
- **Prettier**: Formata código de forma consistente

## Instalação

```bash
npm install -D eslint prettier eslint-config-prettier eslint-plugin-prettier
```

## Configuração do ESLint

```javascript
// .eslintrc.js
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'error',
  },
};
```

## Configuração do Prettier

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

## Scripts no package.json

```json
{
  "scripts": {
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "format": "prettier --write src/"
  }
}
```

## Integração com VS Code

Instale as extensões ESLint e Prettier e configure format on save para produtividade máxima.

## Conclusão

Investir tempo na configuração inicial economiza horas de revisão de código e discussões sobre estilo.
