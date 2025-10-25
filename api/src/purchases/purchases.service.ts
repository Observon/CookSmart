import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { PurchasesValidationService } from './services/purchases-validation.service';
import { PurchasesTotalsService } from './services/purchases-totals.service';
import { PurchasesInventoryService } from './services/purchases-inventory.service';

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validationService: PurchasesValidationService,
    private readonly totalsService: PurchasesTotalsService,
    private readonly inventoryService: PurchasesInventoryService,
  ) {}

  async create(userId: number, dto: CreatePurchaseDto) {
    this.validationService.ensureItemsPresent(dto.items);
    const ingredientIds = this.validationService.extractIngredientIds(dto.items);

    return this.prisma.$transaction(async (tx) => {
      await this.validationService.ensureIngredientsBelongToUser(tx, userId, ingredientIds);

      const totalAmountDecimal = this.totalsService.computeTotalAmount(
        dto.items,
        dto.totalAmount,
      );
      this.validationService.ensureTotalsNonNegative(totalAmountDecimal);

      const purchase = await tx.purchase.create({
        data: {
          userId,
          purchaseDate: new Date(dto.purchaseDate),
          supplier: dto.supplier ?? null,
          receiptImage: dto.receiptImage ?? null,
          invoiceNumber: dto.invoiceNumber ?? null,
          supplierTaxId: dto.supplierTaxId ?? null,
          currency: dto.currency ?? null,
          totalAmount: totalAmountDecimal,
          items: {
            create: dto.items.map((item) => {
              const quantityDecimal = new Prisma.Decimal(item.quantity);
              const totalPriceDecimal = new Prisma.Decimal(item.totalPrice);

              return {
                ingredientId: item.ingredientId,
                quantity: quantityDecimal,
                totalPrice: totalPriceDecimal,
                unitPrice: this.totalsService.computeUnitPrice(
                  totalPriceDecimal,
                  quantityDecimal,
                ),
              };
            }),
          },
        },
        include: this.defaultInclude,
      });

      for (const item of dto.items) {
        await this.inventoryService.adjustInventory(
          tx,
          userId,
          item.ingredientId,
          new Prisma.Decimal(item.quantity),
          new Prisma.Decimal(item.totalPrice),
          'add',
        );
      }

      return purchase;
    });
  }

  async findAll(userId: number) {
    return this.prisma.purchase.findMany({
      where: { userId },
      orderBy: { purchaseDate: 'desc' },
      include: this.defaultInclude,
    });
  }

  async findOne(userId: number, id: number) {
    const purchase = await this.prisma.purchase.findFirst({
      where: { id, userId },
      include: this.defaultInclude,
    });
    if (!purchase) {
      throw new NotFoundException('Compra não encontrada');
    }
    return purchase;
  }

  async update(userId: number, id: number, dto: UpdatePurchaseDto) {
    return this.prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.findFirst({
        where: { id, userId },
        include: {
          items: true,
        },
      });

      if (!purchase) {
        throw new NotFoundException('Compra não encontrada');
      }

      let newTotalAmount: Prisma.Decimal;
      if (dto.totalAmount !== undefined) {
        newTotalAmount = new Prisma.Decimal(dto.totalAmount);
      } else if (purchase.totalAmount) {
        newTotalAmount = purchase.totalAmount;
      } else {
        newTotalAmount = new Prisma.Decimal(0);
      }

      if (dto.items) {
        this.validationService.ensureItemsPresent(dto.items);
        const ingredientIds = this.validationService.extractIngredientIds(dto.items);
        await this.validationService.ensureIngredientsBelongToUser(tx, userId, ingredientIds);

        for (const item of purchase.items) {
          await this.inventoryService.adjustInventory(
            tx,
            userId,
            item.ingredientId,
            item.quantity,
            item.totalPrice,
            'subtract',
          );
        }

        await tx.purchaseItem.deleteMany({ where: { purchaseId: id } });

        const itemsForCreation = dto.items.map((item) => {
          const quantityDecimal = new Prisma.Decimal(item.quantity);
          const totalPriceDecimal = new Prisma.Decimal(item.totalPrice);

          return {
            purchaseId: id,
            ingredientId: item.ingredientId,
            quantity: quantityDecimal,
            totalPrice: totalPriceDecimal,
            unitPrice: this.totalsService.computeUnitPrice(
              totalPriceDecimal,
              quantityDecimal,
            ),
          };
        });

        await tx.purchaseItem.createMany({ data: itemsForCreation });

        for (const item of dto.items) {
          await this.inventoryService.adjustInventory(
            tx,
            userId,
            item.ingredientId,
            new Prisma.Decimal(item.quantity),
            new Prisma.Decimal(item.totalPrice),
            'add',
          );
        }

        newTotalAmount = this.totalsService.computeTotalAmount(dto.items, dto.totalAmount);
      }

      this.validationService.ensureTotalsNonNegative(newTotalAmount);

      const updated = await tx.purchase.update({
        where: { id },
        data: {
          purchaseDate: dto.purchaseDate
            ? new Date(dto.purchaseDate)
            : purchase.purchaseDate,
          supplier: dto.supplier ?? purchase.supplier,
          receiptImage:
            dto.receiptImage !== undefined ? dto.receiptImage : purchase.receiptImage,
          invoiceNumber:
            dto.invoiceNumber !== undefined ? dto.invoiceNumber : purchase.invoiceNumber,
          supplierTaxId:
            dto.supplierTaxId !== undefined ? dto.supplierTaxId : purchase.supplierTaxId,
          currency: dto.currency !== undefined ? dto.currency : purchase.currency,
          totalAmount: newTotalAmount,
        },
        include: this.defaultInclude,
      });

      return updated;
    });
  }

  async remove(userId: number, id: number) {
    return this.prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.findFirst({
        where: { id, userId },
        include: {
          items: true,
        },
      });

      if (!purchase) {
        throw new NotFoundException('Compra não encontrada');
      }

      for (const item of purchase.items) {
        await this.inventoryService.adjustInventory(
          tx,
          userId,
          item.ingredientId,
          item.quantity,
          item.totalPrice,
          'subtract',
        );
      }

      await tx.purchaseItem.deleteMany({ where: { purchaseId: id } });
      await tx.purchase.delete({ where: { id } });

      return { id };
    });
  }

  private readonly defaultInclude = {
    items: {
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
