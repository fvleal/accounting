---
phase: quick-11
plan: 01
subsystem: logging
tags: [pino-loki, logging, docker, observability]
dependency_graph:
  requires: [quick-9, quick-10]
  provides: [direct-loki-shipping]
  affects: [docker-compose, pino-config]
tech_stack:
  added: [pino-loki]
  patterns: [pino-transport-targets, multistream-logging]
key_files:
  created: []
  modified:
    - src/shared/infrastructure/logger/pino.config.ts
    - docker-compose.yml
    - docker/loki-config.yml
    - .env.example
    - package.json
  deleted:
    - docker/promtail-config.yml
decisions:
  - Use pino transport.targets array (not pino.multistream) for nestjs-pino compatibility
  - Batch logs with 2s interval to reduce HTTP overhead to Loki
metrics:
  duration: 164s
  completed: "2026-03-12T22:00:00Z"
  tasks_completed: 3
  tasks_total: 3
---

# Quick Task 11: Replace Promtail with pino-loki Transport Summary

Direct HTTP log shipping from NestJS to Loki via pino-loki transport, eliminating the Promtail sidecar container entirely.

## Task Completion

| Task | Name | Commit | Key Changes |
|------|------|--------|-------------|
| 1 | Install pino-loki and reconfigure pino transports | 673e950 | pino-loki installed, transport.targets array with dev/prod configs |
| 2 | Remove Promtail from docker-compose and delete config | 9e64c01 | promtail service removed, config deleted, loki/postgres fixes included |
| 3 | Smoke test -- app starts and logs reach Loki | (verification only) | Loki query {app="accounting-backend"} returns structured log entries |

## What Changed

### pino.config.ts
Rewrote from single pino-pretty transport to multistream `transport.targets` array:
- **Development:** pino-pretty (colorized console) + pino-loki (HTTP to Loki)
- **Production:** pino-loki only
- Labels: `app=accounting-backend`, `env=development|production`
- Batching enabled with 2-second interval

### docker-compose.yml
- Removed promtail service (image, volumes, command, depends_on)
- Also included pending fixes: postgres image 17->15, loki-config tsdb+WAL path

### Deleted
- `docker/promtail-config.yml` -- no longer needed

## Deviations from Plan

### Included Pending Infrastructure Fixes
**[Rule 3 - Blocking] Committed docker-compose.yml and loki-config.yml fixes from previous session**
- **Found during:** Task 2
- **Issue:** docker-compose.yml had postgres:15 fix and loki-config.yml had tsdb/WAL fixes that were uncommitted
- **Fix:** Included in Task 2 commit alongside promtail removal
- **Files modified:** docker-compose.yml, docker/loki-config.yml

## Verification Results

- `npm ls pino-loki` -- installed
- TypeScript compiles without errors
- `docker compose config` validates
- `docker/promtail-config.yml` does not exist
- Loki query `{app="accounting-backend"}` returns structured JSON log entries
- No promtail container running

## Self-Check: PASSED

All files exist, deleted file confirmed removed, all commit hashes verified.
