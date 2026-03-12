---
phase: quick-9
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - docker-compose.yml
  - docker/loki-config.yml
  - docker/promtail-config.yml
  - docker/grafana/provisioning/datasources/loki.yml
  - package.json
  - src/main.ts
  - src/app.module.ts
  - src/shared/infrastructure/logger/logger.module.ts
  - src/shared/infrastructure/logger/pino-http.config.ts
autonomous: true
requirements: [QUICK-9]

must_haves:
  truths:
    - "NestJS app outputs structured JSON logs via pino with HTTP request/response details"
    - "Grafana UI at localhost:3100 shows logs from Loki datasource"
    - "HTTP request logs flow from app through Promtail into Loki and are queryable in Grafana"
  artifacts:
    - path: "docker-compose.yml"
      provides: "Loki, Promtail, Grafana services alongside existing Postgres/MinIO"
      contains: "loki"
    - path: "src/shared/infrastructure/logger/logger.module.ts"
      provides: "NestJS LoggerModule wrapping nestjs-pino"
      exports: ["LoggerModule"]
    - path: "docker/loki-config.yml"
      provides: "Loki storage and schema config"
    - path: "docker/promtail-config.yml"
      provides: "Promtail scrape config for docker logs"
  key_links:
    - from: "src/main.ts"
      to: "nestjs-pino Logger"
      via: "app.useLogger(app.get(Logger))"
      pattern: "useLogger"
    - from: "docker/promtail-config.yml"
      to: "loki"
      via: "clients push URL"
      pattern: "http://loki:3100"
    - from: "docker/grafana/provisioning/datasources/loki.yml"
      to: "loki"
      via: "provisioned datasource URL"
      pattern: "http://loki:3100"
---

<objective>
Configure Grafana + Loki via Docker Compose and integrate pino-http structured logging into the NestJS application for real-time HTTP observability.

Purpose: Enable structured JSON logging with automatic HTTP request/response correlation, queryable through Grafana's Explore UI via Loki.
Output: Docker Compose stack with Loki+Promtail+Grafana, NestJS app using pino-http for structured logs.
</objective>

<execution_context>
@C:/Users/felip/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/felip/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@docker-compose.yml
@src/main.ts
@src/app.module.ts
@tsconfig.json
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add Loki, Promtail, and Grafana to Docker Compose</name>
  <files>docker-compose.yml, docker/loki-config.yml, docker/promtail-config.yml, docker/grafana/provisioning/datasources/loki.yml</files>
  <action>
1. Create `docker/loki-config.yml` with minimal Loki config:
   - auth_enabled: false
   - server http_listen_port: 3100
   - ingester lifecycle_alive with ring store inmemory, replication_factor 1
   - schema_config: v13 schema, from 2024-01-01, boltdb-shipper + filesystem store
   - storage_config: boltdb_shipper active_index_directory /loki/boltdb-shipper-active, cache_location /loki/boltdb-shipper-cache; filesystem directory /loki/chunks
   - compactor working_directory /loki/compactor
   - limits_config: reject_old_samples true, reject_old_samples_max_age 168h

2. Create `docker/promtail-config.yml`:
   - server http_listen_port: 9080
   - positions filename: /tmp/positions.yaml
   - clients: push to http://loki:3100/loki/api/v1/push
   - scrape_configs: job_name docker, docker_sd_configs host unix:///var/run/docker.sock refresh_interval 5s
   - relabel_configs: source_labels __meta_docker_container_name, target_label container

3. Create `docker/grafana/provisioning/datasources/loki.yml`:
   - apiVersion: 1
   - datasources: name Loki, type loki, access proxy, url http://loki:3100, isDefault true

4. Update `docker-compose.yml` adding three services AFTER existing services:

   loki:
     image: grafana/loki:3.4.2
     ports: ["3100:3100"]
     volumes: ["./docker/loki-config.yml:/etc/loki/config.yaml"]
     command: -config.file=/etc/loki/config.yaml
     volumes also: lokidata:/loki

   promtail:
     image: grafana/promtail:3.4.2
     volumes:
       - /var/run/docker.sock:/var/run/docker.sock:ro
       - ./docker/promtail-config.yml:/etc/promtail/config.yaml
     command: -config.file=/etc/promtail/config.yaml
     depends_on: [loki]

   grafana:
     image: grafana/grafana:11.5.2
     ports: ["3200:3000"]
     environment: GF_SECURITY_ADMIN_PASSWORD=admin, GF_AUTH_ANONYMOUS_ENABLED=true, GF_AUTH_ANONYMOUS_ORG_ROLE=Admin
     volumes:
       - ./docker/grafana/provisioning:/etc/grafana/provisioning
       - grafanadata:/var/lib/grafana
     depends_on: [loki]

   Add volumes: lokidata, grafanadata

   IMPORTANT: Use port 3200 for Grafana to avoid conflict with NestJS default port 3000.
  </action>
  <verify>
    <automated>docker compose config --quiet 2>&1 && echo "compose valid"</automated>
  </verify>
  <done>docker-compose.yml validates with loki, promtail, grafana services; config files exist in docker/ directory</done>
</task>

<task type="auto">
  <name>Task 2: Integrate nestjs-pino for structured HTTP logging</name>
  <files>package.json, src/shared/infrastructure/logger/logger.module.ts, src/shared/infrastructure/logger/pino-http.config.ts, src/main.ts, src/app.module.ts</files>
  <action>
1. Install dependencies:
   npm install nestjs-pino pino-http pino pino-pretty

2. Create `src/shared/infrastructure/logger/pino-http.config.ts`:
   Export a function `pinoHttpConfig()` returning PinoHttp config object:
   - pinoHttp.transport: in non-production (process.env.NODE_ENV !== 'production'), use target 'pino-pretty' with options colorize true, singleLine true, translateTime 'SYS:HH:MM:ss.l'. In production, no transport (raw JSON to stdout).
   - pinoHttp.level: process.env.LOG_LEVEL || 'info'
   - pinoHttp.autoLogging: true (logs all HTTP requests automatically)
   - pinoHttp.serializers: use pino-http default serializers (req, res, err)
   - pinoHttp.customProps: add context: 'HTTP' to each log
   - pinoHttp.redact: redact paths ['req.headers.authorization', 'req.headers.cookie'] to avoid leaking tokens

3. Create `src/shared/infrastructure/logger/logger.module.ts`:
   ```typescript
   import { Module } from '@nestjs/common';
   import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
   import { pinoHttpConfig } from './pino-http.config.js';

   @Module({
     imports: [PinoLoggerModule.forRoot(pinoHttpConfig())],
     exports: [PinoLoggerModule],
   })
   export class LoggerModule {}
   ```

4. Update `src/app.module.ts`:
   - Import LoggerModule from './shared/infrastructure/logger/logger.module.js'
   - Add LoggerModule to imports array (before other modules so logging is available early)

5. Update `src/main.ts`:
   - Import { Logger } from 'nestjs-pino'
   - After NestFactory.create, call: app.useLogger(app.get(Logger))
   - This replaces the default NestJS logger with pino for ALL framework logs

   The NestFactory.create call should use `bufferLogs: true`:
   `NestFactory.create(AppModule, { bufferLogs: true })`
   This buffers logs until pino logger is attached, preventing lost logs during startup.
  </action>
  <verify>
    <automated>cd C:/Users/felip/desktop/accounting/backend && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>TypeScript compiles clean; NestJS app uses pino-http for structured JSON logging with HTTP request auto-logging and sensitive header redaction</done>
</task>

<task type="auto">
  <name>Task 3: Verify end-to-end log pipeline</name>
  <files></files>
  <action>
1. Run `docker compose up -d loki grafana` to start observability stack.
2. Wait for services healthy (curl http://localhost:3100/ready, curl http://localhost:3200/api/health).
3. Start the NestJS app briefly with `npm run start` (or start:dev) in background, hit GET /health to generate a log line, then stop the app.
4. Verify structured JSON output appears in stdout with req/res fields.
5. Stop docker services with `docker compose down` (cleanup -- user will start manually when needed).

NOTE: Promtail requires Docker socket access which may not work on Windows Docker Desktop without WSL. If promtail fails, that is acceptable -- the core value is:
  a) Structured pino-http JSON logs from NestJS (works everywhere)
  b) Loki + Grafana stack ready for when running in Linux/WSL/CI

Document in SUMMARY if promtail has Windows-specific limitations.
  </action>
  <verify>
    <automated>cd C:/Users/felip/desktop/accounting/backend && docker compose config --quiet && npx tsc --noEmit && echo "all checks pass"</automated>
  </verify>
  <done>Docker Compose validates, TypeScript compiles, structured logging is integrated. Grafana accessible at localhost:3200 with Loki datasource pre-provisioned.</done>
</task>

</tasks>

<verification>
- `docker compose config` validates without errors
- `npx tsc --noEmit` compiles clean
- NestJS app starts and outputs JSON-structured logs with HTTP request details
- Grafana UI loads at http://localhost:3200 with Loki datasource configured
</verification>

<success_criteria>
- NestJS produces structured JSON logs via pino-http with request method, URL, status code, response time
- Sensitive headers (authorization, cookie) are redacted in logs
- Docker Compose includes Loki, Promtail, and Grafana services alongside existing Postgres/MinIO
- Grafana has Loki auto-provisioned as default datasource
- Dev mode uses pino-pretty for readable console output
</success_criteria>

<output>
After completion, create `.planning/quick/9-configurar-grafana-loki-via-docker-compo/9-SUMMARY.md`
</output>
