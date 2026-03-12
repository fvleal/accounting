---
phase: quick-5
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/account/interface/controllers/account.controller.ts
  - src/account/interface/dtos/list-accounts-query.dto.ts
  - src/account/application/queries/get-account-by-id.query.ts
  - src/account/application/queries/get-account-by-id.query.spec.ts
  - src/account/application/queries/list-accounts.query.ts
  - src/account/application/queries/list-accounts.query.spec.ts
  - src/account/application/queries/find-account-by-field.query.ts
  - src/account/application/queries/find-account-by-field.query.spec.ts
  - src/account/application/account-application.module.ts
  - src/shared/infrastructure/auth/decorators/roles.decorator.ts
  - src/shared/infrastructure/auth/guards/roles.guard.ts
  - src/shared/infrastructure/auth/index.ts
  - src/shared/infrastructure/auth/auth.module.ts
  - src/setup-app.ts
  - test/accounts.e2e-spec.ts
  - test/security.e2e-spec.ts
  - test/helpers/test-fixtures.ts
autonomous: true
requirements: []
must_haves:
  truths:
    - "Controller only exposes me-routes: POST /accounts, GET /accounts/me, PATCH /accounts/me, POST /accounts/me/phone/*, POST /accounts/me/photo"
    - "No @Roles decorator usage remains in the codebase"
    - "RolesGuard is removed from global guards and auth module"
    - "Admin-only queries (GetAccountById, ListAccounts, FindAccountByField) and their tests are deleted"
    - "All unit and e2e tests pass"
  artifacts:
    - path: "src/account/interface/controllers/account.controller.ts"
      provides: "Controller with me-only routes"
    - path: "src/setup-app.ts"
      provides: "Global guards without RolesGuard"
  key_links:
    - from: "src/setup-app.ts"
      to: "src/shared/infrastructure/auth/index.ts"
      via: "imports only JwtAuthGuard (no RolesGuard)"
      pattern: "useGlobalGuards.*JwtAuthGuard"
---

<objective>
Remove admin routes (GET /accounts/:id, GET /accounts with @Roles) from the controller, keeping only user me-routes. Delete admin-only queries (GetAccountById, ListAccounts, FindAccountByField), their tests, the ListAccountsQueryDto, and the roles decorator/guard infrastructure since nothing else uses them. Update e2e tests to remove all admin-route test sections.

Purpose: Clean up v1 to only expose user-facing routes. Admin routes will be added in v2.
Output: Leaner controller, no dead code, all tests green.
</objective>

<execution_context>
@C:/Users/felip/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/felip/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/account/interface/controllers/account.controller.ts
@src/account/application/account-application.module.ts
@src/shared/infrastructure/auth/index.ts
@src/shared/infrastructure/auth/auth.module.ts
@src/shared/infrastructure/auth/decorators/roles.decorator.ts
@src/shared/infrastructure/auth/guards/roles.guard.ts
@src/setup-app.ts
@test/accounts.e2e-spec.ts
@test/security.e2e-spec.ts
@test/helpers/test-fixtures.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove admin routes, queries, roles infrastructure, and DTO</name>
  <files>
    src/account/interface/controllers/account.controller.ts
    src/account/interface/dtos/list-accounts-query.dto.ts
    src/account/application/queries/get-account-by-id.query.ts
    src/account/application/queries/get-account-by-id.query.spec.ts
    src/account/application/queries/list-accounts.query.ts
    src/account/application/queries/list-accounts.query.spec.ts
    src/account/application/queries/find-account-by-field.query.ts
    src/account/application/queries/find-account-by-field.query.spec.ts
    src/account/application/account-application.module.ts
    src/shared/infrastructure/auth/decorators/roles.decorator.ts
    src/shared/infrastructure/auth/guards/roles.guard.ts
    src/shared/infrastructure/auth/index.ts
    src/shared/infrastructure/auth/auth.module.ts
    src/setup-app.ts
  </files>
  <action>
    1. **Controller** (`account.controller.ts`):
       - Remove the `findById` method (GET :id with @Roles, lines 75-82)
       - Remove the `list` method (GET with @Roles, lines 84-106)
       - Remove imports: `Roles` from auth index, `Param`, `Query`, `ParseUUIDPipe` (only used by removed routes)
       - Remove imports: `GetAccountByIdQuery`, `FindAccountByFieldQuery`, `ListAccountsQuery`, `ListAccountsQueryDto`
       - Remove constructor params: `getById`, `findByField`, `listAccounts`
       - Keep all me-routes intact (POST /accounts, GET me, PATCH me, phone/send-code, phone/verify, photo)

    2. **Delete files** (admin-only queries + tests + DTO):
       - `src/account/application/queries/get-account-by-id.query.ts`
       - `src/account/application/queries/get-account-by-id.query.spec.ts`
       - `src/account/application/queries/list-accounts.query.ts`
       - `src/account/application/queries/list-accounts.query.spec.ts`
       - `src/account/application/queries/find-account-by-field.query.ts`
       - `src/account/application/queries/find-account-by-field.query.spec.ts`
       - `src/account/interface/dtos/list-accounts-query.dto.ts`

    3. **Application module** (`account-application.module.ts`):
       - Remove imports and providers/exports for: `GetAccountByIdQuery`, `ListAccountsQuery`, `FindAccountByFieldQuery`

    4. **Delete roles files**:
       - `src/shared/infrastructure/auth/decorators/roles.decorator.ts`
       - `src/shared/infrastructure/auth/guards/roles.guard.ts`

    5. **Auth index** (`src/shared/infrastructure/auth/index.ts`):
       - Remove exports for `Roles`, `ROLES_KEY`, `RolesGuard`

    6. **Auth module** (`src/shared/infrastructure/auth/auth.module.ts`):
       - Remove `RolesGuard` import and from providers/exports arrays

    7. **setup-app.ts**:
       - Remove `RolesGuard` import
       - Change `app.useGlobalGuards(app.get(JwtAuthGuard), app.get(RolesGuard))` to `app.useGlobalGuards(app.get(JwtAuthGuard))`

    8. Run `npx tsc --noEmit` to confirm no compile errors from removed references.
  </action>
  <verify>
    <automated>cd C:/Users/felip/desktop/accounting/backend && npx tsc --noEmit</automated>
  </verify>
  <done>All admin routes, queries, roles infrastructure, and DTO removed. TypeScript compiles clean.</done>
</task>

<task type="auto">
  <name>Task 2: Update e2e tests to remove admin-route test sections</name>
  <files>
    test/accounts.e2e-spec.ts
    test/security.e2e-spec.ts
    test/helpers/test-fixtures.ts
  </files>
  <action>
    1. **accounts.e2e-spec.ts** — Remove these describe blocks that test admin routes:
       - `AUTH-03: GET /accounts requires admin/M2M permissions` (lines 147-173) — tests @Roles on list route
       - `REST-02: GET /accounts/:id` (lines 251-292) — tests admin GET by ID
       - `REST-03: GET /accounts?cpf=X` (lines 298-316) — tests admin CPF search
       - `REST-06: GET /accounts (list)` (lines 528-579) — tests admin list pagination
       - `REST-09: Domain error mapping` test case for 404 on GET /:id (lines 661-672) — references admin GET :id route. Replace it with a test that hits GET /accounts/me with a user that has no account, which should also return 404 with ACCOUNT_NOT_FOUND.
       - In `Response envelope` describe: remove the list envelope test (lines 835-846) that hits `GET /accounts` with ADMIN_PAYLOAD, and remove the error test (lines 848-857) that hits `GET /accounts/:id` with ADMIN_PAYLOAD. For the error envelope test, replace with a test hitting `GET /accounts/me` without an account to get 404.
       - Remove import of `ADMIN_PAYLOAD` and `M2M_PAYLOAD` from test-fixtures if no longer used in this file (check carefully — they may be used in REST-02 or elsewhere). Also remove `NO_PERMISSIONS_PAYLOAD` import if not used.

    2. **security.e2e-spec.ts** — Remove these describe blocks:
       - `RBAC-01: regular user cannot read other accounts` (lines 239-264) — tests 403 on admin routes
       - `RBAC-02: M2M service access control` tests for GET /accounts (lines 279-293) — tests M2M on admin list route. Keep the POST /accounts M2M test (line 271-277) as a standalone section.
       - `RBAC-03: user with no permissions` tests for GET /accounts and GET /accounts/:id (lines 315-328) — admin route assertions. Keep the POST and GET /me tests (lines 300-313).
       - `DATA-LEAK-01` test for GET /accounts/:id admin (lines 392-401) and GET /accounts admin list (lines 403-414) — remove these two `it()` blocks only
       - `DATA-LEAK-02` test for 404 on GET /accounts/:id (lines 447-458) — the 404 test hits admin route, replace with GET /accounts/me test that expects 404
       - `ENUM-01: ID enumeration` (lines 467-484) — entirely about admin GET :id, remove whole describe
       - Remove `ADMIN_PAYLOAD` and `M2M_PAYLOAD` imports if no longer used after cleanup (M2M_PAYLOAD is used in RBAC-02 POST test, keep it if still referenced).

    3. **test-fixtures.ts** — Keep `ADMIN_PAYLOAD` and `M2M_PAYLOAD` exports even if some e2e files stop using them. Other test files or future tests may need them. Only remove if BOTH e2e files stop importing them (check after edits). `NO_PERMISSIONS_PAYLOAD` — same rule.

    4. Run unit tests: `npx vitest run`
    5. Run e2e tests: `npx vitest run --config test/vitest-e2e.config.ts`
  </action>
  <verify>
    <automated>cd C:/Users/felip/desktop/accounting/backend && npx vitest run && npx vitest run --config test/vitest-e2e.config.ts</automated>
  </verify>
  <done>All tests pass. No test references admin routes (GET /accounts/:id, GET /accounts with @Roles). E2e tests only cover me-routes and user-facing endpoints.</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes (no compile errors)
- `npx vitest run` passes (unit tests)
- `npx vitest run --config test/vitest-e2e.config.ts` passes (e2e tests)
- `grep -r "@Roles" src/` returns no matches
- `grep -r "RolesGuard" src/` returns no matches
- `grep -r "GetAccountByIdQuery\|ListAccountsQuery\|FindAccountByFieldQuery" src/` returns no matches
- Controller only has routes: POST '', GET 'me', PATCH 'me', POST 'me/phone/send-code', POST 'me/phone/verify', POST 'me/photo'
</verification>

<success_criteria>
- Controller has zero @Roles decorators and zero admin routes
- GetAccountByIdQuery, ListAccountsQuery, FindAccountByFieldQuery files deleted
- roles.decorator.ts and roles.guard.ts files deleted
- ListAccountsQueryDto deleted
- RolesGuard removed from setup-app.ts global guards and auth.module.ts
- All unit and e2e tests pass
</success_criteria>

<output>
After completion, create `.planning/quick/5-remover-rotas-admin-do-controller-manter/5-SUMMARY.md`
</output>
