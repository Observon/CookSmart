import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class DetectedIngredientItemDto {
  @ApiPropertyOptional({
    description: 'Identificador arbitrário enviado pelo cliente para correlacionar a resposta',
    example: 'item-1',
  })
  @IsOptional()
  @IsString()
  clientItemId?: string;

  @ApiProperty({ description: 'Nome do ingrediente que será criado', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ description: 'Nome detectado originalmente pelo OCR' })
  @IsOptional()
  @IsString()
  detectedName?: string;

  @ApiProperty({ description: 'Unidade de medida utilizada no estoque', maxLength: 10 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  unitOfMeasure!: string;

  @ApiPropertyOptional({ description: 'Categoria opcional para o ingrediente', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;
}

export class CreateDetectedIngredientsDto {
  @ApiProperty({ type: [DetectedIngredientItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DetectedIngredientItemDto)
  items!: DetectedIngredientItemDto[];
}

export class CreatedDetectedIngredientDto {
  @ApiPropertyOptional({
    description: 'Identificador arbitrário enviado pelo cliente que originou este ingrediente',
    example: 'item-1',
    nullable: true,
  })
  clientItemId?: string | null;

  @ApiProperty({ description: 'Identificador interno do ingrediente recém-criado', example: 42 })
  ingredientId!: number;
}

export class CreateDetectedIngredientsResponseDto {
  @ApiProperty({ type: [CreatedDetectedIngredientDto] })
  created!: CreatedDetectedIngredientDto[];
}
