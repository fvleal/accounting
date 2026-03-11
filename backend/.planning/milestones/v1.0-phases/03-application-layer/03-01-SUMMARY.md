---
phase: 03-application-layer
plan: 01
subsystem: domain
tags: [auth0, account-aggregate, cqrs, exceptions, prisma, use-case]

# Dependency graph
requires:
  - phase: 02-infrastructure-and-persistence
    provides: Account entity, Prisma schema, repository port/adapter/mapper
provides:
  - auth0Sub field on Account aggregate (create, reconstitute, getter, event)
  - findByAuth0Sub on AccountRepositoryPort and PrismaAccountRepository
  - Prisma migration for auth0_sub unique column
  - UseCase<I, O> base interface in shared/application
  - DomainException abstract base class in shared/domain/exceptions
  - 4 account domain exceptions (AccountNotFound, DuplicateEmail, DuplicateCpf, DuplicateAuth0Sub)
  - CQRS folder structure (commands/ and queries/ under account/application)
affects: [03-application-layer plans 02 and 03, future use case implementations]

# Tech tracking
tech-stack:
  added: []
  patterns: [DomainException hierarchy, UseCase<I,O> command/query pattern, CQRS folder structure]

key-files:
  created:
    - src/shared/application/use-case.base.ts
    - src/shared/domain/exceptions/domain-exception.base.ts
    - src/account/domain/exceptions/account-not-found.error.ts
    - src/account/domain/exceptions/duplicate-email.error.ts
    - src/account/domain/exceptions/duplicate-cpf.error.ts
    - src/account/domain/exceptions/duplicate-auth0-sub.error.ts
    - src/account/domain/exceptions/index.ts
    - prisma/migrations/20260311133600_add_auth0_sub/migration.sql
  modified:
    - src/account/domain/entities/account.entity.ts
    - src/account/domain/entities/account.entity.spec.ts
    - src/account/domain/ports/account.repository.port.ts
    - src/account/domain/events/account-created.event.ts
    - src/account/infrastructure/adapters/prisma-account.repository.ts
    - src/account/infrastructure/adapters/prisma-account.repository.spec.ts
    - src/account/infrastructure/mappers/account.mapper.ts
    - src/account/infrastructure/mappers/account.mapper.spec.ts
    - prisma/schema.prisma

key-decisions:
  - "auth0Sub is a plain string on Account, not a Value Object -- simple identity link, no domain validation needed"
  - "Migration created manually (DB not running locally) -- SQL verified against Prisma schema"

patterns-established:
  - "DomainException base class: abstract code property + metadata record for structured error handling"
  - "Account domain exceptions follow naming convention: [Context][Reason]Error extending DomainException"
  - "UseCase<I, O> interface: single execute(input: I): Promise<O> contract for all commands/queries"

requirements-completed: [UCAS-06, UCAS-07, UCAS-08, UCAS-09]

# Metrics
duration: 6min
completed: 2026-03-11
---

# Phase 3 Plan 1: Application Layer Prerequisites Summary

**auth0Sub on Account aggregate with Prisma migration, UseCase/DomainException base classes, 4 account exceptions, and CQRS folder structure**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-11T13:35:46Z
- **Completed:** 2026-03-11T13:41:38Z
- **Tasks:** 2
- **Files modified:** 19

## Accomplishments
- Added auth0Sub field to Account entity with full persistence layer support (schema, migration, port, adapter, mapper)
- Created UseCase<I, O> base interface and DomainException abstract base class as shared infrastructure
- Built 4 account-specific domain exceptions with structured error codes and metadata
- Established CQRS folder structure (commands/ and queries/) for subsequent use case implementations

## Task Commits

Each task was committed atomically:

1. **Task 1: Add auth0Sub to Account entity, Prisma schema, repository port, adapter, mapper** - `f8234b8` (feat)
2. **Task 2: Create UseCase base interface, DomainException base, account exceptions, CQRS folders** - `f93b1eb` (feat)

## Files Created/Modified
- `prisma/schema.prisma` - Added auth0_sub unique column to Account model
- `prisma/migrations/20260311133600_add_auth0_sub/migration.sql` - Migration for auth0_sub column
- `src/account/domain/entities/account.entity.ts` - Added auth0Sub field, getter, and constructor integration
- `src/account/domain/events/account-created.event.ts` - Added auth0Sub to event payload
- `src/account/domain/ports/account.repository.port.ts` - Added findByAuth0Sub to port interface
- `src/account/infrastructure/adapters/prisma-account.repository.ts` - Implemented findByAuth0Sub
- `src/account/infrastructure/mappers/account.mapper.ts` - Added auth0Sub mapping in both directions
- `src/shared/application/use-case.base.ts` - UseCase<I, O> interface
- `src/shared/domain/exceptions/domain-exception.base.ts` - DomainException abstract base class
- `src/account/domain/exceptions/account-not-found.error.ts` - AccountNotFoundError
- `src/account/domain/exceptions/duplicate-email.error.ts` - DuplicateEmailError
- `src/account/domain/exceptions/duplicate-cpf.error.ts` - DuplicateCpfError
- `src/account/domain/exceptions/duplicate-auth0-sub.error.ts` - DuplicateAuth0SubError
- `src/account/domain/exceptions/index.ts` - Barrel export for all account exceptions
- `src/account/application/commands/.gitkeep` - CQRS commands directory
- `src/account/application/queries/.gitkeep` - CQRS queries directory

## Decisions Made
- auth0Sub stored as plain string on Account entity (not a Value Object) -- it is an external identity link with no domain validation rules
- Prisma migration SQL created manually since local database was not running -- SQL matches schema definition exactly

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed account.mapper.spec.ts missing auth0Sub in test data**
- **Found during:** Task 2 (TypeScript compilation check)
- **Issue:** The mapper spec file was not listed in Task 1's files but needed auth0Sub added to all test data objects after the entity change
- **Fix:** Added auth0Sub to all raw Prisma objects and Account.reconstitute calls in the mapper spec
- **Files modified:** src/account/infrastructure/mappers/account.mapper.spec.ts
- **Verification:** npx tsc --noEmit passes for all changed files, npx vitest run passes all 97 tests
- **Committed in:** f93b1eb (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Auto-fix necessary for correctness after Task 1 entity changes. No scope creep.

## Issues Encountered
- Database not running locally, so `prisma migrate dev` could not be used. Migration SQL was created manually and is ready to apply when database is available.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Account entity now has auth0Sub field required by CreateAccountByAuth0 use case (Plan 02)
- UseCase<I, O> interface ready for all command/query implementations (Plans 02 and 03)
- DomainException hierarchy ready for structured error signaling in use cases
- CQRS folder structure established for organizing commands and queries

---
*Phase: 03-application-layer*
*Completed: 2026-03-11*
