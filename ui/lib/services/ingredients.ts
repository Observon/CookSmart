import type { Ingredient } from "@/lib/types"

export interface RawIngredient {
  id?: number | string | null
  name?: string | null
  unitOfMeasure?: string | null
  totalCost?: number | string | null
  totalAmount?: number | string | null
  costPerUnit?: number | string | null
  category?: string | null
}

function toNumber(value: unknown, fallback = 0): number {
  if (value == null) {
    return fallback
  }

  const parsed = typeof value === "string" && value.trim() === "" ? Number.NaN : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

export function normalizeIngredient(raw: RawIngredient): Ingredient {
  return {
    id: toNumber(raw.id),
    name: toString(raw.name),
    unitOfMeasure: toString(raw.unitOfMeasure),
    totalCost: toNumber(raw.totalCost),
    totalAmount: toNumber(raw.totalAmount),
    costPerUnit: toNumber(raw.costPerUnit),
    category: raw.category ?? null,
  }
}

export function normalizeIngredients(rawItems: RawIngredient[] = []): Ingredient[] {
  return Array.isArray(rawItems) ? rawItems.map(normalizeIngredient) : []
}
