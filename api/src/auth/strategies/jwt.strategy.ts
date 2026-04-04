import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { JwtFromRequestFunction, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../types/jwt-payload.interface';

interface JwtStrategyConfig {
  jwtFromRequest: JwtFromRequestFunction;
  ignoreExpiration: boolean;
  secretOrKey: string;
}

const bearerTokenExtractor: JwtFromRequestFunction = (request: Request) => {
  const authorization = request.headers.authorization;
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const jwtSecret = String(configService.getOrThrow('JWT_SECRET'));

    const strategyOptions: JwtStrategyConfig = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      jwtFromRequest: bearerTokenExtractor,
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super(strategyOptions);
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    return user;
  }
}
