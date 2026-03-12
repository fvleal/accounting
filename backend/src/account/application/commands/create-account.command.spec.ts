import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateAccountCommand } from './create-account.command';
import { AccountRepositoryPort } from '../../domain/ports';
import { Account } from '../../domain/entities/account.entity';
import {
  DuplicateEmailError,
  DuplicateCpfError,
} from '../../domain/exceptions';

const VALID_EMAIL = 'john@example.com';
const VALID_NAME = 'John Doe';
const VALID_CPF = '529.982.247-25';

function createMockRepo(): AccountRepositoryPort {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findByEmail: vi.fn().mockResolvedValue(null),
    findByCpf: vi.fn().mockResolvedValue(null),
    findAll: vi.fn(),
  } as unknown as AccountRepositoryPort;
}

describe('CreateAccountCommand', () => {
  let command: CreateAccountCommand;
  let mockRepo: AccountRepositoryPort;

  const validInput = {
    email: VALID_EMAIL,
    name: VALID_NAME,
    cpf: VALID_CPF,
  };

  beforeEach(() => {
    mockRepo = createMockRepo();
    command = new CreateAccountCommand(mockRepo);
  });

  it('should return existing account when email already linked (idempotent)', async () => {
    const existing = Account.create({
      name: VALID_NAME,
      email: VALID_EMAIL,
      cpf: VALID_CPF,
    });
    (mockRepo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(
      existing,
    );

    const output = await command.execute(validInput);

    expect(output.id).toBe(existing.id);
    expect(output.email).toBe(existing.email);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('should create new account when no duplicates exist', async () => {
    const output = await command.execute(validInput);

    expect(output.id).toBeDefined();
    expect(output.name).toBe(VALID_NAME);
    expect(output.email).toBe(VALID_EMAIL.toLowerCase());
    expect(output.cpf).toBe('52998224725');
    expect(mockRepo.save).toHaveBeenCalledOnce();
  });

  it('should throw DuplicateCpfError when CPF taken by different user', async () => {
    const other = Account.create({
      name: 'Jane Doe',
      email: 'jane@example.com',
      cpf: VALID_CPF,
    });
    (mockRepo.findByCpf as ReturnType<typeof vi.fn>).mockResolvedValue(other);

    await expect(command.execute(validInput)).rejects.toThrow(
      DuplicateCpfError,
    );
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('should include all account fields in output', async () => {
    const output = await command.execute(validInput);

    expect(output).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: VALID_NAME,
        email: VALID_EMAIL.toLowerCase(),
        cpf: '52998224725',
        birthDate: null,
        phone: null,
        photoUrl: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }),
    );
  });
});
