---
phase: quick
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
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
  - src/account/interface/controllers/account.controller.ts
  - src/account/domain/entities/account.entity.spec.ts
  - src/account/infrastructure/mappers/account.mapper.spec.ts
  - src/account/infrastructure/adapters/prisma-account.repository.spec.ts
  - src/account/application/commands/create-account.command.spec.ts
  - src/account/application/commands/update-name.command.spec.ts
  - src/account/application/commands/update-phone.command.spec.ts
  - src/account/application/commands/update-birth-date.command.spec.ts
  - src/account/application/commands/upload-account-photo.command.spec.ts
  - src/account/application/queries/get-me.query.spec.ts
autonomous: true
requirements: [REFACTOR-01]

must_haves:
  truths:
    - "Account entity has no auth0Sub field, property, or getter"
    - "All command/query handlers use email for identity lookup and ownership checks"
    - "GET /accounts/me resolves account by email from JWT payload"
    - "POST /accounts uses email from JWT for idempotency check (findByEmail)"
    - "Prisma schema has no auth0_sub column"
    - "All existing tests pass with auth0Sub fully removed"
  artifacts:
    - path: "prisma/schema.prisma"
      provides: "Account model without auth0_sub"
      contains: "model Account"
    - path: "src/account/domain/entities/account.entity.ts"
      provides: "Account entity without auth0Sub"
    - path: "src/account/domain/ports/account.repository.port.ts"
      provides: "Repository port without findByAuth0Sub"
  key_links:
    - from: "src/account/interface/controllers/account.controller.ts"
      to: "src/account/application/commands/create-account.command.ts"
      via: "user.email instead of user.sub"
      pattern: "email.*user\\.email"
    - from: "src/account/interface/controllers/account.controller.ts"
      to: "src/account/application/queries/get-me.query.ts"
      via: "email from JWT payload"
      pattern: "email.*user\\.email"
    - from: "src/account/application/commands/update-name.command.ts"
      to: "account.email"
      via: "ownership check comparing email"
      pattern: "account\\.email.*!==.*input\\.email"
---

<objective>
Remove auth0Sub from the entire Account domain, replacing all identity lookups and ownership checks with email (already unique in DB and present in JWT payload).

Purpose: Decouple Account from Auth0's internal subject identifier. Email is already unique, already in the JWT payload, and is the natural user-facing identifier.

Output: All production code and tests updated, Prisma migration created, zero references to auth0Sub remain.
</objective>

<execution_context>
@C:/Users/felip/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/felip/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@prisma/schema.prisma
@src/account/domain/entities/account.entity.ts
@src/account/domain/ports/account.repository.port.ts
@src/account/infrastructure/adapters/prisma-account.repository.ts
@src/account/infrastructure/mappers/account.mapper.ts
@src/account/application/commands/create-account.command.ts
@src/account/application/commands/update-name.command.ts
@src/account/application/commands/update-phone.command.ts
@src/account/application/commands/update-birth-date.command.ts
@src/account/application/commands/upload-account-photo.command.ts
@src/account/application/queries/get-me.query.ts
@src/account/interface/controllers/account.controller.ts
@src/account/domain/events/account-created.event.ts
@src/shared/infrastructure/auth/interfaces/jwt-payload.interface.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove auth0Sub from domain layer, schema, and infrastructure</name>
  <files>
    prisma/schema.prisma,
    src/account/domain/entities/account.entity.ts,
    src/account/domain/ports/account.repository.port.ts,
    src/account/domain/events/account-created.event.ts,
    src/account/infrastructure/adapters/prisma-account.repository.ts,
    src/account/infrastructure/mappers/account.mapper.ts
  </files>
  <action>
    1. **Prisma schema** (`prisma/schema.prisma`): Remove the line `auth0Sub String @unique @map("auth0_sub")` from the Account model. Then run `npx prisma migrate dev --name remove-auth0-sub` to create and apply the migration. Then run `npx prisma generate` to regenerate the client.

    2. **Account entity** (`src/account/domain/entities/account.entity.ts`):
       - Remove `auth0Sub` from `CreateAccountProps` interface
       - Remove `auth0Sub` from `ReconstituteAccountProps` interface
       - Remove `private _auth0Sub!: string;` field
       - Remove `account._auth0Sub = props.auth0Sub;` from both `create()` and `reconstitute()`
       - Remove the `get auth0Sub(): string` getter
       - In `create()`, remove `auth0Sub: account.auth0Sub` from the AccountCreated event constructor — just remove that property entirely

    3. **AccountCreated event** (`src/account/domain/events/account-created.event.ts`):
       - Remove `auth0Sub` from the public field, constructor props interface, and assignment

    4. **Repository port** (`src/account/domain/ports/account.repository.port.ts`):
       - Remove `findByAuth0Sub(auth0Sub: string): Promise<Account | null>;` from the interface

    5. **Prisma repository** (`src/account/infrastructure/adapters/prisma-account.repository.ts`):
       - Remove the entire `findByAuth0Sub` method

    6. **Account mapper** (`src/account/infrastructure/mappers/account.mapper.ts`):
       - In `toDomain()`: Remove `auth0Sub: raw.auth0Sub` from reconstitute props
       - In `toPersistence()`: Remove `auth0Sub: account.auth0Sub` from returned object
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>Domain layer, schema, and infrastructure have zero references to auth0Sub. TypeScript compilation shows only errors in application/interface layer (expected, fixed in Task 2).</done>
</task>

<task type="auto">
  <name>Task 2: Update application layer, controller, and all tests</name>
  <files>
    src/account/application/commands/create-account.command.ts,
    src/account/application/commands/update-name.command.ts,
    src/account/application/commands/update-phone.command.ts,
    src/account/application/commands/update-birth-date.command.ts,
    src/account/application/commands/upload-account-photo.command.ts,
    src/account/application/queries/get-me.query.ts,
    src/account/interface/controllers/account.controller.ts,
    src/account/domain/entities/account.entity.spec.ts,
    src/account/infrastructure/mappers/account.mapper.spec.ts,
    src/account/infrastructure/adapters/prisma-account.repository.spec.ts,
    src/account/application/commands/create-account.command.spec.ts,
    src/account/application/commands/update-name.command.spec.ts,
    src/account/application/commands/update-phone.command.spec.ts,
    src/account/application/commands/update-birth-date.command.spec.ts,
    src/account/application/commands/upload-account-photo.command.spec.ts,
    src/account/application/queries/get-me.query.spec.ts
  </files>
  <action>
    **Commands and queries — replace auth0Sub with email throughout:**

    1. **CreateAccountCommand** (`create-account.command.ts`):
       - Remove `auth0Sub` from `CreateAccountInput` (keep email, name, cpf)
       - Remove `auth0Sub` from `CreateAccountOutput` (keep id, name, email, cpf, birthDate, phone, photoUrl, createdAt, updatedAt)
       - Change idempotency check from `findByAuth0Sub(input.auth0Sub)` to `findByEmail(input.email)` — if account exists for that email, return it (idempotent). Remove the separate duplicate email check since findByEmail now serves both purposes.
       - In `Account.create()` call, remove `auth0Sub` prop
       - In `toOutput()`, remove `auth0Sub` field

    2. **GetMeQuery** (`get-me.query.ts`):
       - Change `GetMeInput` from `{ auth0Sub: string }` to `{ email: string }`
       - Remove `auth0Sub` from `GetMeOutput`
       - Change `findByAuth0Sub(input.auth0Sub)` to `findByEmail(input.email)`
       - In `toOutput()`, remove `auth0Sub` field

    3. **UpdateNameCommand** (`update-name.command.ts`):
       - In `UpdateNameInput`: replace `auth0Sub: string` with `email: string`
       - Remove `auth0Sub` from `UpdateNameOutput`
       - Change ownership check: `if (account.email !== input.email)` instead of `account.auth0Sub !== input.auth0Sub`
       - In `toOutput()`, remove `auth0Sub` field

    4. **UpdatePhoneCommand** (`update-phone.command.ts`): Same pattern as UpdateNameCommand — replace `auth0Sub` with `email` in input, output, and ownership check.

    5. **UpdateBirthDateCommand** (`update-birth-date.command.ts`): Same pattern as UpdateNameCommand.

    6. **UploadAccountPhotoCommand** (`upload-account-photo.command.ts`): Same pattern — replace `auth0Sub` with `email` in input, output, and ownership check.

    **Controller** (`account.controller.ts`):
    - `create()`: Change `auth0Sub: user.sub` to just pass `email: user.email, name: dto.name, cpf: dto.cpf` (remove auth0Sub entirely)
    - `me()`: Change `{ auth0Sub: user.sub }` to `{ email: user.email }`
    - `update()` (PATCH): Change `auth0Sub: user.sub` to `email: user.email` for both updateName and updateBirthDate calls
    - `sendPhoneCode()`: Change `auth0Sub: user.sub` to `email: user.email`
    - `uploadAccountPhoto()`: Change `auth0Sub: user.sub` to `email: user.email`

    **Tests — update all spec files:**

    For every test file, apply these changes:
    - Remove `VALID_AUTH0_SUB` constant and any `auth0Sub` in test data
    - In `createMockRepo()` helper: remove `findByAuth0Sub` from the mock object
    - In `Account.create()` calls within tests: remove `auth0Sub` prop
    - In assertions: remove `expect(output.auth0Sub)` checks
    - In `createTestAccount()` helpers: remove `auth0Sub` from create props

    Specific test changes:
    - **create-account.command.spec.ts**: Change idempotency test to mock `findByEmail` returning existing account (instead of `findByAuth0Sub`). Remove `auth0Sub` from validInput. Update all output assertions.
    - **get-me.query.spec.ts**: Change `execute({ auth0Sub: ... })` to `execute({ email: VALID_EMAIL })`. Mock `findByEmail` instead of `findByAuth0Sub`.
    - **update-name.command.spec.ts**: Change `auth0Sub` in input to `email`. Update ownership test to use mismatched email.
    - **update-phone.command.spec.ts**: Same pattern.
    - **update-birth-date.command.spec.ts**: Same pattern.
    - **upload-account-photo.command.spec.ts**: Same pattern.
    - **account.entity.spec.ts**: Remove auth0Sub from all create/reconstitute calls and assertions.
    - **account.mapper.spec.ts**: Remove auth0Sub from mapping assertions and test data.
    - **prisma-account.repository.spec.ts**: Remove findByAuth0Sub test cases.

    After all changes, do a global search for "auth0Sub", "auth0_sub", "findByAuth0Sub" across the entire `src/` directory to ensure zero remaining references. If any are found, fix them.
  </action>
  <verify>
    <automated>npx vitest run 2>&1 | tail -20</automated>
  </verify>
  <done>All tests pass. Zero references to auth0Sub/auth0_sub/findByAuth0Sub remain in src/ directory. TypeScript compiles cleanly. Prisma migration exists for column removal.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` compiles with zero errors
2. `npx vitest run` all tests pass
3. `grep -r "auth0Sub\|auth0_sub\|findByAuth0Sub" src/` returns no matches
4. Prisma migration file exists in `prisma/migrations/` for removing auth0_sub column
</verification>

<success_criteria>
- Zero references to auth0Sub in production code and tests
- All ownership checks use email comparison
- GET /accounts/me resolves by email
- POST /accounts idempotency check uses findByEmail
- All unit tests pass
- Prisma migration created and applied
- TypeScript compiles cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/1-refatorar-account-para-remover-auth0sub-/1-SUMMARY.md`
</output>
