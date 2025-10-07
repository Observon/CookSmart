import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUserDto } from '../auth/dto';

@ApiTags('recipes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  @ApiCreatedResponse({ description: 'Receita criada com sucesso.' })
  create(@CurrentUser() user: AuthUserDto, @Body() dto: CreateRecipeDto) {
    return this.recipesService.create(user.id, dto);
  }

  @Get()
  @ApiOkResponse({ description: 'Lista de receitas do usuário.' })
  findAll(@CurrentUser() user: AuthUserDto) {
    return this.recipesService.findAll(user.id);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Detalhes da receita.' })
  findOne(
    @CurrentUser() user: AuthUserDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.recipesService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Receita atualizada com sucesso.' })
  update(
    @CurrentUser() user: AuthUserDto,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRecipeDto,
  ) {
    return this.recipesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Receita removida com sucesso.' })
  remove(
    @CurrentUser() user: AuthUserDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.recipesService.remove(user.id, id);
  }
}
