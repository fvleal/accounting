---
phase: quick-4
plan: 1
subsystem: account
tags: [refactoring, controller, commands, routes]
dependency_graph:
  requires: []
  provides: [generic-commands, me-routes]
  affects: [account-controller, account-commands]
tech_stack:
  added: []
  patterns: [jwt-email-resolution, accountId-only-commands]
key_files:
  created: []
  modified:
    - src/account/application/commands/update-name.command.ts
    - src/account/application/commands/update-birth-date.command.ts
    - src/account/application/commands/update-phone.command.ts
    - src/account/application/commands/upload-account-photo.command.ts
    - src/account/application/commands/update-name.command.spec.ts
    - src/account/application/commands/update-birth-date.command.spec.ts
    - src/account/application/commands/update-phone.command.spec.ts
    - src/account/application/commands/upload-account-photo.command.spec.ts
    - src/account/interface/controllers/account.controller.ts
    - src/account/domain/exceptions/index.ts
  deleted:
    - src/account/domain/exceptions/account-ownership.error.ts
decisions:
  - Commands accept accountId only, no email or ownership check -- reusable for admin routes
  - Controller resolves account via existing GetMeQuery rather than injecting repository directly
metrics:
  duration: 4m23s
  completed: 2026-03-12T13:57:36Z
  tasks_completed: 2
  tasks_total: 2
---

# Quick Task 4: Refactor Controller to Me-Only Routes

Separated HTTP/auth concern (controller resolves JWT email to accountId via GetMeQuery) from business logic (commands accept accountId only), preparing commands for reuse by future admin routes.

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | 3aeb2ac | refactor(quick-4): make commands generic with accountId-only input |
| 2 | 08c4710 | refactor(quick-4): change controller user routes to me-only with JWT resolution |

## Task Details

### Task 1: Refactor commands to be generic (accountId-only, no ownership check)

Removed `email` from all 4 command Input interfaces and removed the ownership check (`if (account.email !== input.email) throw AccountOwnershipError`) from all execute methods. Deleted `AccountOwnershipError` class entirely. Updated all spec files to remove email from execute calls and removed ownership error test cases.

**Commands modified:** UpdateNameCommand, UpdateBirthDateCommand, UpdatePhoneCommand, UploadAccountPhotoCommand

### Task 2: Refactor controller to me-only routes resolving account via JWT email

Changed all user-facing mutation routes from `:id` params to `me` prefix:
- `PATCH :id` -> `PATCH me`
- `POST :id/phone/send-code` -> `POST me/phone/send-code`
- `POST :id/phone/verify` -> `POST me/phone/verify`
- `POST :id/photo` -> `POST me/photo`

Controller now resolves accountId from JWT email using `GetMeQuery` before delegating to commands. Admin routes (`GET :id`, `GET list`) remain unchanged with `@Roles` guard.

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- All 116 tests pass (`npx vitest run`)
- TypeScript compiles cleanly (`npx tsc --noEmit`)
- No remaining references to `AccountOwnershipError` in codebase
- No `:id` in user mutation routes

## Self-Check: PASSED
