import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateIngredientDto {
  @ApiProperty({ description: 'Nome do ingrediente', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Unidade de medida (ex.: kg, g, ml)',
    maxLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  unitOfMeasure: string;

  @ApiPropertyOptional({
    description: 'Categoria opcional do ingrediente',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiProperty({
    description: 'Custo total da compra do ingrediente',
    example: 25.5,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  totalCost: number;

  @ApiProperty({ description: 'Quantidade total adquirida', example: 2.5 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  totalAmount: number;
}
