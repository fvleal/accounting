---
phase: quick
plan: 2
subsystem: account-authorization
tags: [auth, rbac, jwt, security]
dependency_graph:
  requires: []
  provides: [jwt-only-user-routes]
  affects: [account-controller, security-tests, test-fixtures]
tech_stack:
  added: []
  patterns: [jwt-only-authorization-for-user-routes]
key_files:
  created: []
  modified:
    - src/account/interface/controllers/account.controller.ts
    - test/helpers/test-fixtures.ts
    - test/security.e2e-spec.ts
    - test/accounts.e2e-spec.ts
decisions:
  - User-facing endpoints require only valid JWT, no specific permissions
  - Admin endpoints (GET /accounts/:id, GET /accounts) retain @Roles('read:accounts')
  - IDOR protections via ownership checks remain unchanged
metrics:
  duration: 239s
  completed: "2026-03-12T01:27:28Z"
  tasks: 2/2
  files_modified: 4
---

# Quick Task 2: Simplify Authorization -- JWT-Only User Routes

Removed @Roles decorator from user-facing account endpoints so any authenticated user (valid JWT) can access them without needing specific permission claims in the token. Admin-only routes (GET /accounts/:id, GET /accounts) retain @Roles('read:accounts').

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | 2612779 | feat(quick-2): remove @Roles from user-facing account endpoints |
| 2 | a644b7e | test(quick-2): update tests for JWT-only user route authorization |

## Task Details

### Task 1: Remove @Roles from user-facing endpoints

Removed `@Roles` decorator from 5 user-facing endpoints:
- `POST /accounts` (create) -- removed `@Roles('create:account')`
- `GET /accounts/me` -- removed `@Roles('read:own-account')`
- `PATCH /accounts/:id` -- removed `@Roles('update:own-account')`
- `POST /accounts/:id/phone/send-code` -- removed `@Roles('update:own-account')`
- `POST /accounts/:id/photo` -- removed `@Roles('update:own-account')`

Kept `@Roles('read:accounts')` on admin-only endpoints:
- `GET /accounts/:id`
- `GET /accounts`

The `Roles` import remains since it is still used on admin endpoints. No changes to `RolesGuard` were needed -- it already returns `true` when no `@Roles` metadata is present.

### Task 2: Update test fixtures and security e2e tests

**test-fixtures.ts:**
- `USER_PAYLOAD`: permissions set to `[]` (regular users need only JWT)
- `ADMIN_PAYLOAD`: permissions reduced to `['read:accounts']` only

**security.e2e-spec.ts:**
- RBAC-02: Updated M2M tests -- POST /accounts now succeeds (201) since no @Roles required. Added tests for M2M with/without read:accounts on list endpoint.
- RBAC-03: POST /accounts now expects 201 (not 403). GET /accounts/me now expects 404 (no account for that email, not 403). Admin routes still expect 403.

**accounts.e2e-spec.ts:**
- AUTH-02: Updated description and expectations -- getMe requires only valid JWT, not specific permissions. No-permissions user gets 404 (not 403).
- Photo upload test: Updated description to reflect ownership check rather than permission check.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test data: name validation requires 2 words**
- **Found during:** Task 2
- **Issue:** RBAC-03 test sent `name: 'Nobody'` (single word) which triggers domain validation error "Person name must have at least 2 words", resulting in 500 instead of 201.
- **Fix:** Changed test to send `name: 'Nobody User'` (two words).
- **Files modified:** test/security.e2e-spec.ts
- **Commit:** a644b7e

## Verification

- TypeScript compilation: PASSED (no errors)
- Unit tests: 120/120 passed
- E2E tests: 83/83 passed
- Manual verification: controller has @Roles only on GET /accounts/:id and GET /accounts
