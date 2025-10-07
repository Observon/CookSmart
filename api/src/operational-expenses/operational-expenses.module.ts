import { Module } from '@nestjs/common';
import { OperationalExpensesService } from './operational-expenses.service';
import { OperationalExpensesController } from './operational-expenses.controller';

@Module({
  providers: [OperationalExpensesService],
  controllers: [OperationalExpensesController],
})
export class OperationalExpensesModule {}
