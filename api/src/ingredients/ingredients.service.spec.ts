import { Test, TestingModule } from '@nestjs/testing';

import { IngredientsService } from './ingredients.service';
import { PrismaService } from '../prisma/prisma.service';

describe('IngredientsService', () => {
  let service: IngredientsService;

  const prismaMock = {
    ingredient: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  } as unknown as PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngredientsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<IngredientsService>(IngredientsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
