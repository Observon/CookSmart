---
sidebar_position: 1
---

# Visão Geral do Backend

O backend do CookSmart é construído com **NestJS** e fornece uma API REST completa para autenticação, gestão de ingredientes, receitas, compras e OCR.

## Tecnologias

| Tecnologia | Versão | Descrição |
|-----------|--------|-----------|
| NestJS | 11+ | Framework Node.js server-side |
| Prisma | 6+ | ORM moderno para TypeScript |
| PostgreSQL | 14+ | Banco de dados relacional |
| JWT | — | Autenticação via JSON Web Tokens |
| Swagger | — | Documentação interativa da API |
| Amazon Textract | — | OCR de notas fiscais |

## Módulos

| Módulo | Descrição |
|--------|-----------|
| `auth` | Autenticação local com suporte a reset via Supabase |
| `ingredients` | CRUD de ingredientes e insumos |
| `recipes` | CRUD de receitas com cálculo de custo e margem de lucro |
| `purchases` | Registro de compras e histórico de notas |
| `ocr` | Integração Amazon Textract para leitura de notas fiscais |
| `operational-expenses` | Despesas operacionais _(roadmap)_ |
| `prisma` | Módulo compartilhado do Prisma Client |

## Estrutura de diretórios

```
api/
├── prisma/
│   ├── migrations/       # Histórico de migrações
│   └── schema.prisma     # Definição do schema
├── src/
│   ├── auth/             # Autenticação
│   ├── common/           # Filtros, interceptors e helpers globais
│   ├── ingredients/      # Módulo de ingredientes
│   ├── ocr/              # Integração Amazon Textract
│   ├── operational-expenses/
│   ├── purchases/        # Compras e histórico
│   └── recipes/          # Receitas e margem de lucro
└── test/                 # Testes E2E (Jest)
```

## Executando o Backend

```bash
# Desenvolvimento
pnpm run start:dev

# Produção
pnpm run build
pnpm run start:prod
```

## Documentação Interativa (Swagger)

Após iniciar o servidor, acesse `http://localhost:3000/docs` para explorar todos os endpoints disponíveis.

## Scripts Úteis

| Script | Descrição |
|--------|-----------|
| `pnpm prisma:format` | Formatar schema do Prisma |
| `pnpm prisma:generate` | Gerar cliente Prisma |
| `pnpm prisma:migrate --name <titulo>` | Criar nova migração |
| `pnpm prisma studio` | Abrir GUI do Prisma |
| `pnpm run test` | Executar testes unitários |
| `pnpm run test:e2e` | Executar testes E2E |
| `pnpm run test:cov` | Gerar relatório de cobertura |
| `pnpm run lint` | Verificar lint |
| `pnpm run format` | Formatar código |

## Autenticação

O sistema usa JWT. Os endpoints `/auth/register` e `/auth/login` retornam um token que deve ser enviado em todas as requisições autenticadas via header `Authorization: Bearer <token>`.

Variáveis necessárias:
- `JWT_SECRET` — chave secreta para assinar os tokens
- `FRONTEND_ORIGIN` — origem do frontend (para configuração do CORS)
