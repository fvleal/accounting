import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { PrismaService } from '../prisma/prisma.service.js';
import { Public } from '../auth/index.js';

@Controller('health')
export class HealthController {
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    this.bucket = configService.get<string>('S3_BUCKET')!;

    this.s3Client = new S3Client({
      endpoint: configService.get<string>('S3_ENDPOINT'),
      region: configService.get<string>('S3_REGION'),
      credentials: {
        accessKeyId: configService.get<string>('S3_ACCESS_KEY')!,
        secretAccessKey: configService.get<string>('S3_SECRET_KEY')!,
      },
      forcePathStyle: true,
    });
  }

  @Public()
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => {
        await this.prisma.$queryRaw`SELECT 1`;
        return { database: { status: 'up' } };
      },
      async (): Promise<HealthIndicatorResult> => {
        await this.s3Client.send(
          new HeadBucketCommand({ Bucket: this.bucket }),
        );
        return { storage: { status: 'up' } };
      },
    ]);
  }
}
