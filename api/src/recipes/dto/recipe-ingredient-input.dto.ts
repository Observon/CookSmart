import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsPositive } from 'class-validator';

export class RecipeIngredientInputDto {
  @ApiProperty({ description: 'Identificador do ingrediente', example: 1 })
  @IsInt()
  @IsPositive()
  ingredientId: number;

  @ApiProperty({ description: 'Quantidade utilizada na receita', example: 0.5 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  quantity: number;
}
