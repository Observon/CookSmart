import { apiFetch } from "@/lib/http"
import type { CreateIngredientPayload, Ingredient, UpdateIngredientPayload } from "@/lib/types"

type RawIngredient = Partial<Record<string, unknown>>

const toNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function normalizeIngredient(raw: unknown): Ingredient {
  const item: RawIngredient = raw && typeof raw === "object" ? raw : {}

  return {
    id: toNumber(item.id),
    name: typeof item.name === "string" ? item.name : "",
    unitOfMeasure: typeof item.unitOfMeasure === "string" ? item.unitOfMeasure : "",
    totalCost: toNumber(item.totalCost),
    totalAmount: toNumber(item.totalAmount),
    costPerUnit: toNumber(item.costPerUnit),
    category: typeof item.category === "string" ? item.category : null,
  }
}

export async function listIngredients(token: string): Promise<Ingredient[]> {
  const data = await apiFetch<unknown[]>("/ingredients", {
    method: "GET",
    token,
  })

  return data.map(normalizeIngredient)
}

export async function createIngredient(token: string, payload: CreateIngredientPayload): Promise<Ingredient> {
  const data = await apiFetch<unknown>("/ingredients", {
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
  const data = await apiFetch<unknown>(`/ingredients/${id}`, {
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
