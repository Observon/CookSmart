import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { AuthPasswordService } from './services/auth-password.service';
import { AuthTokenService } from './services/auth-token.service';
import { AuthSupabaseService } from './services/auth-supabase.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: AuthPasswordService,
    private readonly tokenService: AuthTokenService,
    private readonly supabaseService: AuthSupabaseService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const passwordHash = await this.passwordService.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        phone: dto.phone,
      },
    });

    return this.tokenService.buildAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordValid = await this.passwordService.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return this.tokenService.buildAuthResponse(user);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const redirectTo = this.configService.get<string>('SUPABASE_RESET_REDIRECT_URL');

    if (!redirectTo) {
      throw new InternalServerErrorException('SUPABASE_RESET_REDIRECT_URL não configurada');
    }

    await this.supabaseService.resetPasswordForEmail(email, redirectTo);
  }

  async completePasswordReset(accessToken: string, newPassword: string): Promise<void> {
    const { data, error } = await this.supabaseService.getUser(accessToken);

    if (error || !data?.user?.email) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    const user = await this.prisma.user.findUnique({ where: { email: data.user.email } });

    if (!user) {
      return;
    }

    const passwordHash = await this.passwordService.hash(newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });
  }
}
