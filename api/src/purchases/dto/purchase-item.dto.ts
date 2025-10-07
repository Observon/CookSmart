import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class PurchaseItemDto {
  @ApiProperty({
    description: 'Identificador do ingrediente comprado',
    example: 1,
  })
  @IsPositive()
  ingredientId: number;

  @ApiProperty({
    description: 'Quantidade adquirida para o ingrediente',
    example: 2.5,
  })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  quantity: number;

  @ApiProperty({
    description: 'Preço total pago pelo ingrediente',
    example: 30,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  totalPrice: number;
}
