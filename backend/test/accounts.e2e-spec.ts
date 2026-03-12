import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import {
  S3Client,
  HeadObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';

import { AppModule } from '../src/app.module.js';
import { JwtAuthGuard } from '../src/shared/infrastructure/auth/index.js';
import { setupApp } from '../src/setup-app.js';
import { PrismaService } from '../src/shared/infrastructure/prisma/prisma.service.js';

import { MockJwtAuthGuard } from './helpers/mock-auth.guard.js';
import {
  USER_PAYLOAD,
  NO_PERMISSIONS_PAYLOAD,
  authHeader,
} from './helpers/test-fixtures.js';

// Algorithmically valid CPFs (pass cpf-cnpj-validator)
const CPF_1 = '17663758803';
const CPF_2 = '53887317823';

const S3_BUCKET = process.env.S3_BUCKET ?? 'account';
const COMPANY_SLUG = process.env.COMPANY_SLUG ?? 'test';

describe('Accounts API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let s3Client: S3Client;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();

    setupApp(app);

    await app.init();

    prisma = app.get(PrismaService);

    s3Client = new S3Client({
      endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
      region: process.env.S3_REGION ?? 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY ?? 'minioadmin',
        secretAccessKey: process.env.S3_SECRET_KEY ?? 'minioadmin',
      },
      forcePathStyle: true,
    });
  });

  afterAll(async () => {
    s3Client.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // Clean all accounts between tests
    await prisma.account.deleteMany();

    // Clean all objects in the S3 bucket
    const listed = await s3Client.send(
      new ListObjectsV2Command({ Bucket: S3_BUCKET }),
    );
    if (listed.Contents?.length) {
      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: S3_BUCKET,
          Delete: {
            Objects: listed.Contents.map((o) => ({ Key: o.Key })),
          },
        }),
      );
    }
  });

  // -- Helper: create an account via the API -----------------

  async function createAccount(
    overrides: {
      name?: string;
      cpf?: string;
      user?: typeof USER_PAYLOAD;
    } = {},
  ) {
    const user = overrides.user ?? USER_PAYLOAD;
    const res = await request(app.getHttpServer())
      .post('/accounts')
      .set('x-test-auth', authHeader(user))
      .send({
        name: overrides.name ?? 'John Doe',
        cpf: overrides.cpf ?? CPF_1,
      })
      .expect(201);
    return res.body;
  }

  // ===========================================================
  // AUTH: JWT Guard (AUTH-01)
  // ===========================================================

  describe('AUTH-01: JWT Guard enforcement', () => {
    it('returns 403 when no auth header is provided', async () => {
      await request(app.getHttpServer())
        .post('/accounts')
        .send({ name: 'Test', cpf: CPF_1 })
        .expect(403);
    });
  });

  // ===========================================================
  // AUTH: getMe requires only valid JWT (AUTH-02)
  // ===========================================================

  describe('AUTH-02: getMe requires only valid JWT', () => {
    it('returns 404 when no account exists for user (no permissions needed)', async () => {
      await request(app.getHttpServer())
        .get('/accounts/me')
        .set('x-test-auth', authHeader(NO_PERMISSIONS_PAYLOAD))
        .expect(404);
    });

    it('returns 200 when account exists for user', async () => {
      await createAccount();

      const res = await request(app.getHttpServer())
        .get('/accounts/me')
        .set('x-test-auth', authHeader(USER_PAYLOAD))
        .expect(200);

      expect(res.body.data).toHaveProperty('email', USER_PAYLOAD.email);
    });
  });

  // ===========================================================
  // REST-01: POST /accounts (create)
  // ===========================================================

  describe('REST-01: POST /accounts', () => {
    it('creates account, persists in DB, returns 201 with envelope', async () => {
      const body = await createAccount();

      expect(body.data).toMatchObject({
        name: 'John Doe',
        email: USER_PAYLOAD.email,
        cpf: CPF_1,
        phoneVerified: false,
      });
      expect(body.data).toHaveProperty('id');
      expect(body.data).toHaveProperty('createdAt');
      expect(body.data).toHaveProperty('updatedAt');
      expect(body.meta).toHaveProperty('timestamp');

      // Verify persisted in real DB
      const dbRecord = await prisma.account.findUnique({
        where: { id: body.data.id },
      });
      expect(dbRecord).not.toBeNull();
      expect(dbRecord!.name).toBe('John Doe');
    });

    it('is idempotent -- returns existing account on duplicate email', async () => {
      const first = await createAccount();
      const second = await createAccount();

      expect(first.data.id).toBe(second.data.id);

      // Only one record in DB
      const count = await prisma.account.count();
      expect(count).toBe(1);
    });

    it('is idempotent -- returns existing account when same email from different provider', async () => {
      const first = await createAccount();

      const otherUser = {
        ...USER_PAYLOAD,
        sub: 'auth0|other-user',
      };
      const res = await request(app.getHttpServer())
        .post('/accounts')
        .set('x-test-auth', authHeader(otherUser))
        .send({ name: 'Other', cpf: CPF_2 })
        .expect(201);

      expect(res.body.data.id).toBe(first.data.id);
    });

    it('returns 409 on duplicate CPF', async () => {
      await createAccount();

      const otherUser = {
        ...USER_PAYLOAD,
        sub: 'auth0|other-user',
        email: 'other@example.com',
      };
      const res = await request(app.getHttpServer())
        .post('/accounts')
        .set('x-test-auth', authHeader(otherUser))
        .send({ name: 'Other', cpf: CPF_1 })
        .expect(409);

      expect(res.body.error).toBe('DUPLICATE_CPF');
    });
  });

  // ===========================================================
  // REST-04: GET /accounts/me
  // ===========================================================

  describe('REST-04: GET /accounts/me', () => {
    it('returns own account when found', async () => {
      await createAccount();

      const res = await request(app.getHttpServer())
        .get('/accounts/me')
        .set('x-test-auth', authHeader(USER_PAYLOAD))
        .expect(200);

      expect(res.body.data.email).toBe(USER_PAYLOAD.email);
      expect(res.body.meta).toHaveProperty('timestamp');
    });

    it('returns 404 when no account exists for email', async () => {
      const res = await request(app.getHttpServer())
        .get('/accounts/me')
        .set('x-test-auth', authHeader(USER_PAYLOAD))
        .expect(404);

      expect(res.body.error).toBe('ACCOUNT_NOT_FOUND');
    });
  });

  // ===========================================================
  // IDENTITY: Multiple providers, same email -> same account
  // ===========================================================

  describe('IDENTITY: different subs with same verified email resolve to same account', () => {
    const googleUser: typeof USER_PAYLOAD = {
      ...USER_PAYLOAD,
      sub: 'google-oauth2|111111',
      email: 'john@example.com',
    };

    const emailCodeUser: typeof USER_PAYLOAD = {
      ...USER_PAYLOAD,
      sub: 'email|222222',
      email: 'john@example.com',
    };

    const passwordUser: typeof USER_PAYLOAD = {
      ...USER_PAYLOAD,
      sub: 'auth0|333333',
      email: 'john@example.com',
    };

    it('creates account with Google, then returns same account with email code login', async () => {
      const created = await createAccount({ user: googleUser });

      const res = await request(app.getHttpServer())
        .get('/accounts/me')
        .set('x-test-auth', authHeader(emailCodeUser))
        .expect(200);

      expect(res.body.data.id).toBe(created.data.id);
      expect(res.body.data.email).toBe('john@example.com');
    });

    it('creates account with email code, then returns same account with Google login', async () => {
      const created = await createAccount({ user: emailCodeUser });

      const res = await request(app.getHttpServer())
        .get('/accounts/me')
        .set('x-test-auth', authHeader(googleUser))
        .expect(200);

      expect(res.body.data.id).toBe(created.data.id);
    });

    it('POST /accounts is idempotent across three different providers', async () => {
      const first = await createAccount({ user: googleUser });

      const second = await request(app.getHttpServer())
        .post('/accounts')
        .set('x-test-auth', authHeader(emailCodeUser))
        .send({ name: 'John Doe', cpf: CPF_1 })
        .expect(201);

      const third = await request(app.getHttpServer())
        .post('/accounts')
        .set('x-test-auth', authHeader(passwordUser))
        .send({ name: 'John Doe', cpf: CPF_1 })
        .expect(201);

      expect(first.data.id).toBe(second.body.data.id);
      expect(first.data.id).toBe(third.body.data.id);

      const count = await prisma.account.count();
      expect(count).toBe(1);
    });

    it('allows update from any provider sub as long as email matches', async () => {
      await createAccount({ user: googleUser });

      const res = await request(app.getHttpServer())
        .patch('/accounts/me')
        .set('x-test-auth', authHeader(emailCodeUser))
        .send({ name: 'John Updated' })
        .expect(200);

      expect(res.body.data.name).toBe('John Updated');
    });

    it('blocks update when email does not match account owner', async () => {
      await createAccount({ user: googleUser });

      const attackerUser: typeof USER_PAYLOAD = {
        ...USER_PAYLOAD,
        sub: 'google-oauth2|attacker',
        email: 'attacker@example.com',
      };

      // Attacker has no account, so PATCH /me returns 404 (no account for this email)
      await request(app.getHttpServer())
        .patch('/accounts/me')
        .set('x-test-auth', authHeader(attackerUser))
        .send({ name: 'Hacked' })
        .expect(404);

      const dbRecord = await prisma.account.findFirst({
        where: { email: 'john@example.com' },
      });
      expect(dbRecord!.name).toBe('John Doe');
    });
  });

  // ===========================================================
  // REST-05: PATCH /accounts/me (update)
  // ===========================================================

  describe('REST-05: PATCH /accounts/me', () => {
    it('updates name, persists in DB, returns 200', async () => {
      await createAccount();

      const res = await request(app.getHttpServer())
        .patch('/accounts/me')
        .set('x-test-auth', authHeader(USER_PAYLOAD))
        .send({ name: 'Jane Doe' })
        .expect(200);

      expect(res.body.data.name).toBe('Jane Doe');

      // Verify persisted
      const dbRecord = await prisma.account.findFirst({
        where: { email: USER_PAYLOAD.email },
      });
      expect(dbRecord!.name).toBe('Jane Doe');
    });

    it('updates birthDate and returns 200', async () => {
      await createAccount();

      const res = await request(app.getHttpServer())
        .patch('/accounts/me')
        .set('x-test-auth', authHeader(USER_PAYLOAD))
        .send({ birthDate: '1990-05-15' })
        .expect(200);

      expect(res.body.data.birthDate).toContain('1990-05-15');
    });

    it('updates both name and birthDate', async () => {
      await createAccount();

      const res = await request(app.getHttpServer())
        .patch('/accounts/me')
        .set('x-test-auth', authHeader(USER_PAYLOAD))
        .send({ name: 'Jane Doe', birthDate: '1990-05-15' })
        .expect(200);

      expect(res.body.data.name).toBe('Jane Doe');
      expect(res.body.data.birthDate).toContain('1990-05-15');
    });

    it('returns 400 when no fields provided', async () => {
      await createAccount();

      await request(app.getHttpServer())
        .patch('/accounts/me')
        .set('x-test-auth', authHeader(USER_PAYLOAD))
        .send({})
        .expect(400);
    });

    it('returns 404 when user has no account', async () => {
      const otherUser = {
        ...USER_PAYLOAD,
        sub: 'auth0|other-user',
        email: 'other@example.com',
      };

      await request(app.getHttpServer())
        .patch('/accounts/me')
        .set('x-test-auth', authHeader(otherUser))
        .send({ name: 'Hacker Name' })
        .expect(404);
    });
  });

  // ===========================================================
  // REST-07: Request DTO validation
  // ===========================================================

  describe('REST-07: Request DTO validation', () => {
    it('returns 422 with structured field errors on invalid input', async () => {
      const res = await request(app.getHttpServer())
        .post('/accounts')
        .set('x-test-auth', authHeader(USER_PAYLOAD))
        .send({ name: '', cpf: 'invalid' })
        .expect(422);

      expect(res.body).toMatchObject({
        statusCode: 422,
        error: 'VALIDATION_ERROR',
        message: 'Validation failed',
      });
      expect(res.body.details).toBeDefined();
    });

    it('rejects unknown fields (forbidNonWhitelisted)', async () => {
      await request(app.getHttpServer())
        .post('/accounts')
        .set('x-test-auth', authHeader(USER_PAYLOAD))
        .send({ name: 'John', cpf: CPF_1, extraField: 'hack' })
        .expect(422);
    });

    it('validates PATCH birthDate format', async () => {
      await createAccount();

      await request(app.getHttpServer())
        .patch('/accounts/me')
        .set('x-test-auth', authHeader(USER_PAYLOAD))
        .send({ birthDate: 'not-a-date' })
        .expect(422);
    });

    it('validates phone format on send-code', async () => {
      await createAccount();

      await request(app.getHttpServer())
        .post('/accounts/me/phone/send-code')
        .set('x-test-auth', authHeader(USER_PAYLOAD))
        .send({ phone: '123' })
        .expect(422);
    });
  });

  // ===========================================================
  // REST-08: Response DTO contract
  // ===========================================================

  describe('REST-08: Response DTO contract', () => {
    it('returns all 10 fields in stable contract', async () => {
      const body = await createAccount();
      const account = body.data;

      expect(account).toHaveProperty('id');
      expect(account).toHaveProperty('name');
      expect(account).toHaveProperty('email');
      expect(account).toHaveProperty('cpf');
      expect(account).toHaveProperty('birthDate');
      expect(account).toHaveProperty('phone');
      expect(account).toHaveProperty('phoneVerified');
      expect(account).toHaveProperty('photoUrl');
      expect(account).toHaveProperty('createdAt');
      expect(account).toHaveProperty('updatedAt');

      // Should NOT leak internal fields
      expect(account).not.toHaveProperty('auth0Sub');
      expect(account).not.toHaveProperty('_name');
    });
  });

  // ===========================================================
  // REST-09: Domain exception filter
  // ===========================================================

  describe('REST-09: Domain error mapping', () => {
    it('maps ACCOUNT_NOT_FOUND to 404 with standardized format', async () => {
      const res = await request(app.getHttpServer())
        .get('/accounts/me')
        .set('x-test-auth', authHeader(USER_PAYLOAD))
        .expect(404);

      expect(res.body).toMatchObject({
        statusCode: 404,
        error: 'ACCOUNT_NOT_FOUND',
      });
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('details');
    });

    it('maps duplicate email to idempotent 201 (same account returned)', async () => {
      const first = await createAccount();

      const otherUser = { ...USER_PAYLOAD, sub: 'auth0|other' };
      const res = await request(app.getHttpServer())
        .post('/accounts')
        .set('x-test-auth', authHeader(otherUser))
        .send({ name: 'Other', cpf: CPF_2 })
        .expect(201);

      expect(res.body.data.id).toBe(first.data.id);
    });

    it('maps DUPLICATE_CPF to 409', async () => {
      await createAccount();

      const otherUser = {
        ...USER_PAYLOAD,
        sub: 'auth0|other',
        email: 'other@example.com',
      };
      const res = await request(app.getHttpServer())
        .post('/accounts')
        .set('x-test-auth', authHeader(otherUser))
        .send({ name: 'Other', cpf: CPF_1 })
        .expect(409);

      expect(res.body.error).toBe('DUPLICATE_CPF');
    });
  });

  // ===========================================================
  // REST-10: POST /accounts/me/phone/send-code
  // ===========================================================

  describe('REST-10: POST /accounts/me/phone/send-code', () => {
    it('updates phone in DB and returns account', async () => {
      await createAccount();

      const res = await request(app.getHttpServer())
        .post('/accounts/me/phone/send-code')
        .set('x-test-auth', authHeader(USER_PAYLOAD))
        .send({ phone: '11987654321' })
        .expect(200);

      expect(res.body.data.phone).toBe('11987654321');

      // Verify persisted in DB
      const dbRecord = await prisma.account.findFirst({
        where: { email: USER_PAYLOAD.email },
      });
      expect(dbRecord!.phone).toBe('11987654321');
    });
  });

  // ===========================================================
  // REST-11: POST /accounts/me/phone/verify (deferred)
  // ===========================================================

  describe('REST-11: POST /accounts/me/phone/verify', () => {
    it('returns 501 Not Implemented', async () => {
      await createAccount();

      await request(app.getHttpServer())
        .post('/accounts/me/phone/verify')
        .set('x-test-auth', authHeader(USER_PAYLOAD))
        .send({ code: '123456' })
        .expect(501);
    });
  });

  // ===========================================================
  // REST-12: POST /accounts/me/photo (real S3/MinIO)
  // ===========================================================

  describe('REST-12: POST /accounts/me/photo', () => {
    it('uploads photo to S3/MinIO and returns account with photoUrl', async () => {
      const created = await createAccount();

      const res = await request(app.getHttpServer())
        .post('/accounts/me/photo')
        .set('x-test-auth', authHeader(USER_PAYLOAD))
        .attach('file', Buffer.from('fake-image-data'), {
          filename: 'photo.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      expect(res.body.data.photoUrl).toBeTruthy();
      expect(res.body.data.photoUrl).toContain('account');

      // Verify persisted in DB
      const dbRecord = await prisma.account.findUnique({
        where: { id: created.data.id },
      });
      expect(dbRecord!.photoUrl).toBe(res.body.data.photoUrl);

      // Verify file actually exists in S3/MinIO
      const s3Key = `companies/${COMPANY_SLUG}/accounts/${created.data.id}/photo`;
      const head = await s3Client.send(
        new HeadObjectCommand({ Bucket: S3_BUCKET, Key: s3Key }),
      );
      expect(head.$metadata.httpStatusCode).toBe(200);
      expect(head.ContentType).toBe('image/jpeg');
    });

    it('returns 404 when caller has no account', async () => {
      const otherUser = {
        sub: 'auth0|other-user',
        email: 'other@example.com',
        permissions: [] as string[],
        iss: 'https://test.auth0.com/',
        aud: 'test-api',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      await request(app.getHttpServer())
        .post('/accounts/me/photo')
        .set('x-test-auth', authHeader(otherUser))
        .attach('file', Buffer.from('fake-image-data'), {
          filename: 'photo.jpg',
          contentType: 'image/jpeg',
        })
        .expect(404);
    });
  });

  // ===========================================================
  // Health Check (TEST-06)
  // ===========================================================

  describe('Health Check', () => {
    it('GET /health returns 200 without auth', async () => {
      const res = await request(app.getHttpServer()).get('/health').expect(200);

      // Controller uses @Res() so response is not wrapped by interceptor
      const health = res.body;
      expect(health.status).toBe('ok');
      expect(health.services.database).toBeDefined();
      expect(health.services.storage).toBeDefined();
    });
  });

  // ===========================================================
  // Response envelope (cross-cutting)
  // ===========================================================

  describe('Response envelope', () => {
    it('wraps single resource in { data, meta: { timestamp } }', async () => {
      const body = await createAccount();

      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('meta');
      expect(body.meta).toHaveProperty('timestamp');
      expect(typeof body.meta.timestamp).toBe('string');
    });

    it('does NOT wrap error responses in envelope', async () => {
      const res = await request(app.getHttpServer())
        .get('/accounts/me')
        .set('x-test-auth', authHeader(USER_PAYLOAD))
        .expect(404);

      expect(res.body).toHaveProperty('statusCode');
      expect(res.body).toHaveProperty('error');
      expect(res.body).not.toHaveProperty('meta');
    });
  });
});
