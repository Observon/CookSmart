import { Test, TestingModule } from '@nestjs/testing';

import { OperationalExpensesService } from './operational-expenses.service';
import { PrismaService } from '../prisma/prisma.service';

describe('OperationalExpensesService', () => {
  let service: OperationalExpensesService;

  const prismaMock = {} as PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperationalExpensesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<OperationalExpensesService>(
      OperationalExpensesService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
