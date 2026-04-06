---
sidebar_position: 2
---

# Gestão de Receitas

O módulo de receitas permite criar produtos finais com cálculo automático de custos e sugestão de preço de venda.

## Funcionalidades

- Criação de receitas com lista de ingredientes e quantidades
- Cálculo automático do custo total baseado nos ingredientes
- Definição de margem de lucro (%) por receita
- Sugestão automática de preço de venda
- Edição e exclusão de receitas

## Cálculo de Preço

O backend calcula o `suggestedPrice` usando:

```
suggestedPrice = costPerServing × (1 + profitMargin / 100)
```

## API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/recipes` | Listar todas as receitas |
| `GET` | `/recipes/:id` | Obter detalhes de uma receita |
| `POST` | `/recipes` | Criar nova receita |
| `PATCH` | `/recipes/:id` | Atualizar receita |
| `DELETE` | `/recipes/:id` | Remover receita |

## Exemplo de criação

```json
POST /recipes
{
  "name": "Bolo de Chocolate",
  "servings": 10,
  "profitMargin": 40,
  "ingredients": [
    { "ingredientId": "uuid-farinha", "quantity": 0.5 },
    { "ingredientId": "uuid-chocolate", "quantity": 0.2 }
  ]
}
```

## Resposta com preço sugerido

```json
{
  "id": "uuid-receita",
  "name": "Bolo de Chocolate",
  "costPerServing": 3.20,
  "suggestedPrice": 4.48,
  "profitMargin": 40,
  "ingredients": [...]
}
```

## Hook `useRecipes()`

```tsx
import { useRecipes } from '@/hooks/use-recipes';

function RecipesPage() {
  const { recipes, loading, createRecipe } = useRecipes();

  const handleCreate = async () => {
    await createRecipe({
      name: 'Bolo de Chocolate',
      servings: 10,
      profitMargin: 40,
      ingredients: [
        { ingredientId: 'uuid', quantity: 0.5 },
      ],
    });
  };

  return (
    // ...
  );
}
```
