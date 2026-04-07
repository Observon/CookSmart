import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  } as unknown as PrismaService;

  const jwtServiceMock = {
    sign: jest.fn(),
  } as unknown as JwtService;

  const configServiceMock = {
    get: jest.fn(),
  } as unknown as ConfigService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    (configServiceMock.get as jest.Mock).mockImplementation((key: string, fallback?: string) => {
      if (key === 'JWT_SECRET') {
        return 'test-secret';
      }
      if (key === 'JWT_EXPIRES_IN') {
        return fallback ?? '1d';
      }
      return undefined;
    });
  });

  it('register should throw conflict when email already exists', async () => {
    (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({ id: 1, email: 'john@example.com' });

    await expect(
      service.register({
        name: 'John',
        email: 'john@example.com',
        password: 'strongPass123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('register should create user and return auth payload', async () => {
    (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prismaMock.user.create as jest.Mock).mockResolvedValue({
      id: 7,
      name: 'Jane',
      email: 'jane@example.com',
      phone: null,
    });
    (jwtServiceMock.sign as jest.Mock).mockReturnValue('jwt-token');

    const result = await service.register({
      name: 'Jane',
      email: 'jane@example.com',
      password: 'strongPass123',
    });

    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'jane@example.com',
          passwordHash: expect.any(String),
        }),
      }),
    );

    const createCall = (prismaMock.user.create as jest.Mock).mock.calls[0][0];
    expect(createCall.data.passwordHash).not.toBe('strongPass123');

    expect(result).toEqual({
      accessToken: 'jwt-token',
      expiresIn: '1d',
      user: {
        id: 7,
        name: 'Jane',
        email: 'jane@example.com',
        phone: null,
      },
    });
  });

  it('login should throw unauthorized when user does not exist', async () => {
    (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      service.login({ email: 'missing@example.com', password: 'x' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('login should throw unauthorized when password is invalid', async () => {
    const validHash = await bcrypt.hash('validPass123', 10);

    (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({
      id: 7,
      name: 'Jane',
      email: 'jane@example.com',
      phone: null,
      passwordHash: validHash,
    });

    await expect(
      service.login({ email: 'jane@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('login should return token and user when credentials are valid', async () => {
    const validHash = await bcrypt.hash('validPass123', 10);

    (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({
      id: 8,
      name: 'Joao',
      email: 'joao@example.com',
      phone: '+55 11 99999-9999',
      passwordHash: validHash,
    });
    (jwtServiceMock.sign as jest.Mock).mockReturnValue('jwt-login');

    const result = await service.login({
      email: 'joao@example.com',
      password: 'validPass123',
    });

    expect(result.accessToken).toBe('jwt-login');
    expect(result.user.email).toBe('joao@example.com');
  });

  it('completePasswordReset should throw bad request when token is invalid', async () => {
    const getSupabaseAdminClientSpy = jest
      .spyOn(service as never, 'getSupabaseAdminClient' as never)
      .mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: null, error: new Error('invalid token') }),
        },
      } as never);

    await expect(
      service.completePasswordReset('invalid', 'newPassword123'),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(getSupabaseAdminClientSpy).toHaveBeenCalled();
  });
});
