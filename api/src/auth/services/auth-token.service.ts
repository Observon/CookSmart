import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { AuthResponseDto, AuthUserDto } from '../dto/auth-response.dto';
import { JwtPayload } from '../types/jwt-payload.interface';

@Injectable()
export class AuthTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  buildAuthResponse(user: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
  }): AuthResponseDto {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '1d');
    const secret = this.configService.get<string>('JWT_SECRET');

    const accessToken = this.jwtService.sign(payload, {
      secret,
      expiresIn,
    });

    const authUser: AuthUserDto = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    };

    return {
      accessToken,
      expiresIn,
      user: authUser,
    };
  }
}
