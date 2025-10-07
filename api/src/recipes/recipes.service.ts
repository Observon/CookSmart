import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { RecipeIngredientInputDto } from './dto/recipe-ingredient-input.dto';

@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateRecipeDto) {
    const ingredients = await this.fetchAndValidateIngredients(
      userId,
      dto.ingredients,
    );

    const { totalCost, costPerServing, recipeIngredients } =
      this.calculateRecipeCosts(dto.servings, dto.ingredients, ingredients);

    return this.prisma.recipe.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description ?? null,
        servings: dto.servings,
        suggestedPrice: dto.suggestedPrice,
        totalCost,
        costPerServing,
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

    let totalCost = existing.totalCost;
    let costPerServing = existing.costPerServing;
    let ingredientsUpdate:
      | Prisma.RecipeIngredientUpdateManyWithoutRecipeNestedInput
      | undefined;

    if (dto.ingredients) {
      const ingredients = await this.fetchAndValidateIngredients(
        userId,
        dto.ingredients,
      );
      const recalculated = this.calculateRecipeCosts(
        updatedServings,
        dto.ingredients,
        ingredients,
      );
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

    return this.prisma.recipe.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        description: dto.description ?? existing.description,
        servings: updatedServings,
        suggestedPrice: dto.suggestedPrice ?? existing.suggestedPrice,
        totalCost,
        costPerServing,
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
    const ingredientIds = items.map((item) => item.ingredientId);
    const uniqueIds = [...new Set(ingredientIds)];

    const ingredients = await this.prisma.ingredient.findMany({
      where: {
        userId,
        id: { in: uniqueIds },
      },
    });

    if (ingredients.length !== uniqueIds.length) {
      throw new BadRequestException(
        'Ingredientes inválidos ou não pertencentes ao usuário',
      );
    }

    const ingredientMap = new Map(
      ingredients.map((ingredient) => [ingredient.id, ingredient]),
    );
    return ingredientMap;
  }

  private calculateRecipeCosts(
    servings: number,
    items: RecipeIngredientInputDto[],
    ingredientMap: Map<number, { costPerUnit: Prisma.Decimal }>,
  ) {
    const totalCostDecimal = items.reduce((acc, item) => {
      const ingredient = ingredientMap.get(item.ingredientId)!;
      const quantity = new Prisma.Decimal(item.quantity);
      const itemCost = ingredient.costPerUnit.mul(quantity);
      return acc.add(itemCost);
    }, new Prisma.Decimal(0));

    if (totalCostDecimal.isZero()) {
      throw new BadRequestException(
        'O custo total da receita não pode ser zero',
      );
    }

    const servingsDecimal = new Prisma.Decimal(servings);
    const costPerServing = totalCostDecimal.div(servingsDecimal);

    const recipeIngredients = items.map((item) => ({
      ingredientId: item.ingredientId,
      quantity: new Prisma.Decimal(item.quantity),
    }));

    return {
      totalCost: totalCostDecimal,
      costPerServing,
      recipeIngredients,
    };
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
