import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetAccountByIdQuery } from './get-account-by-id.query';
import { AccountRepositoryPort } from '../../domain/ports';
import { Account } from '../../domain/entities/account.entity';
import { AccountNotFoundError } from '../../domain/exceptions';

const VALID_AUTH0_SUB = 'auth0|abc123';
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
    findByAuth0Sub: vi.fn(),
    findAll: vi.fn(),
    exists: vi.fn(),
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

describe('GetAccountByIdQuery', () => {
  let query: GetAccountByIdQuery;
  let mockRepo: AccountRepositoryPort;

  beforeEach(() => {
    mockRepo = createMockRepo();
    query = new GetAccountByIdQuery(mockRepo);
  });

  it('should return account output when found by ID', async () => {
    const account = createTestAccount();
    (mockRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    const output = await query.execute({ id: account.id });

    expect(output.id).toBe(account.id);
    expect(output.auth0Sub).toBe(VALID_AUTH0_SUB);
    expect(output.name).toBe(VALID_NAME);
    expect(output.email).toBe(VALID_EMAIL);
    expect(output.cpf).toBe(NORMALIZED_CPF);
    expect(output.birthDate).toBeNull();
    expect(output.phone).toBeNull();
    expect(output.photoUrl).toBeNull();
    expect(output.createdAt).toBeInstanceOf(Date);
    expect(output.updatedAt).toBeInstanceOf(Date);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('should throw AccountNotFoundError when ID not found', async () => {
    (mockRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(query.execute({ id: 'nonexistent-id' })).rejects.toThrow(
      AccountNotFoundError,
    );
  });
});
