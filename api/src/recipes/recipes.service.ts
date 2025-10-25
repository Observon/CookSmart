import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { RecipeIngredientInputDto } from './dto/recipe-ingredient-input.dto';
import {
  buildIngredientCostLookup,
  calculateRecipeTotals,
  calculateSuggestedPrice,
} from './recipes-cost.utils';

@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateRecipeDto) {
    const ingredientRecords = await this.fetchIngredientCosts(userId, dto.ingredients);
    const ingredientCosts = buildIngredientCostLookup(ingredientRecords);

    const { totalCost, costPerServing, recipeIngredients } = calculateRecipeTotals(
      dto.servings,
      dto.ingredients,
      ingredientCosts,
    );

    const profitMarginDecimal = new Prisma.Decimal(dto.profitMargin ?? 200);
    const suggestedPrice = calculateSuggestedPrice(costPerServing, profitMarginDecimal);

    return this.prisma.recipe.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description ?? null,
        servings: dto.servings,
        suggestedPrice,
        totalCost,
        costPerServing,
        profitMargin: profitMarginDecimal,
        ingredients: {
          create: recipeIngredients,
        },
      },
      include: this.defaultInclude,
    });
  }

  async findAll(userId: number) {
    return this.prisma.recipe.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      include: this.defaultInclude,
    });
  }

  async findOne(userId: number, id: number) {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id, userId },
      include: this.defaultInclude,
    });
    if (!recipe) {
      throw new NotFoundException('Receita não encontrada');
    }
    return recipe;
  }

  async update(userId: number, id: number, dto: UpdateRecipeDto) {
    const existing = await this.ensureRecipeExists(userId, id);

    const updatedServings = dto.servings ?? existing.servings;

    let profitMargin =
      dto.profitMargin !== undefined
        ? new Prisma.Decimal(dto.profitMargin)
        : existing.profitMargin ?? new Prisma.Decimal(200);

    let totalCost = existing.totalCost;
    let costPerServing = existing.costPerServing;
    let ingredientsUpdate:
      | Prisma.RecipeIngredientUpdateManyWithoutRecipeNestedInput
      | undefined;

    if (dto.ingredients) {
      const ingredientRecords = await this.fetchIngredientCosts(userId, dto.ingredients);
      const ingredientCosts = buildIngredientCostLookup(ingredientRecords);
      const recalculated = calculateRecipeTotals(updatedServings, dto.ingredients, ingredientCosts);
      totalCost = recalculated.totalCost;
      costPerServing = recalculated.costPerServing;
      ingredientsUpdate = {
        deleteMany: {},
        create: recalculated.recipeIngredients,
      };
    } else if (dto.servings) {
      const servingsDecimal = new Prisma.Decimal(updatedServings);
      costPerServing = totalCost.div(servingsDecimal);
    }

    const suggestedPrice = calculateSuggestedPrice(costPerServing, profitMargin);

    return this.prisma.recipe.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        description: dto.description ?? existing.description,
        servings: updatedServings,
        suggestedPrice,
        totalCost,
        costPerServing,
        profitMargin,
        ingredients: ingredientsUpdate,
      },
      include: this.defaultInclude,
    });
  }

  async remove(userId: number, id: number) {
    await this.ensureRecipeExists(userId, id);
    await this.prisma.recipeIngredient.deleteMany({ where: { recipeId: id } });
    await this.prisma.recipe.delete({ where: { id } });
    return { id };
  }

  private async ensureRecipeExists(userId: number, id: number) {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id, userId },
      include: this.defaultInclude,
    });
    if (!recipe) {
      throw new NotFoundException('Receita não encontrada');
    }
    return recipe;
  }

  private async fetchAndValidateIngredients(
    userId: number,
    items: RecipeIngredientInputDto[],
  ) {
    const ingredients = await this.fetchIngredientCosts(userId, items);
    return buildIngredientCostLookup(ingredients);
  }

  private async fetchIngredientCosts(
    userId: number,
    items: RecipeIngredientInputDto[],
  ): Promise<Array<{ id: number; costPerUnit: Prisma.Decimal }>> {
    if (!items?.length) {
      throw new BadRequestException('A receita deve conter ao menos um ingrediente');
    }

    const ingredientIds = items.map((item) => item.ingredientId);
    const uniqueIds = [...new Set(ingredientIds)];

    const ingredients = await this.prisma.ingredient.findMany({
      where: {
        userId,
        id: { in: uniqueIds },
      },
      select: {
        id: true,
        costPerUnit: true,
      },
    });

    if (ingredients.length !== uniqueIds.length) {
      throw new BadRequestException(
        'Ingredientes inválidos ou não pertencentes ao usuário',
      );
    }

    return ingredients;
  }

  private readonly defaultInclude = {
    ingredients: {
      include: {
        ingredient: {
          select: {
            id: true,
            name: true,
            unitOfMeasure: true,
            costPerUnit: true,
          },
        },
      },
    },
  } as const;
}
