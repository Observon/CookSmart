import type { Recipe } from "@/lib/types"

import type { RawIngredient } from "./ingredients"
import { normalizeIngredient } from "./ingredients"

interface RawRecipeIngredient {
  id?: number | string | null
  ingredientId?: number | string | null
  quantity?: number | string | null
  ingredient?: RawIngredient | null
}

export interface RawRecipe {
  id?: number | string | null
  name?: string | null
  description?: string | null
  servings?: number | string | null
  suggestedPrice?: number | string | null
  totalCost?: number | string | null
  costPerServing?: number | string | null
  profitMargin?: number | string | null
  ingredients?: RawRecipeIngredient[] | null
}

function toNumber(value: unknown, fallback = 0): number {
  if (value == null) {
    return fallback
  }

  const parsed = typeof value === "string" && value.trim() === "" ? Number.NaN : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeRecipeIngredient(raw: RawRecipeIngredient, fallbackId: number): Recipe["ingredients"][number] {
  const ingredientId = toNumber(raw.ingredientId ?? raw.ingredient?.id)
  const detailId = toNumber(raw.id ?? `${fallbackId}${ingredientId}`)
  const quantity = toNumber(raw.quantity)

  return {
    id: detailId,
    ingredientId,
    quantity,
    ingredient: normalizeIngredient(raw.ingredient ?? {}),
  }
}

export function normalizeRecipe(raw: RawRecipe): Recipe {
  const id = toNumber(raw.id)

  return {
    id,
    name: raw.name ?? "",
    description: raw.description ?? null,
    servings: toNumber(raw.servings),
    suggestedPrice: toNumber(raw.suggestedPrice),
    totalCost: toNumber(raw.totalCost),
    costPerServing: toNumber(raw.costPerServing),
    profitMargin: toNumber(raw.profitMargin, 200),
    ingredients: Array.isArray(raw.ingredients)
      ? raw.ingredients.map((item) => normalizeRecipeIngredient(item ?? {}, id))
      : [],
  }
}

export function normalizeRecipes(rawItems: RawRecipe[] = []): Recipe[] {
  return Array.isArray(rawItems) ? rawItems.map((item) => normalizeRecipe(item ?? {})) : []
}
