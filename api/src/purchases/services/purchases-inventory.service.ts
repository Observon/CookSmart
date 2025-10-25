import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class PurchasesInventoryService {
  async adjustInventory(
    tx: Pick<Prisma.TransactionClient, 'ingredient'>,
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
      throw new BadRequestException('Atualização deixaria o ingrediente com valores negativos');
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
}
