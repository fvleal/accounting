import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateBirthDateCommand } from './update-birth-date.command';
import { AccountRepositoryPort } from '../../domain/ports';
import { Account } from '../../domain/entities/account.entity';
import { AccountNotFoundError } from '../../domain/exceptions';

const VALID_EMAIL = 'john@example.com';
const VALID_NAME = 'John Doe';
const VALID_CPF = '529.982.247-25';

function createMockRepo(): AccountRepositoryPort {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findByCpf: vi.fn(),
    findAll: vi.fn(),
  } as unknown as AccountRepositoryPort;
}

function createTestAccount(): Account {
  return Account.create({
    name: VALID_NAME,
    email: VALID_EMAIL,
    cpf: VALID_CPF,
  });
}

describe('UpdateBirthDateCommand', () => {
  let command: UpdateBirthDateCommand;
  let mockRepo: AccountRepositoryPort;

  beforeEach(() => {
    mockRepo = createMockRepo();
    command = new UpdateBirthDateCommand(mockRepo);
  });

  it('should load account by ID, call updateBirthDate(), save, and return updated output', async () => {
    const account = createTestAccount();
    (mockRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);
    const birthDate = new Date('1990-05-15');

    const output = await command.execute({
      accountId: account.id,
      birthDate,
    });

    expect(output.id).toBe(account.id);
    expect(output.birthDate).toEqual(birthDate);
    expect(mockRepo.save).toHaveBeenCalledOnce();
    expect(mockRepo.save).toHaveBeenCalledWith(account);
  });

  it('should throw AccountNotFoundError when account ID not found', async () => {
    (mockRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(
      command.execute({
        accountId: 'nonexistent-id',
        birthDate: new Date('1990-05-15'),
      }),
    ).rejects.toThrow(AccountNotFoundError);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

});
