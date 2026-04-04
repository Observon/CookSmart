/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';

import { PurchasesService } from './purchases.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PurchasesService', () => {
  let service: PurchasesService;
  type TxCallback = (tx: PrismaService) => Promise<unknown>;
  type PurchaseCreateData = {
    totalAmount?: Prisma.Decimal;
  };

  const prismaMock = {
    purchase: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    purchaseItem: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    ingredient: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  } as unknown as PrismaService;

  beforeEach(async () => {
    const purchaseMocks = Object.values(prismaMock.purchase) as jest.Mock[];
    const purchaseItemMocks = Object.values(
      prismaMock.purchaseItem,
    ) as jest.Mock[];
    const ingredientMocks = Object.values(prismaMock.ingredient) as jest.Mock[];
    const transactionMock = prismaMock.$transaction as jest.Mock;

    purchaseMocks.forEach((fn) => fn.mockReset());
    purchaseItemMocks.forEach((fn) => fn.mockReset());
    ingredientMocks.forEach((fn) => fn.mockReset());
    transactionMock.mockReset();

    transactionMock.mockImplementation(async (callback: TxCallback) =>
      callback(prismaMock),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchasesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<PurchasesService>(PurchasesService);
  });

  it('cria compra com metadados e ajusta inventário', async () => {
    const userId = 10;
    const dto = {
      purchaseDate: '2025-01-15',
      supplier: 'Padaria Central',
      supplierTaxId: '12.345.678/0001-00',
      invoiceNumber: 'NF-123',
      currency: 'BRL',
      totalAmount: 45.9,
      receiptImage: 'tmp/ocr/nota.pdf',
      items: [
        {
          ingredientId: 1,
          quantity: 0.485,
          totalPrice: 6.06,
        },
      ],
    };

    (prismaMock.ingredient.findMany as jest.Mock).mockResolvedValue([
      { id: 1 },
    ]);
    (prismaMock.purchase.create as jest.Mock).mockResolvedValue({ id: 99 });
    (prismaMock.ingredient.findFirst as jest.Mock).mockResolvedValue({
      totalCost: new Prisma.Decimal(10),
      totalAmount: new Prisma.Decimal(1),
    });
    (prismaMock.ingredient.update as jest.Mock).mockResolvedValue({});

    const result = await service.create(userId, dto);

    const ingredientFindManyMock = prismaMock.ingredient.findMany as jest.Mock;
    const purchaseCreateMock = prismaMock.purchase.create as jest.Mock;
    const ingredientUpdateMock = prismaMock.ingredient.update as jest.Mock;

    expect(ingredientFindManyMock).toHaveBeenCalledWith({
      where: { userId, id: { in: [1] } },
      select: { id: true },
    });

    expect(purchaseCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId,
        purchaseDate: new Date('2025-01-15'),
        supplier: 'Padaria Central',
        supplierTaxId: '12.345.678/0001-00',
        invoiceNumber: 'NF-123',
        currency: 'BRL',
        totalAmount: new Prisma.Decimal(45.9),
        receiptImage: 'tmp/ocr/nota.pdf',
      }),
      include: expect.any(Object),
    });

    expect(ingredientUpdateMock).toHaveBeenCalledWith({
      where: { id: 1 },
      data: expect.objectContaining({
        totalCost: expect.any(Prisma.Decimal),
        totalAmount: expect.any(Prisma.Decimal),
        costPerUnit: expect.any(Prisma.Decimal),
      }),
    });

    expect(result).toEqual({ id: 99 });
  });

  it('calcula totalAmount quando não informado', async () => {
    const userId = 5;
    const dto = {
      purchaseDate: '2025-02-01',
      items: [
        { ingredientId: 1, quantity: 1, totalPrice: 10 },
        { ingredientId: 2, quantity: 2, totalPrice: 5.5 },
      ],
    };

    (prismaMock.ingredient.findMany as jest.Mock).mockResolvedValue([
      { id: 1 },
      { id: 2 },
    ]);
    (prismaMock.purchase.create as jest.Mock).mockImplementation(
      ({ data }: { data: PurchaseCreateData }) => {
        expect(data.totalAmount?.toNumber()).toBeCloseTo(15.5, 2);
        return Promise.resolve({ id: 10 });
      },
    );
    (prismaMock.ingredient.findFirst as jest.Mock).mockResolvedValue({
      totalCost: new Prisma.Decimal(0),
      totalAmount: new Prisma.Decimal(0.1),
    });

    await service.create(userId, dto);

    expect(prismaMock.purchase.create as jest.Mock).toHaveBeenCalled();
  });
});
