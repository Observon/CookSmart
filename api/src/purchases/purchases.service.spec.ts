import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';

import { PurchasesService } from './purchases.service';
import { PrismaService } from '../prisma/prisma.service';
import { PurchasesValidationService } from './services/purchases-validation.service';
import { PurchasesTotalsService } from './services/purchases-totals.service';
import { PurchasesInventoryService } from './services/purchases-inventory.service';

describe('PurchasesService', () => {
  let service: PurchasesService;

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

  const validationServiceMock = {
    ensureItemsPresent: jest.fn(),
    extractIngredientIds: jest.fn(),
    ensureIngredientsBelongToUser: jest.fn(),
    ensureTotalsNonNegative: jest.fn(),
  } as unknown as PurchasesValidationService;

  const totalsServiceMock = {
    computeTotalAmount: jest.fn(),
    computeUnitPrice: jest.fn(),
  } as unknown as PurchasesTotalsService;

  const inventoryServiceMock = {
    adjustInventory: jest.fn(),
  } as unknown as PurchasesInventoryService;

  beforeEach(async () => {
    Object.values(prismaMock.purchase).forEach((fn) =>
      (fn as jest.Mock).mockReset?.(),
    );
    Object.values(prismaMock.purchaseItem).forEach((fn) =>
      (fn as jest.Mock).mockReset?.(),
    );
    Object.values(prismaMock.ingredient).forEach((fn) =>
      (fn as jest.Mock).mockReset?.(),
    );
    (prismaMock.$transaction as jest.Mock).mockReset();

    (prismaMock.$transaction as jest.Mock).mockImplementation(
      async (callback: (tx: PrismaService) => Promise<unknown>) =>
        callback(prismaMock),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchasesService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: PurchasesValidationService, useValue: validationServiceMock },
        { provide: PurchasesTotalsService, useValue: totalsServiceMock },
        { provide: PurchasesInventoryService, useValue: inventoryServiceMock },
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
    (validationServiceMock.extractIngredientIds as jest.Mock).mockReturnValue([1]);
    (validationServiceMock.ensureIngredientsBelongToUser as jest.Mock).mockResolvedValue(undefined);
    (totalsServiceMock.computeTotalAmount as jest.Mock).mockReturnValue(new Prisma.Decimal(45.9));
    (totalsServiceMock.computeUnitPrice as jest.Mock).mockReturnValue(new Prisma.Decimal(12.5));
    (validationServiceMock.ensureTotalsNonNegative as jest.Mock).mockReturnValue(undefined);
    (prismaMock.purchase.create as jest.Mock).mockResolvedValue({ id: 99 });
    (inventoryServiceMock.adjustInventory as jest.Mock).mockResolvedValue(undefined);

    const result = await service.create(userId, dto);

    expect(validationServiceMock.ensureItemsPresent).toHaveBeenCalledWith(dto.items);
    expect(validationServiceMock.extractIngredientIds).toHaveBeenCalledWith(dto.items);
    expect(validationServiceMock.ensureIngredientsBelongToUser).toHaveBeenCalled();

    expect(prismaMock.purchase.create).toHaveBeenCalledWith({
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

    expect(inventoryServiceMock.adjustInventory).toHaveBeenCalledWith(
      expect.anything(),
      userId,
      1,
      expect.any(Prisma.Decimal),
      expect.any(Prisma.Decimal),
      'add',
    );

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

    (validationServiceMock.extractIngredientIds as jest.Mock).mockReturnValue([1, 2]);
    (validationServiceMock.ensureIngredientsBelongToUser as jest.Mock).mockResolvedValue(undefined);
    (totalsServiceMock.computeTotalAmount as jest.Mock).mockReturnValue(new Prisma.Decimal(15.5));
    (validationServiceMock.ensureTotalsNonNegative as jest.Mock).mockReturnValue(undefined);
    (prismaMock.purchase.create as jest.Mock).mockResolvedValue({ id: 10 });

    await service.create(userId, dto);

    expect(totalsServiceMock.computeTotalAmount).toHaveBeenCalledWith(dto.items, undefined);
  });
});
