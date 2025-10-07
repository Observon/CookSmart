import { PartialType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { CreatePurchaseDto } from './create-purchase.dto';
import { PurchaseItemDto } from './purchase-item.dto';

export class UpdatePurchaseDto extends PartialType(CreatePurchaseDto) {
  @ApiPropertyOptional({
    description: 'Itens atualizados da compra',
    type: [PurchaseItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items?: PurchaseItemDto[];
}
