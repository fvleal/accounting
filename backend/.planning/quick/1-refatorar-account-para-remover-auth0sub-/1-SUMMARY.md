---
phase: quick
plan: 1
subsystem: account
tags: [refactor, auth, domain]
dependency-graph:
  requires: []
  provides: [email-based-identity]
  affects: [account-domain, account-application, account-infrastructure, account-controller]
tech-stack:
  added: []
  patterns: [email-based-ownership-check, email-based-idempotency]
key-files:
  created:
    - prisma/migrations/20260311235900_remove_auth0_sub/migration.sql
  modified:
    - prisma/schema.prisma
    - src/account/domain/entities/account.entity.ts
    - src/account/domain/ports/account.repository.port.ts
    - src/account/domain/events/account-created.event.ts
    - src/account/infrastructure/adapters/prisma-account.repository.ts
    - src/account/infrastructure/mappers/account.mapper.ts
    - src/account/application/commands/create-account.command.ts
    - src/account/application/commands/update-name.command.ts
    - src/account/application/commands/update-phone.command.ts
    - src/account/application/commands/update-birth-date.command.ts
    - src/account/application/commands/upload-account-photo.command.ts
    - src/account/application/queries/get-me.query.ts
    - src/account/application/queries/find-account-by-field.query.ts
    - src/account/application/queries/get-account-by-id.query.ts
    - src/account/application/queries/list-accounts.query.ts
    - src/account/interface/controllers/account.controller.ts
decisions:
  - Idempotency check now uses findByEmail instead of findByAuth0Sub, which also serves as duplicate email check
  - Ownership checks use account.email !== input.email comparison
key-metrics:
  duration: ~7min
  completed: 2026-03-11
  tasks: 2/2
  tests: 120 passed
  files-modified: 29
---

# Quick Task 1: Remove auth0Sub from Account Domain Summary

Removed auth0Sub from the entire Account bounded context, replacing all identity lookups and ownership checks with email. Email is unique in DB, present in JWT payload, and is the natural user-facing identifier.

## Task Results

| Task | Name | Commit | Status |
|------|------|--------|--------|
| 1 | Remove auth0Sub from domain layer, schema, and infrastructure | 36c9a36 | Done |
| 2 | Update application layer, controller, and all tests | 1db0b7f | Done |

## What Changed

### Domain Layer
- **Account entity**: Removed `auth0Sub` from `CreateAccountProps`, `ReconstituteAccountProps`, private field, getter, and both `create()`/`reconstitute()` methods
- **AccountCreated event**: Removed `auth0Sub` from public field, constructor props, and assignment
- **Repository port**: Removed `findByAuth0Sub()` method from interface

### Infrastructure Layer
- **Prisma schema**: Removed `auth0Sub String @unique @map("auth0_sub")` column
- **Migration**: Created `20260311235900_remove_auth0_sub` to drop index and column
- **PrismaAccountRepository**: Removed `findByAuth0Sub()` implementation
- **AccountMapper**: Removed `auth0Sub` from `toDomain()` and `toPersistence()`

### Application Layer
- **CreateAccountCommand**: Idempotency now uses `findByEmail` (was `findByAuth0Sub`); removed separate duplicate email check since findByEmail serves both purposes
- **GetMeQuery**: Uses `findByEmail` instead of `findByAuth0Sub`
- **UpdateNameCommand, UpdatePhoneCommand, UpdateBirthDateCommand, UploadAccountPhotoCommand**: Ownership check changed from `account.auth0Sub !== input.auth0Sub` to `account.email !== input.email`
- **FindAccountByFieldQuery, GetAccountByIdQuery, ListAccountsQuery**: Removed `auth0Sub` from output interfaces

### Controller
- All endpoints now pass `user.email` instead of `user.sub` for identity

### Tests
- All 22 test files updated to remove auth0Sub references
- Mock repositories no longer include `findByAuth0Sub`
- Ownership tests now use mismatched email instead of mismatched auth0Sub
- 120 tests pass

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed auth0Sub in additional queries not listed in plan**
- **Found during:** Task 2
- **Issue:** `find-account-by-field.query.ts`, `get-account-by-id.query.ts`, and `list-accounts.query.ts` also had auth0Sub in their output interfaces and toOutput() methods, plus their spec files had auth0Sub in mock repos and test data
- **Fix:** Removed auth0Sub from all three query output interfaces and their corresponding spec files
- **Files modified:** 6 additional files (3 queries + 3 specs)
- **Commit:** 1db0b7f (included in Task 2 commit)

## Verification Results

1. `npx tsc --noEmit` -- zero errors
2. `npx vitest run` -- 120 tests passed across 22 files
3. `grep -r "auth0Sub|auth0_sub|findByAuth0Sub" src/` -- zero matches
4. Migration file exists at `prisma/migrations/20260311235900_remove_auth0_sub/migration.sql`
