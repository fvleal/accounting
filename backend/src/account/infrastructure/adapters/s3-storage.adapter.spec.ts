import { S3StorageAdapter } from './s3-storage.adapter';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

function createMockConfigService(
  overrides: Record<string, string | undefined> = {},
) {
  const config: Record<string, string | undefined> = {
    S3_ENDPOINT: 'http://localhost:9000',
    S3_REGION: 'us-east-1',
    S3_ACCESS_KEY: 'minioadmin',
    S3_SECRET_KEY: 'minioadmin',
    S3_BUCKET: 'account',
    S3_PUBLIC_URL: 'http://cdn.example.com',
    ...overrides,
  };
  return {
    get: vi.fn((key: string) => config[key]),
  };
}

describe('S3StorageAdapter', () => {
  let adapter: S3StorageAdapter;
  let mockSend: ReturnType<typeof vi.fn>;
  let configService: ReturnType<typeof createMockConfigService>;

  beforeEach(() => {
    vi.clearAllMocks();
    configService = createMockConfigService();
    adapter = new S3StorageAdapter(configService as any);

    // Replace the internal s3Client.send with a mock
    mockSend = vi.fn().mockResolvedValue({});
    (adapter as any).s3Client.send = mockSend;
  });

  describe('upload', () => {
    it('should send PutObjectCommand with correct params', async () => {
      const buffer = Buffer.from('test-content');
      await adapter.upload('photos/test.jpg', buffer, 'image/jpeg');

      expect(mockSend).toHaveBeenCalledTimes(1);
      const command = mockSend.mock.calls[0][0];
      expect(command).toBeInstanceOf(PutObjectCommand);
      expect(command.input).toEqual(
        expect.objectContaining({
          Bucket: 'account',
          Key: 'photos/test.jpg',
          Body: buffer,
          ContentType: 'image/jpeg',
        }),
      );
    });

    it('should return constructed URL using S3_PUBLIC_URL', async () => {
      const buffer = Buffer.from('test-content');
      const url = await adapter.upload('photos/test.jpg', buffer, 'image/jpeg');

      expect(url).toBe('http://cdn.example.com/account/photos/test.jpg');
    });

    it('should fall back to S3_ENDPOINT when S3_PUBLIC_URL is not set', async () => {
      const fallbackConfig = createMockConfigService({
        S3_PUBLIC_URL: undefined,
      });
      const fallbackAdapter = new S3StorageAdapter(fallbackConfig as any);
      const fallbackMockSend = vi.fn().mockResolvedValue({});
      (fallbackAdapter as any).s3Client.send = fallbackMockSend;

      const buffer = Buffer.from('test-content');
      const url = await fallbackAdapter.upload(
        'photos/test.jpg',
        buffer,
        'image/jpeg',
      );

      expect(url).toBe('http://localhost:9000/account/photos/test.jpg');
    });
  });

  describe('delete', () => {
    it('should send DeleteObjectCommand with correct params', async () => {
      await adapter.delete('photos/test.jpg');

      expect(mockSend).toHaveBeenCalledTimes(1);
      const command = mockSend.mock.calls[0][0];
      expect(command).toBeInstanceOf(DeleteObjectCommand);
      expect(command.input).toEqual(
        expect.objectContaining({
          Bucket: 'account',
          Key: 'photos/test.jpg',
        }),
      );
    });
  });
});
