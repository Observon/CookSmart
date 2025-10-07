# CookSmart – Guia de Ambiente e Variáveis

## Variáveis de Ambiente

Crie um arquivo `.env.local` na pasta `ui/` com os valores abaixo (ajuste conforme o seu backend):

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

No backend `api/`, configure um arquivo `.env` (ou exporte variáveis) com:

```
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DATABASE
JWT_SECRET=uma_chave_segura_qualquer
FRONTEND_ORIGIN=http://localhost:3001
PORT=3000
```

## Como executar o projeto

1. **Backend** (`api/`)
   - Instale dependências: `pnpm install`
   - Gere o cliente Prisma (opcional após mudanças de esquema): `pnpm prisma generate`
   - Rode as migrações: `pnpm prisma migrate deploy`
   - Inicie em modo dev: `pnpm run start:dev`

2. **Frontend** (`ui/`)
   - Instale dependências: `pnpm install`
   - Inicie em modo dev na porta 3001: `pnpm run dev`

## Hooks de Dados

- `useIngredients()` – Carrega, cria, atualiza e remove ingredientes usando os serviços de `ui/lib/services/ingredients.ts`. Retorna estados `ingredients`, `loading`, `saving`, `error`, além das ações `refresh`, `createIngredient`, `updateIngredient`, `deleteIngredient`.
- `useRecipes()` – Fornece operações equivalentes para receitas via `ui/lib/services/recipes.ts`.

Ambos os hooks dependem do `AuthProvider` para obter o `token`. Certifique-se de estar autenticado antes de usá-los.

## Check-list rápido

- [ ] Backend rodando em `http://localhost:3000`
- [ ] Frontend rodando em `http://localhost:3001`
- [ ] `NEXT_PUBLIC_API_URL` aponta para o backend
- [ ] Usuário autenticado (login/cadastro) antes de acessar telas internas
