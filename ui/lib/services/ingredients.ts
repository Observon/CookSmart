import { apiFetch } from "@/lib/http"
import type { CreateIngredientPayload, Ingredient, UpdateIngredientPayload } from "@/lib/types"

export function normalizeIngredient(raw: any): Ingredient {
  return {
    id: Number(raw.id),
    name: raw.name,
    unitOfMeasure: raw.unitOfMeasure,
    totalCost: Number(raw.totalCost),
    totalAmount: Number(raw.totalAmount),
    costPerUnit: Number(raw.costPerUnit),
    category: raw.category ?? null,
  }
}

export async function listIngredients(token: string): Promise<Ingredient[]> {
  const data = await apiFetch<any[]>("/ingredients", {
    method: "GET",
    token,
  })

  return data.map(normalizeIngredient)
}

export async function createIngredient(token: string, payload: CreateIngredientPayload): Promise<Ingredient> {
  const data = await apiFetch<any>("/ingredients", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  })

  return normalizeIngredient(data)
}

export async function updateIngredient(
  token: string,
  id: number,
  payload: Partial<Omit<UpdateIngredientPayload, "id">>,
): Promise<Ingredient> {
  const data = await apiFetch<any>(`/ingredients/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  })

  return normalizeIngredient(data)
}

export async function deleteIngredient(token: string, id: number): Promise<void> {
  await apiFetch(`/ingredients/${id}`, {
    method: "DELETE",
    token,
  })
}
