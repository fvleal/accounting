---
phase: quick-4
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/account/application/commands/update-name.command.ts
  - src/account/application/commands/update-name.command.spec.ts
  - src/account/application/commands/update-birth-date.command.ts
  - src/account/application/commands/update-birth-date.command.spec.ts
  - src/account/application/commands/update-phone.command.ts
  - src/account/application/commands/update-phone.command.spec.ts
  - src/account/application/commands/upload-account-photo.command.ts
  - src/account/application/commands/upload-account-photo.command.spec.ts
  - src/account/interface/controllers/account.controller.ts
  - src/account/domain/exceptions/account-ownership.error.ts
  - src/account/domain/exceptions/index.ts
autonomous: true
requirements: [QUICK-4]

must_haves:
  truths:
    - "Controller user routes (update, phone, photo) do not accept accountId from request params"
    - "Controller resolves account from JWT email via findByEmail before calling commands"
    - "Commands accept accountId only (no email, no ownership check) making them reusable for admin routes"
    - "All existing tests pass after refactoring"
  artifacts:
    - path: "src/account/interface/controllers/account.controller.ts"
      provides: "Me-only routes: PATCH me, POST me/phone/send-code, POST me/photo"
    - path: "src/account/application/commands/update-name.command.ts"
      provides: "Generic command accepting accountId only"
  key_links:
    - from: "account.controller.ts"
      to: "findByEmail on AccountRepositoryPort"
      via: "getMe query or direct repo call to resolve email -> account"
      pattern: "findByEmail.*email"
---

<objective>
Refactor the Account controller and commands to separate concerns: controller handles "me" route resolution (JWT email -> accountId), commands become generic (accept accountId only, no ownership checks). This prepares commands for reuse by future admin routes (v2) while keeping current routes user-only.

Purpose: Clean separation between HTTP/auth concern (controller) and business logic (commands). Commands become reusable for both self-service and admin contexts.
Output: Refactored controller with me-routes, generic commands, updated tests.
</objective>

<execution_context>
@C:/Users/felip/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/felip/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

<interfaces>
<!-- AccountRepositoryPort already has findByEmail -->
From src/account/domain/ports/account.repository.port.ts:
```typescript
export interface AccountRepositoryPort {
  save(account: Account): Promise<void>;
  findById(id: string): Promise<Account | null>;
  findByEmail(email: string): Promise<Account | null>;
  findByCpf(cpf: string): Promise<Account | null>;
  findAll(params: PaginationParams): Promise<PaginatedResult<Account>>;
}
```

From src/account/application/queries/get-me.query.ts:
```typescript
// Already does findByEmail -> returns account output
export interface GetMeInput { email: string; }
export class GetMeQuery implements UseCase<GetMeInput, GetMeOutput> { ... }
```

From src/shared/infrastructure/auth/index.ts:
```typescript
export function CurrentUser(): ParameterDecorator;  // extracts JwtPayload
export function Roles(...roles: string[]): MethodDecorator;
export interface JwtPayload { email: string; /* ... */ }
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Refactor commands to be generic (accountId-only, no ownership check)</name>
  <files>
    src/account/application/commands/update-name.command.ts,
    src/account/application/commands/update-name.command.spec.ts,
    src/account/application/commands/update-birth-date.command.ts,
    src/account/application/commands/update-birth-date.command.spec.ts,
    src/account/application/commands/update-phone.command.ts,
    src/account/application/commands/update-phone.command.spec.ts,
    src/account/application/commands/upload-account-photo.command.ts,
    src/account/application/commands/upload-account-photo.command.spec.ts,
    src/account/domain/exceptions/account-ownership.error.ts,
    src/account/domain/exceptions/index.ts
  </files>
  <action>
    For each of the 4 commands (UpdateNameCommand, UpdateBirthDateCommand, UpdatePhoneCommand, UploadAccountPhotoCommand):

    1. Remove `email` from the Input interface. Each command should only receive `accountId` plus the field-specific data:
       - UpdateNameInput: `{ accountId: string; name: string }`
       - UpdateBirthDateInput: `{ accountId: string; birthDate: Date }`
       - UpdatePhoneInput: `{ accountId: string; phone: string }`
       - UploadAccountPhotoInput: `{ accountId: string; buffer: Buffer; contentType: string }`

    2. In the `execute()` method, remove the ownership check (`if (account.email !== input.email) throw new AccountOwnershipError`). Keep only `findById` + `AccountNotFoundError` check.

    3. Remove the `AccountOwnershipError` import from each command file.

    4. Update each spec file:
       - Remove `email` from all `command.execute()` calls.
       - Remove the "should throw AccountOwnershipError when email does not match" test case entirely.
       - Keep the success case and AccountNotFoundError test cases, adjusting input shapes.

    5. Delete `src/account/domain/exceptions/account-ownership.error.ts` since it is no longer used.

    6. Update `src/account/domain/exceptions/index.ts` to remove the `AccountOwnershipError` export.

    7. Also grep for any other imports of AccountOwnershipError across the codebase and remove them. Check `src/account/interface/filters/domain-exception.filter.ts` in particular.
  </action>
  <verify>
    <automated>cd C:/Users/felip/desktop/accounting/backend && npx vitest run src/account/application/commands/ --reporter=verbose 2>&1 | tail -30</automated>
  </verify>
  <done>All 4 commands accept accountId-only input (no email), ownership check removed, AccountOwnershipError deleted, all command tests pass.</done>
</task>

<task type="auto">
  <name>Task 2: Refactor controller to me-only routes resolving account via JWT email</name>
  <files>
    src/account/interface/controllers/account.controller.ts
  </files>
  <action>
    Refactor the AccountController to remove `:id` param from user-facing mutation routes. The controller now resolves the account from JWT email before delegating to commands.

    1. Inject the AccountRepositoryPort directly into the controller (import ACCOUNT_REPOSITORY_PORT token from account-infrastructure.module). This allows the controller to resolve email -> account without creating a new use case. The GetMeQuery already exists but returns a DTO; the controller needs the raw account.id to pass to commands.

    Alternative (preferred for consistency): Use the existing `GetMeQuery` to resolve the email, then extract the `id` from its output. This avoids injecting the repo directly into the controller layer.

    Choose the GetMeQuery approach:
    - The GetMeQuery output already contains `id`, which is all we need.

    2. Change the routes:
       - `PATCH ':id'` becomes `PATCH 'me'` -- remove `@Param('id', ParseUUIDPipe) id: string`, use `@CurrentUser() user: JwtPayload` to get email, call `this.getMe.execute({ email: user.email })` to get accountId, then pass to commands.
       - `POST ':id/phone/send-code'` becomes `POST 'me/phone/send-code'` -- same pattern.
       - `POST ':id/phone/verify'` becomes `POST 'me/phone/verify'` -- same pattern (still throws NOT_IMPLEMENTED).
       - `POST ':id/photo'` becomes `POST 'me/photo'` -- same pattern.

    3. In the `update()` method (PATCH me):
       - Resolve account: `const me = await this.getMe.execute({ email: user.email });`
       - Pass `me.id` as accountId to updateName/updateBirthDate commands (without email).
       - Remove `ParseUUIDPipe` import if no longer used anywhere (check findById route still uses it).

    4. In `sendPhoneCode()` (POST me/phone/send-code):
       - Resolve account via getMe, pass `me.id` to updatePhone command (without email).

    5. In `uploadAccountPhoto()` (POST me/photo):
       - Resolve account via getMe, pass `me.id` to uploadPhoto command (without email).

    6. In `verifyPhone()` (POST me/phone/verify):
       - Remove `@Param('id', ParseUUIDPipe) _id: string`. Still throws NOT_IMPLEMENTED.

    7. Keep admin routes unchanged: `GET ':id'` with `@Roles('read:accounts')` and `GET()` with `@Roles('read:accounts')` stay as-is since they are already admin-only.

    8. Keep `POST()` (create) unchanged -- it already uses `user.email` from JWT.

    9. Keep `GET 'me'` unchanged -- it already works correctly.

    10. Clean up unused imports (ParseUUIDPipe may still be needed for GET ':id').
  </action>
  <verify>
    <automated>cd C:/Users/felip/desktop/accounting/backend && npx vitest run --reporter=verbose 2>&1 | tail -40</automated>
  </verify>
  <done>Controller user routes are PATCH me, POST me/phone/send-code, POST me/phone/verify, POST me/photo. No accountId in URL for user actions. Admin routes (GET :id, GET list) unchanged. All tests pass, TypeScript compiles (`npx tsc --noEmit`).</done>
</task>

</tasks>

<verification>
1. `npx vitest run` -- all tests pass
2. `npx tsc --noEmit` -- no TypeScript errors
3. Grep confirms no remaining references to AccountOwnershipError: `grep -r "AccountOwnershipError" src/`
4. Grep confirms no `:id` in user mutation routes: controller uses 'me' prefix for update/phone/photo routes
</verification>

<success_criteria>
- Commands are generic: accept accountId only, no email, no ownership check
- Controller resolves JWT email -> accountId via GetMeQuery for all user mutation routes
- AccountOwnershipError is deleted from codebase
- Routes: PATCH me, POST me/phone/*, POST me/photo (no :id param)
- Admin routes (GET :id, GET list) remain unchanged with @Roles guard
- All tests pass, TypeScript compiles cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/4-refatorar-controller-para-rotas-do-propr/4-SUMMARY.md`
</output>
