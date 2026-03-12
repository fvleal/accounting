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

function createMockResponse() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('HealthController', () => {
  let controller: HealthController;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = createMockPrismaService();
    const configService = createMockConfigService();

    controller = new HealthController(
      mockPrisma as unknown as PrismaService,
      configService as unknown as ConfigService,
    );

    mockSend = vi.fn().mockResolvedValue({});
    (controller as any).s3Client.send = mockSend;
  });

  it('returns 200 with all services up', async () => {
    const res = createMockResponse();
    await controller.check(res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'ok',
      services: {
        database: { status: 'up' },
        storage: { status: 'up' },
      },
    });
  });

  it('returns 503 with database down and extracts error code from Prisma error', async () => {
    const prismaError = new Error('Invalid `prisma.$queryRaw()` invocation:');
    (prismaError as any).code = 'ECONNREFUSED';
    mockPrisma.$queryRaw.mockRejectedValue(prismaError);
    const res = createMockResponse();
    await controller.check(res);

    expect(res.status).toHaveBeenCalledWith(503);
    const body = res.json.mock.calls[0][0];
    expect(body.status).toBe('error');
    expect(body.services.database).toEqual({
      status: 'down',
      message: 'ECONNREFUSED',
    });
    expect(body.services.storage).toEqual({ status: 'up' });
  });

  it('returns 503 with storage down and extracts AggregateError messages', async () => {
    const aggError = new AggregateError([
      new Error('connect ECONNREFUSED ::1:9000'),
      new Error('connect ECONNREFUSED 127.0.0.1:9000'),
    ]);
    (aggError as any).code = 'ECONNREFUSED';
    mockSend.mockRejectedValue(aggError);
    const res = createMockResponse();
    await controller.check(res);

    expect(res.status).toHaveBeenCalledWith(503);
    const body = res.json.mock.calls[0][0];
    expect(body.status).toBe('error');
    expect(body.services.storage).toEqual({
      status: 'down',
      message:
        'connect ECONNREFUSED ::1:9000; connect ECONNREFUSED 127.0.0.1:9000',
    });
    expect(body.services.database).toEqual({ status: 'up' });
  });

  it('returns 503 with both services down and error messages', async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));
    mockSend.mockRejectedValue(new Error('ECONNREFUSED'));
    const res = createMockResponse();
    await controller.check(res);

    expect(res.status).toHaveBeenCalledWith(503);
    const body = res.json.mock.calls[0][0];
    expect(body.status).toBe('error');
    expect(body.services.database).toEqual({
      status: 'down',
      message: 'Connection refused',
    });
    expect(body.services.storage).toEqual({
      status: 'down',
      message: 'ECONNREFUSED',
    });
  });
});
