---
sidebar_position: 1
---

# Visão Geral do Frontend

O frontend do CookSmart é construído com **Next.js 14** utilizando o App Router.

## Tecnologias

| Tecnologia | Versão | Descrição |
|-----------|--------|-----------|
| Next.js | 14+ | Framework React com SSR/App Router |
| TypeScript | 5+ | Tipagem estática |
| Tailwind CSS | 3+ | Framework CSS utility-first |
| Radix UI | — | Componentes acessíveis |
| React Hook Form | — | Gerenciamento de formulários |
| Sonner | — | Notificações toast |
| Vitest | — | Testes unitários |

## Estrutura de diretórios

```
ui/
├── app/                    # Rotas e layouts (App Router)
│   └── reset-password/     # Fluxo de redefinição de senha
├── components/             # Telas e componentes reutilizáveis
│   └── ui/                 # Design system (Radix + Tailwind)
├── context/                # Providers (AuthProvider)
├── hooks/                  # Hooks de dados
├── lib/                    # Serviços de API e utilitários
│   └── services/           # Clientes de API (ingredients, recipes)
└── __tests__/              # Testes Vitest + Testing Library
```

## Autenticação

O `AuthProvider` (`ui/context/auth-context.tsx`) gerencia o estado de autenticação:

- Salva token e usuário no `localStorage`
- Protege `ui/app/page.tsx` (redireciona para login se não autenticado)
- Expõe `logout()` para encerrar a sessão

## Hooks de Dados

Os principais hooks encapsulam a comunicação com a API:

### `useIngredients()`

```ts
const {
  ingredients, loading, saving, error,
  refresh, createIngredient, updateIngredient, deleteIngredient
} = useIngredients();
```

### `useRecipes()`

```ts
const {
  recipes, loading, saving, error,
  refresh, createRecipe, updateRecipe, deleteRecipe
} = useRecipes();
```

Ambos dependem do `useAuth()` para obter o token JWT.

## Executando o Frontend

```bash
cd ui

# Desenvolvimento (porta 3001)
pnpm run dev

# Build de produção
pnpm run build

# Servir build de produção
pnpm run start

# Lint
pnpm run lint

# Testes
pnpm run test
pnpm run test:watch
```

## Configuração de CORS

O backend deve ter `FRONTEND_ORIGIN=http://localhost:3001` configurado para aceitar chamadas do frontend.

## Variáveis de Ambiente

| Variável | Exemplo | Descrição |
|---------|---------|-----------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | URL base do backend |
