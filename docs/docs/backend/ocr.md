---
sidebar_position: 2
---

# OCR de Notas Fiscais

O módulo `ocr` integra o **Amazon Textract** para leitura automática de notas fiscais, facilitando o lançamento de insumos.

## Fluxo

1. **Upload**: a rota `POST /ocr/textract` recebe imagem ou PDF (até `TEXTRACT_MAX_FILE_SIZE_MB`)
2. **Processamento**: o serviço salva o arquivo no S3 (quando habilitado) e aciona o `AnalyzeExpenseCommand`
3. **Resposta**: retorna fornecedor, CNPJ, número da nota, valor total, itens com confiança e `receiptImageKey`
4. **Revisão na UI**: a tela `AiScannerScreen` exibe badges de atenção e permite vinculação manual de itens
5. **Persistência**: após confirmação, os itens válidos são enviados para `POST /purchases`

## Configuração AWS {#configuração-aws}

Configure as variáveis no arquivo `api/.env`:

```env
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
TEXTRACT_BUCKET=cooksmart-ocr-uploads
TEXTRACT_USE_S3=true
TEXTRACT_MAX_FILE_SIZE_MB=10
# Opcional (credenciais temporárias)
AWS_SESSION_TOKEN=...
```

### Política IAM mínima recomendada

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["textract:AnalyzeExpense"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::<bucket-name>/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::<bucket-name>"
    }
  ]
}
```

## Configuração S3 Local {#configuração-s3-local}

Para desenvolvimento local sem usar AWS real, utilize **LocalStack** ou **MinIO**.

### LocalStack

```bash
docker run -p 4566:4566 localstack/localstack
```

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

### MinIO

```bash
docker run -p 9000:9000 -p 9090:9090 quay.io/minio/minio server /data
```

```env
TEXTRACT_USE_S3=true
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_ENDPOINT_URL=http://localhost:9000
TEXTRACT_BUCKET=cooksmart-ocr-local
```

> **Nota**: quando `AWS_ENDPOINT_URL` estiver definido, o SDK usa o endpoint customizado para operações S3, mantendo o Textract na AWS real.

## Exemplo de chamada

```bash
curl -X POST http://localhost:3000/ocr/textract \
  -H "Authorization: Bearer <TOKEN>" \
  -F file=@nota-fiscal.pdf
```

## Métricas

O endpoint `GET /ocr/metrics` (autenticado) expõe:

- Total de requisições processadas
- Tempo médio de processamento
- Taxa de falhas
- Alertas (latência > 5s ou falhas ≥ 20%)

Use-o para integrar com dashboards ou alarmes externos.

## Campos do schema Prisma

O modelo `Purchase` inclui os campos:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `invoiceNumber` | String? | Número da nota fiscal |
| `supplierTaxId` | String? | CNPJ do fornecedor |
| `currency` | String? | Moeda (ex: `BRL`) |
| `totalAmount` | Decimal? | Valor total da nota |
| `receiptImage` | String? | Chave do arquivo no S3 |
