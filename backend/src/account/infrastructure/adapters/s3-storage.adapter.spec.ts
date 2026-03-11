import { S3StorageAdapter } from './s3-storage.adapter';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

function createMockConfigService() {
  const config: Record<string, string> = {
    S3_ENDPOINT: 'http://localhost:9000',
    S3_REGION: 'us-east-1',
    S3_ACCESS_KEY: 'minioadmin',
    S3_SECRET_KEY: 'minioadmin',
    S3_BUCKET: 'account-photos',
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
          Bucket: 'account-photos',
          Key: 'photos/test.jpg',
          Body: buffer,
          ContentType: 'image/jpeg',
        }),
      );
    });

    it('should return constructed URL', async () => {
      const buffer = Buffer.from('test-content');
      const url = await adapter.upload('photos/test.jpg', buffer, 'image/jpeg');

      expect(url).toBe('http://localhost:9000/account-photos/photos/test.jpg');
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
          Bucket: 'account-photos',
          Key: 'photos/test.jpg',
        }),
      );
    });
  });
});
