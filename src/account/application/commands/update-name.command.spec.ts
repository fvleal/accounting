import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateNameCommand } from './update-name.command';
import { AccountRepositoryPort } from '../../domain/ports';
import { Account } from '../../domain/entities/account.entity';
import {
  AccountNotFoundError,
  AccountOwnershipError,
} from '../../domain/exceptions';

const VALID_AUTH0_SUB = 'auth0|abc123';
const VALID_EMAIL = 'john@example.com';
const VALID_NAME = 'John Doe';
const VALID_CPF = '529.982.247-25';

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

function createTestAccount(): Account {
  return Account.create({
    auth0Sub: VALID_AUTH0_SUB,
    name: VALID_NAME,
    email: VALID_EMAIL,
    cpf: VALID_CPF,
  });
}

describe('UpdateNameCommand', () => {
  let command: UpdateNameCommand;
  let mockRepo: AccountRepositoryPort;

  beforeEach(() => {
    mockRepo = createMockRepo();
    command = new UpdateNameCommand(mockRepo);
  });

  it('should load account by ID, call updateName(), save, and return updated output', async () => {
    const account = createTestAccount();
    (mockRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    const output = await command.execute({
      accountId: account.id,
      auth0Sub: VALID_AUTH0_SUB,
      name: 'Jane Smith',
    });

    expect(output.id).toBe(account.id);
    expect(output.name).toBe('Jane Smith');
    expect(mockRepo.save).toHaveBeenCalledOnce();
    expect(mockRepo.save).toHaveBeenCalledWith(account);
  });

  it('should throw AccountNotFoundError when account ID not found', async () => {
    (mockRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(
      command.execute({
        accountId: 'nonexistent-id',
        auth0Sub: VALID_AUTH0_SUB,
        name: 'Jane Smith',
      }),
    ).rejects.toThrow(AccountNotFoundError);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('should throw AccountOwnershipError when auth0Sub does not match', async () => {
    const account = createTestAccount();
    (mockRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    await expect(
      command.execute({
        accountId: account.id,
        auth0Sub: 'auth0|other-user',
        name: 'Jane Smith',
      }),
    ).rejects.toThrow(AccountOwnershipError);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });
});
