import type { Ingredient } from "@/lib/types"

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

export function normalizeIngredients(rawItems: any[]): Ingredient[] {
  return rawItems.map(normalizeIngredient)
}
