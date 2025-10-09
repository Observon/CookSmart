import { apiFetch } from "@/lib/http"
import type { CreateRecipePayload, Recipe, UpdateRecipePayload } from "@/lib/types"
import { normalizeIngredient } from "./ingredients"

function normalizeRecipe(raw: any): Recipe {
  return {
    id: Number(raw.id),
    name: raw.name,
    description: raw.description ?? null,
    servings: Number(raw.servings),
    suggestedPrice: Number(raw.suggestedPrice ?? 0),
    totalCost: Number(raw.totalCost ?? 0),
    costPerServing: Number(raw.costPerServing ?? 0),
    profitMargin: Number(raw.profitMargin ?? 200),
    ingredients: Array.isArray(raw.ingredients)
      ? raw.ingredients.map((item: any) => ({
          id: item.id ? Number(item.id) : Number(`${raw.id ?? 0}${item.ingredientId ?? 0}`),
          ingredientId: Number(item.ingredientId ?? item.ingredient?.id ?? 0),
          quantity: Number(item.quantity ?? 0),
          ingredient: normalizeIngredient(item.ingredient ?? {}),
        }))
      : [],
  }
}

export async function listRecipes(token: string): Promise<Recipe[]> {
  const data = await apiFetch<any[]>("/recipes", {
    method: "GET",
    token,
  })

  return data.map(normalizeRecipe)
}

export async function createRecipe(token: string, payload: CreateRecipePayload): Promise<Recipe> {
  const data = await apiFetch<any>("/recipes", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  })

  return normalizeRecipe(data)
}

export async function updateRecipe(
  token: string,
  id: number,
  payload: Partial<Omit<UpdateRecipePayload, "id">>,
): Promise<Recipe> {
  const data = await apiFetch<any>(`/recipes/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  })

  return normalizeRecipe(data)
}

export async function deleteRecipe(token: string, id: number): Promise<void> {
  await apiFetch(`/recipes/${id}`, {
    method: "DELETE",
    token,
  })
}
