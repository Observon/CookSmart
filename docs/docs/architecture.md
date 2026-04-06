---
id: architecture
title: Arquitetura
sidebar_position: 3
---

# 🏗 Arquitetura

## Visão Geral

CookSmart é um monorepo gerenciado com **pnpm workspaces** contendo três pacotes principais:

```
CookSmart/
├── api/                              # Backend NestJS
│   ├── prisma/                       # Schema do Prisma + migrações
│   │   ├── migrations/
│   │   └── schema.prisma
│   └── src/
│       ├── auth/                     # Auth local com suporte a reset via Supabase
│       ├── common/                   # Filtros, interceptors e helpers globais
│       ├── ingredients/              # Casos de uso de ingredientes
│       ├── ocr/                      # Integração Amazon Textract
│       ├── operational-expenses/     # Despesas operacionais
│       ├── purchases/                # Compras e histórico de notas
│       └── recipes/                  # CRUD de receitas e margem de lucro
├── ui/                               # Frontend Next.js 14 (App Router)
│   ├── app/                          # Rotas, layouts e reset de senha
│   ├── components/                   # Telas e componentes reutilizáveis
│   │   └── ui/                       # Design system baseado em Radix/Tailwind
│   ├── context/                      # Providers (ex.: AuthProvider)
│   ├── hooks/                        # Hooks de dados (ingredientes, receitas, etc.)
│   ├── lib/                          # Serviços de API, Supabase client, utilitários
│   └── __tests__/                    # Testes Vitest + RTL
└── docs/                             # Documentação Docusaurus (este site)
```

## Backend (API)

O backend é construído com **NestJS** e organizado em módulos independentes.

### Módulos Principais

| Módulo | Descrição |
|---|---|
| `auth` | Registro, login e reset de senha (JWT + Supabase) |
| `ingredients` | CRUD de ingredientes e controle de preços unitários |
| `recipes` | CRUD de receitas com cálculo de custo e preço sugerido |
| `purchases` | Registro de compras e atualização de preços de ingredientes |
| `ocr` | Integração com Amazon Textract para leitura de notas fiscais |
| `operational-expenses` | Despesas operacionais (roadmap) |
| `common` | Filtros de exceção, interceptors e helpers globais |

### Banco de Dados

O banco é **PostgreSQL** com schema gerenciado pelo **Prisma ORM**. Migrações versionadas ficam em `api/prisma/migrations/`.

## Frontend (UI)

O frontend usa **Next.js 14 App Router** com **TypeScript** e **Tailwind CSS**.

### Hooks de Dados

Os principais fluxos utilizam hooks que encapsulam comunicação com a API:

- **`useIngredients()`** (`ui/hooks/use-ingredients.ts`) – CRUD de ingredientes com estados `loading`, `saving`, `error`.
- **`useRecipes()`** (`ui/hooks/use-recipes.ts`) – CRUD de receitas com estados/ações equivalentes.

Ambos dependem de `useAuth()` para obter o token JWT.

## Execução Local & CORS

- O backend NestJS escuta em `http://localhost:3000` e habilita CORS via `app.enableCors({ origin: FRONTEND_ORIGIN, credentials: true })`.
- O frontend roda em `http://localhost:3001` para evitar conflito de porta.
- Configure `FRONTEND_ORIGIN=http://localhost:3001` no backend e `NEXT_PUBLIC_API_URL=http://localhost:3000` no frontend.

## Funcionalidades Principais

### Margem de Lucro Personalizada

Ao criar ou editar uma receita, o campo `profitMargin` (%) é enviado para a API. O backend calcula:

```
suggestedPrice = costPerServing × (1 + profitMargin / 100)
```

Ambos os valores (`costPerServing` e `suggestedPrice`) são persistidos e retornados nos endpoints `/recipes`.

### Gestão de Ingredientes

- Cadastro com nome, unidade de medida e preço unitário.
- Histórico de compras e variação de preços.
- Atualização e exclusão de ingredientes.

### Gestão de Receitas

- Criação com lista de ingredientes e quantidades.
- Cálculo automático do custo total.
- Sugestão de preço de venda baseado na margem configurada.
