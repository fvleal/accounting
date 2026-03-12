import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { pinoHttpConfig } from './pino-http.config.js';

@Module({
  imports: [PinoLoggerModule.forRoot(pinoHttpConfig())],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
