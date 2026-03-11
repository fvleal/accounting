import { describe, it, expect } from 'vitest';
import { Email } from './email.value-object';

describe('Email', () => {
  it('should create with valid email', () => {
    const email = Email.create('user@example.com');
    expect(email.value).toBe('user@example.com');
  });

  it('should normalize to lowercase', () => {
    const email = Email.create('USER@EXAMPLE.COM');
    expect(email.value).toBe('user@example.com');
  });

  it('should trim whitespace', () => {
    const email = Email.create('  user@example.com  ');
    expect(email.value).toBe('user@example.com');
  });

  it('should throw on invalid format', () => {
    expect(() => Email.create('invalid')).toThrow('Invalid email format');
  });

  it('should throw on empty string', () => {
    expect(() => Email.create('')).toThrow();
  });

  it('should throw on @missing.com', () => {
    expect(() => Email.create('@missing.com')).toThrow();
  });

  it('should be equal when addresses match', () => {
    const email1 = Email.create('user@example.com');
    const email2 = Email.create('user@example.com');
    expect(email1.equals(email2)).toBe(true);
  });

  it('should not be equal when addresses differ', () => {
    const email1 = Email.create('user1@example.com');
    const email2 = Email.create('user2@example.com');
    expect(email1.equals(email2)).toBe(false);
  });
});
