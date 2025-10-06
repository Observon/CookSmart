import { Test, TestingModule } from '@nestjs/testing';
import { OperationalExpensesService } from './operational-expenses.service';

describe('OperationalExpensesService', () => {
  let service: OperationalExpensesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OperationalExpensesService],
    }).compile();

    service = module.get<OperationalExpensesService>(OperationalExpensesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
