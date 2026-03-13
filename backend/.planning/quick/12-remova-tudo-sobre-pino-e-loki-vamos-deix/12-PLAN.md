---
phase: quick-12
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/main.ts
  - src/app.module.ts
  - src/shared/infrastructure/logger/logger.module.ts
  - src/shared/infrastructure/logger/pino.config.ts
  - package.json
  - .env
  - .env.example
  - docker-compose.yml
autonomous: true
requirements: [QUICK-12]
must_haves:
  truths:
    - "App starts and logs to console using NestJS built-in logger (no pino)"
    - "No pino or loki dependencies in package.json"
    - "No loki/grafana references in env files or docker-compose"
    - "All existing tests pass"
  artifacts:
    - path: "src/main.ts"
      provides: "Bootstrap without pino Logger"
    - path: "src/app.module.ts"
      provides: "No LoggerModule import"
  key_links:
    - from: "src/main.ts"
      to: "@nestjs/common Logger"
      via: "NestJS default logger"
---

<objective>
Remove all pino, pino-loki, pino-pretty, nestjs-pino, and Loki/Grafana observability infrastructure. Revert to NestJS built-in console logger. Clean up env vars, docker-compose leftovers, and uninstall npm packages.

Purpose: User wants zero observability overhead for now; will re-implement when needed.
Output: Clean codebase with no pino/loki traces, using NestJS default logger.
</objective>

<execution_context>
@C:/Users/felip/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/felip/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove pino/loki from application code</name>
  <files>
    src/main.ts
    src/app.module.ts
    src/shared/infrastructure/logger/logger.module.ts
    src/shared/infrastructure/logger/pino.config.ts
  </files>
  <action>
1. DELETE `src/shared/infrastructure/logger/pino.config.ts` entirely.
2. DELETE `src/shared/infrastructure/logger/logger.module.ts` entirely.
3. If the `src/shared/infrastructure/logger/` directory is now empty, delete it too.
4. In `src/app.module.ts`: remove the `LoggerModule` import line and remove `LoggerModule` from the `imports` array. No replacement needed -- NestJS has a built-in logger.
5. In `src/main.ts`:
   - Remove `import { Logger } from 'nestjs-pino';` (line 2).
   - Remove `app.useLogger(app.get(Logger));` (line 10).
   - Remove `bufferLogs: true` from NestFactory.create options (no longer needed without pino).
   - Keep the `NestLogger` import from `@nestjs/common` and the process error handlers -- those use NestJS Logger, not pino.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>No TypeScript compilation errors. No imports from nestjs-pino or pino anywhere in src/.</done>
</task>

<task type="auto">
  <name>Task 2: Uninstall npm packages and clean env/docker</name>
  <files>
    package.json
    .env
    .env.example
    docker-compose.yml
  </files>
  <action>
1. Run: `npm uninstall nestjs-pino pino pino-http pino-loki pino-pretty`
2. In `.env`: remove the lines for LOKI_HOST, LOKI_USER, LOKI_API_KEY, and the comment about pino-pretty (lines 19-23). Keep all other env vars.
3. In `.env.example`: remove the LOKI_URL line.
4. In `docker-compose.yml`: the file currently has no loki/grafana services (already cleaned). Verify it only has postgres, minio, minio-init. Stage any unstaged changes to docker-compose.yml (there are unstaged modifications from prior work).
5. Delete the `docker/` directory if it still exists (grafana provisioning files were deleted but directory may linger).
6. Delete `dist/src/shared/infrastructure/logger/` directory (stale build artifacts from pino.config).
  </action>
  <verify>
    <automated>npm test 2>&1 | tail -20</automated>
  </verify>
  <done>All tests pass. No pino/loki/grafana packages in node_modules. No LOKI vars in .env or .env.example. No docker/ directory.</done>
</task>

</tasks>

<verification>
- `grep -r "pino\|loki\|grafana" src/` returns no matches
- `grep "pino\|loki" package.json` returns no matches
- `npm test` passes
- App starts successfully: `npx nest start` boots without errors (ctrl+c after confirming)
</verification>

<success_criteria>
- Zero pino/loki/grafana references in source code, config, or dependencies
- NestJS boots with its built-in console logger
- All existing tests pass
- docker-compose.yml is clean (postgres + minio only)
</success_criteria>

<output>
After completion, create `.planning/quick/12-remova-tudo-sobre-pino-e-loki-vamos-deix/12-SUMMARY.md`
</output>
