import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module';
import { AuthModule } from './shared/infrastructure/auth/index.js';
import { AccountInterfaceModule } from './account/interface/account-interface.module.js';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    EventEmitterModule.forRoot(),
    PrismaModule,
    AuthModule,
    AccountInterfaceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
