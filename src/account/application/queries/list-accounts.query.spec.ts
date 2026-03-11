import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListAccountsQuery } from './list-accounts.query';
import { AccountRepositoryPort } from '../../domain/ports';
import { Account } from '../../domain/entities/account.entity';

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

describe('ListAccountsQuery', () => {
  let query: ListAccountsQuery;
  let mockRepo: AccountRepositoryPort;

  beforeEach(() => {
    mockRepo = createMockRepo();
    query = new ListAccountsQuery(mockRepo);
  });

  it('should return paginated result with data array and total count', async () => {
    const account = createTestAccount();
    (mockRepo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [account],
      total: 1,
    });

    const output = await query.execute({ limit: 10, offset: 0 });

    expect(output.data).toHaveLength(1);
    expect(output.data[0].id).toBe(account.id);
    expect(output.data[0].auth0Sub).toBe(VALID_AUTH0_SUB);
    expect(output.data[0].name).toBe(VALID_NAME);
    expect(output.data[0].email).toBe(VALID_EMAIL);
    expect(output.total).toBe(1);
    expect(mockRepo.findAll).toHaveBeenCalledWith({ limit: 10, offset: 0 });
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('should return empty data array with total=0 when no accounts', async () => {
    (mockRepo.findAll as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [],
      total: 0,
    });

    const output = await query.execute({ limit: 10, offset: 0 });

    expect(output.data).toHaveLength(0);
    expect(output.total).toBe(0);
  });
});
