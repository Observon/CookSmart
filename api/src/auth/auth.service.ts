import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';
import { AuthResponseDto, AuthUserDto } from './dto/auth-response.dto';
import { JwtPayload } from './types/jwt-payload.interface';

@Injectable()
export class AuthService {
  private supabaseAdminClient: SupabaseClient | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const passwordHash = await this.hashPassword(dto.password);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        phone: dto.phone,
      },
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return this.buildAuthResponse(user);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const supabase = this.getSupabaseAdminClient();
    const redirectTo = this.configService.get<string>('SUPABASE_RESET_REDIRECT_URL');

    if (!redirectTo) {
      throw new InternalServerErrorException('SUPABASE_RESET_REDIRECT_URL não configurada');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  private getSupabaseAdminClient(): SupabaseClient {
    if (!this.supabaseAdminClient) {
      const url = this.configService.get<string>('SUPABASE_URL');
      const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

      if (!url || !serviceRoleKey) {
        throw new Error('Supabase credentials are not configured');
      }

      this.supabaseAdminClient = createClient(url, serviceRoleKey, {
        auth: {
          persistSession: false,
        },
      });
    }

    return this.supabaseAdminClient;
  }

  private buildAuthResponse(user: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
  }): AuthResponseDto {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '1d'),
    });

    const authUser: AuthUserDto = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    };

    return {
      accessToken,
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '1d'),
      user: authUser,
    };
  }
}
