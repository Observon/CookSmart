import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { IngredientsService } from './ingredients.service';
import { PrismaService } from '../prisma/prisma.service';

describe('IngredientsService', () => {
  let service: IngredientsService;

  const prismaMock = {
    ingredient: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  } as unknown as PrismaService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngredientsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<IngredientsService>(IngredientsService);
  });

  it('create should calculate costPerUnit before persisting', async () => {
    (prismaMock.ingredient.create as jest.Mock).mockResolvedValue({ id: 1 });

    await service.create(10, {
      name: 'Farinha',
      unitOfMeasure: 'kg',
      totalCost: 20,
      totalAmount: 4,
    });

    expect(prismaMock.ingredient.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          costPerUnit: 5,
          userId: 10,
        }),
      }),
    );
  });

  it('findOne should throw not found when ingredient does not belong to user', async () => {
    (prismaMock.ingredient.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(service.findOne(1, 99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update should recalculate costPerUnit when totalCost or totalAmount changes', async () => {
    (prismaMock.ingredient.findFirst as jest.Mock).mockResolvedValue({
      id: 3,
      userId: 1,
      name: 'Acucar',
      unitOfMeasure: 'kg',
      category: null,
      totalCost: 30,
      totalAmount: 6,
      costPerUnit: 5,
      registrationDate: new Date('2026-01-01T00:00:00.000Z'),
    });
    (prismaMock.ingredient.update as jest.Mock).mockResolvedValue({ id: 3 });

    await service.update(1, 3, {
      totalCost: 21,
      totalAmount: 3,
      category: undefined,
    });

    expect(prismaMock.ingredient.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 3 },
        data: expect.objectContaining({
          totalCost: 21,
          totalAmount: 3,
          costPerUnit: 7,
        }),
      }),
    );
  });

  it('remove should delete ingredient after ownership validation', async () => {
    (prismaMock.ingredient.findFirst as jest.Mock).mockResolvedValue({
      id: 4,
      userId: 1,
      name: 'Manteiga',
      unitOfMeasure: 'g',
      category: 'laticinio',
      totalCost: 18,
      totalAmount: 300,
      costPerUnit: 0.06,
      registrationDate: new Date('2026-01-01T00:00:00.000Z'),
    });
    (prismaMock.ingredient.delete as jest.Mock).mockResolvedValue({ id: 4 });

    const result = await service.remove(1, 4);

    expect(prismaMock.ingredient.delete).toHaveBeenCalledWith({ where: { id: 4 } });
    expect(result).toEqual({ id: 4 });
  });
});
