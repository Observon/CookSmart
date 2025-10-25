import { Module } from '@nestjs/common';

import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PurchasesValidationService } from './services/purchases-validation.service';
import { PurchasesTotalsService } from './services/purchases-totals.service';
import { PurchasesInventoryService } from './services/purchases-inventory.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PurchasesController],
  providers: [PurchasesService, PurchasesValidationService, PurchasesTotalsService, PurchasesInventoryService],
})
export class PurchasesModule {}
