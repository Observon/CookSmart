import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  const prismaMock = {
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  } as Partial<PrismaService>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/ingredients (GET) sem token deve retornar 401', () => {
    return request(app.getHttpServer()).get('/ingredients').expect(401);
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

    expect(response.body.message).toBeDefined();
  });

  it('/auth/login (POST) sem senha deve retornar 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'user@example.com',
      })
      .expect(400);

    expect(response.body.message).toBeDefined();
  });
});
