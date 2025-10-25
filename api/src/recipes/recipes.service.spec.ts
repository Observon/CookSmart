import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { RecipeIngredientInputDto } from './dto/recipe-ingredient-input.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { RecipesService } from './recipes.service';

describe('RecipesService', () => {
  let service: RecipesService;

  const recipeDelegateMock = {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  } as any;

  const recipeIngredientDelegateMock = {
    deleteMany: jest.fn(),
  } as any;

  const ingredientDelegateMock = {
    findMany: jest.fn(),
  } as any;

  const prismaMock = {
    recipe: recipeDelegateMock,
    recipeIngredient: recipeIngredientDelegateMock,
    ingredient: ingredientDelegateMock,
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

  it('cria receita calculando preços sugeridos e custos', async () => {
    const payload: CreateRecipeDto = {
      name: 'Bolo',
      servings: 10,
      profitMargin: 150,
      description: 'Chocolate',
      ingredients: [
        { ingredientId: 1, quantity: 2 },
        { ingredientId: 2, quantity: 0.5 },
      ],
    } as any;

    ingredientDelegateMock.findMany.mockResolvedValue([
      { id: 1, costPerUnit: new Prisma.Decimal(4) },
      { id: 2, costPerUnit: new Prisma.Decimal(10) },
    ]);

    recipeDelegateMock.create.mockResolvedValue({});

    await service.create(1, payload);

    expect(recipeDelegateMock.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        totalCost: new Prisma.Decimal(4 * 2 + 10 * 0.5),
        costPerServing: new Prisma.Decimal( (4 * 2 + 10 * 0.5) / 10),
        suggestedPrice: expect.any(Prisma.Decimal),
        ingredients: {
          create: [
            { ingredientId: 1, quantity: new Prisma.Decimal(2) },
            { ingredientId: 2, quantity: new Prisma.Decimal(0.5) },
          ],
        },
      }),
      include: expect.any(Object),
    });
  });

  it('recalcula custos ao atualizar ingredientes', async () => {
    const existing = {
      id: 10,
      userId: 1,
      name: 'Bolo',
      description: 'Chocolate',
      servings: 10,
      totalCost: new Prisma.Decimal(40),
      costPerServing: new Prisma.Decimal(4),
      profitMargin: new Prisma.Decimal(150),
      suggestedPrice: new Prisma.Decimal(10),
      ingredients: [],
    };

    recipeDelegateMock.findFirst.mockResolvedValue(existing);
    ingredientDelegateMock.findMany.mockResolvedValue([
      { id: 1, costPerUnit: new Prisma.Decimal(5) },
    ]);
    recipeDelegateMock.update.mockResolvedValue({});

    const payload: UpdateRecipeDto = {
      ingredients: [{ ingredientId: 1, quantity: 3 }],
    } as any;

    await service.update(1, existing.id, payload);

    expect(recipeDelegateMock.update).toHaveBeenCalledWith({
      where: { id: existing.id },
      data: expect.objectContaining({
        totalCost: new Prisma.Decimal(15),
        costPerServing: new Prisma.Decimal(15).div(new Prisma.Decimal(10)),
        ingredients: {
          deleteMany: {},
          create: [{ ingredientId: 1, quantity: new Prisma.Decimal(3) }],
        },
      }),
      include: expect.any(Object),
    });
  });

  it('lança exceção ao receber lista de ingredientes vazia', async () => {
    await expect(
      service.create(1, {
        name: 'Teste',
        servings: 1,
        profitMargin: 100,
        ingredients: [],
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lança exceção quando ingrediente não pertence ao usuário', async () => {
    const items: RecipeIngredientInputDto[] = [
      { ingredientId: 1, quantity: 1 },
      { ingredientId: 2, quantity: 1 },
    ];

    ingredientDelegateMock.findMany.mockResolvedValue([
      { id: 1, costPerUnit: new Prisma.Decimal(5) },
    ]);

    await expect(
      service.create(1, {
        name: 'Teste',
        servings: 1,
        profitMargin: 100,
        ingredients: items,
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
