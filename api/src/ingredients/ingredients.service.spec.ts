import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { IngredientsService } from './ingredients.service';

describe('IngredientsService', () => {
  let service: IngredientsService;

  const ingredientDelegateMock = {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  } as any;

  const prismaMock = {
    ingredient: ingredientDelegateMock,
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('calcula costPerUnit corretamente', async () => {
      const userId = 1;
      const dto = {
        name: 'Farinha',
        unitOfMeasure: 'kg',
        totalCost: 20,
        totalAmount: 10,
      } as const;

      ingredientDelegateMock.create.mockResolvedValue({} as any);

      await service.create(userId, dto);

      expect(ingredientDelegateMock.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          name: dto.name,
          costPerUnit: 2,
        }),
      });
    });

    it('lança exceção quando amount é zero', async () => {
      await expect(
        service.create(1, {
          name: 'Leite',
          unitOfMeasure: 'L',
          totalCost: 10,
          totalAmount: 0,
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(ingredientDelegateMock.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const existing = {
      id: 5,
      userId: 1,
      name: 'Açúcar',
      unitOfMeasure: 'kg',
      category: null,
      totalCost: new Prisma.Decimal(15),
      totalAmount: new Prisma.Decimal(5),
      costPerUnit: new Prisma.Decimal(3),
      registrationDate: new Date(),
    };

    beforeEach(() => {
      ingredientDelegateMock.findFirst.mockResolvedValue(existing as any);
    });

    it('recalcula costPerUnit quando custo/quantidade mudam', async () => {
      ingredientDelegateMock.update.mockResolvedValue({} as any);

      await service.update(1, existing.id, {
        totalCost: 30,
        totalAmount: 10,
      });

      expect(ingredientDelegateMock.update).toHaveBeenCalledWith({
        where: { id: existing.id },
        data: expect.objectContaining({
          totalCost: 30,
          totalAmount: 10,
          costPerUnit: 3,
        }),
      });
    });

    it('lança exceção quando quantidade atualizada é inválida', async () => {
      await expect(
        service.update(1, existing.id, {
          totalAmount: 0,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(ingredientDelegateMock.update).not.toHaveBeenCalled();
    });
  });
});
