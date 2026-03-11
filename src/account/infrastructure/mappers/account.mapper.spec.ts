import { AccountMapper } from './account.mapper';
import { Account } from '../../domain/entities/account.entity';

const VALID_CPF = '529.982.247-25';
const VALID_EMAIL = 'john@example.com';
const VALID_NAME = 'John Doe';

describe('AccountMapper', () => {
  describe('toDomain', () => {
    it('should convert a Prisma row to a domain Account', () => {
      const now = new Date();
      const raw = {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: VALID_NAME,
        email: VALID_EMAIL,
        cpf: VALID_CPF,
        birthDate: new Date('1990-05-15'),
        phone: '11987654321',
        phoneVerified: false,
        photoUrl: 'http://example.com/photo.jpg',
        createdAt: now,
        updatedAt: now,
      };

      const account = AccountMapper.toDomain(raw);

      expect(account).toBeInstanceOf(Account);
      expect(account.id).toBe(raw.id);
      expect(account.name).toBe(raw.name);
      expect(account.email).toBe(raw.email);
      expect(account.cpf).toBe(raw.cpf);
      expect(account.birthDate).toEqual(raw.birthDate);
      expect(account.phone).toBe(raw.phone);
      expect(account.photoUrl).toBe(raw.photoUrl);
      expect(account.createdAt).toBe(raw.createdAt);
      expect(account.updatedAt).toBe(raw.updatedAt);
    });

    it('should handle null optional fields', () => {
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

      const account = AccountMapper.toDomain(raw);

      expect(account).toBeInstanceOf(Account);
      expect(account.birthDate).toBeNull();
      expect(account.phone).toBeNull();
      expect(account.photoUrl).toBeNull();
    });
  });

  describe('toPersistence', () => {
    it('should convert a domain Account to a Prisma-compatible object', () => {
      const now = new Date();
      const account = Account.reconstitute(
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        {
          name: VALID_NAME,
          email: VALID_EMAIL,
          cpf: VALID_CPF,
          birthDate: new Date('1990-05-15'),
          phone: '11987654321',
          photoUrl: 'http://example.com/photo.jpg',
          createdAt: now,
          updatedAt: now,
        },
      );

      const persistence = AccountMapper.toPersistence(account);

      expect(persistence.id).toBe(account.id);
      expect(persistence.name).toBe(account.name);
      expect(persistence.email).toBe(account.email);
      expect(persistence.cpf).toBe(account.cpf);
      expect(persistence.birthDate).toEqual(account.birthDate);
      expect(persistence.phone).toBe(account.phone);
      expect(persistence.phoneVerified).toBe(false);
      expect(persistence.photoUrl).toBe(account.photoUrl);
      expect(persistence.createdAt).toBe(account.createdAt);
      expect(persistence.updatedAt).toBe(account.updatedAt);
    });

    it('should use camelCase keys matching Prisma TypeScript model', () => {
      const now = new Date();
      const account = Account.reconstitute(
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        {
          name: VALID_NAME,
          email: VALID_EMAIL,
          cpf: VALID_CPF,
          birthDate: null,
          phone: null,
          photoUrl: null,
          createdAt: now,
          updatedAt: now,
        },
      );

      const persistence = AccountMapper.toPersistence(account);
      const keys = Object.keys(persistence);

      expect(keys).toContain('birthDate');
      expect(keys).toContain('phoneVerified');
      expect(keys).toContain('photoUrl');
      expect(keys).toContain('createdAt');
      expect(keys).toContain('updatedAt');
      // Should NOT have snake_case
      expect(keys).not.toContain('birth_date');
      expect(keys).not.toContain('phone_verified');
      expect(keys).not.toContain('photo_url');
      expect(keys).not.toContain('created_at');
      expect(keys).not.toContain('updated_at');
    });
  });
});
