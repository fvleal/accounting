---
phase: quick-13
plan: 01
subsystem: account/infrastructure
tags: [s3, storage, docker, env-config]
dependency_graph:
  requires: []
  provides: [S3_PUBLIC_URL-env-var, public-facing-photo-urls]
  affects: [s3-storage.adapter, env.validation, docker-compose]
tech_stack:
  added: []
  patterns: [separate-internal-vs-public-url]
key_files:
  created: []
  modified:
    - src/account/infrastructure/adapters/s3-storage.adapter.ts
    - src/account/infrastructure/adapters/s3-storage.adapter.spec.ts
    - src/shared/infrastructure/config/env.validation.ts
    - docker-compose.yml
    - .env.example
    - .env
decisions:
  - S3_PUBLIC_URL is optional and falls back to S3_ENDPOINT for backward compatibility
metrics:
  duration: 98s
  completed: 2026-03-13T00:32:00Z
  tasks_completed: 2
  tasks_total: 2
  test_count: 186
  test_pass: 186
---

# Quick Task 13: Fix S3 Public URL for Photo Storage Summary

Separate S3_PUBLIC_URL from S3_ENDPOINT so photo URLs saved to the database use the publicly accessible address instead of Docker-internal hostname.

## What Changed

### Task 1: Add S3_PUBLIC_URL env var and update S3StorageAdapter (999d620)

- Added `S3_PUBLIC_URL` optional env var to `env.validation.ts`
- Added `publicUrl` field to `S3StorageAdapter` that reads `S3_PUBLIC_URL` with fallback to `S3_ENDPOINT`
- Changed `upload()` return URL from `this.endpoint` to `this.publicUrl`
- S3Client connection still uses `this.endpoint` (internal Docker hostname)
- Added `S3_PUBLIC_URL=http://localhost:9000` to `docker-compose.yml`, `.env.example`, and `.env`

### Task 2: Update S3StorageAdapter tests for S3_PUBLIC_URL (943d051)

- Updated mock config factory to accept overrides and include `S3_PUBLIC_URL=http://cdn.example.com`
- Updated existing URL test to verify it uses `S3_PUBLIC_URL` (not `S3_ENDPOINT`)
- Added fallback test: when `S3_PUBLIC_URL` is undefined, URL uses `S3_ENDPOINT`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Skipped .env from git commit**
- **Found during:** Task 1
- **Issue:** `.env` is in `.gitignore`, cannot be staged
- **Fix:** Committed all other files; `.env` updated locally but not committed (correct behavior)
- **Files modified:** .env (local only)

## Verification

- All 186 tests pass (23 test files)
- S3 adapter spec: 4 tests pass (was 3, added fallback test)
- docker-compose.yml has both `S3_ENDPOINT: http://minio:9000` and `S3_PUBLIC_URL: http://localhost:9000`
- `upload()` returns URL built with `S3_PUBLIC_URL`

## Self-Check: PASSED
