import type {
  AuthResponseContract,
  AuthUserContract,
  CreateIngredientContract,
  CreateRecipeContract,
  IngredientContract,
  RecipeContract,
  RecipeIngredientDetailContract,
  RecipeIngredientInputContract,
  UpdateIngredientContract,
  UpdateRecipeContract,
} from "@cooksmart/contracts"

export type AuthUser = AuthUserContract

export type AuthResponse = AuthResponseContract

export type Ingredient = IngredientContract

export type CreateIngredientPayload = CreateIngredientContract

export type UpdateIngredientPayload = UpdateIngredientContract & {
  id: number
}

export type RecipeIngredientInput = RecipeIngredientInputContract

export type RecipeIngredientDetail = RecipeIngredientDetailContract

export type Recipe = RecipeContract

export type CreateRecipePayload = CreateRecipeContract & {
  profitMargin: number
}

export type UpdateRecipePayload = UpdateRecipeContract & {
  id: number
}

export interface PurchaseItemPayload {
  ingredientId: number
  quantity: number
  totalPrice: number
}

export interface CreatePurchasePayload {
  purchaseDate: string
  supplier?: string
  receiptImage?: string
  invoiceNumber?: string
  supplierTaxId?: string
  currency?: string
  totalAmount?: number
  items: PurchaseItemPayload[]
}
