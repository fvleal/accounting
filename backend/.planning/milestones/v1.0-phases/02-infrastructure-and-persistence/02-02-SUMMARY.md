---
phase: 02-infrastructure-and-persistence
plan: 02
subsystem: database, infra
tags: [prisma, s3, minio, repository-pattern, hexagonal-architecture, event-emitter]

# Dependency graph
requires:
  - phase: 02-01
    provides: PrismaService, Prisma schema with Account model, PrismaModule
  - phase: 01-03
    provides: Account entity with reconstitute, AggregateRoot with domain events
provides:
  - AccountRepositoryPort with findAll + pagination types
  - StoragePort interface for file upload/delete
  - AccountMapper (static toDomain/toPersistence)
  - PrismaAccountRepository (upsert, transactional event dispatch)
  - S3StorageAdapter (MinIO-compatible upload/delete)
  - AccountInfrastructureModule (DI wiring ports to adapters)
affects: [03-application-layer, account-use-cases]

# Tech tracking
tech-stack:
  added: ["@aws-sdk/client-s3"]
  patterns: [static-mapper-pattern, transactional-event-dispatch, DI-token-binding]

key-files:
  created:
    - src/account/domain/ports/storage.port.ts
    - src/account/infrastructure/mappers/account.mapper.ts
    - src/account/infrastructure/mappers/account.mapper.spec.ts
    - src/account/infrastructure/adapters/prisma-account.repository.ts
    - src/account/infrastructure/adapters/prisma-account.repository.spec.ts
    - src/account/infrastructure/adapters/s3-storage.adapter.ts
    - src/account/infrastructure/adapters/s3-storage.adapter.spec.ts
    - src/account/infrastructure/account-infrastructure.module.ts
  modified:
    - src/account/domain/ports/account.repository.port.ts
    - src/account/domain/ports/index.ts
    - src/app.module.ts

key-decisions:
  - "Use event.constructor.name for EventEmitter2 event names (not event.eventName which does not exist)"
  - "DB stores CPF normalized (digits only), matching CPF value object normalization"
  - "S3StorageAdapter directly instantiates S3Client in constructor from ConfigService values"

patterns-established:
  - "Static mapper pattern: AccountMapper with toDomain/toPersistence static methods (not injectable)"
  - "Transactional event dispatch: events emitted inside $transaction, cleared after commit"
  - "DI token binding: string tokens (ACCOUNT_REPOSITORY_PORT, STORAGE_PORT) bound to adapter classes"

requirements-completed: [INFR-01, INFR-03, INFR-06]

# Metrics
duration: 5min
completed: 2026-03-11
---

# Phase 02 Plan 02: Persistence Adapters Summary

**PostgreSQL repository with transactional event dispatch, S3/MinIO storage adapter, and NestJS DI module wiring ports to infrastructure adapters**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-11T01:40:54Z
- **Completed:** 2026-03-11T01:45:27Z
- **Tasks:** 4
- **Files modified:** 11

## Accomplishments
- AccountRepositoryPort extended with findAll pagination (PaginationParams/PaginatedResult types)
- StoragePort interface created with upload/delete operations
- AccountMapper converts bidirectionally between domain Account and Prisma model
- PrismaAccountRepository implements all 6 port methods with upsert + transactional event dispatch
- S3StorageAdapter with MinIO-compatible config (forcePathStyle: true)
- AccountInfrastructureModule binds port tokens to adapter implementations
- 95 total tests passing (14 new infrastructure tests, 81 existing)

## Task Commits

Each task was committed atomically:

1. **Task 0: Create test scaffolds** - `3b7177a` (test)
2. **Task 1: Domain port updates** - `0af4cf6` (feat)
3. **Task 2: AccountMapper and PrismaAccountRepository** - `0c1de2e` (feat)
4. **Task 3: S3StorageAdapter and AccountInfrastructureModule** - `0a3bb6d` (feat)

## Files Created/Modified
- `src/account/domain/ports/account.repository.port.ts` - Added PaginationParams, PaginatedResult, findAll method
- `src/account/domain/ports/storage.port.ts` - StoragePort interface with upload/delete
- `src/account/domain/ports/index.ts` - Barrel exports for all port types
- `src/account/infrastructure/mappers/account.mapper.ts` - Static mapper toDomain/toPersistence
- `src/account/infrastructure/mappers/account.mapper.spec.ts` - Mapper unit tests (4 tests)
- `src/account/infrastructure/adapters/prisma-account.repository.ts` - PostgreSQL repository adapter
- `src/account/infrastructure/adapters/prisma-account.repository.spec.ts` - Repository unit tests (7 tests)
- `src/account/infrastructure/adapters/s3-storage.adapter.ts` - S3/MinIO storage adapter
- `src/account/infrastructure/adapters/s3-storage.adapter.spec.ts` - Storage adapter unit tests (3 tests)
- `src/account/infrastructure/account-infrastructure.module.ts` - NestJS module with DI token bindings
- `src/app.module.ts` - Added AccountInfrastructureModule import

## Decisions Made
- Used `event.constructor.name` for EventEmitter2 event names (RESEARCH.md incorrectly suggested `event.eventName` which does not exist on DomainEvent)
- DB stores CPF as normalized digits only, matching domain value object behavior
- S3StorageAdapter instantiates S3Client directly in constructor (not injectable) for simplicity
- Test for S3 adapter replaces `send` method on instance rather than mocking S3Client constructor (avoids vi.fn constructor issues)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed mapper test CPF assertion mismatch**
- **Found during:** Task 2 (AccountMapper implementation)
- **Issue:** Test used formatted CPF '529.982.247-25' in raw data but CPF value object normalizes to '52998224725'
- **Fix:** Use normalized CPF in raw test data to match DB storage format
- **Files modified:** src/account/infrastructure/mappers/account.mapper.spec.ts
- **Verification:** All 4 mapper tests pass
- **Committed in:** 0c1de2e (Task 2 commit)

**2. [Rule 1 - Bug] Fixed S3 adapter test mock approach**
- **Found during:** Task 3 (S3StorageAdapter implementation)
- **Issue:** vi.fn().mockImplementation() for S3Client constructor did not produce a valid constructor function
- **Fix:** Replaced S3Client mock with direct replacement of s3Client.send on adapter instance
- **Files modified:** src/account/infrastructure/adapters/s3-storage.adapter.spec.ts
- **Verification:** All 3 S3 adapter tests pass
- **Committed in:** 0a3bb6d (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs in test scaffolds)
**Impact on plan:** Both fixes necessary for test correctness. No scope creep.

## Issues Encountered
- Pre-existing TS2344 errors in Phase 1 value objects remain (5 errors in nest build) -- already tracked in deferred-items.md from plan 02-01. No new build errors introduced by this plan.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Infrastructure ring of hexagonal architecture complete
- Repository and storage ports bound to adapters via DI tokens
- Ready for application layer use cases to inject ACCOUNT_REPOSITORY_PORT and STORAGE_PORT
- All 95 tests passing with no regressions

---
*Phase: 02-infrastructure-and-persistence*
*Completed: 2026-03-11*

## Self-Check: PASSED

All 8 created files verified. All 4 task commits verified (3b7177a, 0af4cf6, 0c1de2e, 0a3bb6d).
