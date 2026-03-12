---
phase: quick-11
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/shared/infrastructure/logger/pino.config.ts
  - docker-compose.yml
  - docker/promtail-config.yml
  - .env
  - .env.example
  - package.json
autonomous: true
requirements: [QUICK-11]
must_haves:
  truths:
    - "App sends logs directly to Loki via HTTP (no Promtail middleman)"
    - "Dev mode shows pretty-printed logs in console AND sends to Loki"
    - "Production mode sends only to Loki (no pino-pretty)"
    - "Promtail container no longer exists in docker-compose"
  artifacts:
    - path: "src/shared/infrastructure/logger/pino.config.ts"
      provides: "Multistream pino config with pino-loki transport"
    - path: "docker-compose.yml"
      provides: "Compose without promtail service"
  key_links:
    - from: "pino.config.ts"
      to: "Loki HTTP endpoint"
      via: "pino-loki transport targeting localhost:3100"
      pattern: "pino-loki|loki"
---

<objective>
Replace Promtail with pino-loki transport so the NestJS app sends structured JSON logs directly to Loki via HTTP, eliminating the Promtail sidecar.

Purpose: Simplify the logging pipeline -- no Docker socket scraping, no Promtail config, direct structured push from app to Loki.
Output: Updated pino config with pino-loki transport, cleaned docker-compose, deleted promtail config.
</objective>

<execution_context>
@C:/Users/felip/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/felip/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/shared/infrastructure/logger/pino.config.ts
@src/shared/infrastructure/logger/logger.module.ts
@docker-compose.yml
@docker/promtail-config.yml
@.env
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install pino-loki and reconfigure pino transports</name>
  <files>package.json, src/shared/infrastructure/logger/pino.config.ts, .env, .env.example</files>
  <action>
1. Install pino-loki:
   ```
   npm install pino-loki
   ```

2. Add `LOKI_URL` to `.env` and `.env.example`:
   ```
   LOKI_URL=http://localhost:3100
   ```

3. Rewrite `src/shared/infrastructure/logger/pino.config.ts` to use pino multistream transport:

   - Import `Params` from `nestjs-pino` (keep existing import style).
   - Read `LOKI_URL` from `process.env` (default to `http://localhost:3100`).
   - Read `NODE_ENV` and `LOG_LEVEL` as before.
   - Configure `pinoHttp` with `transport.targets` array (pino transport pipeline):

   **Development (NODE_ENV !== 'production'):**
   - Target 1: `pino-pretty` with `{ colorize: true, singleLine: true, translateTime: 'SYS:HH:MM:ss.l' }` -- level: same as LOG_LEVEL or `info`
   - Target 2: `pino-loki` with `{ host: LOKI_URL, batching: true, interval: 2, labels: { app: 'accounting-backend', env: 'development' } }` -- level: same

   **Production (NODE_ENV === 'production'):**
   - Single target: `pino-loki` with `{ host: LOKI_URL, batching: true, interval: 2, labels: { app: 'accounting-backend', env: 'production' } }`

   Use the pino `transport.targets` array syntax (NOT `pino.multistream`). This is the correct approach for nestjs-pino which expects `transport` config. Example structure:

   ```typescript
   transport: {
     targets: [
       { target: 'pino-pretty', options: { ... }, level },
       { target: 'pino-loki', options: { host: lokiUrl, ... }, level },
     ],
   }
   ```

   - Keep existing `autoLogging: true`, `customProps`, and `redact` settings unchanged.
   - Do NOT import pino directly -- nestjs-pino handles transport initialization.
  </action>
  <verify>
    <automated>cd C:/Users/felip/desktop/accounting/backend && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>pino-loki installed, pino.config.ts uses transport.targets with pino-loki for both envs and pino-pretty added in dev only. LOKI_URL env var added.</done>
</task>

<task type="auto">
  <name>Task 2: Remove Promtail from docker-compose and delete its config</name>
  <files>docker-compose.yml, docker/promtail-config.yml</files>
  <action>
1. Edit `docker-compose.yml`:
   - Remove the entire `promtail` service block (lines 52-59: image, volumes, command, depends_on).
   - Keep `loki` and `grafana` services unchanged -- they are still needed.
   - Do NOT remove any volumes (promtail had no named volume).

2. Delete `docker/promtail-config.yml` entirely (use git rm or just delete).

3. Verify the YAML is still valid after editing by checking indentation and structure.
  </action>
  <verify>
    <automated>cd C:/Users/felip/desktop/accounting/backend && docker compose config --quiet 2>&1 && echo "VALID" || echo "INVALID"</automated>
  </verify>
  <done>Promtail service removed from docker-compose.yml. docker/promtail-config.yml deleted. docker compose config validates successfully.</done>
</task>

<task type="auto">
  <name>Task 3: Smoke test -- app starts and logs reach Loki</name>
  <files></files>
  <action>
1. Restart docker compose to apply changes (remove old promtail container):
   ```
   docker compose down && docker compose up -d
   ```

2. Wait for Loki to be healthy (poll `http://localhost:3100/ready` up to 15s).

3. Start the NestJS app briefly to generate some log entries:
   ```
   npx nest start &
   APP_PID=$!
   sleep 8
   curl -s http://localhost:3000/health || true
   kill $APP_PID 2>/dev/null
   ```

4. Query Loki to verify logs arrived:
   ```
   curl -s "http://localhost:3100/loki/api/v1/query_range" \
     --data-urlencode 'query={app="accounting-backend"}' \
     --data-urlencode 'limit=5'
   ```
   Expect: non-empty `result` array with log entries.

5. Verify promtail container is NOT running:
   ```
   docker compose ps | grep promtail
   ```
   Expect: no output (promtail gone).
  </action>
  <verify>
    <automated>cd C:/Users/felip/desktop/accounting/backend && curl -sf "http://localhost:3100/loki/api/v1/query_range?query=%7Bapp%3D%22accounting-backend%22%7D&limit=1" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d.data.result.length > 0 ? 'LOGS_FOUND' : 'NO_LOGS')"</automated>
  </verify>
  <done>App logs appear in Loki with label app=accounting-backend. No promtail container running. Dev console shows pretty-printed logs.</done>
</task>

</tasks>

<verification>
- `npm ls pino-loki` shows pino-loki installed
- TypeScript compiles without errors
- `docker compose config` validates
- `docker/promtail-config.yml` does not exist
- Loki query `{app="accounting-backend"}` returns log entries
- Dev mode shows colorized pretty logs in terminal
</verification>

<success_criteria>
- pino-loki transport sends structured logs directly to Loki via HTTP
- Dev mode: both pino-pretty (console) and pino-loki (remote) active
- Production mode: only pino-loki active
- Promtail fully removed (no service, no config file)
- Existing logging behavior (autoLogging, redact, customProps) preserved
</success_criteria>

<output>
After completion, create `.planning/quick/11-substituir-promtail-por-pino-loki-transp/11-SUMMARY.md`
</output>
