---
id: setup
title: Configuração do Ambiente
sidebar_position: 2
---

# 🚀 Configuração do Ambiente

## Pré-requisitos

- **Node.js** 20+
- **pnpm** 10+
- **PostgreSQL** 14+

## Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/Observon/CookSmart.git
cd CookSmart
```

### 2. Instale as dependências

```bash
pnpm install
```

## Configuração do Backend

### Variáveis de Ambiente

Crie o arquivo `api/.env` a partir do exemplo:

```bash
cd api
cp .env.example .env
```

Edite `api/.env` com suas configurações:

```env
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DATABASE
JWT_SECRET=sua_chave_secreta_aqui
FRONTEND_ORIGIN=http://localhost:3001
PORT=3000
```

### Migrações do Banco

```bash
pnpm prisma:format
pnpm prisma migrate dev
pnpm prisma:generate
```

### Iniciar o Backend

```bash
pnpm run start:dev
```

O backend estará disponível em `http://localhost:3000`.  
A documentação Swagger interativa fica em `http://localhost:3000/docs`.

## Configuração do Frontend

### Variáveis de Ambiente

```bash
cd ui
# crie o arquivo manualmente ou copie um exemplo existente
```

Conteúdo de `ui/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Iniciar o Frontend

```bash
pnpm run dev
```

O frontend estará disponível em `http://localhost:3001`.

## Check-list Rápido

- [ ] Backend rodando em `http://localhost:3000`
- [ ] Frontend rodando em `http://localhost:3001`
- [ ] `NEXT_PUBLIC_API_URL` aponta para o backend
- [ ] Usuário autenticado antes de acessar telas internas

## Scripts Úteis

### Backend (Prisma)

```bash
pnpm prisma:format                    # Formatar schema
pnpm prisma:generate                  # Gerar client
pnpm prisma:migrate --name <titulo>   # Nova migração
pnpm prisma studio                    # Interface GUI do Prisma
```

### Backend (NestJS)

```bash
pnpm run build        # Build para produção
pnpm run start:prod   # Iniciar em modo produção
pnpm run lint         # Lint e fix
pnpm run format       # Formatar código
```

### Frontend (Next.js)

```bash
pnpm run build   # Build para produção
pnpm run start   # Iniciar em modo produção
pnpm run lint    # Linting
pnpm run test    # Testes unitários com Vitest
```

## Variáveis AWS (OCR)

Para usar o módulo de OCR com Amazon Textract, configure adicionalmente em `api/.env`:

```env
AWS_ACCESS_KEY_ID=sua_access_key
AWS_SECRET_ACCESS_KEY=sua_secret_key
AWS_REGION=us-east-1
TEXTRACT_BUCKET=nome-do-bucket
TEXTRACT_USE_S3=true
TEXTRACT_MAX_FILE_SIZE_MB=10
```
