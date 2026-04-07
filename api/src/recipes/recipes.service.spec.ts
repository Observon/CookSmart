import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { RecipesService } from './recipes.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RecipesService', () => {
  let service: RecipesService;

  const prismaMock = {
    recipe: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    recipeIngredient: {
      deleteMany: jest.fn(),
    },
    ingredient: {
      findMany: jest.fn(),
    },
  } as unknown as PrismaService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<RecipesService>(RecipesService);
  });

  it('create should calculate costs and suggested price', async () => {
    (prismaMock.ingredient.findMany as jest.Mock).mockResolvedValue([
      { id: 1, userId: 10, costPerUnit: new Prisma.Decimal(2) },
      { id: 2, userId: 10, costPerUnit: new Prisma.Decimal(5) },
    ]);
    (prismaMock.recipe.create as jest.Mock).mockResolvedValue({ id: 100 });

    await service.create(10, {
      name: 'Bolo',
      servings: 2,
      profitMargin: 50,
      ingredients: [
        { ingredientId: 1, quantity: 3 },
        { ingredientId: 2, quantity: 1 },
      ],
    });

    const createCall = (prismaMock.recipe.create as jest.Mock).mock.calls[0][0];
    expect(createCall.data.totalCost.toNumber()).toBe(11);
    expect(createCall.data.costPerServing.toNumber()).toBe(5.5);
    expect(createCall.data.suggestedPrice.toNumber()).toBe(8.25);
    expect(createCall.data.ingredients.create).toHaveLength(2);
  });

  it('create should throw when ingredient list is invalid for user', async () => {
    (prismaMock.ingredient.findMany as jest.Mock).mockResolvedValue([
      { id: 1, userId: 10, costPerUnit: new Prisma.Decimal(1) },
    ]);

    await expect(
      service.create(10, {
        name: 'Receita',
        servings: 1,
        ingredients: [
          { ingredientId: 1, quantity: 1 },
          { ingredientId: 2, quantity: 1 },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('create should throw when total recipe cost is zero', async () => {
    (prismaMock.ingredient.findMany as jest.Mock).mockResolvedValue([
      { id: 1, userId: 10, costPerUnit: new Prisma.Decimal(0) },
    ]);

    await expect(
      service.create(10, {
        name: 'Receita Gratis',
        servings: 2,
        ingredients: [{ ingredientId: 1, quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('findOne should throw when recipe is not found', async () => {
    (prismaMock.recipe.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(service.findOne(1, 99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update should recalculate costPerServing when only servings changes', async () => {
    (prismaMock.recipe.findFirst as jest.Mock).mockResolvedValue({
      id: 9,
      userId: 1,
      name: 'Pudim',
      description: null,
      servings: 2,
      totalCost: new Prisma.Decimal(20),
      costPerServing: new Prisma.Decimal(10),
      profitMargin: new Prisma.Decimal(100),
      suggestedPrice: new Prisma.Decimal(20),
      ingredients: [],
    });
    (prismaMock.recipe.update as jest.Mock).mockResolvedValue({ id: 9 });

    await service.update(1, 9, { servings: 4 });

    const updateCall = (prismaMock.recipe.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data.costPerServing.toNumber()).toBe(5);
    expect(updateCall.data.suggestedPrice.toNumber()).toBe(10);
  });

  it('remove should delete recipe ingredients then recipe', async () => {
    (prismaMock.recipe.findFirst as jest.Mock).mockResolvedValue({
      id: 12,
      userId: 1,
      name: 'Torta',
      description: null,
      servings: 8,
      totalCost: new Prisma.Decimal(80),
      costPerServing: new Prisma.Decimal(10),
      profitMargin: new Prisma.Decimal(120),
      suggestedPrice: new Prisma.Decimal(22),
      ingredients: [],
    });
    (prismaMock.recipeIngredient.deleteMany as jest.Mock).mockResolvedValue({ count: 3 });
    (prismaMock.recipe.delete as jest.Mock).mockResolvedValue({ id: 12 });

    const result = await service.remove(1, 12);

    expect(prismaMock.recipeIngredient.deleteMany).toHaveBeenCalledWith({ where: { recipeId: 12 } });
    expect(prismaMock.recipe.delete).toHaveBeenCalledWith({ where: { id: 12 } });
    expect(result).toEqual({ id: 12 });
  });
});
