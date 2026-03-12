import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [HealthController],
})
export class HealthModule {}
