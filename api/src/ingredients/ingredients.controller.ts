import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ParseIntPipe } from '@nestjs/common';

import { IngredientsService } from './ingredients.service';
import { CreateIngredientDto, UpdateIngredientDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUserDto } from '../auth/dto';

@UseGuards(JwtAuthGuard)
@Controller('ingredients')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Post()
  create(@CurrentUser() user: AuthUserDto, @Body() dto: CreateIngredientDto) {
    return this.ingredientsService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUserDto) {
    return this.ingredientsService.findAll(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUserDto, @Param('id', ParseIntPipe) id: number) {
    return this.ingredientsService.findOne(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUserDto,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIngredientDto,
  ) {
    return this.ingredientsService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUserDto, @Param('id', ParseIntPipe) id: number) {
    return this.ingredientsService.remove(user.id, id);
  }
}
