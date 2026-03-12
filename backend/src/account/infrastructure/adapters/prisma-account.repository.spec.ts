import { PrismaAccountRepository } from './prisma-account.repository';
import { Account } from '../../domain/entities/account.entity';
import { AccountMapper } from '../mappers/account.mapper';

const VALID_CPF = '529.982.247-25';
const VALID_EMAIL = 'john@example.com';
const VALID_NAME = 'John Doe';

function createMockPrisma() {
  return {
    account: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  };
}

function createMockEventEmitter() {
  return {
    emit: vi.fn(),
  };
}

describe('PrismaAccountRepository', () => {
  let repo: PrismaAccountRepository;
  let prisma: ReturnType<typeof createMockPrisma>;
  let eventEmitter: ReturnType<typeof createMockEventEmitter>;

  beforeEach(() => {
    prisma = createMockPrisma();
    eventEmitter = createMockEventEmitter();
    repo = new PrismaAccountRepository(prisma as any, eventEmitter as any);
  });

  describe('save', () => {
    it('should upsert account data and dispatch events inside transaction', async () => {
      const account = Account.create({
        name: VALID_NAME,
        email: VALID_EMAIL,
        cpf: VALID_CPF,
      });

      const events = account.getEvents();
      expect(events.length).toBeGreaterThan(0);

      // Interactive transaction mock: callback receives the prisma tx client
      prisma.$transaction.mockImplementation(async (cb: any) => cb(prisma));
      prisma.account.upsert.mockResolvedValue(undefined);

      await repo.save(account);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.account.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: account.id },
          create: expect.objectContaining({ id: account.id }),
          update: expect.objectContaining({ id: account.id }),
        }),
      );
      // Events dispatched with constructor name
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'AccountCreated',
        expect.anything(),
      );
    });

    it('should clear domain events after successful save', async () => {
      const account = Account.create({
        name: VALID_NAME,
        email: VALID_EMAIL,
        cpf: VALID_CPF,
      });

      prisma.$transaction.mockImplementation(async (cb: any) => cb(prisma));
      prisma.account.upsert.mockResolvedValue(undefined);

      await repo.save(account);

      expect(account.getEvents()).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('should return domain Account when found', async () => {
      const now = new Date();
      const raw = {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: VALID_NAME,
        email: VALID_EMAIL,
        cpf: VALID_CPF,
        birthDate: null,
        phone: null,
        phoneVerified: false,
        photoUrl: null,
        createdAt: now,
        updatedAt: now,
      };
      prisma.account.findUnique.mockResolvedValue(raw);

      const result = await repo.findById(raw.id);

      expect(result).toBeInstanceOf(Account);
      expect(result!.id).toBe(raw.id);
    });

    it('should return null when not found', async () => {
      prisma.account.findUnique.mockResolvedValue(null);

      const result = await repo.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const now = new Date();
      const rows = [
        {
          id: 'id-1',
          name: VALID_NAME,
          email: VALID_EMAIL,
          cpf: VALID_CPF,
          birthDate: null,
          phone: null,
          phoneVerified: false,
          photoUrl: null,
          createdAt: now,
          updatedAt: now,
        },
      ];

      prisma.account.findMany.mockResolvedValue(rows);
      prisma.account.count.mockResolvedValue(1);

      const result = await repo.findAll({ limit: 10, offset: 0 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toBeInstanceOf(Account);
      expect(result.total).toBe(1);
    });
  });
});
