---
phase: quick-10
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/shared/infrastructure/logger/pino-http.config.ts
  - src/shared/infrastructure/logger/logger.module.ts
  - src/account/interface/filters/domain-exception.filter.ts
  - src/main.ts
  - src/account/interface/filters/domain-exception.filter.spec.ts
autonomous: true
requirements: [QUICK-10]
must_haves:
  truths:
    - "All NestJS logs (domain errors, lifecycle events, exceptions) go through pino in structured JSON"
    - "Unhandled exceptions and unhandled promise rejections are captured in pino logs"
    - "DomainExceptionFilter logs errors via NestJS Logger, not console.error"
    - "HTTP request logging still works (pino-http not removed, just no longer the only config)"
    - "Dev environment still uses pino-pretty for readable output"
  artifacts:
    - path: "src/shared/infrastructure/logger/pino-http.config.ts"
      provides: "Renamed/refactored to pino.config.ts with base pino config + optional pinoHttp"
    - path: "src/shared/infrastructure/logger/logger.module.ts"
      provides: "LoggerModule using the new config"
    - path: "src/main.ts"
      provides: "Process-level uncaughtException and unhandledRejection handlers"
    - path: "src/account/interface/filters/domain-exception.filter.ts"
      provides: "Uses NestJS Logger instead of console.error"
  key_links:
    - from: "src/main.ts"
      to: "nestjs-pino Logger"
      via: "app.useLogger() + process.on handlers"
      pattern: "process\\.on\\('uncaughtException"
    - from: "src/account/interface/filters/domain-exception.filter.ts"
      to: "NestJS Logger"
      via: "Logger injection or instantiation"
      pattern: "this\\.logger\\.error"
---

<objective>
Refactor nestjs-pino from HTTP-only middleware to the true global NestJS logger. All application logs (domain errors, unhandled exceptions, lifecycle events, Prisma failures, S3 errors) must flow through pino as structured JSON. Promtail continues capturing stdout unchanged.

Purpose: Currently pino only instruments HTTP requests. Domain exceptions use console.error, and process-level crashes are not captured. This leaves observability gaps in Grafana/Loki.
Output: Fully configured global pino logger capturing ALL application log output as structured JSON.
</objective>

<execution_context>
@C:/Users/felip/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/felip/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/shared/infrastructure/logger/logger.module.ts
@src/shared/infrastructure/logger/pino-http.config.ts
@src/main.ts
@src/setup-app.ts
@src/account/interface/filters/domain-exception.filter.ts
@src/app.module.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Refactor pino config from HTTP-only to global logger config</name>
  <files>
    src/shared/infrastructure/logger/pino-http.config.ts
    src/shared/infrastructure/logger/logger.module.ts
  </files>
  <action>
Rename `pino-http.config.ts` to `pino.config.ts` (delete old file, create new one).

In `pino.config.ts`, change the nestjs-pino `Params` config to set BOTH the base `pino` options AND `pinoHttp`:

```typescript
import type { Params } from 'nestjs-pino';

export function pinoConfig(): Params {
  const isProduction = process.env.NODE_ENV === 'production';
  const level = process.env.LOG_LEVEL || 'info';

  return {
    pinoHttp: {
      level,
      autoLogging: true,
      customProps: () => ({ context: 'HTTP' }),
      redact: ['req.headers.authorization', 'req.headers.cookie'],
      ...(isProduction
        ? {}
        : {
            transport: {
              target: 'pino-pretty',
              options: {
                colorize: true,
                singleLine: true,
                translateTime: 'SYS:HH:MM:ss.l',
              },
            },
          }),
    },
  };
}
```

Note: nestjs-pino v4 uses `pinoHttp` as the config key and internally creates the base pino logger from it. The key insight is that `app.useLogger(app.get(Logger))` in main.ts already makes nestjs-pino the global logger for ALL NestJS Logger calls. The issue is NOT the config shape -- it is that code uses `console.error` instead of NestJS `Logger`. So the config rename is mostly cosmetic for clarity, but the file rename signals intent.

Actually, keep the config structure the same but rename the file and function for clarity. The real fix is in Tasks 2 and 3.

Update `logger.module.ts` to import from the renamed file:

```typescript
import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { pinoConfig } from './pino.config.js';

@Module({
  imports: [PinoLoggerModule.forRoot(pinoConfig())],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
```
  </action>
  <verify>
    <automated>cd C:/Users/felip/desktop/accounting/backend && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>pino-http.config.ts renamed to pino.config.ts, logger.module.ts updated to import from new path, TypeScript compiles cleanly</done>
</task>

<task type="auto">
  <name>Task 2: Fix DomainExceptionFilter to use NestJS Logger and add process-level handlers</name>
  <files>
    src/account/interface/filters/domain-exception.filter.ts
    src/main.ts
  </files>
  <action>
**DomainExceptionFilter** -- Replace `console.error('Unhandled exception:', exception)` on line 58 with a proper NestJS Logger:

1. Add `import { Logger } from '@nestjs/common';` (the NestJS Logger class, NOT nestjs-pino).
2. Add a private logger property: `private readonly logger = new Logger(DomainExceptionFilter.name);`
3. Replace the console.error line with: `this.logger.error(exception instanceof Error ? exception.stack || exception.message : String(exception), 'UnhandledException');`

This ensures unhandled exceptions in the filter flow through pino since app.useLogger() is already set.

**main.ts** -- Add process-level handlers for uncaught exceptions and unhandled rejections AFTER `app.useLogger()`:

```typescript
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { Logger as NestLogger } from '@nestjs/common';
import { AppModule } from './app.module';
import { setupApp } from './setup-app.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));
  setupApp(app);
  app.enableShutdownHooks();

  const logger = new NestLogger('Process');

  process.on('uncaughtException', (error) => {
    logger.fatal(error instanceof Error ? error.stack || error.message : String(error), 'UncaughtException');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error(
      reason instanceof Error ? reason.stack || reason.message : String(reason),
      'UnhandledRejection',
    );
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
```

Note: Use `NestLogger` (from `@nestjs/common`) which by this point is backed by pino due to `app.useLogger()`. The `logger.fatal()` method is available on NestJS Logger. If TypeScript complains about `fatal` not existing on Logger, use `logger.error()` instead with a `[FATAL]` prefix in the message.
  </action>
  <verify>
    <automated>cd C:/Users/felip/desktop/accounting/backend && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>DomainExceptionFilter uses NestJS Logger (no more console.error), main.ts catches uncaughtException and unhandledRejection via pino-backed logger</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Add test for DomainExceptionFilter logging behavior</name>
  <files>
    src/account/interface/filters/domain-exception.filter.spec.ts
  </files>
  <behavior>
    - Test: unhandled (non-domain, non-HTTP) exception triggers logger.error with exception details
    - Test: domain exception does NOT trigger logger.error (it returns structured JSON response)
    - Test: HTTP exception does NOT trigger logger.error
  </behavior>
  <action>
Create a spec file for DomainExceptionFilter. Use the existing test patterns in the project (Jest with NestJS testing utilities).

Key test structure:
1. Instantiate `DomainExceptionFilter`
2. Spy on the filter's private logger: `jest.spyOn((filter as any).logger, 'error')`
3. Create a mock `ArgumentsHost` with `switchToHttp()` returning mock request/response
4. For unknown exception test: call `filter.catch(new Error('boom'), mockHost)` and assert `logger.error` was called with the stack trace
5. For DomainException test: call `filter.catch(domainException, mockHost)` and assert `logger.error` was NOT called
6. For HttpException test: call `filter.catch(httpException, mockHost)` and assert `logger.error` was NOT called

Run existing tests too to ensure nothing is broken.
  </action>
  <verify>
    <automated>cd C:/Users/felip/desktop/accounting/backend && npx jest --testPathPattern="domain-exception.filter" --no-coverage 2>&1 | tail -20</automated>
  </verify>
  <done>DomainExceptionFilter has tests verifying that unhandled exceptions are logged via NestJS Logger, while domain and HTTP exceptions are not logged (just returned as JSON responses). All existing tests still pass.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. `npx jest --no-coverage` -- all tests pass
3. `npm run start:dev` -- application starts, logs appear in pino-pretty format
4. Trigger an unhandled exception scenario -- verify it appears in structured log output
5. No `console.error` or `console.log` calls remain in production code (except potentially in test files)
</verification>

<success_criteria>
- pino is the global logger for ALL NestJS log output (not just HTTP)
- DomainExceptionFilter uses NestJS Logger instead of console.error
- Process-level uncaughtException and unhandledRejection are captured in logs
- Structured JSON format maintained (level, context, timestamp, error stack)
- pino-pretty still works in development
- All existing tests pass, new filter tests pass
</success_criteria>

<output>
After completion, create `.planning/quick/10-refatorar-pino-para-logger-global-do-nes/10-SUMMARY.md`
</output>
