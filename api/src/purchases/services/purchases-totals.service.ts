import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class PurchasesTotalsService {
  computeTotalAmount(
    items: { totalPrice: number }[],
    providedTotal?: number,
  ): Prisma.Decimal {
    if (providedTotal !== undefined) {
      return new Prisma.Decimal(providedTotal);
    }

    return items.reduce(
      (acc, item) => acc.add(new Prisma.Decimal(item.totalPrice)),
      new Prisma.Decimal(0),
    );
  }

  computeUnitPrice(totalPrice: Prisma.Decimal, quantity: Prisma.Decimal): Prisma.Decimal {
    if (quantity.isZero()) {
      return new Prisma.Decimal(0);
    }

    return totalPrice.div(quantity);
  }
}
