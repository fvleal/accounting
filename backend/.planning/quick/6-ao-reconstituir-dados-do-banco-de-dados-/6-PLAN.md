---
phase: quick
plan: 6
type: execute
wave: 1
depends_on: []
files_modified:
  - src/account/domain/entities/account.entity.spec.ts
  - src/account/infrastructure/mappers/account.mapper.spec.ts
autonomous: true
requirements: [QUICK-6]

must_haves:
  truths:
    - "Reconstituting an Account with an invalid name throws"
    - "Reconstituting an Account with an invalid email throws"
    - "Reconstituting an Account with an invalid CPF throws"
    - "Reconstituting an Account with an invalid phone throws"
    - "Reconstituting an Account with an invalid birthDate throws"
    - "Reconstituting an Account with an invalid photoUrl throws"
    - "AccountMapper.toDomain throws when Prisma row has inconsistent data"
  artifacts:
    - path: "src/account/domain/entities/account.entity.spec.ts"
      provides: "Reconstitution validation tests for every field"
    - path: "src/account/infrastructure/mappers/account.mapper.spec.ts"
      provides: "Integration tests proving mapper rejects corrupt DB rows"
  key_links:
    - from: "account.mapper.spec.ts"
      to: "Account.reconstitute"
      via: "AccountMapper.toDomain calling reconstitute"
      pattern: "AccountMapper\\.toDomain"
---

<objective>
Add comprehensive tests proving that Account.reconstitute (and by extension AccountMapper.toDomain) rejects inconsistent data from the database. Every value object validation must be exercised during reconstitution.

Purpose: Guarantee that corrupt or inconsistent database rows cannot be silently loaded into the domain model. Validation runs on every reconstitution path.
Output: Extended test suites in entity spec and mapper spec.
</objective>

<execution_context>
@C:/Users/felip/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/felip/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/account/domain/entities/account.entity.ts
@src/account/domain/entities/account.entity.spec.ts
@src/account/infrastructure/mappers/account.mapper.ts
@src/account/infrastructure/mappers/account.mapper.spec.ts
@src/account/domain/value-objects/person-name.value-object.ts
@src/account/domain/value-objects/email.value-object.ts
@src/account/domain/value-objects/cpf.value-object.ts
@src/account/domain/value-objects/phone-number.value-object.ts
@src/account/domain/value-objects/birth-date.value-object.ts

<interfaces>
<!-- Validation rules per value object (reconstitute must enforce all of these): -->

PersonName.create(value):
  - Throws "Person name is required" if empty/whitespace
  - Throws "Person name must have at least 2 words" if single word

Email.create(value):
  - Throws "Invalid email format: {value}" if fails /^[^\s@]+@[^\s@]+\.[^\s@]+$/

CPF.create(value):
  - Throws on invalid CPF checksum (e.g. '000.000.000-00')

PhoneNumber.create(value):
  - Throws "Invalid Brazilian phone number: {value}" if fails /^[1-9]{2}[2-9]\d{7,8}$/

BirthDate.create(date):
  - Throws "Invalid date" if NaN
  - Throws "Birth date cannot be in the future" if date > now

Account.reconstitute(id, props):
  - Calls setName -> PersonName.create (validates name)
  - Calls setEmail -> Email.create (validates email)
  - Calls setCpf -> CPF.create (validates cpf)
  - Calls BirthDate.create if birthDate !== null
  - Calls PhoneNumber.create if phone !== null
  - Calls new URL(photoUrl) if photoUrl !== null

AccountMapper.toDomain(raw: AccountModel):
  - Delegates entirely to Account.reconstitute — any validation failure propagates
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add reconstitute validation tests to Account entity spec</name>
  <files>src/account/domain/entities/account.entity.spec.ts</files>
  <behavior>
    - reconstitute throws when name is empty string
    - reconstitute throws when name is single word (e.g. "John")
    - reconstitute throws when email is invalid format (e.g. "not-an-email")
    - reconstitute throws when CPF has invalid checksum (e.g. "000.000.000-00") -- already exists, keep it
    - reconstitute throws when phone is invalid Brazilian number (e.g. "123")
    - reconstitute throws when birthDate is in the future
    - reconstitute throws when photoUrl is not a valid URL (e.g. "not-a-url")
    - reconstitute succeeds with all valid data (already exists, keep it)
    - reconstitute succeeds with null optional fields (already exists, keep it)
  </behavior>
  <action>
In `src/account/domain/entities/account.entity.spec.ts`, inside the existing `describe('reconstitute()')` block, add new test cases. The existing test "should validate fields (throws on invalid CPF)" already covers CPF -- keep it. Add the following new tests:

- "should throw on invalid name (empty)" -- empty string name
- "should throw on invalid name (single word)" -- e.g. "John"
- "should throw on invalid email" -- e.g. "not-an-email"
- "should throw on invalid phone" -- e.g. "123" (too short, invalid format)
- "should throw on future birthDate" -- date 1 year in the future
- "should throw on invalid photoUrl" -- e.g. "not-a-url"

Each test creates a base valid props object (name: 'John Doe', email: 'john@example.com', cpf: '529.982.247-25', birthDate: null, phone: null, photoUrl: null, createdAt: now, updatedAt: now) and overrides only the field under test with an invalid value. Use `expect(() => Account.reconstitute('some-id', {...})).toThrow()`.

Do NOT modify existing tests. Only add new ones inside the reconstitute describe block.
  </action>
  <verify>
    <automated>npx vitest run src/account/domain/entities/account.entity.spec.ts</automated>
  </verify>
  <done>All reconstitute validation tests pass. Every value object field (name, email, cpf, phone, birthDate, photoUrl) has at least one test proving reconstitute rejects invalid data.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Add integration tests to AccountMapper proving toDomain rejects corrupt DB rows</name>
  <files>src/account/infrastructure/mappers/account.mapper.spec.ts</files>
  <behavior>
    - toDomain throws when Prisma row has invalid name (empty string)
    - toDomain throws when Prisma row has invalid email (bad format)
    - toDomain throws when Prisma row has invalid CPF (bad checksum)
    - toDomain throws when Prisma row has invalid phone (bad format)
    - toDomain throws when Prisma row has future birthDate
    - toDomain throws when Prisma row has invalid photoUrl (not a URL)
    - toDomain succeeds with valid data (already exists, keep it)
  </behavior>
  <action>
In `src/account/infrastructure/mappers/account.mapper.spec.ts`, inside the existing `describe('toDomain')` block, add a new nested `describe('rejects inconsistent DB data')` block. These are integration tests: they prove the full mapper-to-domain reconstitution path validates data.

For each test, create a Prisma row object (simulating what the DB would return) with one invalid field:

- "should throw when DB row has empty name" -- raw.name = ''
- "should throw when DB row has single-word name" -- raw.name = 'John'
- "should throw when DB row has invalid email" -- raw.email = 'not-an-email'
- "should throw when DB row has invalid CPF" -- raw.cpf = '00000000000'
- "should throw when DB row has invalid phone" -- raw.phone = '123'
- "should throw when DB row has future birthDate" -- raw.birthDate = new Date(Date.now() + 365*24*60*60*1000)
- "should throw when DB row has invalid photoUrl" -- raw.photoUrl = 'not-a-url'

Each test: `expect(() => AccountMapper.toDomain(raw)).toThrow()`.

Use a helper function `validRow()` that returns a complete valid Prisma row, then spread-override the bad field: `AccountMapper.toDomain({ ...validRow(), name: '' })`.

Do NOT modify existing tests. Only add the new describe block.
  </action>
  <verify>
    <automated>npx vitest run src/account/infrastructure/mappers/account.mapper.spec.ts</automated>
  </verify>
  <done>All mapper integration tests pass. toDomain rejects every type of inconsistent DB data, proving that validation runs on reconstitution through the full mapper path.</done>
</task>

</tasks>

<verification>
npx vitest run src/account/domain/entities/account.entity.spec.ts src/account/infrastructure/mappers/account.mapper.spec.ts
</verification>

<success_criteria>
- At least 6 new test cases in account.entity.spec.ts (one per validated field on reconstitute)
- At least 7 new test cases in account.mapper.spec.ts (one per validated field via toDomain)
- All tests pass
- Each invalid field case (name, email, cpf, phone, birthDate, photoUrl) is covered in both test files
- No existing tests broken
</success_criteria>

<output>
After completion, create `.planning/quick/6-ao-reconstituir-dados-do-banco-de-dados-/6-SUMMARY.md`
</output>
