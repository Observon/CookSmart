import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma, Ingredient } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateIngredientDto, UpdateIngredientDto } from './dto';

@Injectable()
export class IngredientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateIngredientDto) {
    const costPerUnit = this.computeCostPerUnit(dto.totalCost, dto.totalAmount);

    const data = {
      userId,
      name: dto.name,
      unitOfMeasure: dto.unitOfMeasure,
      category: dto.category ?? null,
      totalCost: dto.totalCost,
      totalAmount: dto.totalAmount,
      costPerUnit,
    } as Prisma.IngredientUncheckedCreateInput;

    return this.prisma.ingredient.create({ data });
  }

  async findAll(userId: number) {
    return this.prisma.ingredient.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(userId: number, id: number) {
    const ingredient = await this.prisma.ingredient.findFirst({
      where: { id, userId },
    });
    if (!ingredient) {
      throw new NotFoundException('Ingrediente não encontrado');
    }
    return ingredient;
  }

  async update(userId: number, id: number, dto: UpdateIngredientDto) {
    const existing = await this.ensureIngredientExists(userId, id);

    const data: Prisma.IngredientUncheckedUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }
    if (dto.unitOfMeasure !== undefined) {
      data.unitOfMeasure = dto.unitOfMeasure;
    }
    if (dto.category !== undefined) {
      data.category = dto.category ?? null;
    }

    let totalCost = Number(existing.totalCost);
    let totalAmount = Number(existing.totalAmount);

    if (dto.totalCost !== undefined) {
      totalCost = dto.totalCost;
      data.totalCost = dto.totalCost;
    }
    if (dto.totalAmount !== undefined) {
      totalAmount = dto.totalAmount;
      data.totalAmount = dto.totalAmount;
    }

    if (dto.totalCost !== undefined || dto.totalAmount !== undefined) {
      data.costPerUnit = this.computeCostPerUnit(totalCost, totalAmount);
    }

    return this.prisma.ingredient.update({
      where: { id },
      data,
    });
  }

  async remove(userId: number, id: number) {
    await this.ensureIngredientExists(userId, id);
    await this.prisma.ingredient.delete({ where: { id } });
    return { id };
  }

  private async ensureIngredientExists(
    userId: number,
    id: number,
  ): Promise<Ingredient> {
    const ingredient = await this.prisma.ingredient.findFirst({
      where: { id, userId },
      select: {
        id: true,
        userId: true,
        name: true,
        unitOfMeasure: true,
        category: true,
        totalCost: true,
        totalAmount: true,
        costPerUnit: true,
        registrationDate: true,
      },
    });
    if (!ingredient) {
      throw new NotFoundException('Ingrediente não encontrado');
    }
    return ingredient;
  }

  private computeCostPerUnit(totalCost: number, totalAmount: number): number {
    if (totalCost <= 0) {
      throw new BadRequestException(
        'O custo total do ingrediente deve ser maior que zero',
      );
    }

    if (totalAmount <= 0) {
      throw new BadRequestException(
        'A quantidade total do ingrediente deve ser maior que zero',
      );
    }

    return totalCost / totalAmount;
  }
}
