---
phase: quick-10
plan: 01
subsystem: logger
tags: [pino, nestjs-logger, observability, structured-logging]
dependency_graph:
  requires: [nestjs-pino, pino-pretty]
  provides: [global-pino-logger, process-level-error-capture]
  affects: [domain-exception-filter, main-bootstrap]
tech_stack:
  added: []
  patterns: [nestjs-logger-facade, process-level-handlers]
key_files:
  created:
    - src/shared/infrastructure/logger/pino.config.ts
    - src/account/interface/filters/domain-exception.filter.spec.ts
  modified:
    - src/shared/infrastructure/logger/logger.module.ts
    - src/account/interface/filters/domain-exception.filter.ts
    - src/main.ts
decisions:
  - Use NestJS Logger class (backed by pino via app.useLogger) instead of direct pino access
  - Process-level handlers use NestLogger which routes through pino after app.useLogger() call
metrics:
  duration: 147s
  completed: 2026-03-12T21:34:39Z
  tasks_completed: 3
  tasks_total: 3
  test_count: 5
---

# Quick Task 10: Refactor Pino to Global NestJS Logger Summary

Promoted pino from HTTP-only middleware logger to full global NestJS logger with process-level crash capture and structured error logging in DomainExceptionFilter.

## What Changed

### 1. Config Rename (pino-http.config.ts -> pino.config.ts)
Renamed the config file and export function from `pinoHttpConfig` to `pinoConfig` to reflect that pino is the global logger, not just HTTP middleware. The config shape is unchanged -- nestjs-pino uses `pinoHttp` as entry point but `app.useLogger()` makes it the global logger for all NestJS Logger calls.

### 2. DomainExceptionFilter Logger Migration
Replaced `console.error('Unhandled exception:', exception)` with `this.logger.error()` using a NestJS `Logger` instance. This ensures unhandled exceptions in the filter flow through pino as structured JSON instead of plain text to stdout.

### 3. Process-Level Crash Handlers
Added `process.on('uncaughtException')` and `process.on('unhandledRejection')` handlers in `main.ts` after `app.useLogger()`. These use NestJS Logger (backed by pino) to capture crashes that bypass NestJS exception filters.

### 4. Test Coverage
Added 5 tests for DomainExceptionFilter verifying:
- Unhandled exceptions trigger `logger.error` with stack trace
- Domain exceptions do NOT trigger logger.error
- HTTP exceptions do NOT trigger logger.error
- Non-Error values are stringified before logging

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- TypeScript compiles cleanly (`npx tsc --noEmit`)
- All 185 tests pass across 23 test files
- No `console.error` or `console.log` calls remain in production code
- pino-http still active with `autoLogging: true` for HTTP request logging

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | 2ab059c | refactor(quick-10): rename pino-http.config.ts to pino.config.ts |
| 2 | 95dfa0c | fix(quick-10): replace console.error with NestJS Logger and add process handlers |
| 3 | 8974f2b | test(quick-10): add DomainExceptionFilter logging behavior tests |
