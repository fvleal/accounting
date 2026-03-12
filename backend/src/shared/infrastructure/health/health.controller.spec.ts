import { Test } from '@nestjs/testing';
import { TerminusModule, HealthCheckService } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

function createMockConfigService() {
  const config: Record<string, string> = {
    S3_ENDPOINT: 'http://localhost:9000',
    S3_REGION: 'us-east-1',
    S3_ACCESS_KEY: 'minioadmin',
    S3_SECRET_KEY: 'minioadmin',
    S3_BUCKET: 'account',
  };
  return {
    get: vi.fn((key: string) => config[key]),
  };
}

function createMockPrismaService() {
  return {
    $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
  };
}

describe('HealthController', () => {
  let controller: HealthController;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockSend: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockPrisma = createMockPrismaService();
    const configService = createMockConfigService();

    const module = await Test.createTestingModule({
      imports: [TerminusModule],
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);

    // Replace the internal s3Client.send with a mock
    mockSend = vi.fn().mockResolvedValue({});
    (controller as any).s3Client.send = mockSend;
  });

  it('returns status ok with database up and storage up when all services healthy', async () => {
    const result = await controller.check();

    expect(result).toEqual({
      status: 'ok',
      info: {
        database: { status: 'up' },
        storage: { status: 'up' },
      },
      error: {},
      details: {
        database: { status: 'up' },
        storage: { status: 'up' },
      },
    });
  });

  it('returns 503 with database down when database throws', async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));

    try {
      await controller.check();
      // Should not reach here
      expect.unreachable('Expected ServiceUnavailableException');
    } catch (error: any) {
      const response = error.getResponse();
      expect(response.status).toBe('error');
      expect(response.error.database.status).toBe('down');
      expect(response.error.database.message).toBe('Connection refused');
      expect(response.info.storage.status).toBe('up');
    }
  });

  it('returns 503 with storage down when S3 throws', async () => {
    mockSend.mockRejectedValue(new Error('Connection refused'));

    try {
      await controller.check();
      expect.unreachable('Expected ServiceUnavailableException');
    } catch (error: any) {
      const response = error.getResponse();
      expect(response.status).toBe('error');
      expect(response.error.storage.status).toBe('down');
      expect(response.error.storage.message).toBe('Connection refused');
      expect(response.info.database.status).toBe('up');
    }
  });

  it('returns 503 with both down when database and S3 both throw', async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));
    mockSend.mockRejectedValue(new Error('Connection refused'));

    try {
      await controller.check();
      expect.unreachable('Expected ServiceUnavailableException');
    } catch (error: any) {
      const response = error.getResponse();
      expect(response.status).toBe('error');
      expect(response.error.database.status).toBe('down');
      expect(response.error.database.message).toBe('Connection refused');
      expect(response.error.storage.status).toBe('down');
      expect(response.error.storage.message).toBe('Connection refused');
    }
  });
});
