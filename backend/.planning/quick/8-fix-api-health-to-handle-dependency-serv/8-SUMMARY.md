---
phase: quick-8
plan: 1
subsystem: health
tags: [health-check, resilience, error-handling]
dependency-graph:
  requires: [prisma-service, s3-client, terminus]
  provides: [graceful-health-endpoint]
  affects: [health-controller]
tech-stack:
  added: []
  patterns: [try-catch-per-indicator, HealthCheckError-throw]
key-files:
  created:
    - src/shared/infrastructure/health/health.controller.spec.ts
  modified:
    - src/shared/infrastructure/health/health.controller.ts
decisions:
  - Used HealthCheckError throw pattern instead of returning status down (Terminus requires throw for 503)
metrics:
  duration: 92s
  completed: "2026-03-12T20:58:37Z"
---

# Quick Task 8: Fix API Health to Handle Dependency Service Outages

Wrapped each health indicator in try/catch throwing HealthCheckError so Terminus returns structured 503 with per-service status instead of crashing on dependency failures.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add failing tests for health controller (TDD RED) | 9c27028 | health.controller.spec.ts |
| 2 | Add try/catch to each health indicator (TDD GREEN) | 8e994f1 | health.controller.ts |

## What Changed

### health.controller.ts
- Added `HealthCheckError` import from `@nestjs/terminus`
- Wrapped database indicator (`$queryRaw`) in try/catch; on failure throws `HealthCheckError` with `{ database: { status: 'down', message } }`
- Wrapped storage indicator (`HeadBucketCommand`) in try/catch; on failure throws `HealthCheckError` with `{ storage: { status: 'down', message } }`

### health.controller.spec.ts (new)
- 4 test cases using NestJS TestingModule with TerminusModule
- All-up scenario: verifies 200 with both services "up"
- DB-down scenario: verifies 503 with database "down" + error message, storage "up"
- S3-down scenario: verifies 503 with storage "down" + error message, database "up"
- Both-down scenario: verifies 503 with both services "down" + error messages

## Decisions Made

1. **HealthCheckError throw pattern**: Terminus only triggers 503 when an indicator throws, not when it returns `{ status: 'down' }`. Used `HealthCheckError` from `@nestjs/terminus` to ensure proper 503 responses with structured per-service status.

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- All 4 health controller tests pass
- Full test suite: 180/180 tests pass, zero regressions
