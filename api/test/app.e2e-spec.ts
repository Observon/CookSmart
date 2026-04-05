import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthService } from '../src/auth/auth.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  const prismaMock = {
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  } as Partial<PrismaService>;

  const authServiceMock = {
    register: jest.fn().mockResolvedValue({
      accessToken: 'register-token',
      expiresIn: '1d',
      user: {
        id: 1,
        name: 'Joao Teste',
        email: 'joao@example.com',
        phone: null,
      },
    }),
    login: jest.fn().mockResolvedValue({
      accessToken: 'login-token',
      expiresIn: '1d',
      user: {
        id: 1,
        name: 'Joao Teste',
        email: 'joao@example.com',
        phone: null,
      },
    }),
    requestPasswordReset: jest.fn().mockResolvedValue(undefined),
    completePasswordReset: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(AuthService)
      .useValue(authServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/auth/register (POST) deve respeitar contrato de resposta', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Joao Teste',
        email: 'joao@example.com',
        password: 'senhaSegura123',
      })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        expiresIn: expect.any(String),
        user: expect.objectContaining({
          id: expect.any(Number),
          name: expect.any(String),
          email: expect.any(String),
        }),
      }),
    );
  });

  it('/auth/login (POST) deve respeitar contrato de resposta', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'joao@example.com',
        password: 'senhaSegura123',
      })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        expiresIn: expect.any(String),
        user: expect.objectContaining({
          id: expect.any(Number),
          name: expect.any(String),
          email: expect.any(String),
        }),
      }),
    );
  });

  it('/ingredients (GET) sem token deve retornar 401', () => {
    return request(app.getHttpServer()).get('/ingredients').expect(401);
  });

  it('/recipes (GET) sem token deve retornar 401', () => {
    return request(app.getHttpServer()).get('/recipes').expect(401);
  });

  it('/auth/register (POST) com payload inválido deve retornar 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'A',
        email: 'email-invalido',
        password: '123',
      })
      .expect(400);

    const body = response.body as {
      statusCode?: number;
      error?: string;
      message?: unknown;
    };

    expect(body.statusCode).toBe(400);
    expect(body.error).toBe('Bad Request');
    expect(Array.isArray(body.message)).toBe(true);
  });

  it('/auth/login (POST) sem senha deve retornar 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'user@example.com',
      })
      .expect(400);

    const body = response.body as {
      statusCode?: number;
      error?: string;
      message?: unknown;
    };

    expect(body.statusCode).toBe(400);
    expect(body.error).toBe('Bad Request');
    expect(Array.isArray(body.message)).toBe(true);
  });
});
