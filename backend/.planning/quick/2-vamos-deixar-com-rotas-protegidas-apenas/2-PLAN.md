---
phase: quick
plan: 2
type: execute
wave: 1
depends_on: []
files_modified:
  - src/account/interface/controllers/account.controller.ts
  - src/shared/infrastructure/auth/guards/roles.guard.ts
  - test/helpers/test-fixtures.ts
  - test/security.e2e-spec.ts
  - test/accounts.e2e-spec.ts
autonomous: true
requirements: [QUICK-2]

must_haves:
  truths:
    - "Admin-only routes (GET /accounts/:id, GET /accounts) still require 'read:accounts' permission"
    - "User-facing routes (POST /accounts, GET /accounts/me, PATCH, phone, photo) only require a valid JWT — no specific permissions"
    - "Unauthenticated requests are still blocked on all endpoints"
    - "IDOR protections (ownership checks) remain intact on user routes"
  artifacts:
    - path: "src/account/interface/controllers/account.controller.ts"
      provides: "Controller with @Roles only on admin endpoints"
    - path: "test/security.e2e-spec.ts"
      provides: "Updated security tests reflecting new authorization model"
    - path: "test/helpers/test-fixtures.ts"
      provides: "Updated test fixtures — USER_PAYLOAD no longer needs permissions"
  key_links:
    - from: "RolesGuard"
      to: "account.controller.ts"
      via: "@Roles decorator metadata"
      pattern: "Routes without @Roles skip RolesGuard (returns true when no requiredRoles)"
---

<objective>
Remove @Roles from user-facing account endpoints so any authenticated user (valid JWT) can access them without needing specific permissions in the token. Keep @Roles only on admin-characteristic routes (GET /accounts/:id and GET /accounts).

Purpose: Simplify authorization — regular users only need a valid JWT, no role claims. Admin routes remain protected by permission checks.
Output: Updated controller, updated test fixtures and security e2e tests.
</objective>

<execution_context>
@C:/Users/felip/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/felip/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/account/interface/controllers/account.controller.ts
@src/shared/infrastructure/auth/guards/roles.guard.ts
@src/shared/infrastructure/auth/guards/jwt-auth.guard.ts
@test/helpers/test-fixtures.ts
@test/security.e2e-spec.ts
@test/accounts.e2e-spec.ts
</context>

<interfaces>
<!-- RolesGuard already returns true when no @Roles metadata is set (line 16-18 of roles.guard.ts) -->
<!-- This means removing @Roles from a route makes it pass RolesGuard automatically -->
<!-- JwtAuthGuard is global and still enforces JWT on all non-@Public routes -->

From src/shared/infrastructure/auth/guards/roles.guard.ts:
```typescript
// If no @Roles decorator → requiredRoles is undefined → returns true
if (!requiredRoles) {
  return true;
}
```
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Remove @Roles from user-facing endpoints</name>
  <files>src/account/interface/controllers/account.controller.ts</files>
  <action>
Remove @Roles decorator from the following user-facing endpoints (these only need a valid JWT, not specific permissions):

1. `POST /accounts` (create) — remove `@Roles('create:account')`
2. `GET /accounts/me` — remove `@Roles('read:own-account')`
3. `PATCH /accounts/:id` (update) — remove `@Roles('update:own-account')`
4. `POST /accounts/:id/phone/send-code` — remove `@Roles('update:own-account')`
5. `POST /accounts/:id/photo` — remove `@Roles('update:own-account')`

KEEP @Roles on these admin-only endpoints:
- `GET /accounts/:id` — keep `@Roles('read:accounts')`
- `GET /accounts` (list/search) — keep `@Roles('read:accounts')`

Also clean up the import: remove `Roles` from the import if it is no longer used in the file. Actually, `Roles` IS still used on the two admin endpoints, so keep the import.

The RolesGuard already returns true when no @Roles metadata is present, so removing the decorator is all that is needed — no guard changes required.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>User-facing endpoints have no @Roles decorator. Admin endpoints (GET /accounts/:id, GET /accounts) retain @Roles('read:accounts').</done>
</task>

<task type="auto">
  <name>Task 2: Update test fixtures and security e2e tests</name>
  <files>test/helpers/test-fixtures.ts, test/security.e2e-spec.ts, test/accounts.e2e-spec.ts</files>
  <action>
**test/helpers/test-fixtures.ts:**
- `USER_PAYLOAD`: remove `permissions` array entirely (or set to empty `[]`). A regular user no longer needs any permissions — just a valid JWT. Set to empty array since the interface has `permissions?: string[]`.
- `ADMIN_PAYLOAD`: keep only `['read:accounts']` since that is the only role still checked.
- `M2M_PAYLOAD`: keep `['read:accounts']` — unchanged.
- `NO_PERMISSIONS_PAYLOAD`: keep as-is (empty permissions).

**test/security.e2e-spec.ts:**
Update tests to reflect the new authorization model:

1. **RBAC-01 tests** (regular user cannot read other accounts): These should STILL pass since GET /accounts/:id and GET /accounts still have @Roles('read:accounts') and USER_PAYLOAD now has no permissions.

2. **RBAC-02 tests** (M2M cannot create): Update expectation — since POST /accounts no longer has @Roles, an authenticated M2M token CAN now create accounts. Change this test: M2M calling POST /accounts should now get 201 (or test a different admin restriction). Best approach: REMOVE or update this test since POST /accounts is no longer role-protected. Replace with a test that M2M without 'read:accounts' cannot list accounts.

3. **RBAC-03 tests** (no permissions blocked everywhere):
   - `POST /accounts` — now should return 201 (not 403) since no @Roles needed. Update to expect 201.
   - `GET /accounts/me` — now should return 404 (account not found for that email, not 403). Update to expect 404 since no account exists for noperm@example.com.
   - `GET /accounts` — should still return 403 (admin route).
   - `GET /accounts/:id` — should still return 403 (admin route).

4. **AUTH-BYPASS-01 tests** (unauthenticated): These should still pass as-is — JwtAuthGuard blocks unauthenticated requests globally.

5. **All IDOR tests**: Should still pass — ownership is checked at the application/command layer, not via @Roles.

**test/accounts.e2e-spec.ts:**
Review and update if any tests rely on specific permissions in USER_PAYLOAD that are now removed. Since USER_PAYLOAD will have empty permissions, tests that call user-facing endpoints (POST, GET /me, PATCH, etc.) should still work because those routes no longer check permissions.
  </action>
  <verify>
    <automated>npx jest --forceExit --detectOpenHandles 2>&1 | tail -30</automated>
  </verify>
  <done>All e2e tests pass. Tests correctly validate that admin routes (GET /accounts/:id, GET /accounts) still require 'read:accounts' permission, while user-facing routes only need JWT authentication.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` — no type errors
2. `npx jest --forceExit --detectOpenHandles` — all tests pass
3. Manual check: controller has @Roles only on GET /accounts/:id and GET /accounts
</verification>

<success_criteria>
- User-facing endpoints (POST, GET /me, PATCH, phone, photo) accessible with any valid JWT — no permissions required
- Admin endpoints (GET /accounts/:id, GET /accounts) still require 'read:accounts' permission
- All IDOR protections remain intact
- All e2e tests pass reflecting the new authorization model
</success_criteria>

<output>
After completion, create `.planning/quick/2-vamos-deixar-com-rotas-protegidas-apenas/2-SUMMARY.md`
</output>
