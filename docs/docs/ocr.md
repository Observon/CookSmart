---
id: ocr
title: OCR de Notas Fiscais
sidebar_position: 5
---

# 📸 OCR de Notas Fiscais

## Visão Geral

O módulo OCR integra o **Amazon Textract** para leitura automática de notas fiscais, agilizando o lançamento de insumos.

## Fluxo Completo

1. **Upload seguro** – A tela `AiScannerScreen` envia imagens/PDFs via `POST /ocr/textract`. O backend valida tamanho e formato, salva o arquivo no S3 (quando `TEXTRACT_USE_S3=true`) e aciona o Textract (`AnalyzeExpenseCommand`).
2. **Processamento** – O serviço (`api/src/ocr/ocr.service.ts`) normaliza fornecedor, CNPJ, número e valor total. Cada item contém `issues[]` indicando inconsistências.
3. **Revisão na UI** – `AiScannerScreen` exibe badges de atenção, impede seleção de itens sem ingrediente vinculado e destaca confiança. Itens sem correspondência podem ser vinculados manualmente.
4. **Confirmação** – A UI vincula cada item válido e chama `/purchases` para registrar a compra. O serviço de compras recalcula o custo dos ingredientes.

## Issues nos Itens

| Código | Descrição |
|---|---|
| `missing_description` | Descrição do item não encontrada |
| `missing_quantity` | Quantidade não encontrada |
| `missing_total` | Valor total do item não encontrado |
| `missing_unit_price` | Preço unitário não encontrado |
| `low_confidence` | Confiança de leitura abaixo do limiar |
| `unmatched_ingredient` | Nenhum ingrediente correspondente encontrado |

## Métricas

O serviço expõe `GET /ocr/metrics` (autenticado) com:

- Total de processamentos
- Tempo médio de resposta
- Taxa de falhas
- Alertas (latência > 5s ou falhas ≥ 20%)

## Variáveis de Ambiente

Configure em `api/.env`:

```env
AWS_ACCESS_KEY_ID=sua_access_key
AWS_SECRET_ACCESS_KEY=sua_secret_key
AWS_REGION=us-east-1
TEXTRACT_BUCKET=nome-do-bucket
TEXTRACT_USE_S3=true
TEXTRACT_MAX_FILE_SIZE_MB=10
# opcional:
AWS_SESSION_TOKEN=
```

## Políticas IAM Recomendadas

Crie uma role/usuário com a política mínima (substitua `<bucket-name>`):

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

## Exemplo de Requisição

```bash
curl -X POST http://localhost:3000/ocr/textract \
  -H "Authorization: Bearer <TOKEN>" \
  -F file=@nota-fiscal.pdf
```

## Desenvolvimento Local

Para usar LocalStack ou MinIO em vez de AWS real, consulte a seção **Configuração S3 Local** em `api/README.md`.
