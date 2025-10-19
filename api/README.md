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
  - Preencha as chaves AWS (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`).
  - Defina o bucket onde os arquivos serão enviados (ex.: `TEXTRACT_BUCKET`).
- **Prisma**
  ```bash
  pnpm prisma:format
  pnpm prisma:migrate --name init
  pnpm prisma:generate
  ```

### Configuração AWS / Textract

- **Permissões necessárias**
  - `textract:AnalyzeExpense`, `textract:StartExpenseAnalysis`, `textract:GetExpenseAnalysis`
  - `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` para o bucket definido em `TEXTRACT_BUCKET`
- **Variáveis suportadas** (`api/.env`)
  ```env
  AWS_ACCESS_KEY_ID=...
  AWS_SECRET_ACCESS_KEY=...
  AWS_REGION=us-east-1
  TEXTRACT_BUCKET=cooksmart-ocr-uploads
  TEXTRACT_USE_S3=true
  TEXTRACT_MAX_FILE_SIZE_MB=10
  ```
- **Observações**
  - Se estiver usando credenciais temporárias, inclua `AWS_SESSION_TOKEN`.
  - Garanta que o bucket S3 está na mesma região configurada em `AWS_REGION`.

### Fluxo OCR → Compras

- **Upload**: a rota `POST /ocr/textract` recebe imagem/PDF (até `TEXTRACT_MAX_FILE_SIZE_MB`), salva o arquivo no S3 (quando habilitado) e executa o `AnalyzeExpenseCommand` do Amazon Textract.
- **Resposta**: o serviço (`src/ocr/ocr.service.ts`) agrupa fornecedor, CNPJ (`supplierTaxId`), número da nota, valor total (`totalAmount`), moeda (`currency`), itens e a chave do arquivo (`receiptImageKey`).
- **Persistência**: após a confirmação na UI, um payload `CreatePurchaseDto` é enviado para `POST /purchases`. O `PurchasesService` cria `Purchase`/`PurchaseItem`, armazena os metadados opcionais (`invoiceNumber`, `supplierTaxId`, `currency`, `totalAmount`, `receiptImage`) e recalcula o custo dos ingredientes.
- **Campos novos** (`prisma/schema.prisma`): `Purchase` possui `invoiceNumber`, `supplierTaxId`, `currency`, `totalAmount`, além de `receiptImage`.

Exemplo de chamada autenticada:

```bash
curl -X POST http://localhost:3000/ocr/textract \
  -H "Authorization: Bearer <TOKEN>" \
  -F file=@nota-fiscal.pdf
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
