import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ParseIntPipe } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import { IngredientsService } from './ingredients.service';
import { CreateIngredientDto, UpdateIngredientDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUserDto } from '../auth/dto';

@ApiTags('ingredients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ingredients')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Post()
  @ApiCreatedResponse({ description: 'Ingrediente criado com sucesso.' })
  create(@CurrentUser() user: AuthUserDto, @Body() dto: CreateIngredientDto) {
    return this.ingredientsService.create(user.id, dto);
  }

  @Get()
  @ApiOkResponse({ description: 'Lista de ingredientes do usuário.' })
  findAll(@CurrentUser() user: AuthUserDto) {
    return this.ingredientsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Detalhes do ingrediente.' })
  findOne(
    @CurrentUser() user: AuthUserDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ingredientsService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Ingrediente atualizado com sucesso.' })
  update(
    @CurrentUser() user: AuthUserDto,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIngredientDto,
  ) {
    return this.ingredientsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiNoContentResponse({ description: 'Ingrediente removido com sucesso.' })
  remove(
    @CurrentUser() user: AuthUserDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ingredientsService.remove(user.id, id);
  }
}
