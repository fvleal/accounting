import { Module } from '@nestjs/common';
import { PrismaAccountRepository } from './adapters/prisma-account.repository';
import { S3StorageAdapter } from './adapters/s3-storage.adapter';

export const ACCOUNT_REPOSITORY_PORT = 'ACCOUNT_REPOSITORY_PORT';
export const STORAGE_PORT = 'STORAGE_PORT';

@Module({
  providers: [
    {
      provide: ACCOUNT_REPOSITORY_PORT,
      useClass: PrismaAccountRepository,
    },
    {
      provide: STORAGE_PORT,
      useClass: S3StorageAdapter,
    },
  ],
  exports: [ACCOUNT_REPOSITORY_PORT, STORAGE_PORT],
})
export class AccountInfrastructureModule {}
