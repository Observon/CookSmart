import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { RecipeIngredientInputDto } from './dto/recipe-ingredient-input.dto';

export type IngredientCostLookup = Map<number, Prisma.Decimal>;

export interface RecipeCostResult {
  totalCost: Prisma.Decimal;
  costPerServing: Prisma.Decimal;
  recipeIngredients: { ingredientId: number; quantity: Prisma.Decimal }[];
}

export function buildIngredientCostLookup(
  records: Array<{ id: number; costPerUnit: Prisma.Decimal }>,
): IngredientCostLookup {
  return new Map(records.map(({ id, costPerUnit }) => [id, costPerUnit]));
}

export function calculateRecipeTotals(
  servings: number,
  items: RecipeIngredientInputDto[],
  ingredientCosts: IngredientCostLookup,
): RecipeCostResult {
  if (servings <= 0) {
    throw new BadRequestException('O número de porções deve ser maior que zero');
  }

  if (!items.length) {
    throw new BadRequestException('A receita deve conter ao menos um ingrediente');
  }

  const totalCost = items.reduce((acc, item) => {
    const costPerUnit = ingredientCosts.get(item.ingredientId);
    if (!costPerUnit) {
      throw new BadRequestException(
        'Ingredientes inválidos ou não pertencentes ao usuário',
      );
    }

    const quantity = new Prisma.Decimal(item.quantity);
    if (quantity.lte(0)) {
      throw new BadRequestException(
        'A quantidade do ingrediente deve ser maior que zero',
      );
    }

    return acc.add(costPerUnit.mul(quantity));
  }, new Prisma.Decimal(0));

  if (totalCost.isZero()) {
    throw new BadRequestException('O custo total da receita não pode ser zero');
  }

  const servingsDecimal = new Prisma.Decimal(servings);
  const costPerServing = totalCost.div(servingsDecimal);

  const recipeIngredients = items.map((item) => ({
    ingredientId: item.ingredientId,
    quantity: new Prisma.Decimal(item.quantity),
  }));

  return {
    totalCost,
    costPerServing,
    recipeIngredients,
  };
}

export function calculateSuggestedPrice(
  costPerServing: Prisma.Decimal,
  profitMarginPercent: Prisma.Decimal,
): Prisma.Decimal {
  const multiplier = profitMarginPercent
    .div(new Prisma.Decimal(100))
    .add(new Prisma.Decimal(1));

  return costPerServing.mul(multiplier);
}
