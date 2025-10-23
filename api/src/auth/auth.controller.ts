import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiCreatedResponse({
    description: 'Usuário registrado com sucesso',
    type: AuthResponseDto,
  })
  async register(@Body() data: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(data);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Login realizado com sucesso',
    type: AuthResponseDto,
  })
  async login(@Body() data: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(data);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Solicitação enviada caso o email exista' })
  async forgotPassword(@Body() data: RequestPasswordResetDto): Promise<void> {
    await this.authService.requestPasswordReset(data.email);
  }
}
