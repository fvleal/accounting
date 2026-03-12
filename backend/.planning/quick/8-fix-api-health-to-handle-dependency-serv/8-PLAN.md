---
phase: quick-8
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/shared/infrastructure/health/health.controller.ts
  - src/shared/infrastructure/health/health.controller.spec.ts
autonomous: true
requirements: [HEALTH-01]
must_haves:
  truths:
    - "Health endpoint returns 200 with per-service status when all services are up"
    - "Health endpoint returns 503 with per-service status when database is down (not an unhandled crash)"
    - "Health endpoint returns 503 with per-service status when S3 is down (not an unhandled crash)"
    - "Health endpoint returns 503 with all services down without crashing the process"
  artifacts:
    - path: "src/shared/infrastructure/health/health.controller.ts"
      provides: "Graceful health check with try/catch per indicator"
    - path: "src/shared/infrastructure/health/health.controller.spec.ts"
      provides: "Unit tests covering up/down scenarios for each dependency"
  key_links:
    - from: "health.controller.ts"
      to: "PrismaService"
      via: "try/catch around $queryRaw"
    - from: "health.controller.ts"
      to: "S3Client"
      via: "try/catch around HeadBucketCommand"
---

<objective>
Fix the API health endpoint to handle dependency service outages gracefully.

Purpose: Currently, when Docker or dependent services (database, S3) are down, the health
endpoint's indicator functions throw unhandled errors that propagate through Terminus and can
cause unclear 500 errors or crash behavior. Each indicator needs its own try/catch so that
Terminus receives a proper "down" status per service, returning a structured 503 response
instead of crashing.

Output: Resilient health controller with unit tests proving graceful degradation.
</objective>

<execution_context>
@C:/Users/felip/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/felip/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/shared/infrastructure/health/health.controller.ts
@src/shared/infrastructure/health/health.module.ts
@src/shared/infrastructure/prisma/prisma.service.ts
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add unit tests for health controller covering up/down scenarios</name>
  <files>src/shared/infrastructure/health/health.controller.spec.ts</files>
  <behavior>
    - Test 1: When both database and S3 are healthy, returns status "ok" with database: "up" and storage: "up"
    - Test 2: When database throws (connection refused), returns status "error" with database: "down" (includes error message) and storage: "up" — response is 503 via Terminus
    - Test 3: When S3 throws (connection refused), returns status "error" with database: "up" and storage: "down" (includes error message) — response is 503 via Terminus
    - Test 4: When both database and S3 throw, returns status "error" with both "down" — response is 503 via Terminus
  </behavior>
  <action>
    Create `health.controller.spec.ts` using vitest (import { describe, it, expect, vi } from 'vitest').

    Mock dependencies:
    - PrismaService: mock `$queryRaw` — resolve for up, reject with Error('Connection refused') for down
    - S3Client: mock `send` method — resolve for up, reject with Error('Connection refused') for down
    - ConfigService: mock `get` to return dummy values for S3_BUCKET, S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY
    - HealthCheckService: use the REAL `HealthCheckService` from `@nestjs/terminus` (it orchestrates the indicators and throws ServiceUnavailableException on failure)

    For the "down" test cases, the `health.check()` call will throw a `ServiceUnavailableException`. Catch it and assert on `exception.getResponse()` to verify the per-service status details.

    Use `@nestjs/testing` `Test.createTestingModule` to wire HealthCheckService properly (it needs the Terminus module). Override PrismaService and ConfigService with mocks. Construct S3Client mock via vi.fn().

    These tests should FAIL initially since the current controller does not wrap indicators in try/catch — when a service is down, the raw error propagates and Terminus marks the entire check as errored without the structured per-service "down" status we want.
  </action>
  <verify>
    <automated>cd C:/Users/felip/desktop/accounting/backend && npx vitest run src/shared/infrastructure/health/health.controller.spec.ts</automated>
  </verify>
  <done>Test file exists with 4 test cases. "All up" test passes; at least one "down" test fails (proving the fix is needed).</done>
</task>

<task type="auto">
  <name>Task 2: Add try/catch to each health indicator for graceful degradation</name>
  <files>src/shared/infrastructure/health/health.controller.ts</files>
  <action>
    Modify the `check()` method in `HealthController`. Wrap each indicator function in a try/catch:

    For the database indicator:
    ```typescript
    async (): Promise<HealthIndicatorResult> => {
      try {
        await this.prisma.$queryRaw`SELECT 1`;
        return { database: { status: 'up' } };
      } catch (error) {
        return { database: { status: 'down', message: error instanceof Error ? error.message : String(error) } };
      }
    },
    ```

    For the storage indicator:
    ```typescript
    async (): Promise<HealthIndicatorResult> => {
      try {
        await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
        return { storage: { status: 'up' } };
      } catch (error) {
        return { storage: { status: 'down', message: error instanceof Error ? error.message : String(error) } };
      }
    },
    ```

    IMPORTANT: When an indicator returns `{ status: 'down' }`, Terminus `HealthCheckService.check()` does NOT automatically treat it as a failure — Terminus only fails if the indicator THROWS. So we need a different approach:

    Instead of returning `{ status: 'down' }` in the catch block, we should THROW a `HealthCheckError` (from `@nestjs/terminus`) with the accumulated results so Terminus properly returns 503. The simplest correct approach:

    Wrap each indicator so that on catch, it throws via Terminus's built-in mechanism. Use the pattern:
    ```typescript
    catch (error) {
      throw new HealthCheckError('database check failed', {
        database: { status: 'down', message: error instanceof Error ? error.message : String(error) },
      });
    }
    ```

    This way Terminus returns 503 with the structured response showing which services are down vs up.

    Keep all existing imports. Add `HealthCheckError` to the `@nestjs/terminus` import.
  </action>
  <verify>
    <automated>cd C:/Users/felip/desktop/accounting/backend && npx vitest run src/shared/infrastructure/health/health.controller.spec.ts</automated>
  </verify>
  <done>All 4 test cases pass. Health endpoint returns structured per-service status for both healthy and unhealthy scenarios without crashing.</done>
</task>

</tasks>

<verification>
- `npx vitest run src/shared/infrastructure/health/health.controller.spec.ts` — all tests pass
- `npx vitest run` — no regressions in existing tests
- Manual: with services up, `curl http://localhost:3000/health` returns 200 with `{"status":"ok","info":{"database":{"status":"up"},"storage":{"status":"up"}}}`
- Manual: with database stopped, `curl http://localhost:3000/health` returns 503 with structured JSON showing database down, no crash
</verification>

<success_criteria>
- Health endpoint returns 200 with per-service status when all dependencies are up
- Health endpoint returns 503 with structured per-service status (not a crash) when any dependency is down
- Unit tests cover all combinations (all up, db down, s3 down, both down)
- No regressions in existing test suite
</success_criteria>

<output>
After completion, create `.planning/quick/8-fix-api-health-to-handle-dependency-serv/8-SUMMARY.md`
</output>
