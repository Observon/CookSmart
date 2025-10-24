import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthPasswordService } from './services/auth-password.service';
import { AuthTokenService } from './services/auth-token.service';
import { AuthSupabaseService } from './services/auth-supabase.service';

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const configServiceMock = {
    get: jest.fn(),
  };

  const passwordServiceMock = {
    hash: jest.fn().mockResolvedValue('hashed'),
    compare: jest.fn().mockResolvedValue(true),
  };

  const tokenServiceMock = {
    buildAuthResponse: jest.fn(),
  };

  const supabaseServiceMock = {
    resetPasswordForEmail: jest.fn(),
    getUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock as unknown as PrismaService },
        { provide: AuthPasswordService, useValue: passwordServiceMock as unknown as AuthPasswordService },
        { provide: AuthTokenService, useValue: tokenServiceMock as unknown as AuthTokenService },
        { provide: AuthSupabaseService, useValue: supabaseServiceMock as unknown as AuthSupabaseService },
        { provide: ConfigService, useValue: configServiceMock as unknown as ConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('registers user and returns token response', async () => {
    (prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
    (prismaMock.user.create as jest.Mock).mockResolvedValueOnce({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      phone: null,
    });
    (tokenServiceMock.buildAuthResponse as jest.Mock).mockReturnValue({
      accessToken: 'token',
      expiresIn: '1d',
      user: {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone: null,
      },
    });

    const result = await service.register({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'secret',
    });

    expect(passwordServiceMock.hash).toHaveBeenCalledWith('secret');
    expect(tokenServiceMock.buildAuthResponse).toHaveBeenCalled();
    expect(result.accessToken).toBe('token');
  });
});
