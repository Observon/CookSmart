## CookSmart API

Backend em NestJS responsável por autenticação, cadastro de insumos, receitas, compras e OCR do CookSmart. As despesas operacionais seguem como roadmap.

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
  pnpm prisma migrate dev
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

### Configuração S3 Local

Para desenvolvimento local sem usar AWS real, configure um serviço S3 compatível:

**LocalStack**:
```bash
docker run -p 4566:4566 localstack/localstack
```

Depois, no arquivo `.env` da API:
```env
TEXTRACT_USE_S3=true
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_ENDPOINT_URL=http://localhost:4566
TEXTRACT_BUCKET=cooksmart-ocr-local
```

Crie o bucket:
```bash
awslocal s3 mb s3://cooksmart-ocr-local
```

**MinIO** (alternativa):
```bash
docker run -p 9000:9000 -p 9090:9090 quay.io/minio/minio server /data
```

Configure no `.env`:
```env
TEXTRACT_USE_S3=true
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_ENDPOINT_URL=http://localhost:9000
TEXTRACT_BUCKET=cooksmart-ocr-local
```

> **Nota**: quando `AWS_ENDPOINT_URL` estiver definido, o SDK usará o endpoint customizado para operações S3, mantendo o Textract na AWS real.

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

### Testes

- `pnpm run test` executa a suíte unitária com Jest.
- `pnpm run test:e2e` roda testes end-to-end usando Supertest.
- `pnpm run test:cov` gera relatório de cobertura.

### Documentação da API

- Swagger disponível em `http://localhost:3000/docs` após iniciar o servidor (`pnpm run start:dev`).
- Principais módulos já implementados: `auth`, `ingredients`, `recipes`, `purchases`, `ocr` e `prisma`.

### Roadmap

- **Despesas operacionais**: previsão de implementação do módulo (`operational-expenses`) com CRUD e integração ao cálculo de preço.
- **Dashboard de métricas**: endpoints agregados para consumo pelo frontend.
- **Integração com notificações**: alertas de OCR e variação de custos.
- **Pipelines CI/CD**: automação de testes e deploy.
