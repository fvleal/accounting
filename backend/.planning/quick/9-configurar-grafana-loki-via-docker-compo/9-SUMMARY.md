---
phase: quick-9
plan: 1
subsystem: observability
tags: [logging, grafana, loki, pino, docker]
dependency_graph:
  requires: [docker-compose.yml, app.module.ts, main.ts]
  provides: [structured-logging, grafana-loki-stack]
  affects: [all-http-endpoints]
tech_stack:
  added: [nestjs-pino, pino-http, pino, pino-pretty, grafana, loki, promtail]
  patterns: [structured-json-logging, log-aggregation, pino-http-middleware]
key_files:
  created:
    - docker/loki-config.yml
    - docker/promtail-config.yml
    - docker/grafana/provisioning/datasources/loki.yml
    - src/shared/infrastructure/logger/logger.module.ts
    - src/shared/infrastructure/logger/pino-http.config.ts
  modified:
    - docker-compose.yml
    - package.json
    - src/app.module.ts
    - src/main.ts
decisions:
  - "Grafana on port 3200 to avoid conflict with NestJS on 3000"
  - "pino-pretty in dev mode, raw JSON in production"
  - "Redact authorization and cookie headers from all logs"
metrics:
  duration: 120s
  completed: "2026-03-12T21:23:36Z"
---

# Quick Task 9: Configure Grafana + Loki via Docker Compose with Structured Logging

Grafana/Loki/Promtail observability stack in Docker Compose with nestjs-pino structured HTTP logging using pino-pretty for dev and JSON for production, with sensitive header redaction.

## Tasks Completed

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Add Loki, Promtail, and Grafana to Docker Compose | ea61676 | docker-compose.yml, docker/loki-config.yml, docker/promtail-config.yml, docker/grafana/provisioning/datasources/loki.yml |
| 2 | Integrate nestjs-pino for structured HTTP logging | 6512b09 | src/shared/infrastructure/logger/logger.module.ts, src/shared/infrastructure/logger/pino-http.config.ts, src/app.module.ts, src/main.ts |
| 3 | Verify end-to-end log pipeline | (verification only) | -- |

## What Was Built

### Docker Observability Stack

- **Loki** (grafana/loki:3.4.2): Log aggregation service on port 3100, using boltdb-shipper + filesystem storage with v13 schema
- **Promtail** (grafana/promtail:3.4.2): Docker log scraper, forwards container logs to Loki via Docker socket
- **Grafana** (grafana/grafana:11.5.2): Visualization UI on port 3200, anonymous admin access enabled, Loki auto-provisioned as default datasource

### Structured Logging Integration

- **LoggerModule**: NestJS module wrapping nestjs-pino, imported first in AppModule for early availability
- **pino-http config**: Structured JSON logs for all HTTP requests with auto-logging, custom `context: 'HTTP'` property, and sensitive header redaction (`authorization`, `cookie`)
- **main.ts**: Buffered logs during startup (`bufferLogs: true`), pino logger attached via `app.useLogger(app.get(Logger))`
- **Dev mode**: pino-pretty with colorized single-line output and translated timestamps
- **Production mode**: Raw JSON to stdout for machine parsing

## Decisions Made

1. **Grafana port 3200** -- avoids conflict with NestJS default port 3000
2. **pino-pretty in dev only** -- readable logs during development, machine-parseable JSON in production
3. **Header redaction** -- authorization and cookie headers redacted from all HTTP logs to prevent token leakage

## Deviations from Plan

None -- plan executed exactly as written.

## Notes

- Promtail requires Docker socket access (`/var/run/docker.sock`), which may not work on Windows Docker Desktop without WSL. The core value (structured pino-http JSON logs) works everywhere; Loki+Grafana stack is ready for Linux/WSL/CI environments.
- `docker compose config` validates successfully with all new services.
- TypeScript compiles clean with no errors.
