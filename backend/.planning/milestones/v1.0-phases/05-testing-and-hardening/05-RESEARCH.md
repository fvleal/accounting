# Phase 5: Testing and Hardening - Research

**Researched:** 2026-03-11
**Domain:** Test coverage gaps, health checks, graceful shutdown, config validation
**Confidence:** HIGH

## Summary

Phase 5 closes test coverage gaps and adds operational hardening (health check, graceful shutdown, config validation). The project already has extensive test coverage: 22 unit spec files covering all 5 VOs, Account aggregate, 5 commands, 4 queries, adapters, and mapper; plus 37 E2E tests covering all REST endpoints against real Docker infrastructure. The test requirements (TEST-01 through TEST-04) are already satisfied by existing tests. TEST-05 is satisfied by E2E tests per user decision. TEST-06 is satisfied by the existing E2E suite.

The real work in this phase is: (1) adding a unit test for `DuplicateAuth0SubError` (the one untested domain exception), (2) adding `@nestjs/terminus` health check endpoint, (3) enabling graceful shutdown, and (4) adding env var validation at boot time.

**Primary recommendation:** Focus plans on hardening features (health check, graceful shutdown, config validation) since testing requirements are already met. Add the `DuplicateAuth0SubError` test as a small task.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- PrismaService (0% coverage): **ignorar** -- sao lifecycle hooks do NestJS, E2E ja prova que funciona
- prisma-account.repository (81.8%): **E2E ja cobre** -- os caminhos faltantes sao exercitados via API com banco real
- DuplicateAuth0SubError (0%): **manter e adicionar teste** -- guarda defensiva caso uma conta ja exista com determinado auth0Sub. Adicionar cobertura de teste
- Codigo gerado pelo Prisma (prisma/internal): **ignorar** -- nao faz sentido testar codigo gerado
- **E2E ja supre TEST-05** -- os testes E2E exercitam PrismaAccountRepository e S3StorageAdapter contra infra real (Docker)
- Nao criar teste isolado do adapter contra banco -- seria redundante com E2E
- Health check endpoint (`GET /health`) -- verifica se Postgres e MinIO estao acessiveis
- Graceful shutdown -- terminar requests em andamento antes de fechar conexoes
- Config validation no boot -- validar que variaveis de ambiente obrigatorias existem antes de subir. Fail fast com mensagem clara

### Claude's Discretion
- Escolha de lib para health check (@nestjs/terminus ou implementacao manual)
- Estrategia de timeout no graceful shutdown
- Formato exato do response do health check

### Deferred Ideas (OUT OF SCOPE)
- CI pipeline (GitHub Actions com docker-compose) -- decidido ficar fora desta fase
- OpenAPI/Swagger documentation (APIE-02) -- v2 requirement
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TEST-01 | Testes unitarios de Value Objects (Email, CPF, PhoneNumber, PersonName, BirthDate) -- sem infra | Already covered: 5 VO spec files exist with valid/invalid/equality tests |
| TEST-02 | Testes unitarios do Account Aggregate -- sem infra | Already covered: `account.entity.spec.ts` with 20+ tests (create, reconstitute, updates, events) |
| TEST-03 | Testes unitarios de Commands (CreateAccount, UpdateAccount) -- ports mockados pelo Vitest | Already covered: 5 command spec files with mocked repos |
| TEST-04 | Testes unitarios de Queries (GetAccountById, FindAccountByField, ListAccounts) -- ports mockados pelo Vitest | Already covered: 4 query spec files with mocked repos |
| TEST-05 | Testes de integracao do PostgreSQL adapter contra banco real | Covered by E2E per user decision -- E2E tests exercise full stack including PrismaAccountRepository against real Docker DB |
| TEST-06 | Testes E2E dos endpoints REST | Already covered: 37 tests in `test/accounts.e2e-spec.ts` covering all REST + AUTH requirements |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @nestjs/terminus | ^11.x | Health check indicators | Official NestJS recipe, integrates with HealthCheckService |
| joi | ^17.x | Env var validation schema | Officially recommended by NestJS ConfigModule docs |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | ^4.0.18 | Test runner | Already installed, used for unit + E2E |
| supertest | ^7.0.0 | HTTP E2E assertions | Already installed |
| @nestjs/testing | ^11.0.1 | Test module builder | Already installed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @nestjs/terminus | Manual health controller | Terminus provides standard indicators, `/health` format, and Kubernetes-compatible responses out of the box |
| Joi | class-validator validate function | Joi is simpler for flat env vars -- class-validator requires class definition + transform, overkill for env config |

**Recommendation for Claude's Discretion:** Use `@nestjs/terminus` -- it is the official NestJS solution, provides PrismaHealthIndicator (or custom DB check via raw query), and follows Kubernetes liveness/readiness patterns. For config validation, use Joi with `ConfigModule.forRoot({ validationSchema })` since the project already uses ConfigModule.

**Installation:**
```bash
npm install @nestjs/terminus joi
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  shared/
    infrastructure/
      health/
        health.controller.ts      # GET /health endpoint
        health.module.ts           # TerminusModule + indicators
      config/
        env.validation.ts          # Joi schema for required env vars
```

### Pattern 1: Health Check with Terminus
**What:** Dedicated health controller using TerminusModule that checks Postgres connectivity and MinIO (S3) availability.
**When to use:** Always for production-ready services.
**Example:**
```typescript
// src/shared/infrastructure/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Postgres: raw query via Prisma
      () => this.prisma.$queryRaw`SELECT 1`
        .then(() => ({ database: { status: 'up' } }))
        .catch(() => { throw { database: { status: 'down' } }; }),
      // MinIO: HeadBucket check
      // ... similar pattern
    ]);
  }
}
```

### Pattern 2: Joi Config Validation at Boot
**What:** Define required env vars as Joi schema, passed to ConfigModule.forRoot().
**When to use:** Always -- fail fast on missing config.
**Example:**
```typescript
// src/shared/infrastructure/config/env.validation.ts
import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().uri().required(),
  AUTH0_DOMAIN: Joi.string().required(),
  AUTH0_AUDIENCE: Joi.string().required(),
  S3_ENDPOINT: Joi.string().required(),
  S3_BUCKET: Joi.string().required(),
  S3_REGION: Joi.string().required(),
  S3_ACCESS_KEY: Joi.string().required(),
  S3_SECRET_KEY: Joi.string().required(),
  PORT: Joi.number().default(3000),
});
```

```typescript
// app.module.ts update
ConfigModule.forRoot({
  validationSchema: envValidationSchema,
  validationOptions: { abortEarly: false },
})
```

### Pattern 3: Graceful Shutdown
**What:** Enable NestJS shutdown hooks so `onModuleDestroy` lifecycle methods run on SIGTERM/SIGINT.
**When to use:** Always for production services behind load balancers/orchestrators.
**Example:**
```typescript
// src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupApp(app);
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
```

### Pattern 4: @Public() Decorator for Health Endpoint
**What:** The health endpoint MUST be accessible without JWT auth. Use the existing `@Public()` decorator.
**When to use:** Health check endpoint must be unauthenticated for orchestrator/load balancer probes.
**Example:**
```typescript
@Public()
@Get()
@HealthCheck()
check() { ... }
```

### Anti-Patterns to Avoid
- **Testing PrismaService lifecycle hooks:** User explicitly decided to skip -- E2E proves it works.
- **Isolated adapter integration tests:** User decided E2E covers this -- don't create redundant test files.
- **Using class-validator for env validation:** Overkill for flat env vars; Joi is simpler and officially supported.
- **Blocking shutdown on pending requests without timeout:** Always set a shutdown timeout (e.g., 5-10 seconds) to avoid hanging processes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Health check endpoint | Custom controller with manual status checks | @nestjs/terminus HealthCheckService | Standardized response format, built-in indicators, Kubernetes compatibility |
| Env validation | Manual `if (!process.env.X) throw` | Joi schema via ConfigModule.forRoot | Validates all vars at once, clear error messages, default values, type coercion |
| Shutdown hooks | Manual process.on('SIGTERM') | app.enableShutdownHooks() | NestJS lifecycle integration, triggers onModuleDestroy in all providers |

**Key insight:** NestJS provides official patterns for all three hardening features. Using them ensures correct lifecycle integration and avoids edge cases with manual implementations.

## Common Pitfalls

### Pitfall 1: Health Endpoint Behind Auth Guard
**What goes wrong:** The global JwtAuthGuard blocks `/health` requests from orchestrators/load balancers that don't have JWT tokens.
**Why it happens:** Global guards apply to all routes including health check.
**How to avoid:** Use the existing `@Public()` decorator on the health controller method. The `MockJwtAuthGuard` in tests already respects `IS_PUBLIC_KEY`.
**Warning signs:** Health check returns 401/403 in production.

### Pitfall 2: Prisma Custom Health Indicator
**What goes wrong:** @nestjs/terminus has built-in indicators for TypeORM, Sequelize, Mongoose -- but NOT for Prisma.
**Why it happens:** Prisma is not a first-class Terminus integration.
**How to avoid:** Create a custom health indicator that runs `prisma.$queryRaw\`SELECT 1\`` or use the HealthCheckService's generic `check()` with a lambda. Alternatively, use Terminus `PrismaHealthIndicator` if available in the version used (check docs), or simply extend `HealthIndicator`.
**Warning signs:** Import errors for `PrismaHealthIndicator`.

### Pitfall 3: S3/MinIO Health Check
**What goes wrong:** There is no built-in Terminus indicator for S3/MinIO.
**Why it happens:** S3 is not a database -- no standard indicator exists.
**How to avoid:** Create a custom health indicator using `HeadBucketCommand` from `@aws-sdk/client-s3`. This verifies the bucket exists and MinIO is reachable without reading/writing data.
**Warning signs:** MinIO down but health check still reports UP.

### Pitfall 4: enableShutdownHooks Memory Leak Warning
**What goes wrong:** NestJS docs warn that `enableShutdownHooks()` consumes memory by starting event listeners.
**Why it happens:** Node.js adds SIGTERM/SIGINT listeners which count against the event listener limit.
**How to avoid:** Only call it once in main.ts (not in tests). In tests, rely on `app.close()` explicitly.
**Warning signs:** MaxListenersExceededWarning in test output.

### Pitfall 5: DuplicateAuth0SubError Never Thrown in Current Code
**What goes wrong:** The error class exists but may not be thrown anywhere in application code currently.
**Why it happens:** CreateAccountCommand handles duplicate auth0Sub as idempotent (returns existing account) rather than throwing.
**How to avoid:** The user explicitly wants a unit test for the class itself -- test construction, code property, and message format. Don't try to find a use case that throws it.
**Warning signs:** Trying to write an integration test that triggers this error.

### Pitfall 6: Joi Import Style
**What goes wrong:** `import Joi from 'joi'` fails because Joi uses CommonJS exports.
**Why it happens:** Module interop between ESM and CJS.
**How to avoid:** Use `import * as Joi from 'joi'` (namespace import).
**Warning signs:** `Joi.object is not a function` at runtime.

## Code Examples

### DuplicateAuth0SubError Unit Test
```typescript
// src/account/domain/exceptions/duplicate-auth0-sub.error.spec.ts
import { describe, it, expect } from 'vitest';
import { DuplicateAuth0SubError } from './duplicate-auth0-sub.error';
import { DomainException } from '../../../shared/domain/exceptions/domain-exception.base';

describe('DuplicateAuth0SubError', () => {
  it('should extend DomainException', () => {
    const error = new DuplicateAuth0SubError('auth0|abc123');
    expect(error).toBeInstanceOf(DomainException);
  });

  it('should have code DUPLICATE_AUTH0_SUB', () => {
    const error = new DuplicateAuth0SubError('auth0|abc123');
    expect(error.code).toBe('DUPLICATE_AUTH0_SUB');
  });

  it('should include auth0Sub in message', () => {
    const error = new DuplicateAuth0SubError('auth0|abc123');
    expect(error.message).toContain('auth0|abc123');
  });

  it('should include auth0Sub in metadata', () => {
    const error = new DuplicateAuth0SubError('auth0|abc123');
    expect(error.metadata).toEqual({ auth0Sub: 'auth0|abc123' });
  });
});
```

### Health Module Setup
```typescript
// src/shared/infrastructure/health/health.module.ts
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaModule } from '../prisma/prisma.module';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule, PrismaModule],
  controllers: [HealthController],
})
export class HealthModule {}
```

### Health Controller with Custom Indicators
```typescript
// src/shared/infrastructure/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../auth/index';

@Controller('health')
export class HealthController {
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor(
    private health: HealthCheckService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Reuse same S3 config pattern as S3StorageAdapter
    this.bucket = this.configService.get<string>('S3_BUCKET')!;
    this.s3Client = new S3Client({
      endpoint: this.configService.get<string>('S3_ENDPOINT')!,
      region: this.configService.get<string>('S3_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('S3_ACCESS_KEY')!,
        secretAccessKey: this.configService.get<string>('S3_SECRET_KEY')!,
      },
      forcePathStyle: true,
    });
  }

  @Public()
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => {
        await this.prisma.$queryRaw`SELECT 1`;
        return { database: { status: 'up' } };
      },
      async (): Promise<HealthIndicatorResult> => {
        await this.s3Client.send(
          new HeadBucketCommand({ Bucket: this.bucket }),
        );
        return { storage: { status: 'up' } };
      },
    ]);
  }
}
```

### Config Validation Schema
```typescript
// src/shared/infrastructure/config/env.validation.ts
import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // Database
  DATABASE_URL: Joi.string().required(),

  // Auth0
  AUTH0_DOMAIN: Joi.string().required(),
  AUTH0_AUDIENCE: Joi.string().required(),

  // S3/MinIO
  S3_ENDPOINT: Joi.string().required(),
  S3_BUCKET: Joi.string().required(),
  S3_REGION: Joi.string().required(),
  S3_ACCESS_KEY: Joi.string().required(),
  S3_SECRET_KEY: Joi.string().required(),

  // Optional
  PORT: Joi.number().default(3000),
});
```

### Graceful Shutdown in main.ts
```typescript
// src/main.ts (updated)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupApp } from './setup-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupApp(app);
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual health endpoints | @nestjs/terminus | Stable since NestJS 7+ | Standardized health response format |
| Manual env checking | ConfigModule + Joi validation | Stable since NestJS 7+ | Fail-fast boot with clear error messages |
| process.on('SIGTERM') | app.enableShutdownHooks() | Stable since NestJS 7+ | Lifecycle-aware shutdown with DI cleanup |

## Open Questions

1. **Does @nestjs/terminus 11.x have a built-in PrismaHealthIndicator?**
   - What we know: TypeORM, Sequelize, Mongoose indicators are built-in. Prisma is not standard.
   - What's unclear: Whether recent versions added Prisma support.
   - Recommendation: Use custom indicator with `$queryRaw` -- simple, reliable, no dependency on indicator existence.

2. **Should health check E2E test be added to the existing E2E suite?**
   - What we know: The existing E2E suite tests against real Docker infra.
   - What's unclear: Whether adding a `/health` E2E test is valuable given it tests Terminus internals.
   - Recommendation: Add a simple smoke test in E2E that hits `GET /health` and expects 200 with `status: 'ok'`. It validates the endpoint is wired and public.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file (unit) | `vitest.config.ts` |
| Config file (E2E) | `test/vitest-e2e.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test && npm run test:e2e` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEST-01 | VO unit tests (Email, CPF, PhoneNumber, PersonName, BirthDate) | unit | `npx vitest run src/account/domain/value-objects/ --reporter=verbose` | Yes -- 5 spec files |
| TEST-02 | Account aggregate unit tests | unit | `npx vitest run src/account/domain/entities/account.entity.spec.ts` | Yes |
| TEST-03 | Command use case tests | unit | `npx vitest run src/account/application/commands/ --reporter=verbose` | Yes -- 5 spec files |
| TEST-04 | Query use case tests | unit | `npx vitest run src/account/application/queries/ --reporter=verbose` | Yes -- 4 spec files |
| TEST-05 | Integration tests (adapter vs real DB) | E2E | `npm run test:e2e` | Yes -- covered by E2E per user decision |
| TEST-06 | E2E tests of REST endpoints | E2E | `npm run test:e2e` | Yes -- `test/accounts.e2e-spec.ts` (37 tests) |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test && npm run test:e2e`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/account/domain/exceptions/duplicate-auth0-sub.error.spec.ts` -- covers DuplicateAuth0SubError (user decision)
- [ ] `npm install @nestjs/terminus joi` -- new dependencies for hardening features
- [ ] Health check E2E smoke test in `test/accounts.e2e-spec.ts` (or separate file)

## Sources

### Primary (HIGH confidence)
- Existing codebase: 22 unit spec files + 1 E2E spec file examined directly
- CONTEXT.md: User decisions on coverage gaps and hardening scope
- NestJS official docs: Configuration validation, Terminus health checks, lifecycle events

### Secondary (MEDIUM confidence)
- [NestJS Terminus docs](https://docs.nestjs.com/recipes/terminus) - health check patterns
- [NestJS Configuration docs](https://docs.nestjs.com/techniques/configuration) - Joi validation with ConfigModule
- [NestJS Lifecycle Events](https://docs.nestjs.com/fundamentals/lifecycle-events) - enableShutdownHooks

### Tertiary (LOW confidence)
- [nestjs-graceful-shutdown npm](https://www.npmjs.com/package/nestjs-graceful-shutdown) - third-party alternative (NOT recommended -- native NestJS is sufficient)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - @nestjs/terminus and Joi are official NestJS recommendations
- Architecture: HIGH - patterns verified against existing codebase structure and NestJS conventions
- Pitfalls: HIGH - verified against codebase (auth guard, Prisma indicator, S3 check)
- Test coverage assessment: HIGH - directly inspected all 22 spec files + E2E

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable NestJS ecosystem, no fast-moving dependencies)
