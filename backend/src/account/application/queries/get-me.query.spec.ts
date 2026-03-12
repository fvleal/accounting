import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetMeQuery } from './get-me.query';
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

describe('GetMeQuery', () => {
  let query: GetMeQuery;
  let mockRepo: AccountRepositoryPort;

  beforeEach(() => {
    mockRepo = createMockRepo();
    query = new GetMeQuery(mockRepo);
  });

  it('should return account output when found by email', async () => {
    const account = createTestAccount();
    (mockRepo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(
      account,
    );

    const output = await query.execute({ email: VALID_EMAIL });

    expect(output.id).toBe(account.id);
    expect(output.name).toBe(VALID_NAME);
    expect(output.email).toBe(VALID_EMAIL);
    expect(output.cpf).toBe(NORMALIZED_CPF);
    expect(output.birthDate).toBeNull();
    expect(output.phone).toBeNull();
    expect(output.photoUrl).toBeNull();
    expect(output.createdAt).toBeInstanceOf(Date);
    expect(output.updatedAt).toBeInstanceOf(Date);
    expect(mockRepo.findByEmail).toHaveBeenCalledWith(VALID_EMAIL);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('should throw AccountNotFoundError when email has no account', async () => {
    (mockRepo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(
      query.execute({ email: 'unknown@example.com' }),
    ).rejects.toThrow(AccountNotFoundError);
  });
});
