# Phase 2: Infrastructure and Persistence - Research

**Researched:** 2026-03-10
**Domain:** Prisma 7 + PostgreSQL persistence, S3/MinIO storage, NestJS infrastructure wiring
**Confidence:** HIGH

## Summary

Phase 2 connects the pure domain layer (completed in Phase 1) to real infrastructure: PostgreSQL via Prisma 7, S3-compatible storage via MinIO, and NestJS module wiring with ConfigModule and EventEmitter2. The project already has Prisma 7.4.2 and @prisma/client installed but needs the PostgreSQL driver adapter (@prisma/adapter-pg + pg), NestJS config module, event emitter, and AWS S3 SDK.

The key technical challenge is Prisma 7's new architecture: it requires a driver adapter (PrismaPg) instead of the built-in engine, the generator must output `moduleFormat = "cjs"` for NestJS compatibility (since the project uses CommonJS -- no `"type": "module"` in package.json), and the generated client output path should be inside `src/` for NestJS compilation to find it. The existing schema at `prisma/schema.prisma` has no models yet and outputs to `../generated/prisma` -- this needs to change to `../src/generated/prisma` with `moduleFormat = "cjs"` added.

**Primary recommendation:** Build bottom-up: docker-compose + env first, then Prisma schema + migration, then PrismaService + PrismaModule, then mapper, then repository adapter with event dispatch, then StoragePort + S3 adapter.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- snake_case naming convention for table and column names, with `@map`/`@@map` for Prisma-to-TypeScript mapping
- Unique constraints on `email` and `cpf` columns
- Native PostgreSQL UUID type for `id` column (matches `node:crypto randomUUID()`)
- `phone_verified` boolean column added now (defaults to false, always false in v1) for forward compatibility
- `findAll` method added to AccountRepositoryPort with basic limit/offset pagination (cursor-based deferred to v2)
- Static class with `toDomain()` / `toPersistence()` methods (not injectable service) in `src/account/infrastructure/mappers/account.mapper.ts`
- `save()` uses Prisma upsert (insert or update in single operation)
- StoragePort interface with `upload(key, buffer, contentType): Promise<string>` and `delete(key): Promise<void>`
- Port defined in `src/account/domain/ports/` (scoped to account bounded context)
- Caller provides full storage key (use case decides key structure)
- MinIO (S3-compatible) for local development via Docker Compose
- docker-compose.yml with PostgreSQL 17 + MinIO containers
- `.env` + NestJS ConfigModule for connection strings
- `.env.example` committed with placeholder values, `.env` in `.gitignore`
- npm scripts: `db:migrate`, `db:reset`, `db:studio` wrapping Prisma CLI
- Events dispatched INSIDE the transaction (listeners run in the same transaction boundary)
- Repository adapter manages the transaction boundary (Prisma `$transaction`)
- Repository.save() flow: open transaction -> persist data -> dispatch events -> commit
- NestJS EventEmitter2 (`@nestjs/event-emitter`) for event dispatch mechanism

### Claude's Discretion
- Reconstitute validation strategy (skip vs re-validate for trusted DB data)
- Exact Prisma schema column types for optional fields
- Error handling in S3 adapter
- MinIO Docker configuration details
- EventEmitter2 sync vs async mode choice

### Deferred Ideas (OUT OF SCOPE)
- Phone verification flow (INFR-05) -- deferred to future version (SMS adapter, verification codes, expiry)
- SendPhoneVerificationCommand and VerifyPhoneCommand use cases
- Cursor-based pagination for findAll -- v2 requirement (APIE-01)

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFR-01 | PostgreSQL adapter implementing AccountRepositoryPort | PrismaService setup, repository adapter pattern with upsert + $transaction, event dispatch inside transaction |
| INFR-02 | Prisma schema for accounts table | Schema design with snake_case @@map, @db.Uuid, unique constraints, column types for all Account fields |
| INFR-03 | Mapper between domain aggregate and Prisma model | Static AccountMapper class with toDomain()/toPersistence(), reconstitute pattern |
| INFR-04 | Database migrations via Prisma Migrate | prisma migrate dev command, npm scripts wrapping Prisma CLI |
| INFR-05 | Adapter for phone verification (SMS/WhatsApp) | DEFERRED -- phone_verified column exists but always false in v1, no port/adapter needed |
| INFR-06 | StoragePort in domain + S3 adapter for image upload | @aws-sdk/client-s3 with MinIO, PutObjectCommand/DeleteObjectCommand, port interface in domain |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| prisma | 7.4.2 | Schema, migrations, CLI | Already installed |
| @prisma/client | 7.4.2 | Generated query client | Already installed |
| @prisma/adapter-pg | latest | PostgreSQL driver adapter | Required by Prisma 7 -- replaces built-in Rust engine |
| pg | latest | PostgreSQL client for Node.js | Required by @prisma/adapter-pg |
| @nestjs/config | latest | ConfigModule for env vars | Official NestJS solution for .env loading |
| @nestjs/event-emitter | latest | EventEmitter2 wrapper | Official NestJS event module, used for domain event dispatch |
| @aws-sdk/client-s3 | latest | S3 client for MinIO/AWS | AWS SDK v3, works with MinIO (S3-compatible) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| dotenv | (installed) | Loads .env for prisma.config.ts | Already used by Prisma config |
| @types/pg | latest (dev) | TypeScript types for pg | Type safety for PostgreSQL driver |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @aws-sdk/client-s3 | minio (npm package) | AWS SDK is standard, works with both MinIO and real S3 without code changes |
| @prisma/adapter-pg | Built-in driver | Prisma 7 requires driver adapters -- no built-in option |

**Installation:**
```bash
npm install @prisma/adapter-pg pg @nestjs/config @nestjs/event-emitter @aws-sdk/client-s3
npm install --save-dev @types/pg
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── account/
│   ├── domain/
│   │   ├── ports/
│   │   │   ├── account.repository.port.ts   # EXISTS - needs findAll added
│   │   │   ├── storage.port.ts              # NEW
│   │   │   └── index.ts
│   │   ├── entities/                        # EXISTS
│   │   ├── events/                          # EXISTS
│   │   └── value-objects/                   # EXISTS
│   └── infrastructure/
│       ├── adapters/
│       │   ├── prisma-account.repository.ts # NEW - implements AccountRepositoryPort
│       │   └── s3-storage.adapter.ts        # NEW - implements StoragePort
│       ├── mappers/
│       │   └── account.mapper.ts            # NEW - static toDomain/toPersistence
│       └── account-infrastructure.module.ts # NEW - NestJS module
├── shared/
│   └── infrastructure/
│       ├── prisma/
│       │   ├── prisma.service.ts            # NEW - extends PrismaClient
│       │   └── prisma.module.ts             # NEW - global module
│       └── config/                          # ConfigModule setup if needed
├── generated/
│   └── prisma/                              # Prisma generated client (in .gitignore)
└── app.module.ts                            # Wire ConfigModule, EventEmitterModule, PrismaModule
prisma/
├── schema.prisma                            # EXISTS - needs Account model
└── migrations/                              # Generated by prisma migrate dev
docker-compose.yml                           # NEW
.env.example                                 # NEW
```

### Pattern 1: PrismaService (NestJS + Prisma 7)

**What:** A thin wrapper that extends PrismaClient with NestJS lifecycle hooks.
**When to use:** Always -- this is how Prisma integrates with NestJS dependency injection.

```typescript
// src/shared/infrastructure/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(configService: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: configService.get<string>('DATABASE_URL'),
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### Pattern 2: Static Mapper (Domain <-> Persistence)

**What:** A class with static methods that converts between Prisma row objects and domain aggregates.
**When to use:** Always in the repository adapter -- isolates persistence model from domain model.

```typescript
// src/account/infrastructure/mappers/account.mapper.ts
import { Account } from '../../domain/entities/account.entity';
// Import the Prisma-generated type for the accounts table
// e.g., import { Account as PrismaAccount } from '../../../generated/prisma/client.js';

export class AccountMapper {
  static toDomain(raw: PrismaAccount): Account {
    return Account.reconstitute(raw.id, {
      name: raw.name,
      email: raw.email,
      cpf: raw.cpf,
      birthDate: raw.birthDate,       // Date | null from DB
      phone: raw.phone,               // string | null from DB
      photoUrl: raw.photoUrl,         // string | null from DB
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(account: Account) {
    return {
      id: account.id,
      name: account.name,
      email: account.email,
      cpf: account.cpf,
      birth_date: account.birthDate,
      phone: account.phone,
      phone_verified: false,           // always false in v1
      photo_url: account.photoUrl,
      created_at: account.createdAt,
      updated_at: account.updatedAt,
    };
  }
}
```

### Pattern 3: Repository with Transaction + Event Dispatch

**What:** Repository save() wraps persistence and event dispatch in a single Prisma transaction.
**When to use:** Every save() call that may have domain events.

```typescript
// src/account/infrastructure/adapters/prisma-account.repository.ts
async save(account: Account): Promise<void> {
  const data = AccountMapper.toPersistence(account);
  const events = account.getEvents();

  await this.prisma.$transaction(async (tx) => {
    await tx.account.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });

    // Dispatch events inside transaction (synchronous)
    for (const event of events) {
      this.eventEmitter.emit(event.eventName, event);
    }
  });

  account.clearEvents();
}
```

### Pattern 4: StoragePort + S3 Adapter

**What:** Domain port interface with an infrastructure adapter using @aws-sdk/client-s3.
**When to use:** For file upload/delete operations (photos).

```typescript
// src/account/domain/ports/storage.port.ts
export interface StoragePort {
  upload(key: string, buffer: Buffer, contentType: string): Promise<string>;
  delete(key: string): Promise<void>;
}

// src/account/infrastructure/adapters/s3-storage.adapter.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export class S3StorageAdapter implements StoragePort {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly endpoint: string;

  constructor(config: { endpoint: string; region: string; bucket: string; accessKey: string; secretKey: string }) {
    this.bucket = config.bucket;
    this.endpoint = config.endpoint;
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: { accessKeyId: config.accessKey, secretAccessKey: config.secretKey },
      forcePathStyle: true, // Required for MinIO
    });
  }

  async upload(key: string, buffer: Buffer, contentType: string): Promise<string> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }));
    return `${this.endpoint}/${this.bucket}/${key}`;
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));
  }
}
```

### Anti-Patterns to Avoid
- **Importing Prisma types in domain layer:** The domain must remain pure TypeScript. The mapper lives in infrastructure and handles the translation.
- **Using PrismaClient directly in use cases:** Always go through the repository port. The PrismaService is injected only into infrastructure adapters.
- **Dispatching events after transaction commits:** Per user decision, events MUST be dispatched inside the transaction so listeners participate in the same boundary.
- **Validating trusted DB data on reconstitute:** Data from the DB has already been validated on write. Re-validating on every read is wasteful. Recommendation: skip validation in `reconstitute()` (see Discretion section below).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Database connection pooling | Custom pool manager | @prisma/adapter-pg (handles pool) | Connection pool management has many edge cases |
| Environment variable loading | Manual process.env parsing | @nestjs/config ConfigModule | Handles .env files, validation, typing |
| S3 multipart uploads | Custom chunked upload | @aws-sdk/client-s3 PutObjectCommand | Handles retries, checksums, streaming |
| Database migrations | Raw SQL files | Prisma Migrate (prisma migrate dev) | Tracks migration history, handles rollbacks |
| Event bus | Custom EventEmitter | @nestjs/event-emitter (EventEmitter2) | Wildcard events, TTL, namespace support |

## Common Pitfalls

### Pitfall 1: Prisma 7 moduleFormat Mismatch
**What goes wrong:** NestJS cannot import the generated Prisma client; runtime errors about ESM vs CommonJS.
**Why it happens:** Prisma 7 defaults to ESM output, but NestJS with default config runs as CommonJS.
**How to avoid:** Add `moduleFormat = "cjs"` to the generator block in schema.prisma.
**Warning signs:** `ERR_REQUIRE_ESM` or `Cannot find module` errors at startup.

### Pitfall 2: Prisma Generated Client Output Path
**What goes wrong:** NestJS build cannot find the generated Prisma client.
**Why it happens:** The default Prisma 7 output goes to `../generated/prisma` (project root), outside `src/`. NestJS compiler only processes files inside `src/`.
**How to avoid:** Set output to `"../src/generated/prisma"` in schema.prisma. Update .gitignore accordingly. The current `.gitignore` has `/generated/prisma` -- this needs updating to `/src/generated/prisma`.
**Warning signs:** Build succeeds but runtime fails with module not found.

### Pitfall 3: PrismaPg Adapter Required in Prisma 7
**What goes wrong:** PrismaClient instantiation fails without a driver adapter.
**Why it happens:** Prisma 7 removed the built-in Rust engine; you must provide a driver adapter.
**How to avoid:** Install `@prisma/adapter-pg` and `pg`, pass `PrismaPg` adapter to PrismaClient constructor.
**Warning signs:** Error about missing adapter or engine at startup.

### Pitfall 4: Upsert Where Clause Must Use Unique Field
**What goes wrong:** Prisma upsert fails if the `where` clause references a non-unique field.
**Why it happens:** Prisma requires the where clause to match a `@unique` or `@id` field.
**How to avoid:** Use `where: { id: data.id }` since `id` is `@id`. This is correct for save-by-identity.
**Warning signs:** Prisma type error or runtime error about invalid where clause.

### Pitfall 5: Events Dispatched But Transaction Rolls Back
**What goes wrong:** Event listeners execute side effects, but the transaction rolls back due to a later error.
**Why it happens:** If event listeners perform irreversible actions (HTTP calls, emails) inside the transaction callback.
**How to avoid:** In v1, event listeners should only perform database operations (via the tx client) or collect data for later. External side effects should be deferred to after-commit handlers in future versions.
**Warning signs:** Inconsistent state between DB and external systems.

### Pitfall 6: S3 forcePathStyle for MinIO
**What goes wrong:** S3 SDK uses virtual-hosted-style URLs that MinIO doesn't support.
**Why it happens:** AWS SDK v3 defaults to virtual-hosted-style (`bucket.endpoint`) which doesn't work with MinIO.
**How to avoid:** Set `forcePathStyle: true` in S3Client configuration.
**Warning signs:** DNS resolution errors or 404s when accessing MinIO buckets.

### Pitfall 7: snake_case Mapping Confusion
**What goes wrong:** TypeScript code uses snake_case field names instead of camelCase.
**Why it happens:** Without `@map` annotations, Prisma generates TypeScript types matching DB column names.
**How to avoid:** Use `@map("snake_case_name")` on every field and `@@map("table_name")` on the model to get camelCase TypeScript + snake_case SQL.
**Warning signs:** Inconsistent naming between domain and persistence layers.

## Code Examples

### Prisma Schema for Accounts Table
```prisma
// prisma/schema.prisma
generator client {
  provider     = "prisma-client"
  output       = "../src/generated/prisma"
  moduleFormat = "cjs"
}

datasource db {
  provider = "postgresql"
}

model Account {
  id            String    @id @db.Uuid
  name          String
  email         String    @unique
  cpf           String    @unique
  birthDate     DateTime? @map("birth_date")
  phone         String?
  phoneVerified Boolean   @default(false) @map("phone_verified")
  photoUrl      String?   @map("photo_url")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  @@map("accounts")
}
```

### PrismaModule (Global)
```typescript
// src/shared/infrastructure/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

### docker-compose.yml
```yaml
services:
  postgres:
    image: postgres:17
    environment:
      POSTGRES_USER: account_user
      POSTGRES_PASSWORD: account_pass
      POSTGRES_DB: account_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - miniodata:/data

volumes:
  pgdata:
  miniodata:
```

### .env.example
```env
# Database
DATABASE_URL="postgresql://account_user:account_pass@localhost:5432/account_db?schema=public"

# S3 / MinIO
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET=account-photos
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
```

### npm Scripts for package.json
```json
{
  "db:migrate": "npx prisma migrate dev",
  "db:reset": "npx prisma migrate reset",
  "db:studio": "npx prisma studio"
}
```

### AccountRepositoryPort (Updated with findAll)
```typescript
// src/account/domain/ports/account.repository.port.ts
import { Account } from '../entities/account.entity';

export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export interface AccountRepositoryPort {
  save(account: Account): Promise<void>;
  findById(id: string): Promise<Account | null>;
  findByEmail(email: string): Promise<Account | null>;
  findByCpf(cpf: string): Promise<Account | null>;
  findAll(params: PaginationParams): Promise<PaginatedResult<Account>>;
  exists(id: string): Promise<boolean>;
}
```

### Repository Adapter (Full Implementation Pattern)
```typescript
// src/account/infrastructure/adapters/prisma-account.repository.ts
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import {
  AccountRepositoryPort,
  PaginationParams,
  PaginatedResult,
} from '../../domain/ports/account.repository.port';
import { Account } from '../../domain/entities/account.entity';
import { AccountMapper } from '../mappers/account.mapper';

@Injectable()
export class PrismaAccountRepository implements AccountRepositoryPort {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async save(account: Account): Promise<void> {
    const data = AccountMapper.toPersistence(account);
    const events = account.getEvents();

    await this.prisma.$transaction(async (tx) => {
      await tx.account.upsert({
        where: { id: data.id },
        create: data,
        update: data,
      });

      for (const event of events) {
        this.eventEmitter.emit(event.eventName, event);
      }
    });

    account.clearEvents();
  }

  async findById(id: string): Promise<Account | null> {
    const raw = await this.prisma.account.findUnique({ where: { id } });
    return raw ? AccountMapper.toDomain(raw) : null;
  }

  async findByEmail(email: string): Promise<Account | null> {
    const raw = await this.prisma.account.findUnique({ where: { email } });
    return raw ? AccountMapper.toDomain(raw) : null;
  }

  async findByCpf(cpf: string): Promise<Account | null> {
    const raw = await this.prisma.account.findUnique({ where: { cpf } });
    return raw ? AccountMapper.toDomain(raw) : null;
  }

  async findAll(params: PaginationParams): Promise<PaginatedResult<Account>> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.account.findMany({
        skip: params.offset,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.account.count(),
    ]);

    return {
      data: rows.map(AccountMapper.toDomain),
      total,
    };
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.account.count({ where: { id } });
    return count > 0;
  }
}
```

## Discretion Recommendations

### Reconstitute Validation Strategy
**Recommendation: Skip re-validation for trusted DB data.** The current `Account.reconstitute()` calls `PersonName.create()`, `Email.create()`, `CPF.create()`, etc., which re-validate data that was already validated on write. This is safe but wasteful. For Phase 2, keep the existing reconstitute as-is (it works), but the mapper should call it with trusted DB values. If performance becomes a concern later, a `reconstructUnsafe()` method could bypass validation. **No changes needed now.**

### EventEmitter2 Sync vs Async
**Recommendation: Use synchronous emit (default behavior).** EventEmitter2's `emit()` method is synchronous by default -- listeners execute in order before `emit()` returns. This is exactly what's needed for in-transaction event dispatch. Do NOT use `emitAsync()` as it returns a Promise and may not complete within the transaction boundary. The default `emit()` is correct.

### S3 Adapter Error Handling
**Recommendation: Let S3 SDK errors propagate.** The adapter should not swallow errors. On upload failure, throw so the use case can handle it. On delete failure (e.g., key not found), S3 DeleteObject is idempotent and does not throw for missing keys -- no special handling needed.

### Optional Field Column Types
**Recommendation:**
- `birthDate`: `DateTime?` maps to PostgreSQL `timestamp(3)` -- appropriate for dates with timezone-free storage
- `phone`: `String?` -- stores validated phone string
- `photoUrl`: `String?` -- stores the full URL returned by storage adapter

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Prisma built-in Rust engine | Driver adapters (@prisma/adapter-pg) | Prisma 7 (2025) | Must install pg + adapter-pg, pass adapter to constructor |
| `import { PrismaClient } from '@prisma/client'` | `import { PrismaClient } from './generated/prisma/client.js'` | Prisma 7 | Import path changes to generated location |
| ESM default output | Must specify `moduleFormat = "cjs"` for NestJS | Prisma 7 | Without this, NestJS cannot import generated client |
| `provider = "prisma-client-js"` | `provider = "prisma-client"` | Prisma 7 | Generator provider name changed |

## Open Questions

1. **Transaction isolation for event listeners**
   - What we know: Events are dispatched synchronously inside the Prisma $transaction callback. Listeners will execute in the same Node.js event loop tick.
   - What's unclear: Whether listeners that need to do DB operations can use the `tx` client. The current pattern passes EventEmitter2 emit inside the callback but doesn't pass `tx` to listeners.
   - Recommendation: For v1, keep event listeners lightweight (logging, metrics). If listeners need DB access within the same transaction, the pattern would need to pass `tx` through the event payload -- defer this complexity.

2. **MinIO bucket auto-creation**
   - What we know: MinIO requires buckets to exist before upload.
   - What's unclear: Whether to auto-create the bucket on app startup or document a manual step.
   - Recommendation: Add a bucket creation check in the S3 adapter's onModuleInit or as a startup script. Use CreateBucketCommand with error handling for "bucket already exists."

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --testPathPattern=infrastructure` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFR-01 | PostgreSQL adapter CRUD operations | integration | `npx vitest run src/account/infrastructure/adapters/prisma-account.repository.spec.ts` | No -- Wave 0 |
| INFR-02 | Prisma schema + migrations run | smoke | `npx prisma migrate dev --name test` | N/A -- CLI command |
| INFR-03 | Mapper toDomain/toPersistence correctness | unit | `npx vitest run src/account/infrastructure/mappers/account.mapper.spec.ts` | No -- Wave 0 |
| INFR-04 | Migrations execute against PostgreSQL | smoke | `npx prisma migrate deploy` | N/A -- CLI command |
| INFR-05 | Phone verification adapter | N/A | DEFERRED | N/A |
| INFR-06 | S3 adapter upload/delete | integration | `npx vitest run src/account/infrastructure/adapters/s3-storage.adapter.spec.ts` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before /gsd:verify-work

### Wave 0 Gaps
- [ ] `src/account/infrastructure/mappers/account.mapper.spec.ts` -- covers INFR-03 (unit test, no DB needed)
- [ ] `src/account/infrastructure/adapters/prisma-account.repository.spec.ts` -- covers INFR-01 (integration, needs running PostgreSQL)
- [ ] `src/account/infrastructure/adapters/s3-storage.adapter.spec.ts` -- covers INFR-06 (integration, needs running MinIO)

Note: Integration tests (INFR-01, INFR-06) require docker-compose services running. These are formally covered in Phase 5 (TEST-05) but basic smoke tests can validate the adapters work.

## Sources

### Primary (HIGH confidence)
- Prisma 7.4.2 installed in project -- verified via `npx prisma --version`
- [Prisma Official NestJS Guide](https://www.prisma.io/docs/guides/nestjs) -- PrismaService setup, generator config, adapter pattern
- [Prisma Transactions Docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions) -- $transaction interactive and sequential patterns
- [Prisma Schema Reference](https://www.prisma.io/docs/orm/reference/prisma-schema-reference) -- @map, @@map, @db.Uuid, @unique
- [NestJS Configuration Docs](https://docs.nestjs.com/techniques/configuration) -- ConfigModule.forRoot()
- [NestJS Events Docs](https://docs.nestjs.com/techniques/events) -- EventEmitterModule, @OnEvent decorator

### Secondary (MEDIUM confidence)
- [Prisma 7 + NestJS + Docker Guide (dev.to)](https://dev.to/robson_idongesitsamuel_b/a-complete-guide-to-using-prisma-7-with-docker-and-docker-compose-in-nestjs-80i) -- moduleFormat = "cjs" requirement confirmed
- [NestJS + MinIO S3 Setup (Medium)](https://medium.com/@islamrifat117/nestjs-minio-a-clean-production-ready-file-upload-delete-service-3a963e853010) -- forcePathStyle, S3Client config
- [@aws-sdk/client-s3 npm](https://www.npmjs.com/package/@aws-sdk/client-s3) -- API surface verification

### Tertiary (LOW confidence)
- EventEmitter2 synchronous behavior -- inferred from Node.js EventEmitter docs and EventEmitter2 README; should be validated with a simple test

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all packages verified, versions confirmed from project and npm
- Architecture: HIGH -- patterns follow official Prisma + NestJS guides, verified against existing codebase
- Pitfalls: HIGH -- moduleFormat, adapter-pg, forcePathStyle are well-documented breaking changes
- Event dispatch: MEDIUM -- synchronous emit inside $transaction is sound in theory but the exact behavior with EventEmitter2 should be validated

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (Prisma ecosystem moves fast, but 7.4.2 is stable)
