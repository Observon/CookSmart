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

import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUserDto } from '../auth/dto';

@ApiTags('purchases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @ApiCreatedResponse({ description: 'Compra registrada com sucesso.' })
  create(@CurrentUser() user: AuthUserDto, @Body() dto: CreatePurchaseDto) {
    return this.purchasesService.create(user.id, dto);
  }

  @Get()
  @ApiOkResponse({ description: 'Lista de compras realizadas pelo usuário.' })
  findAll(@CurrentUser() user: AuthUserDto) {
    return this.purchasesService.findAll(user.id);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Detalhes da compra.' })
  findOne(
    @CurrentUser() user: AuthUserDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.purchasesService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Compra atualizada com sucesso.' })
  update(
    @CurrentUser() user: AuthUserDto,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePurchaseDto,
  ) {
    return this.purchasesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Compra removida com sucesso.' })
  remove(
    @CurrentUser() user: AuthUserDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.purchasesService.remove(user.id, id);
  }
}
