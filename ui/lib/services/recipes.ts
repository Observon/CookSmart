import { apiFetch } from "@/lib/http"
import type { CreateRecipePayload, Recipe, UpdateRecipePayload } from "@/lib/types"
import { normalizeIngredient } from "./ingredients"

type RawRecord = Partial<Record<string, unknown>>

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toRecord = (value: unknown): RawRecord =>
  value && typeof value === "object" ? (value as RawRecord) : {}

function normalizeRecipe(raw: unknown): Recipe {
  const item = toRecord(raw)
  const rawIngredients = Array.isArray(item.ingredients) ? item.ingredients : []

  return {
    id: toNumber(item.id),
    name: typeof item.name === "string" ? item.name : "",
    description: typeof item.description === "string" ? item.description : null,
    servings: toNumber(item.servings),
    suggestedPrice: toNumber(item.suggestedPrice),
    totalCost: toNumber(item.totalCost),
    costPerServing: toNumber(item.costPerServing),
    profitMargin: toNumber(item.profitMargin, 200),
    ingredients: rawIngredients.map((recipeIngredient) => {
      const mappedIngredient = toRecord(recipeIngredient)
      const nestedIngredient = toRecord(mappedIngredient.ingredient)

      return {
        id: mappedIngredient.id
          ? toNumber(mappedIngredient.id)
          : toNumber(`${item.id ?? 0}${mappedIngredient.ingredientId ?? 0}`),
        ingredientId: toNumber(mappedIngredient.ingredientId ?? nestedIngredient.id),
        quantity: toNumber(mappedIngredient.quantity),
        ingredient: normalizeIngredient(nestedIngredient),
      }
    }),
  }
}

export async function listRecipes(token: string): Promise<Recipe[]> {
  const data = await apiFetch<unknown[]>("/recipes", {
    method: "GET",
    token,
  })

  return data.map(normalizeRecipe)
}

export async function createRecipe(token: string, payload: CreateRecipePayload): Promise<Recipe> {
  const data = await apiFetch<unknown>("/recipes", {
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
  const data = await apiFetch<unknown>(`/recipes/${id}`, {
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
