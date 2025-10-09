import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { RecipeIngredientInputDto } from './recipe-ingredient-input.dto';

export class CreateRecipeDto {
  @ApiProperty({ description: 'Nome da receita', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Descrição opcional da receita' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Quantidade de porções geradas pela receita',
    minimum: 1,
    example: 8,
  })
  @IsNumber({ maxDecimalPlaces: 0 })
  @IsPositive()
  servings: number;

  @ApiPropertyOptional({
    description: 'Margem de lucro percentual utilizada no cálculo do preço sugerido',
    example: 200,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  profitMargin?: number;

  @ApiProperty({ description: 'Lista de ingredientes utilizados' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientInputDto)
  ingredients: RecipeIngredientInputDto[];
}
