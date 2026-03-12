---
phase: quick
plan: 7
type: execute
wave: 1
depends_on: []
files_modified:
  - .env
  - .env.example
  - docker-compose.yml
  - src/account/application/commands/upload-account-photo.command.ts
  - src/account/application/commands/upload-account-photo.command.spec.ts
  - src/account/infrastructure/adapters/s3-storage.adapter.spec.ts
  - test/accounts.e2e-spec.ts
autonomous: true
requirements: []
must_haves:
  truths:
    - "S3 bucket is named 'account' instead of 'account-photos'"
    - "Photo upload key follows companies/{companyId}/accounts/{accountId}/photo hierarchy"
    - "All tests pass with updated bucket name and key structure"
  artifacts:
    - path: ".env"
      provides: "S3_BUCKET=account"
      contains: "S3_BUCKET=account"
    - path: "docker-compose.yml"
      provides: "MinIO init creates 'account' bucket"
      contains: "local/account"
    - path: "src/account/application/commands/upload-account-photo.command.ts"
      provides: "New key topology with companyId TODO"
      contains: "companies/"
  key_links: []
---

<objective>
Restructure S3 bucket topology from `account-photos` to `account` and update key paths to follow a `companies/{companyId}/accounts/{accountId}/photo` hierarchy in preparation for multi-company support.

Purpose: Align storage structure with the upcoming company entity hierarchy so photo paths are organized under companies from the start.
Output: Updated config, docker-compose, upload command, and all related tests.
</objective>

<execution_context>
@C:/Users/felip/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/felip/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.env.example
@docker-compose.yml
@src/account/application/commands/upload-account-photo.command.ts
@src/account/application/commands/upload-account-photo.command.spec.ts
@src/account/infrastructure/adapters/s3-storage.adapter.spec.ts
@test/accounts.e2e-spec.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update bucket name in config and docker-compose</name>
  <files>.env, .env.example, docker-compose.yml</files>
  <action>
1. In `.env` and `.env.example`: change `S3_BUCKET=account-photos` to `S3_BUCKET=account`.

2. In `docker-compose.yml` minio-init entrypoint: replace all occurrences of `account-photos` with `account`:
   - `mc mb --ignore-existing local/account;`
   - `mc anonymous set download local/account;`
   - `echo 'Bucket account is now public (download)';`

No changes needed to `env.validation.ts` (it validates S3_BUCKET as string, no hardcoded value).
No changes needed to `health.controller.ts` (it reads bucket name from config, no hardcoded value).
  </action>
  <verify>
    <automated>grep -c "account-photos" .env .env.example docker-compose.yml 2>/dev/null | grep -v ":0$" | wc -l</automated>
  </verify>
  <done>Zero occurrences of "account-photos" in .env, .env.example, and docker-compose.yml. All three files reference bucket name "account".</done>
</task>

<task type="auto">
  <name>Task 2: Update upload command key topology and all tests</name>
  <files>src/account/application/commands/upload-account-photo.command.ts, src/account/application/commands/upload-account-photo.command.spec.ts, src/account/infrastructure/adapters/s3-storage.adapter.spec.ts, test/accounts.e2e-spec.ts</files>
  <action>
**upload-account-photo.command.ts:**
- The Account entity has NO companyId field yet. Add a TODO placeholder constant at the top of the execute method:
  ```
  // TODO: Replace hardcoded companyId once Company entity is created and Account has a company relation
  const companyId = 'default';
  ```
- Change both key references (upload key and delete old key) from:
  `accounts/${account.id}/photo`
  to:
  `companies/${companyId}/accounts/${account.id}/photo`

**upload-account-photo.command.spec.ts:**
- Update the `PHOTO_URL` constant to use the new path structure: `'https://s3.example.com/companies/default/accounts/some-id/photo'`
- Update the test "should delete old photo before uploading" to expect the new key format: `companies/default/accounts/${account.id}/photo`
- Update the test "should call StoragePort.upload with correct key" to expect: `companies/default/accounts/${account.id}/photo`

**s3-storage.adapter.spec.ts:**
- Change `S3_BUCKET: 'account-photos'` to `S3_BUCKET: 'account'` in the mock config.
- Update the upload test assertion from `Bucket: 'account-photos'` to `Bucket: 'account'`.
- Update the URL assertion from `'http://localhost:9000/account-photos/photos/test.jpg'` to `'http://localhost:9000/account/photos/test.jpg'`.
- Update the delete test assertion from `Bucket: 'account-photos'` to `Bucket: 'account'`.

**test/accounts.e2e-spec.ts:**
- Change line 28: `const S3_BUCKET = process.env.S3_BUCKET ?? 'account-photos';` to `const S3_BUCKET = process.env.S3_BUCKET ?? 'account';`
- Around line 603: change `expect(res.body.data.photoUrl).toContain('account-photos');` to `expect(res.body.data.photoUrl).toContain('account');`
- Around line 612: change `const s3Key = \`accounts/${'{'}created.data.id{'}'}/photo\`;` to `const s3Key = \`companies/default/accounts/${'{'}created.data.id{'}'}/photo\`;` (uses 'default' to match the TODO placeholder)
  </action>
  <verify>
    <automated>cd C:/Users/felip/desktop/accounting/backend && npx vitest run --reporter=verbose src/account/application/commands/upload-account-photo.command.spec.ts src/account/infrastructure/adapters/s3-storage.adapter.spec.ts 2>&1 | tail -20</automated>
  </verify>
  <done>All unit tests pass. No remaining references to "account-photos" in source or test files (except planning docs). Key topology uses companies/{companyId}/accounts/{accountId}/photo pattern with TODO for real companyId.</done>
</task>

</tasks>

<verification>
1. `grep -rn "account-photos" src/ test/ .env .env.example docker-compose.yml` returns zero matches
2. `npx vitest run` -- all unit tests pass
3. Upload command uses `companies/${companyId}/accounts/${account.id}/photo` key format
4. TODO comment exists in upload command for future companyId wiring
</verification>

<success_criteria>
- Bucket name changed from "account-photos" to "account" in all config and infrastructure files
- S3 key topology changed to companies/{companyId}/accounts/{accountId}/photo
- Placeholder companyId='default' with TODO comment for future company entity integration
- All unit tests pass with updated expectations
- E2E test references updated (will pass when run against updated MinIO)
</success_criteria>

<output>
After completion, create `.planning/quick/7-restructure-s3-bucket-topology-from-acco/7-SUMMARY.md`
</output>
