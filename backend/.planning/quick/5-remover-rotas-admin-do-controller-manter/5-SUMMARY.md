---
phase: quick-5
plan: 1
subsystem: account
tags: [cleanup, admin-routes, roles, me-routes]
dependency_graph:
  requires: [quick-4]
  provides: [controller-me-only, no-roles-infrastructure]
  affects: [e2e-tests, security-tests]
tech_stack:
  removed: [RolesGuard, Roles decorator, GetAccountByIdQuery, ListAccountsQuery, FindAccountByFieldQuery, ListAccountsQueryDto]
  patterns: [me-only routes eliminate IDOR by design]
key_files:
  modified:
    - src/account/interface/controllers/account.controller.ts
    - src/account/application/account-application.module.ts
    - src/shared/infrastructure/auth/index.ts
    - src/shared/infrastructure/auth/auth.module.ts
    - src/setup-app.ts
    - test/accounts.e2e-spec.ts
    - test/security.e2e-spec.ts
  deleted:
    - src/account/application/queries/get-account-by-id.query.ts
    - src/account/application/queries/get-account-by-id.query.spec.ts
    - src/account/application/queries/list-accounts.query.ts
    - src/account/application/queries/list-accounts.query.spec.ts
    - src/account/application/queries/find-account-by-field.query.ts
    - src/account/application/queries/find-account-by-field.query.spec.ts
    - src/account/interface/dtos/list-accounts-query.dto.ts
    - src/shared/infrastructure/auth/decorators/roles.decorator.ts
    - src/shared/infrastructure/auth/guards/roles.guard.ts
decisions:
  - IDOR tests replaced with ME-ISOLATION tests since me-routes make IDOR impossible by design
  - E2e tests using /:id patterns updated to /me patterns to match controller routes from quick task 4
metrics:
  duration: 8m
  completed: 2026-03-12
---

# Quick Task 5: Remove Admin Routes from Controller Summary

Removed all admin routes, admin-only queries, roles infrastructure, and updated all e2e tests to reflect me-only routing. Deleted 9 source files and removed 506 lines of dead code from production, plus 366 net lines from tests.

## Completed Tasks

| # | Task | Commit | Key Changes |
|---|------|--------|-------------|
| 1 | Remove admin routes, queries, roles infrastructure, and DTO | dde3b94 | Deleted 9 files, cleaned controller/module/auth imports |
| 2 | Update e2e tests to remove admin-route test sections | b7f43f7 | Rewrote 2 e2e test files, 54 tests pass |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed e2e tests using /:id paths for me-routes**
- **Found during:** Task 2
- **Issue:** E2e tests in REST-05, REST-07, REST-10, REST-11, REST-12, and IDENTITY sections still used `PATCH /accounts/:id`, `POST /accounts/:id/phone/send-code`, `POST /accounts/:id/photo` paths, but the controller was changed to `/me` routes in quick task 4. Tests would fail with 404.
- **Fix:** Updated all test paths to use `/me` variants. Changed ownership-violation (403) assertions to not-found (404) where the attacker has no account. Replaced IDOR describe blocks with ME-ISOLATION tests since /me routes make IDOR impossible by design.
- **Files modified:** test/accounts.e2e-spec.ts, test/security.e2e-spec.ts
- **Commit:** b7f43f7

## Verification Results

- TypeScript compiles clean (npx tsc --noEmit)
- 109 unit tests pass (npx vitest run)
- 54 e2e tests pass (npx vitest run --config test/vitest-e2e.config.ts)
- No @Roles references in src/
- No RolesGuard references in src/
- No GetAccountByIdQuery/ListAccountsQuery/FindAccountByFieldQuery references in src/
- Controller routes: POST '', GET 'me', PATCH 'me', POST 'me/phone/send-code', POST 'me/phone/verify', POST 'me/photo'

## Self-Check: PASSED

All modified files exist, all deleted files confirmed removed, both commits (dde3b94, b7f43f7) verified in git log.
