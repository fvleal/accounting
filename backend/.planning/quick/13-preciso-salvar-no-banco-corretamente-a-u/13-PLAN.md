---
phase: quick-13
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/account/infrastructure/adapters/s3-storage.adapter.ts
  - src/account/infrastructure/adapters/s3-storage.adapter.spec.ts
  - src/shared/infrastructure/config/env.validation.ts
  - docker-compose.yml
  - .env.example
  - .env
autonomous: true
requirements: [QUICK-13]

must_haves:
  truths:
    - "Photo URLs saved in the database use the public/external URL, not the internal Docker hostname"
    - "S3 client still connects to MinIO using internal endpoint (minio:9000 in Docker)"
    - "Local dev (no Docker) continues to work with S3_ENDPOINT=http://localhost:9000"
  artifacts:
    - path: "src/account/infrastructure/adapters/s3-storage.adapter.ts"
      provides: "Uses S3_PUBLIC_URL for constructing returned URLs, S3_ENDPOINT for S3 client connection"
    - path: "docker-compose.yml"
      provides: "S3_PUBLIC_URL=http://localhost:9000 in backend service environment"
  key_links:
    - from: "s3-storage.adapter.ts upload()"
      to: "database photoUrl field"
      via: "returns URL built with S3_PUBLIC_URL instead of S3_ENDPOINT"
      pattern: "this\\.publicUrl"
---

<objective>
Fix the S3 storage adapter to use a separate public URL for constructing photo URLs saved to the database.

Purpose: The current implementation uses S3_ENDPOINT (the internal Docker hostname `http://minio:9000`) to build photo URLs. When running in Docker, the frontend receives URLs like `http://minio:9000/...` which are not accessible from the browser. The S3 client needs the internal endpoint to connect, but the returned URL must use the public/external address.

Output: S3StorageAdapter uses a new `S3_PUBLIC_URL` env var (falls back to `S3_ENDPOINT`) for building public-facing URLs while keeping `S3_ENDPOINT` for the S3 client connection.
</objective>

<execution_context>
@C:/Users/felip/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/felip/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

<interfaces>
From src/account/domain/ports/storage.port.ts:
```typescript
export interface StoragePort {
  upload(key: string, buffer: Buffer, contentType: string): Promise<string>;
  delete(key: string): Promise<void>;
}
```

From src/account/infrastructure/adapters/s3-storage.adapter.ts (current, line 45):
```typescript
// BUG: uses this.endpoint (S3_ENDPOINT = http://minio:9000 in Docker)
return `${this.endpoint}/${this.bucket}/${key}`;
```

From docker-compose.yml (current backend env):
```yaml
S3_ENDPOINT: http://minio:9000   # internal Docker hostname
```

From .env (local dev):
```
S3_ENDPOINT=http://localhost:9000
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add S3_PUBLIC_URL env var and update S3StorageAdapter</name>
  <files>
    src/account/infrastructure/adapters/s3-storage.adapter.ts,
    src/shared/infrastructure/config/env.validation.ts,
    .env.example,
    .env,
    docker-compose.yml
  </files>
  <action>
1. In `env.validation.ts`: Add `S3_PUBLIC_URL: Joi.string().optional()` to the schema (optional -- falls back to S3_ENDPOINT).

2. In `s3-storage.adapter.ts`:
   - Add a new private field `private readonly publicUrl: string;`
   - In constructor, set: `this.publicUrl = this.configService.get<string>('S3_PUBLIC_URL') || this.endpoint;`
   - On line 45, change the return from `${this.endpoint}` to `${this.publicUrl}`:
     ```typescript
     return `${this.publicUrl}/${this.bucket}/${key}`;
     ```
   - The S3Client must still use `this.endpoint` for its connection (no change there).

3. In `docker-compose.yml`: Add `S3_PUBLIC_URL: http://localhost:9000` to the backend service environment block (after `S3_ENDPOINT`).

4. In `.env.example` and `.env`: Add comment and variable:
   ```
   S3_PUBLIC_URL=http://localhost:9000
   ```
   Place it after the S3_ENDPOINT line. Add a comment: `# Public URL for S3 (used in URLs returned to clients, defaults to S3_ENDPOINT)`.
  </action>
  <verify>
    <automated>cd C:/Users/felip/Desktop/accounting/backend && npx vitest run src/account/infrastructure/adapters/s3-storage.adapter.spec.ts 2>&1 | tail -20</automated>
  </verify>
  <done>S3StorageAdapter builds public URLs using S3_PUBLIC_URL, S3 client connects using S3_ENDPOINT. docker-compose.yml has S3_PUBLIC_URL=http://localhost:9000.</done>
</task>

<task type="auto">
  <name>Task 2: Update S3StorageAdapter tests for S3_PUBLIC_URL</name>
  <files>src/account/infrastructure/adapters/s3-storage.adapter.spec.ts</files>
  <action>
1. Update `createMockConfigService` to include `S3_PUBLIC_URL` in the config map, set to `http://cdn.example.com` (a different value from S3_ENDPOINT to prove the distinction).

2. Update the existing test "should return constructed URL" to expect the URL built with S3_PUBLIC_URL:
   ```typescript
   expect(url).toBe('http://cdn.example.com/account/photos/test.jpg');
   ```

3. Add a new test: "should fall back to S3_ENDPOINT when S3_PUBLIC_URL is not set":
   - Create a config service without S3_PUBLIC_URL (return undefined for that key)
   - Instantiate a new adapter with that config
   - Mock s3Client.send
   - Call upload and assert the URL uses S3_ENDPOINT (`http://localhost:9000/account/photos/test.jpg`)
  </action>
  <verify>
    <automated>cd C:/Users/felip/Desktop/accounting/backend && npx vitest run src/account/infrastructure/adapters/s3-storage.adapter.spec.ts 2>&1 | tail -20</automated>
  </verify>
  <done>Tests pass covering both S3_PUBLIC_URL present and fallback-to-S3_ENDPOINT scenarios. URL returned by upload() is proven to use the public URL, not the internal endpoint.</done>
</task>

</tasks>

<verification>
- `npx vitest run` -- all tests pass
- In docker-compose.yml, backend has both `S3_ENDPOINT: http://minio:9000` and `S3_PUBLIC_URL: http://localhost:9000`
- S3StorageAdapter.upload() returns URL starting with `S3_PUBLIC_URL` value
</verification>

<success_criteria>
- Photo URLs saved to database use the publicly accessible URL (http://localhost:9000/...) instead of the Docker-internal URL (http://minio:9000/...)
- S3 client connection still works via internal endpoint
- All existing tests pass, new fallback test added
</success_criteria>

<output>
After completion, create `.planning/quick/13-preciso-salvar-no-banco-corretamente-a-u/13-SUMMARY.md`
</output>
