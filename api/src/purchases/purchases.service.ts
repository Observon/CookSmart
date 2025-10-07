import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';

@Injectable()
export class PurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreatePurchaseDto) {
    const ingredientIds = [
      ...new Set(dto.items.map((item) => item.ingredientId)),
    ];
    await this.ensureIngredientsBelongToUser(userId, ingredientIds);

    return this.prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.create({
        data: {
          userId,
          purchaseDate: new Date(dto.purchaseDate),
          supplier: dto.supplier ?? null,
          items: {
            create: dto.items.map((item) => ({
              ingredientId: item.ingredientId,
              quantity: new Prisma.Decimal(item.quantity),
              totalPrice: new Prisma.Decimal(item.totalPrice),
              unitPrice: new Prisma.Decimal(item.totalPrice).div(
                new Prisma.Decimal(item.quantity),
              ),
            })),
          },
        },
        include: this.defaultInclude,
      });

      for (const item of dto.items) {
        await this.adjustIngredientInventory(
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

      if (dto.items) {
        const ingredientIds = [
          ...new Set(dto.items.map((item) => item.ingredientId)),
        ];
        await this.ensureIngredientsBelongToUser(userId, ingredientIds, tx);

        for (const item of purchase.items) {
          await this.adjustIngredientInventory(
            tx,
            userId,
            item.ingredientId,
            item.quantity,
            item.totalPrice,
            'subtract',
          );
        }

        await tx.purchaseItem.deleteMany({ where: { purchaseId: id } });

        for (const item of dto.items) {
          await this.adjustIngredientInventory(
            tx,
            userId,
            item.ingredientId,
            new Prisma.Decimal(item.quantity),
            new Prisma.Decimal(item.totalPrice),
            'add',
          );
        }

        await tx.purchaseItem.createMany({
          data: dto.items.map((item) => ({
            purchaseId: id,
            ingredientId: item.ingredientId,
            quantity: new Prisma.Decimal(item.quantity),
            totalPrice: new Prisma.Decimal(item.totalPrice),
            unitPrice: new Prisma.Decimal(item.totalPrice).div(
              new Prisma.Decimal(item.quantity),
            ),
          })),
        });
      } else if (dto.purchaseDate || dto.supplier !== undefined) {
        // No inventory adjustment needed if items remain the same
      }

      const updated = await tx.purchase.update({
        where: { id },
        data: {
          purchaseDate: dto.purchaseDate
            ? new Date(dto.purchaseDate)
            : purchase.purchaseDate,
          supplier: dto.supplier ?? purchase.supplier,
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
        await this.adjustIngredientInventory(
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

  private async ensureIngredientsBelongToUser(
    userId: number,
    ingredientIds: number[],
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    if (ingredientIds.length === 0) {
      throw new BadRequestException('Itens da compra não podem estar vazios');
    }

    const ingredients = await tx.ingredient.findMany({
      where: {
        userId,
        id: { in: ingredientIds },
      },
      select: { id: true },
    });

    if (ingredients.length !== ingredientIds.length) {
      throw new BadRequestException(
        'Ingrediente inválido ou não pertence ao usuário',
      );
    }
  }

  private async adjustIngredientInventory(
    tx: Prisma.TransactionClient,
    userId: number,
    ingredientId: number,
    quantity: Prisma.Decimal,
    totalPrice: Prisma.Decimal,
    direction: 'add' | 'subtract',
  ) {
    const ingredient = await tx.ingredient.findFirst({
      where: { id: ingredientId, userId },
      select: {
        totalCost: true,
        totalAmount: true,
      },
    });

    if (!ingredient) {
      throw new BadRequestException('Ingrediente inválido para atualização');
    }

    const costDelta = totalPrice;
    const amountDelta = quantity;

    const newTotalCost =
      direction === 'add'
        ? ingredient.totalCost.add(costDelta)
        : ingredient.totalCost.sub(costDelta);
    const newTotalAmount =
      direction === 'add'
        ? ingredient.totalAmount.add(amountDelta)
        : ingredient.totalAmount.sub(amountDelta);

    if (newTotalAmount.isNegative() || newTotalCost.isNegative()) {
      throw new BadRequestException(
        'Atualização deixaria o ingrediente com valores negativos',
      );
    }

    const costPerUnit = newTotalAmount.isZero()
      ? new Prisma.Decimal(0)
      : newTotalCost.div(newTotalAmount);

    await tx.ingredient.update({
      where: { id: ingredientId },
      data: {
        totalCost: newTotalCost,
        totalAmount: newTotalAmount,
        costPerUnit,
      },
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
