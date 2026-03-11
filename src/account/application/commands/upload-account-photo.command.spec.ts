import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UploadAccountPhotoCommand } from './upload-account-photo.command';
import { AccountRepositoryPort, StoragePort } from '../../domain/ports';
import { Account } from '../../domain/entities/account.entity';
import {
  AccountNotFoundError,
  AccountOwnershipError,
} from '../../domain/exceptions';

const VALID_AUTH0_SUB = 'auth0|abc123';
const VALID_EMAIL = 'john@example.com';
const VALID_NAME = 'John Doe';
const VALID_CPF = '529.982.247-25';
const PHOTO_URL = 'https://s3.example.com/accounts/some-id/photo';

function createMockRepo(): AccountRepositoryPort {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findByCpf: vi.fn(),
    findByAuth0Sub: vi.fn(),
    findAll: vi.fn(),
  } as unknown as AccountRepositoryPort;
}

function createMockStorage(): StoragePort {
  return {
    upload: vi.fn().mockResolvedValue(PHOTO_URL),
    delete: vi.fn(),
  } as unknown as StoragePort;
}

function createTestAccount(): Account {
  return Account.create({
    auth0Sub: VALID_AUTH0_SUB,
    name: VALID_NAME,
    email: VALID_EMAIL,
    cpf: VALID_CPF,
  });
}

describe('UploadAccountPhotoCommand', () => {
  let command: UploadAccountPhotoCommand;
  let mockRepo: AccountRepositoryPort;
  let mockStorage: StoragePort;

  beforeEach(() => {
    mockRepo = createMockRepo();
    mockStorage = createMockStorage();
    command = new UploadAccountPhotoCommand(mockRepo, mockStorage);
  });

  it('should load account, upload photo, update photo URL, save, and return output', async () => {
    const account = createTestAccount();
    (mockRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);
    const buffer = Buffer.from('fake-image-data');
    const contentType = 'image/jpeg';

    const output = await command.execute({
      accountId: account.id,
      auth0Sub: VALID_AUTH0_SUB,
      buffer,
      contentType,
    });

    expect(output.id).toBe(account.id);
    expect(output.photoUrl).toBe(PHOTO_URL);
    expect(mockStorage.upload).toHaveBeenCalledOnce();
    expect(mockRepo.save).toHaveBeenCalledOnce();
    expect(mockRepo.save).toHaveBeenCalledWith(account);
  });

  it('should throw AccountNotFoundError when account ID not found', async () => {
    (mockRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(
      command.execute({
        accountId: 'nonexistent-id',
        auth0Sub: VALID_AUTH0_SUB,
        buffer: Buffer.from('data'),
        contentType: 'image/jpeg',
      }),
    ).rejects.toThrow(AccountNotFoundError);
    expect(mockStorage.upload).not.toHaveBeenCalled();
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('should throw AccountOwnershipError when auth0Sub does not match', async () => {
    const account = createTestAccount();
    (mockRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    await expect(
      command.execute({
        accountId: account.id,
        auth0Sub: 'auth0|other-user',
        buffer: Buffer.from('data'),
        contentType: 'image/jpeg',
      }),
    ).rejects.toThrow(AccountOwnershipError);
    expect(mockStorage.upload).not.toHaveBeenCalled();
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('should delete old photo before uploading when account already has a photo', async () => {
    const account = createTestAccount();
    account.updatePhoto('https://s3.example.com/accounts/old/photo');
    (mockRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);
    const buffer = Buffer.from('fake-image-data');
    const contentType = 'image/jpeg';

    await command.execute({
      accountId: account.id,
      auth0Sub: VALID_AUTH0_SUB,
      buffer,
      contentType,
    });

    expect(mockStorage.delete).toHaveBeenCalledWith(
      `accounts/${account.id}/photo`,
    );
    expect(mockStorage.delete).toHaveBeenCalledBefore(
      mockStorage.upload as ReturnType<typeof vi.fn>,
    );
  });

  it('should not delete when account has no existing photo', async () => {
    const account = createTestAccount();
    (mockRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);
    const buffer = Buffer.from('fake-image-data');
    const contentType = 'image/jpeg';

    await command.execute({
      accountId: account.id,
      auth0Sub: VALID_AUTH0_SUB,
      buffer,
      contentType,
    });

    expect(mockStorage.delete).not.toHaveBeenCalled();
    expect(mockStorage.upload).toHaveBeenCalledOnce();
  });

  it('should call StoragePort.upload with correct key, buffer, and contentType', async () => {
    const account = createTestAccount();
    (mockRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);
    const buffer = Buffer.from('fake-image-data');
    const contentType = 'image/png';

    await command.execute({
      accountId: account.id,
      auth0Sub: VALID_AUTH0_SUB,
      buffer,
      contentType,
    });

    expect(mockStorage.upload).toHaveBeenCalledWith(
      `accounts/${account.id}/photo`,
      buffer,
      contentType,
    );
  });
});
