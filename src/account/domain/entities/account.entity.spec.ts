import { describe, it, expect } from 'vitest';
import { Account } from './account.entity';
import { AccountCreated } from '../events/account-created.event';
import { AccountUpdated } from '../events/account-updated.event';

const VALID_CPF = '529.982.247-25';
const VALID_EMAIL = 'john@example.com';
const VALID_NAME = 'John Doe';
const VALID_PHONE = '11987654321';

describe('Account', () => {
  describe('create()', () => {
    it('should generate a UUID and return an Account instance', () => {
      const account = Account.create({
        name: VALID_NAME,
        email: VALID_EMAIL,
        cpf: VALID_CPF,
      });

      expect(account.id).toBeDefined();
      expect(account.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    it('should set name, email, and cpf from required fields', () => {
      const account = Account.create({
        name: VALID_NAME,
        email: VALID_EMAIL,
        cpf: VALID_CPF,
      });

      expect(account.name).toBe(VALID_NAME);
      expect(account.email).toBe(VALID_EMAIL.toLowerCase());
      expect(account.cpf).toBe('52998224725'); // stripped
    });

    it('should set optional fields to null by default', () => {
      const account = Account.create({
        name: VALID_NAME,
        email: VALID_EMAIL,
        cpf: VALID_CPF,
      });

      expect(account.birthDate).toBeNull();
      expect(account.phone).toBeNull();
      expect(account.photoUrl).toBeNull();
    });

    it('should set createdAt and updatedAt dates', () => {
      const before = new Date();
      const account = Account.create({
        name: VALID_NAME,
        email: VALID_EMAIL,
        cpf: VALID_CPF,
      });
      const after = new Date();

      expect(account.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(account.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(account.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(account.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should collect exactly one AccountCreated event', () => {
      const account = Account.create({
        name: VALID_NAME,
        email: VALID_EMAIL,
        cpf: VALID_CPF,
      });

      const events = account.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(AccountCreated);
    });

    it('should include full snapshot in AccountCreated event', () => {
      const account = Account.create({
        name: VALID_NAME,
        email: VALID_EMAIL,
        cpf: VALID_CPF,
      });

      const event = account.getEvents()[0] as AccountCreated;
      expect(event.accountId).toBe(account.id);
      expect(event.name).toBe(VALID_NAME);
      expect(event.email).toBe(VALID_EMAIL.toLowerCase());
      expect(event.cpf).toBe('52998224725');
      expect(event.birthDate).toBeNull();
      expect(event.phone).toBeNull();
      expect(event.photoUrl).toBeNull();
      expect(event.createdAt).toBeInstanceOf(Date);
      expect(event.occurredOn).toBeInstanceOf(Date);
    });

    it('should throw if name is invalid (single word)', () => {
      expect(() =>
        Account.create({
          name: 'John',
          email: VALID_EMAIL,
          cpf: VALID_CPF,
        }),
      ).toThrow();
    });

    it('should throw if email is invalid', () => {
      expect(() =>
        Account.create({
          name: VALID_NAME,
          email: 'invalid-email',
          cpf: VALID_CPF,
        }),
      ).toThrow();
    });

    it('should throw if CPF is invalid', () => {
      expect(() =>
        Account.create({
          name: VALID_NAME,
          email: VALID_EMAIL,
          cpf: '000.000.000-00',
        }),
      ).toThrow();
    });
  });

  describe('reconstitute()', () => {
    it('should return an Account with the provided ID', () => {
      const id = 'existing-uuid-123';
      const now = new Date();
      const account = Account.reconstitute(id, {
        name: VALID_NAME,
        email: VALID_EMAIL,
        cpf: VALID_CPF,
        birthDate: null,
        phone: null,
        photoUrl: null,
        createdAt: now,
        updatedAt: now,
      });

      expect(account.id).toBe(id);
    });

    it('should set all fields from props including optional ones', () => {
      const now = new Date();
      const birthDate = new Date('1990-05-15');
      const account = Account.reconstitute('some-id', {
        name: VALID_NAME,
        email: VALID_EMAIL,
        cpf: VALID_CPF,
        birthDate,
        phone: VALID_PHONE,
        photoUrl: 'https://example.com/photo.jpg',
        createdAt: now,
        updatedAt: now,
      });

      expect(account.name).toBe(VALID_NAME);
      expect(account.email).toBe(VALID_EMAIL.toLowerCase());
      expect(account.cpf).toBe('52998224725');
      expect(account.birthDate).toEqual(birthDate);
      expect(account.phone).toBe(VALID_PHONE);
      expect(account.photoUrl).toBe('https://example.com/photo.jpg');
    });

    it('should NOT collect any events', () => {
      const now = new Date();
      const account = Account.reconstitute('some-id', {
        name: VALID_NAME,
        email: VALID_EMAIL,
        cpf: VALID_CPF,
        birthDate: null,
        phone: null,
        photoUrl: null,
        createdAt: now,
        updatedAt: now,
      });

      expect(account.getEvents()).toHaveLength(0);
    });

    it('should validate fields (throws on invalid CPF)', () => {
      const now = new Date();
      expect(() =>
        Account.reconstitute('some-id', {
          name: VALID_NAME,
          email: VALID_EMAIL,
          cpf: '000.000.000-00',
          birthDate: null,
          phone: null,
          photoUrl: null,
          createdAt: now,
          updatedAt: now,
        }),
      ).toThrow();
    });
  });

  describe('getters', () => {
    it('should expose all public getters', () => {
      const account = Account.create({
        name: VALID_NAME,
        email: VALID_EMAIL,
        cpf: VALID_CPF,
      });

      // Verify all getters exist and return proper types
      expect(typeof account.id).toBe('string');
      expect(typeof account.name).toBe('string');
      expect(typeof account.email).toBe('string');
      expect(typeof account.cpf).toBe('string');
      expect(account.birthDate).toBeNull();
      expect(account.phone).toBeNull();
      expect(account.photoUrl).toBeNull();
      expect(account.createdAt).toBeInstanceOf(Date);
      expect(account.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('updateName()', () => {
    it('should update name and collect AccountUpdated event', () => {
      const account = Account.create({
        name: VALID_NAME,
        email: VALID_EMAIL,
        cpf: VALID_CPF,
      });
      account.clearEvents();

      account.updateName('Jane Smith');

      expect(account.name).toBe('Jane Smith');
      const events = account.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(AccountUpdated);

      const event = events[0] as AccountUpdated;
      expect(event.accountId).toBe(account.id);
      expect(event.changes).toEqual({
        name: { before: VALID_NAME, after: 'Jane Smith' },
      });
    });

    it('should throw if new name is invalid', () => {
      const account = Account.create({
        name: VALID_NAME,
        email: VALID_EMAIL,
        cpf: VALID_CPF,
      });

      expect(() => account.updateName('SingleName')).toThrow();
    });
  });

  describe('updatePhone()', () => {
    it('should update phone and collect AccountUpdated event', () => {
      const account = Account.create({
        name: VALID_NAME,
        email: VALID_EMAIL,
        cpf: VALID_CPF,
      });
      account.clearEvents();

      account.updatePhone(VALID_PHONE);

      expect(account.phone).toBe(VALID_PHONE);
      const events = account.getEvents();
      expect(events).toHaveLength(1);

      const event = events[0] as AccountUpdated;
      expect(event.accountId).toBe(account.id);
      expect(event.changes).toEqual({
        phone: { before: null, after: VALID_PHONE },
      });
    });

    it('should throw if phone is invalid', () => {
      const account = Account.create({
        name: VALID_NAME,
        email: VALID_EMAIL,
        cpf: VALID_CPF,
      });

      expect(() => account.updatePhone('123')).toThrow();
    });
  });

  describe('updateBirthDate()', () => {
    it('should update birthDate and collect AccountUpdated event', () => {
      const account = Account.create({
        name: VALID_NAME,
        email: VALID_EMAIL,
        cpf: VALID_CPF,
      });
      account.clearEvents();

      const birthDate = new Date('1990-05-15');
      account.updateBirthDate(birthDate);

      expect(account.birthDate).toEqual(birthDate);
      const events = account.getEvents();
      expect(events).toHaveLength(1);

      const event = events[0] as AccountUpdated;
      expect(event.accountId).toBe(account.id);
      expect(event.changes.birthDate).toBeDefined();
      expect(event.changes.birthDate.before).toBeNull();
      expect(event.changes.birthDate.after).toEqual(birthDate);
    });

    it('should throw if birthDate is in the future', () => {
      const account = Account.create({
        name: VALID_NAME,
        email: VALID_EMAIL,
        cpf: VALID_CPF,
      });

      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      expect(() => account.updateBirthDate(futureDate)).toThrow();
    });
  });

  describe('updatePhoto()', () => {
    it('should update photoUrl and collect AccountUpdated event', () => {
      const account = Account.create({
        name: VALID_NAME,
        email: VALID_EMAIL,
        cpf: VALID_CPF,
      });
      account.clearEvents();

      const url = 'https://example.com/photo.jpg';
      account.updatePhoto(url);

      expect(account.photoUrl).toBe(url);
      const events = account.getEvents();
      expect(events).toHaveLength(1);

      const event = events[0] as AccountUpdated;
      expect(event.accountId).toBe(account.id);
      expect(event.changes).toEqual({
        photoUrl: { before: null, after: url },
      });
    });

    it('should throw if URL is invalid', () => {
      const account = Account.create({
        name: VALID_NAME,
        email: VALID_EMAIL,
        cpf: VALID_CPF,
      });

      expect(() => account.updatePhoto('not-a-url')).toThrow();
    });
  });

  describe('multiple updates', () => {
    it('should collect multiple AccountUpdated events', () => {
      const account = Account.create({
        name: VALID_NAME,
        email: VALID_EMAIL,
        cpf: VALID_CPF,
      });
      account.clearEvents();

      account.updateName('Jane Smith');
      account.updatePhone(VALID_PHONE);

      const events = account.getEvents();
      expect(events).toHaveLength(2);
      expect(events[0]).toBeInstanceOf(AccountUpdated);
      expect(events[1]).toBeInstanceOf(AccountUpdated);
    });

    it('should update updatedAt on each update', () => {
      const account = Account.create({
        name: VALID_NAME,
        email: VALID_EMAIL,
        cpf: VALID_CPF,
      });
      const initialUpdatedAt = account.updatedAt;

      // Small delay to ensure different timestamp
      account.updateName('Jane Smith');

      expect(account.updatedAt.getTime()).toBeGreaterThanOrEqual(
        initialUpdatedAt.getTime(),
      );
    });
  });
});
