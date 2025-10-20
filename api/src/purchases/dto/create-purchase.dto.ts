import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
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

  @ApiPropertyOptional({ description: 'URL ou caminho da imagem do comprovante' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  receiptImage?: string;

  @ApiPropertyOptional({ description: 'Número da nota fiscal associado à compra' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  invoiceNumber?: string;

  @ApiPropertyOptional({ description: 'Documento fiscal/CNPJ do fornecedor' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  supplierTaxId?: string;

  @ApiPropertyOptional({ description: 'Moeda utilizada na nota fiscal', example: 'BRL' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  currency?: string;

  @ApiPropertyOptional({ description: 'Valor total registrado na nota fiscal', type: Number })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  totalAmount?: number;

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
