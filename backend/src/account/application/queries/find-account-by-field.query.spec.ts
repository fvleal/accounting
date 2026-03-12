import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FindAccountByFieldQuery } from './find-account-by-field.query';
import { AccountRepositoryPort } from '../../domain/ports';
import { Account } from '../../domain/entities/account.entity';
import { AccountNotFoundError } from '../../domain/exceptions';

const VALID_EMAIL = 'john@example.com';
const VALID_NAME = 'John Doe';
const VALID_CPF = '529.982.247-25';
const NORMALIZED_CPF = '52998224725';

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

describe('FindAccountByFieldQuery', () => {
  let query: FindAccountByFieldQuery;
  let mockRepo: AccountRepositoryPort;

  beforeEach(() => {
    mockRepo = createMockRepo();
    query = new FindAccountByFieldQuery(mockRepo);
  });

  it('should find account by email field', async () => {
    const account = createTestAccount();
    (mockRepo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(
      account,
    );

    const output = await query.execute({ field: 'email', value: VALID_EMAIL });

    expect(output.id).toBe(account.id);
    expect(output.email).toBe(VALID_EMAIL);
    expect(mockRepo.findByEmail).toHaveBeenCalledWith(VALID_EMAIL);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('should find account by CPF field', async () => {
    const account = createTestAccount();
    (mockRepo.findByCpf as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    const output = await query.execute({ field: 'cpf', value: VALID_CPF });

    expect(output.id).toBe(account.id);
    expect(output.cpf).toBe(NORMALIZED_CPF);
    expect(mockRepo.findByCpf).toHaveBeenCalledWith(VALID_CPF);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('should throw AccountNotFoundError when field value not found', async () => {
    (mockRepo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(
      query.execute({ field: 'email', value: 'unknown@example.com' }),
    ).rejects.toThrow(AccountNotFoundError);
  });
});
