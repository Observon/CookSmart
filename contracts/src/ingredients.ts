export interface IngredientContract {
  id: number;
  name: string;
  unitOfMeasure: string;
  totalCost: number;
  totalAmount: number;
  costPerUnit: number;
  category?: string | null;
}

export interface CreateIngredientContract {
  name: string;
  unitOfMeasure: string;
  totalCost: number;
  totalAmount: number;
  category?: string | null;
}

export type UpdateIngredientContract = Partial<CreateIngredientContract>;
