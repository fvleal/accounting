import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetMeQuery } from './get-me.query';
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

describe('GetMeQuery', () => {
  let query: GetMeQuery;
  let mockRepo: AccountRepositoryPort;

  beforeEach(() => {
    mockRepo = createMockRepo();
    query = new GetMeQuery(mockRepo);
  });

  it('should return account output when found by auth0Sub', async () => {
    const account = createTestAccount();
    (mockRepo.findByAuth0Sub as ReturnType<typeof vi.fn>).mockResolvedValue(
      account,
    );

    const output = await query.execute({ auth0Sub: VALID_AUTH0_SUB });

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
    expect(mockRepo.findByAuth0Sub).toHaveBeenCalledWith(VALID_AUTH0_SUB);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('should throw AccountNotFoundError when auth0Sub has no account', async () => {
    (mockRepo.findByAuth0Sub as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );

    await expect(query.execute({ auth0Sub: 'auth0|unknown' })).rejects.toThrow(
      AccountNotFoundError,
    );
  });
});
