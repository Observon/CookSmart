---
sidebar_position: 1
---

# Gestão de Ingredientes

O módulo de ingredientes permite registrar e gerenciar todos os insumos utilizados nas receitas.

## Funcionalidades

- Cadastro de ingredientes com nome, unidade de medida e preço unitário
- Histórico de compras e variação de preços
- Atualização e exclusão de ingredientes
- Importação via OCR de notas fiscais

## API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/ingredients` | Listar todos os ingredientes |
| `POST` | `/ingredients` | Criar novo ingrediente |
| `PATCH` | `/ingredients/:id` | Atualizar ingrediente |
| `DELETE` | `/ingredients/:id` | Remover ingrediente |

## Exemplo de criação

```json
POST /ingredients
{
  "name": "Farinha de trigo",
  "unit": "kg",
  "unitPrice": 4.50
}
```

## Hook `useIngredients()`

No frontend, utilize o hook `useIngredients()` para todas as operações:

```tsx
import { useIngredients } from '@/hooks/use-ingredients';

function IngredientsPage() {
  const { ingredients, loading, createIngredient } = useIngredients();

  const handleCreate = async () => {
    await createIngredient({
      name: 'Farinha de trigo',
      unit: 'kg',
      unitPrice: 4.50,
    });
  };

  return (
    // ...
  );
}
```
