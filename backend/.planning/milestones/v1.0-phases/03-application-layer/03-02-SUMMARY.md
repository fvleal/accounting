---
phase: 03-application-layer
plan: 02
subsystem: application
tags: [cqrs, commands, use-cases, tdd, nestjs, di-injection]

# Dependency graph
requires:
  - phase: 03-application-layer
    plan: 01
    provides: auth0Sub on Account, UseCase<I,O> base, DomainException base, account exceptions, CQRS folder structure
provides:
  - CreateAccountCommand with idempotency by auth0Sub and uniqueness checks for email/CPF
  - UpdateNameCommand thin orchestrator
  - UpdatePhoneCommand thin orchestrator
  - UpdateBirthDateCommand thin orchestrator
  - UploadAccountPhotoCommand with StoragePort integration
affects: [03-application-layer plan 03, future controller layer (Phase 4)]

# Tech tracking
tech-stack:
  added: []
  patterns: [Command use case with co-located Input/Output, toOutput mapping per command, StoragePort upload integration]

key-files:
  created:
    - src/account/application/commands/create-account.command.ts
    - src/account/application/commands/create-account.command.spec.ts
    - src/account/application/commands/update-name.command.ts
    - src/account/application/commands/update-name.command.spec.ts
    - src/account/application/commands/update-phone.command.ts
    - src/account/application/commands/update-phone.command.spec.ts
    - src/account/application/commands/update-birth-date.command.ts
    - src/account/application/commands/update-birth-date.command.spec.ts
    - src/account/application/commands/upload-account-photo.command.ts
    - src/account/application/commands/upload-account-photo.command.spec.ts
  modified: []

key-decisions:
  - "Each command has its own toOutput() -- intentional duplication since Output shapes may diverge per use case"
  - "UploadAccountPhotoCommand uses key pattern accounts/{id}/photo for S3 storage"

patterns-established:
  - "Command use case pattern: @Injectable, @Inject port token, execute() loads aggregate -> validates -> delegates to domain method -> saves -> returns Output"
  - "Co-located Input/Output interfaces in same file as command class"
  - "StoragePort integration: upload returns URL, then aggregate.updatePhoto(url) persists the link"

requirements-completed: [UCAS-01, UCAS-02, UCAS-10, UCAS-06]

# Metrics
duration: 3min
completed: 2026-03-11
---

# Phase 3 Plan 2: Command Use Cases Summary

**5 CQRS command use cases via TDD: CreateAccount with idempotency/uniqueness, UpdateName/Phone/BirthDate as thin orchestrators, UploadAccountPhoto with StoragePort integration**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-11T13:44:30Z
- **Completed:** 2026-03-11T13:47:44Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Built CreateAccountCommand with idempotency (returns existing when auth0Sub already linked) and uniqueness checks (DuplicateEmailError, DuplicateCpfError)
- Built 3 update commands (UpdateName, UpdatePhone, UpdateBirthDate) as thin orchestrators that load aggregate, delegate to domain method, and save
- Built UploadAccountPhotoCommand integrating StoragePort.upload() to get URL, then account.updatePhoto(url) to persist
- All 14 tests green across 5 spec files, all following TDD (RED then GREEN)

## Task Commits

Each task was committed atomically:

1. **Task 1: CreateAccountCommand with idempotency and uniqueness checks (TDD)** - `35ca4f1` (feat)
2. **Task 2: UpdateName, UpdatePhone, UpdateBirthDate, UploadAccountPhoto commands (TDD)** - `332a413` (feat)

## Files Created/Modified
- `src/account/application/commands/create-account.command.ts` - CreateAccountCommand with idempotency by auth0Sub, email/CPF uniqueness checks
- `src/account/application/commands/create-account.command.spec.ts` - 5 tests covering idempotency, creation, uniqueness errors, output shape
- `src/account/application/commands/update-name.command.ts` - UpdateNameCommand: load -> updateName -> save
- `src/account/application/commands/update-name.command.spec.ts` - 2 tests: success path and AccountNotFoundError
- `src/account/application/commands/update-phone.command.ts` - UpdatePhoneCommand: load -> updatePhone -> save
- `src/account/application/commands/update-phone.command.spec.ts` - 2 tests: success path and AccountNotFoundError
- `src/account/application/commands/update-birth-date.command.ts` - UpdateBirthDateCommand: load -> updateBirthDate -> save
- `src/account/application/commands/update-birth-date.command.spec.ts` - 2 tests: success path and AccountNotFoundError
- `src/account/application/commands/upload-account-photo.command.ts` - UploadAccountPhotoCommand: load -> StoragePort.upload -> updatePhoto -> save
- `src/account/application/commands/upload-account-photo.command.spec.ts` - 3 tests: success path, AccountNotFoundError, StoragePort argument verification

## Decisions Made
- Each command has its own toOutput() method rather than a shared mapper -- intentional per RESEARCH.md Pitfall 6, since Output shapes may diverge per use case
- UploadAccountPhotoCommand uses key pattern `accounts/{id}/photo` for S3 storage
- All commands follow same structure: @Injectable, @Inject port tokens, execute() with load-validate-delegate-save-return pattern

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 5 command use cases ready for DI registration in AccountApplicationModule (Plan 03)
- Query use cases (Plan 03) can follow same pattern established here
- Controller layer (Phase 4) can inject these commands directly

## Self-Check: PASSED

All 10 files verified on disk. Both task commits (35ca4f1, 332a413) verified in git log.

---
*Phase: 03-application-layer*
*Completed: 2026-03-11*
