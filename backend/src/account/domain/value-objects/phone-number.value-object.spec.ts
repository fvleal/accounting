import { describe, it, expect } from 'vitest';
import { PhoneNumber } from './phone-number.value-object';

describe('PhoneNumber', () => {
  it('should create with valid mobile number (11 digits with 9)', () => {
    const phone = PhoneNumber.create('11999887766');
    expect(phone.value).toBe('11999887766');
  });

  it('should create with valid landline number (10 digits)', () => {
    const phone = PhoneNumber.create('1133445566');
    expect(phone.value).toBe('1133445566');
  });

  it('should strip mask characters', () => {
    const phone = PhoneNumber.create('(11) 99988-7766');
    expect(phone.value).toBe('11999887766');
  });

  it('should throw on too-short number', () => {
    expect(() => PhoneNumber.create('123')).toThrow();
  });

  it('should throw when DDD starts with 0', () => {
    expect(() => PhoneNumber.create('0099887766')).toThrow();
  });

  it('should throw on empty string', () => {
    expect(() => PhoneNumber.create('')).toThrow();
  });

  it('should return digits only via value getter', () => {
    const phone = PhoneNumber.create('(11) 99988-7766');
    expect(phone.value).toMatch(/^\d+$/);
  });
});
