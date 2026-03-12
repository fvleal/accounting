import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module';
import { AuthModule } from './shared/infrastructure/auth/index.js';
import { AccountInterfaceModule } from './account/interface/account-interface.module.js';
import { HealthModule } from './shared/infrastructure/health/health.module.js';
import { envValidationSchema } from './shared/infrastructure/config/env.validation.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    AuthModule,
    AccountInterfaceModule,
    HealthModule,
  ],
})
export class AppModule {}
