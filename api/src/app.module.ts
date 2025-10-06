import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { IngredientsModule } from './ingredients/ingredients.module';
import { RecipesModule } from './recipes/recipes.module';
import { PurchasesModule } from './purchases/purchases.module';
import { OperationalExpensesModule } from './operational-expenses/operational-expenses.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    IngredientsModule,
    RecipesModule,
    PurchasesModule,
    OperationalExpensesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
