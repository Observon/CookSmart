import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { PurchaseItemDto } from './purchase-item.dto';

export class CreatePurchaseDto {
  @ApiProperty({
    description: 'Data da compra no formato ISO 8601',
    example: '2025-01-15',
  })
  @IsDateString()
  purchaseDate: string;

  @ApiPropertyOptional({ description: 'Fornecedor da compra' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  supplier?: string;

  @ApiProperty({
    description: 'Itens incluídos na compra',
    type: [PurchaseItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items: PurchaseItemDto[];
}
