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
  ADMIN_PAYLOAD,
  M2M_PAYLOAD,
  NO_PERMISSIONS_PAYLOAD,
  authHeader,
} from './helpers/test-fixtures.js';

// Algorithmically valid CPFs
const CPF_1 = '17663758803';
const CPF_2 = '53887317823';

// ── Attacker: a second regular user ────────────────────────
const ATTACKER_PAYLOAD = {
  ...USER_PAYLOAD,
  sub: 'auth0|attacker-999',
  email: 'attacker@example.com',
};

describe('Security E2E — IDOR & Access Control', () => {
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

  // ── Helper: create an account via the API ─────────────────

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

  // ═══════════════════════════════════════════════════════════
  // IDOR-01: PATCH /accounts/:id — outro usuário tenta alterar nome
  // ═══════════════════════════════════════════════════════════

  describe('IDOR-01: PATCH name — attacker cannot update victim name', () => {
    it('returns 403 ACCOUNT_OWNERSHIP_VIOLATION', async () => {
      const victim = await createAccountAs(USER_PAYLOAD);

      const res = await request(app.getHttpServer())
        .patch(`/accounts/${victim.id}`)
        .set('x-test-auth', authHeader(ATTACKER_PAYLOAD))
        .send({ name: 'Hacked Name' })
        .expect(403);

      expect(res.body.error).toBe('ACCOUNT_OWNERSHIP_VIOLATION');
    });

    it('does NOT modify victim data in the database', async () => {
      const victim = await createAccountAs(USER_PAYLOAD);

      await request(app.getHttpServer())
        .patch(`/accounts/${victim.id}`)
        .set('x-test-auth', authHeader(ATTACKER_PAYLOAD))
        .send({ name: 'Hacked Name' })
        .expect(403);

      const dbRecord = await prisma.account.findUnique({
        where: { id: victim.id },
      });
      expect(dbRecord!.name).toBe('Victim User');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // IDOR-02: PATCH /accounts/:id — outro usuário tenta alterar birthDate
  // ═══════════════════════════════════════════════════════════

  describe('IDOR-02: PATCH birthDate — attacker cannot update victim birthDate', () => {
    it('returns 403 ACCOUNT_OWNERSHIP_VIOLATION', async () => {
      const victim = await createAccountAs(USER_PAYLOAD);

      const res = await request(app.getHttpServer())
        .patch(`/accounts/${victim.id}`)
        .set('x-test-auth', authHeader(ATTACKER_PAYLOAD))
        .send({ birthDate: '2000-01-01' })
        .expect(403);

      expect(res.body.error).toBe('ACCOUNT_OWNERSHIP_VIOLATION');
    });

    it('does NOT modify victim birthDate in the database', async () => {
      const victim = await createAccountAs(USER_PAYLOAD);

      await request(app.getHttpServer())
        .patch(`/accounts/${victim.id}`)
        .set('x-test-auth', authHeader(ATTACKER_PAYLOAD))
        .send({ birthDate: '2000-01-01' })
        .expect(403);

      const dbRecord = await prisma.account.findUnique({
        where: { id: victim.id },
      });
      expect(dbRecord!.birthDate).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // IDOR-03: POST /accounts/:id/phone/send-code — outro usuário tenta alterar phone
  // ═══════════════════════════════════════════════════════════

  describe('IDOR-03: send-code — attacker cannot change victim phone', () => {
    it('returns 403 ACCOUNT_OWNERSHIP_VIOLATION', async () => {
      const victim = await createAccountAs(USER_PAYLOAD);

      const res = await request(app.getHttpServer())
        .post(`/accounts/${victim.id}/phone/send-code`)
        .set('x-test-auth', authHeader(ATTACKER_PAYLOAD))
        .send({ phone: '11999999999' })
        .expect(403);

      expect(res.body.error).toBe('ACCOUNT_OWNERSHIP_VIOLATION');
    });

    it('does NOT modify victim phone in the database', async () => {
      const victim = await createAccountAs(USER_PAYLOAD);

      await request(app.getHttpServer())
        .post(`/accounts/${victim.id}/phone/send-code`)
        .set('x-test-auth', authHeader(ATTACKER_PAYLOAD))
        .send({ phone: '11999999999' })
        .expect(403);

      const dbRecord = await prisma.account.findUnique({
        where: { id: victim.id },
      });
      expect(dbRecord!.phone).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // IDOR-04: POST /accounts/:id/photo — outro usuário tenta fazer upload de foto
  // ═══════════════════════════════════════════════════════════

  describe('IDOR-04: photo upload — attacker cannot upload to victim account', () => {
    it('returns 403 ACCOUNT_OWNERSHIP_VIOLATION', async () => {
      const victim = await createAccountAs(USER_PAYLOAD);

      const res = await request(app.getHttpServer())
        .post(`/accounts/${victim.id}/photo`)
        .set('x-test-auth', authHeader(ATTACKER_PAYLOAD))
        .attach('file', Buffer.from('malicious-image'), {
          filename: 'hack.jpg',
          contentType: 'image/jpeg',
        })
        .expect(403);

      expect(res.body.error).toBe('ACCOUNT_OWNERSHIP_VIOLATION');
    });

    it('does NOT modify victim photoUrl in the database', async () => {
      const victim = await createAccountAs(USER_PAYLOAD);

      await request(app.getHttpServer())
        .post(`/accounts/${victim.id}/photo`)
        .set('x-test-auth', authHeader(ATTACKER_PAYLOAD))
        .attach('file', Buffer.from('malicious-image'), {
          filename: 'hack.jpg',
          contentType: 'image/jpeg',
        })
        .expect(403);

      const dbRecord = await prisma.account.findUnique({
        where: { id: victim.id },
      });
      expect(dbRecord!.photoUrl).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // IDOR-05: PATCH com name + birthDate — ownership check no primeiro campo já bloqueia
  // ═══════════════════════════════════════════════════════════

  describe('IDOR-05: PATCH name+birthDate — blocked on first field, neither is modified', () => {
    it('returns 403 and neither field is modified', async () => {
      const victim = await createAccountAs(USER_PAYLOAD);

      await request(app.getHttpServer())
        .patch(`/accounts/${victim.id}`)
        .set('x-test-auth', authHeader(ATTACKER_PAYLOAD))
        .send({ name: 'Hacked', birthDate: '1999-12-31' })
        .expect(403);

      const dbRecord = await prisma.account.findUnique({
        where: { id: victim.id },
      });
      expect(dbRecord!.name).toBe('Victim User');
      expect(dbRecord!.birthDate).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // RBAC-01: Regular user cannot access admin-only read endpoints
  // ═══════════════════════════════════════════════════════════

  describe('RBAC-01: regular user cannot read other accounts', () => {
    it('GET /accounts/:id — returns 403 for regular user', async () => {
      const victim = await createAccountAs(USER_PAYLOAD);

      await request(app.getHttpServer())
        .get(`/accounts/${victim.id}`)
        .set('x-test-auth', authHeader(ATTACKER_PAYLOAD))
        .expect(403);
    });

    it('GET /accounts — returns 403 for regular user', async () => {
      await request(app.getHttpServer())
        .get('/accounts')
        .set('x-test-auth', authHeader(ATTACKER_PAYLOAD))
        .expect(403);
    });

    it('GET /accounts?cpf=X — returns 403 for regular user', async () => {
      await createAccountAs(USER_PAYLOAD);

      await request(app.getHttpServer())
        .get(`/accounts?cpf=${CPF_1}`)
        .set('x-test-auth', authHeader(ATTACKER_PAYLOAD))
        .expect(403);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // RBAC-02: M2M service (read-only) cannot mutate data
  // ═══════════════════════════════════════════════════════════

  describe('RBAC-02: M2M service cannot create or mutate accounts', () => {
    it('POST /accounts — returns 403 for M2M without create:account', async () => {
      await request(app.getHttpServer())
        .post('/accounts')
        .set('x-test-auth', authHeader(M2M_PAYLOAD))
        .send({ name: 'Service Account', cpf: CPF_1 })
        .expect(403);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // RBAC-03: No permissions at all — blocked on every endpoint
  // ═══════════════════════════════════════════════════════════

  describe('RBAC-03: user with no permissions is blocked everywhere', () => {
    it('POST /accounts — returns 403', async () => {
      await request(app.getHttpServer())
        .post('/accounts')
        .set('x-test-auth', authHeader(NO_PERMISSIONS_PAYLOAD))
        .send({ name: 'Nobody', cpf: CPF_1 })
        .expect(403);
    });

    it('GET /accounts/me — returns 403', async () => {
      await request(app.getHttpServer())
        .get('/accounts/me')
        .set('x-test-auth', authHeader(NO_PERMISSIONS_PAYLOAD))
        .expect(403);
    });

    it('GET /accounts — returns 403', async () => {
      await request(app.getHttpServer())
        .get('/accounts')
        .set('x-test-auth', authHeader(NO_PERMISSIONS_PAYLOAD))
        .expect(403);
    });

    it('GET /accounts/:id — returns 403', async () => {
      await request(app.getHttpServer())
        .get('/accounts/00000000-0000-0000-0000-000000000000')
        .set('x-test-auth', authHeader(NO_PERMISSIONS_PAYLOAD))
        .expect(403);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // AUTH-BYPASS-01: requests without auth header
  // ═══════════════════════════════════════════════════════════

  describe('AUTH-BYPASS-01: unauthenticated requests are blocked', () => {
    it('POST /accounts — returns 403', async () => {
      await request(app.getHttpServer())
        .post('/accounts')
        .send({ name: 'Anon', cpf: CPF_1 })
        .expect(403);
    });

    it('GET /accounts/me — returns 403', async () => {
      await request(app.getHttpServer()).get('/accounts/me').expect(403);
    });

    it('PATCH /accounts/:id — returns 403', async () => {
      await request(app.getHttpServer())
        .patch('/accounts/00000000-0000-0000-0000-000000000000')
        .send({ name: 'Anon' })
        .expect(403);
    });

    it('POST /accounts/:id/phone/send-code — returns 403', async () => {
      await request(app.getHttpServer())
        .post('/accounts/00000000-0000-0000-0000-000000000000/phone/send-code')
        .send({ phone: '11999999999' })
        .expect(403);
    });

    it('POST /accounts/:id/photo — returns 403', async () => {
      await request(app.getHttpServer())
        .post('/accounts/00000000-0000-0000-0000-000000000000/photo')
        .attach('file', Buffer.from('data'), {
          filename: 'photo.jpg',
          contentType: 'image/jpeg',
        })
        .expect(403);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // DATA-LEAK-01: auth0Sub nunca é exposto nas respostas
  // ═══════════════════════════════════════════════════════════

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

    it('GET /accounts/:id (admin) response does not contain auth0Sub', async () => {
      const account = await createAccountAs(USER_PAYLOAD);

      const res = await request(app.getHttpServer())
        .get(`/accounts/${account.id}`)
        .set('x-test-auth', authHeader(ADMIN_PAYLOAD))
        .expect(200);

      expect(res.body.data).not.toHaveProperty('auth0Sub');
    });

    it('GET /accounts (admin list) responses do not contain auth0Sub', async () => {
      await createAccountAs(USER_PAYLOAD);

      const res = await request(app.getHttpServer())
        .get('/accounts')
        .set('x-test-auth', authHeader(ADMIN_PAYLOAD))
        .expect(200);

      for (const account of res.body.data) {
        expect(account).not.toHaveProperty('auth0Sub');
      }
    });

    it('PATCH response does not contain auth0Sub', async () => {
      const account = await createAccountAs(USER_PAYLOAD);

      const res = await request(app.getHttpServer())
        .patch(`/accounts/${account.id}`)
        .set('x-test-auth', authHeader(USER_PAYLOAD))
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(res.body.data).not.toHaveProperty('auth0Sub');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // DATA-LEAK-02: error responses não vazam dados internos
  // ═══════════════════════════════════════════════════════════

  describe('DATA-LEAK-02: error responses do not leak internal data', () => {
    it('ownership error does not leak victim auth0Sub', async () => {
      const victim = await createAccountAs(USER_PAYLOAD);

      const res = await request(app.getHttpServer())
        .patch(`/accounts/${victim.id}`)
        .set('x-test-auth', authHeader(ATTACKER_PAYLOAD))
        .send({ name: 'Hacked' })
        .expect(403);

      const body = JSON.stringify(res.body);
      expect(body).not.toContain(USER_PAYLOAD.sub);
      expect(body).not.toContain('auth0|user-123');
    });

    it('404 error does not leak stack trace or internal paths', async () => {
      const res = await request(app.getHttpServer())
        .get('/accounts/00000000-0000-0000-0000-000000000000')
        .set('x-test-auth', authHeader(ADMIN_PAYLOAD))
        .expect(404);

      const body = JSON.stringify(res.body);
      expect(body).not.toContain('src/');
      expect(body).not.toContain('.ts');
      expect(body).not.toContain('stack');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // ENUM-01: ID enumeration — account não encontrada retorna 404, não 403
  // (garante que atacante não consegue distinguir IDs existentes vs inexistentes
  //  a partir do status code em endpoints protegidos por role)
  // ═══════════════════════════════════════════════════════════

  describe('ENUM-01: ID enumeration via role-protected endpoints', () => {
    it('GET /accounts/:id returns same 403 for existing and non-existing IDs (regular user)', async () => {
      const victim = await createAccountAs(USER_PAYLOAD);

      const [existingRes, nonExistingRes] = await Promise.all([
        request(app.getHttpServer())
          .get(`/accounts/${victim.id}`)
          .set('x-test-auth', authHeader(ATTACKER_PAYLOAD)),
        request(app.getHttpServer())
          .get('/accounts/00000000-0000-0000-0000-000000000000')
          .set('x-test-auth', authHeader(ATTACKER_PAYLOAD)),
      ]);

      // Both should be 403 — role check happens BEFORE resource lookup
      expect(existingRes.status).toBe(403);
      expect(nonExistingRes.status).toBe(403);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // INPUT-01: UUID injection — IDs malformados não passam do ParseUUIDPipe
  // ═══════════════════════════════════════════════════════════

  describe('INPUT-01: malformed UUIDs are rejected before reaching business logic', () => {
    const malformedIds = [
      'not-a-uuid',
      '../../../etc/passwd',
      '1; DROP TABLE accounts;--',
      '<script>alert(1)</script>',
      '00000000-0000-0000-0000-00000000000g',
    ];

    for (const badId of malformedIds) {
      it(`PATCH rejects "${badId}" with 400`, async () => {
        await request(app.getHttpServer())
          .patch(`/accounts/${encodeURIComponent(badId)}`)
          .set('x-test-auth', authHeader(ATTACKER_PAYLOAD))
          .send({ name: 'Hacked' })
          .expect(400);
      });
    }
  });
});
