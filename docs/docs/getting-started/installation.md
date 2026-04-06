---
sidebar_position: 1
---

# Instalação e Configuração

Este guia descreve como configurar o ambiente de desenvolvimento do CookSmart.

## Pré-requisitos

- **Node.js** 20+
- **pnpm** 8+
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

### 1. Configure as variáveis de ambiente

```bash
cd api
cp .env.example .env
```

### 2. Edite o arquivo `.env`

```env
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DATABASE
JWT_SECRET=sua_chave_secreta_aqui
FRONTEND_ORIGIN=http://localhost:3001
PORT=3000
```

### 3. Execute as migrações do Prisma

```bash
pnpm prisma:format
pnpm prisma migrate dev
pnpm prisma:generate
```

### 4. Inicie o servidor

```bash
pnpm run start:dev
```

O backend estará disponível em `http://localhost:3000`

## Configuração do Frontend

### 1. Configure as variáveis de ambiente

```bash
cd ui
cp .env.example .env.local
```

### 2. Edite o arquivo `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Inicie o servidor de desenvolvimento

```bash
pnpm run dev
```

O frontend estará disponível em `http://localhost:3001`

## Check-list rápido

- [ ] Backend rodando em `http://localhost:3000`
- [ ] Frontend rodando em `http://localhost:3001`
- [ ] `NEXT_PUBLIC_API_URL` aponta para o backend
- [ ] Usuário autenticado (login/cadastro) antes de acessar telas internas

## Documentação adicional

- [Configuração AWS / Textract](../backend/ocr#configuração-aws) — Para usar o OCR de notas fiscais
- [Configuração S3 Local](../backend/ocr#configuração-s3-local) — Para desenvolvimento local sem AWS real
