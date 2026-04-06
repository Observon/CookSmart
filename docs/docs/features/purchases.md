---
sidebar_position: 3
---

# Controle de Compras

O módulo de compras registra aquisições de insumos, atualiza preços dos ingredientes automaticamente e mantém histórico de transações.

## Funcionalidades

- Registro de compras de insumos
- Atualização automática do preço unitário dos ingredientes
- Histórico de transações
- Suporte a metadados de notas fiscais (número, CNPJ, valor total)

## API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/purchases` | Registrar nova compra |
| `GET` | `/purchases` | Listar histórico de compras |

## Exemplo de criação

```json
POST /purchases
{
  "supplierId": "opcional",
  "invoiceNumber": "NF-001234",
  "supplierTaxId": "12.345.678/0001-90",
  "currency": "BRL",
  "totalAmount": 150.00,
  "items": [
    {
      "ingredientId": "uuid-farinha",
      "quantity": 10,
      "unitPrice": 4.50
    }
  ]
}
```

## Integração com OCR

Após a revisão na tela de scanner, o frontend vincula cada item válido e envia o payload para `POST /purchases`. O serviço recalcula automaticamente o custo dos ingredientes.

Veja [OCR de Notas Fiscais](../backend/ocr) para mais detalhes.
