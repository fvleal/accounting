import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';

import { AppModule } from '../src/app.module.js';
import { JwtAuthGuard } from '../src/shared/infrastructure/auth/index.js';
import { setupApp } from '../src/setup-app.js';
import { PrismaService } from '../src/shared/infrastructure/prisma/prisma.service.js';

import { MockJwtAuthGuard } from './helpers/mock-auth.guard.js';
import {
  USER_PAYLOAD,
  M2M_PAYLOAD,
  NO_PERMISSIONS_PAYLOAD,
  authHeader,
} from './helpers/test-fixtures.js';

// Algorithmically valid CPFs
const CPF_1 = '17663758803';
const CPF_2 = '53887317823';

// -- Attacker: a second regular user -------------------------
const ATTACKER_PAYLOAD = {
  ...USER_PAYLOAD,
  sub: 'auth0|attacker-999',
  email: 'attacker@example.com',
};

describe('Security E2E -- IDOR & Access Control', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

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
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await prisma.account.deleteMany();
  });

  // -- Helper: create an account via the API -----------------

  async function createAccountAs(
    user: typeof USER_PAYLOAD,
    overrides: { name?: string; cpf?: string } = {},
  ) {
    const res = await request(app.getHttpServer())
      .post('/accounts')
      .set('x-test-auth', authHeader(user))
      .send({
        name: overrides.name ?? 'Victim User',
        cpf: overrides.cpf ?? CPF_1,
      })
      .expect(201);
    return res.body.data;
  }

  // ===========================================================
  // ME-ISOLATION-01: /me routes only operate on caller's own account
  // ===========================================================

  describe('ME-ISOLATION-01: PATCH /accounts/me only modifies caller account', () => {
    it('attacker PATCH /me modifies only attacker account, not victim', async () => {
      await createAccountAs(USER_PAYLOAD);
      await createAccountAs(ATTACKER_PAYLOAD, {
        name: 'Attacker User',
        cpf: CPF_2,
      });

      await request(app.getHttpServer())
        .patch('/accounts/me')
        .set('x-test-auth', authHeader(ATTACKER_PAYLOAD))
        .send({ name: 'New Name' })
        .expect(200);

      // Victim account is unchanged
      const victim = await prisma.account.findFirst({
        where: { email: USER_PAYLOAD.email },
      });
      expect(victim!.name).toBe('Victim User');

      // Attacker account was updated
      const attacker = await prisma.account.findFirst({
        where: { email: ATTACKER_PAYLOAD.email },
      });
      expect(attacker!.name).toBe('New Name');
    });

    it('returns 404 when caller has no account', async () => {
      await createAccountAs(USER_PAYLOAD);

      await request(app.getHttpServer())
        .patch('/accounts/me')
        .set('x-test-auth', authHeader(ATTACKER_PAYLOAD))
        .send({ name: 'Hacked Name' })
        .expect(404);

      // Victim data unchanged
      const victim = await prisma.account.findFirst({
        where: { email: USER_PAYLOAD.email },
      });
      expect(victim!.name).toBe('Victim User');
    });
  });

  // ===========================================================
  // ME-ISOLATION-02: send-code /me only modifies caller phone
  // ===========================================================

  describe('ME-ISOLATION-02: send-code -- only modifies caller phone', () => {
    it('returns 404 when caller has no account', async () => {
      await createAccountAs(USER_PAYLOAD);

      await request(app.getHttpServer())
        .post('/accounts/me/phone/send-code')
        .set('x-test-auth', authHeader(ATTACKER_PAYLOAD))
        .send({ phone: '11999999999' })
        .expect(404);

      // Victim phone unchanged
      const victim = await prisma.account.findFirst({
        where: { email: USER_PAYLOAD.email },
      });
      expect(victim!.phone).toBeNull();
    });
  });

  // ===========================================================
  // ME-ISOLATION-03: photo upload /me only modifies caller photo
  // ===========================================================

  describe('ME-ISOLATION-03: photo upload -- only modifies caller photo', () => {
    it('returns 404 when caller has no account', async () => {
      await createAccountAs(USER_PAYLOAD);

      await request(app.getHttpServer())
        .post('/accounts/me/photo')
        .set('x-test-auth', authHeader(ATTACKER_PAYLOAD))
        .attach('file', Buffer.from('malicious-image'), {
          filename: 'hack.jpg',
          contentType: 'image/jpeg',
        })
        .expect(404);

      // Victim photo unchanged
      const victim = await prisma.account.findFirst({
        where: { email: USER_PAYLOAD.email },
      });
      expect(victim!.photoUrl).toBeNull();
    });
  });

  // ===========================================================
  // RBAC-02: M2M service (read-only) can create accounts
  // ===========================================================

  describe('RBAC-02: M2M service access control', () => {
    it('POST /accounts -- M2M can create accounts (only JWT required)', async () => {
      await request(app.getHttpServer())
        .post('/accounts')
        .set('x-test-auth', authHeader(M2M_PAYLOAD))
        .send({ name: 'Service Account', cpf: CPF_1 })
        .expect(201);
    });
  });

  // ===========================================================
  // RBAC-03: No permissions -- user routes still accessible
  // ===========================================================

  describe('RBAC-03: user with no permissions -- user routes accessible', () => {
    it('POST /accounts -- returns 201 (only JWT required)', async () => {
      await request(app.getHttpServer())
        .post('/accounts')
        .set('x-test-auth', authHeader(NO_PERMISSIONS_PAYLOAD))
        .send({ name: 'Nobody User', cpf: CPF_1 })
        .expect(201);
    });

    it('GET /accounts/me -- returns 404 (no account for this email, but not 403)', async () => {
      await request(app.getHttpServer())
        .get('/accounts/me')
        .set('x-test-auth', authHeader(NO_PERMISSIONS_PAYLOAD))
        .expect(404);
    });
  });

  // ===========================================================
  // AUTH-BYPASS-01: requests without auth header
  // ===========================================================

  describe('AUTH-BYPASS-01: unauthenticated requests are blocked', () => {
    it('POST /accounts -- returns 403', async () => {
      await request(app.getHttpServer())
        .post('/accounts')
        .send({ name: 'Anon', cpf: CPF_1 })
        .expect(403);
    });

    it('GET /accounts/me -- returns 403', async () => {
      await request(app.getHttpServer()).get('/accounts/me').expect(403);
    });

    it('PATCH /accounts/me -- returns 403', async () => {
      await request(app.getHttpServer())
        .patch('/accounts/me')
        .send({ name: 'Anon' })
        .expect(403);
    });

    it('POST /accounts/me/phone/send-code -- returns 403', async () => {
      await request(app.getHttpServer())
        .post('/accounts/me/phone/send-code')
        .send({ phone: '11999999999' })
        .expect(403);
    });

    it('POST /accounts/me/photo -- returns 403', async () => {
      await request(app.getHttpServer())
        .post('/accounts/me/photo')
        .attach('file', Buffer.from('data'), {
          filename: 'photo.jpg',
          contentType: 'image/jpeg',
        })
        .expect(403);
    });
  });

  // ===========================================================
  // DATA-LEAK-01: auth0Sub is never leaked in responses
  // ===========================================================

  describe('DATA-LEAK-01: auth0Sub is never leaked in responses', () => {
    it('POST /accounts response does not contain auth0Sub', async () => {
      const account = await createAccountAs(USER_PAYLOAD);
      expect(account).not.toHaveProperty('auth0Sub');
    });

    it('GET /accounts/me response does not contain auth0Sub', async () => {
      await createAccountAs(USER_PAYLOAD);

      const res = await request(app.getHttpServer())
        .get('/accounts/me')
        .set('x-test-auth', authHeader(USER_PAYLOAD))
        .expect(200);

      expect(res.body.data).not.toHaveProperty('auth0Sub');
    });

    it('PATCH response does not contain auth0Sub', async () => {
      await createAccountAs(USER_PAYLOAD);

      const res = await request(app.getHttpServer())
        .patch('/accounts/me')
        .set('x-test-auth', authHeader(USER_PAYLOAD))
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(res.body.data).not.toHaveProperty('auth0Sub');
    });
  });

  // ===========================================================
  // DATA-LEAK-02: error responses do not leak internal data
  // ===========================================================

  describe('DATA-LEAK-02: error responses do not leak internal data', () => {
    it('404 error does not leak stack trace or internal paths', async () => {
      const res = await request(app.getHttpServer())
        .get('/accounts/me')
        .set('x-test-auth', authHeader(USER_PAYLOAD))
        .expect(404);

      const body = JSON.stringify(res.body);
      expect(body).not.toContain('src/');
      expect(body).not.toContain('.ts');
      expect(body).not.toContain('stack');
    });
  });

  // ===========================================================
  // INPUT-01: malformed UUIDs in non-existent routes return 404
  // ===========================================================

  describe('INPUT-01: no parameterized routes exist, random paths return 404', () => {
    const malformedIds = [
      'not-a-uuid',
      '../../../etc/passwd',
      '1; DROP TABLE accounts;--',
      '<script>alert(1)</script>',
    ];

    for (const badId of malformedIds) {
      it(`PATCH /accounts/${badId} returns 404 (no such route)`, async () => {
        await request(app.getHttpServer())
          .patch(`/accounts/${encodeURIComponent(badId)}`)
          .set('x-test-auth', authHeader(ATTACKER_PAYLOAD))
          .send({ name: 'Hacked' })
          .expect(404);
      });
    }
  });
});
