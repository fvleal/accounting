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
    logger.fatal(
      error instanceof Error ? error.stack || error.message : String(error),
      'UncaughtException',
    );
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
