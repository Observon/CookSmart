import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

type PurchaseItemInput = {
  ingredientId: number;
  quantity: number;
  totalPrice: number;
};

@Injectable()
export class PurchasesValidationService {
  ensureItemsPresent(items: PurchaseItemInput[] | undefined): asserts items is PurchaseItemInput[] {
    if (!items?.length) {
      throw new BadRequestException('Itens da compra não podem estar vazios');
    }
  }

  extractIngredientIds(items: PurchaseItemInput[]): number[] {
    return [...new Set(items.map((item) => item.ingredientId))];
  }

  async ensureIngredientsBelongToUser(
    tx: Pick<Prisma.TransactionClient, 'ingredient'>,
    userId: number,
    ingredientIds: number[],
  ): Promise<void> {
    const ingredients = await tx.ingredient.findMany({
      where: {
        userId,
        id: { in: ingredientIds },
      },
      select: { id: true },
    });

    if (ingredients.length !== ingredientIds.length) {
      throw new BadRequestException('Ingrediente inválido ou não pertence ao usuário');
    }
  }

  ensureTotalsNonNegative(total: Prisma.Decimal) {
    if (total.isNegative()) {
      throw new BadRequestException('Valor total da compra não pode ser negativo');
    }
  }
}
