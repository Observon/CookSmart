## CookSmart API

Backend em NestJS responsável por autenticação, cadastro de insumos, receitas, compras e despesas operacionais do CookSmart.

### Requisitos

- **Node.js** 20+
- **pnpm** 8+
- **PostgreSQL** 14+ (local ou remoto)

### Configuração inicial

- **Instalar dependências**
  ```bash
  pnpm install
  ```
- **Variáveis de ambiente**
  - Copie `api/.env.example` para `api/.env`.
  - Ajuste `DATABASE_URL` com usuário, senha, host e porta do seu PostgreSQL.
- **Prisma**
  ```bash
  pnpm prisma:format
  pnpm prisma:migrate --name init
  pnpm prisma:generate
  ```

### Execução

- **Desenvolvimento**
  ```bash
  pnpm run start:dev
  ```
- **Produção**
  ```bash
  pnpm run build
  pnpm run start:prod
  ```

### Estrutura

- `src/prisma/` contém `PrismaModule` e `PrismaService` com o client compartilhado.
- `prisma/schema.prisma` define as entidades (`User`, `Ingredient`, `Recipe`, `Purchase`, `OperationalExpense`, etc.).
- `prisma/migrations/` mantém histórico das migrações aplicadas.

### Scripts úteis

- **Formatar schema**: `pnpm prisma:format`
- **Gerar client**: `pnpm prisma:generate`
- **Nova migração**: `pnpm prisma:migrate --name <titulo>`
- **Studio (GUI)**: `pnpm prisma studio`

### Próximos passos

- Implementar módulos `auth`, `ingredients`, `recipes`, `purchases`, `operational-expenses` com controllers/services usando `PrismaService`.
- Adicionar testes unitários e e2e com Jest/Supertest.
- Configurar Docker Compose (API + PostgreSQL) e pipelines de CI/CD.
- Expor endpoints REST/GraphQL para consumo pelo frontend (`ui/`).
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
