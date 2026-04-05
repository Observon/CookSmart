import type { IngredientContract } from './ingredients.js';

export interface RecipeIngredientInputContract {
  ingredientId: number;
  quantity: number;
}

export interface RecipeIngredientDetailContract {
  id: number;
  ingredientId: number;
  quantity: number;
  ingredient: IngredientContract;
}

export interface RecipeContract {
  id: number;
  name: string;
  description?: string | null;
  servings: number;
  suggestedPrice: number;
  totalCost: number;
  costPerServing: number;
  profitMargin: number;
  ingredients: RecipeIngredientDetailContract[];
}

export interface CreateRecipeContract {
  name: string;
  servings: number;
  profitMargin?: number;
  description?: string | null;
  ingredients: RecipeIngredientInputContract[];
}

export type UpdateRecipeContract = Partial<CreateRecipeContract>;
