import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { AuthResponseContract, AuthUserContract } from '@cooksmart/contracts';

export class AuthUserDto implements AuthUserContract {
  @ApiProperty({
    description: 'Identificador do usuário autenticado',
    example: 1,
  })
  id!: number;

  @ApiProperty({
    description: 'Nome do usuário autenticado',
    example: 'João da Silva',
  })
  name!: string;

  @ApiProperty({
    description: 'E-mail do usuário',
    example: 'joao@example.com',
  })
  email!: string;

  @ApiPropertyOptional({
    description: 'Telefone do usuário',
    example: '+55 11 99999-9999',
  })
  phone?: string | null;
}

export class AuthResponseDto implements AuthResponseContract {
  @ApiProperty({
    description: 'Token JWT para acessar os endpoints protegidos',
  })
  accessToken!: string;

  @ApiProperty({ description: 'Tempo de expiração do token', example: '1d' })
  expiresIn!: string;

  @ApiProperty({
    description: 'Dados do usuário autenticado',
    type: AuthUserDto,
  })
  user!: AuthUserDto;
}
