export interface AuthUser {
  id: number
  name: string
  email: string
  phone?: string | null
}

export interface AuthResponse {
  accessToken: string
  expiresIn: string
  user: AuthUser
}

export interface Ingredient {
  id: number
  name: string
  unitOfMeasure: string
  totalCost: number
  totalAmount: number
  costPerUnit: number
  category?: string | null
}

export interface CreateIngredientPayload {
  name: string
  unitOfMeasure: string
  totalCost: number
  totalAmount: number
  category?: string | null
}

export interface UpdateIngredientPayload extends Partial<CreateIngredientPayload> {
  id: number
}

export interface RecipeIngredientInput {
  ingredientId: number
  quantity: number
}

export interface RecipeIngredientDetail {
  id: number
  ingredientId: number
  quantity: number
  ingredient: Ingredient
}

export interface Recipe {
  id: number
  name: string
  description?: string | null
  servings: number
  suggestedPrice: number
  totalCost: number
  costPerServing: number
  profitMargin: number
  ingredients: RecipeIngredientDetail[]
}

export interface CreateRecipePayload {
  name: string
  servings: number
  profitMargin: number
  description?: string | null
  ingredients: RecipeIngredientInput[]
}

export interface UpdateRecipePayload extends Partial<CreateRecipePayload> {
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
  items: PurchaseItemPayload[]
}
