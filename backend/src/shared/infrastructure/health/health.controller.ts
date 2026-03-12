import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { PrismaService } from '../prisma/prisma.service.js';
import { Public } from '../auth/index.js';

interface ServiceStatus {
  status: 'up' | 'down';
  message?: string;
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof AggregateError && error.errors?.length) {
    return error.errors.map((e: Error) => e.message).join('; ');
  }
  if (error instanceof Error) {
    const code = (error as unknown as Record<string, unknown>).code;
    if (code && typeof code === 'string') {
      return code;
    }
    if (error.cause instanceof Error) {
      return error.cause.message;
    }
    return error.message;
  }
  return String(error);
}

@Controller('health')
export class HealthController {
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor(
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
  async check(@Res() res: Response) {
    const [database, storage] = await Promise.all([
      this.checkDatabase(),
      this.checkStorage(),
    ]);

    const services = { database, storage };
    const allUp = Object.values(services).every((s) => s.status === 'up');

    res.status(allUp ? 200 : 503).json({
      status: allUp ? 'ok' : 'error',
      services,
    });
  }

  private async checkDatabase(): Promise<ServiceStatus> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up' };
    } catch (error) {
      return {
        status: 'down',
        message: extractErrorMessage(error),
      };
    }
  }

  private async checkStorage(): Promise<ServiceStatus> {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return { status: 'up' };
    } catch (error) {
      return {
        status: 'down',
        message: extractErrorMessage(error),
      };
    }
  }
}
