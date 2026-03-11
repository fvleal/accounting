# Phase 2: Infrastructure and Persistence - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

The domain's repository port gets a working PostgreSQL adapter via Prisma that can persist and retrieve Account aggregates, with clean mappers separating domain and persistence models. Also includes StoragePort (S3 adapter) for photo uploads. Phone verification adapter is deferred to a future version.

</domain>

<decisions>
## Implementation Decisions

### Prisma Schema Design
- snake_case naming convention for table and column names, with `@map`/`@@map` for Prisma-to-TypeScript mapping
- Unique constraints on `email` and `cpf` columns
- Native PostgreSQL UUID type for `id` column (matches `node:crypto randomUUID()`)
- `phone_verified` boolean column added now (defaults to false, always false in v1) for forward compatibility
- `findAll` method added to AccountRepositoryPort with basic limit/offset pagination (cursor-based deferred to v2 — APIE-01)

### Mapper Strategy
- Static class with `toDomain()` / `toPersistence()` methods (not injectable service)
- Lives in `src/account/infrastructure/mappers/account.mapper.ts`
- `save()` uses Prisma upsert (insert or update in single operation)
- Reconstitute validation approach: Claude's discretion

### Storage Adapter (S3)
- StoragePort interface with `upload(key, buffer, contentType): Promise<string>` and `delete(key): Promise<void>`
- Port defined in `src/account/domain/ports/` (scoped to account bounded context)
- Caller provides full storage key (use case decides key structure, e.g., `accounts/{id}/photo.jpg`)
- MinIO (S3-compatible) for local development via Docker Compose
- S3 adapter in `src/account/infrastructure/adapters/`

### Docker/Dev Environment
- docker-compose.yml with PostgreSQL 17 + MinIO containers
- `.env` + NestJS ConfigModule for connection strings (DATABASE_URL, S3 config)
- `.env.example` committed with placeholder values, `.env` in `.gitignore`
- npm scripts: `db:migrate`, `db:reset`, `db:studio` wrapping Prisma CLI

### Domain Events and Transactions
- Events dispatched INSIDE the transaction (listeners run in the same transaction boundary)
- Repository adapter manages the transaction boundary (Prisma `$transaction` — implicit, no UnitOfWork port)
- Repository.save() flow: open transaction → persist data → dispatch events → commit
- NestJS EventEmitter2 (`@nestjs/event-emitter`) for event dispatch mechanism
- Synchronous dispatch within transaction ensures consistency

### Claude's Discretion
- Reconstitute validation strategy (skip vs re-validate for trusted DB data)
- Exact Prisma schema column types for optional fields
- Error handling in S3 adapter
- MinIO Docker configuration details
- EventEmitter2 sync vs async mode choice

</decisions>

<specifics>
## Specific Ideas

- Phone verification (INFR-05) deferred to future version — in v1, phone can be added but stays as "not verified" (phone_verified = false)
- No PhoneVerificationPort in this version — port and adapter created when verification is built
- User wants events inside transactions to ensure listeners see consistent data and participate in the same transaction

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Account.reconstitute(id, props)` — factory method for rebuilding from DB data, accepts primitive props
- `AggregateRoot.addEvent()` / `domainEvents` — event collection already built into base class
- All Value Objects (Email, CPF, PhoneNumber, PersonName, BirthDate) with `.create()` factories and `.value` getters
- `AccountRepositoryPort` interface in `src/account/domain/ports/` — needs `findAll` added

### Established Patterns
- Domain layer is pure TypeScript — no framework imports (enforced by ESLint boundary rules)
- Account getters return primitive strings (VO.value), not VO instances
- UUID generated via `node:crypto randomUUID()` — no external uuid package
- Event snapshots use primitive values, not VO instances

### Integration Points
- `src/account/infrastructure/` — empty, ready for adapters
- `src/account/application/` — empty, ready for use cases (Phase 3)
- Prisma 7 installed with PostgreSQL datasource configured, schema has no models yet
- `app.module.ts` — NestJS root module needs infrastructure module registration

</code_context>

<deferred>
## Deferred Ideas

- Phone verification flow (INFR-05) — deferred to future version (SMS adapter, verification codes, expiry)
- SendPhoneVerificationCommand and VerifyPhoneCommand use cases — depend on phone verification adapter
- Cursor-based pagination for findAll — v2 requirement (APIE-01)

</deferred>

---

*Phase: 02-infrastructure-and-persistence*
*Context gathered: 2026-03-10*
