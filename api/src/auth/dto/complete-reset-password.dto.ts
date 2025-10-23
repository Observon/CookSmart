import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CompleteResetPasswordDto {
  @ApiProperty({ description: 'Token de acesso retornado pelo Supabase' })
  @IsString({ message: 'Token deve ser uma string' })
  @IsNotEmpty({ message: 'Token é obrigatório' })
  accessToken!: string;

  @ApiProperty({ description: 'Nova senha' })
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @MaxLength(64, { message: 'Senha deve ter no máximo 64 caracteres' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Senha deve conter ao menos uma letra e um número',
  })
  newPassword!: string;
}
