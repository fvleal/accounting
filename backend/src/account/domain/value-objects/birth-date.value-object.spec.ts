import { describe, it, expect } from 'vitest';
import { BirthDate } from './birth-date.value-object';

describe('BirthDate', () => {
  it('should create with a past date', () => {
    const bd = BirthDate.create(new Date('1990-01-15'));
    expect(bd.value).toBeInstanceOf(Date);
  });

  it('should create with another valid past date', () => {
    const bd = BirthDate.create(new Date('2000-12-31'));
    expect(bd.value.toISOString()).toContain('2000-12-31');
  });

  it('should throw on future date', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    expect(() => BirthDate.create(futureDate)).toThrow();
  });

  it('should return the date via value getter', () => {
    const date = new Date('1990-01-15');
    const bd = BirthDate.create(date);
    expect(bd.value.getFullYear()).toBe(1990);
  });

  it('should be equal when dates match', () => {
    const bd1 = BirthDate.create(new Date('1990-01-15'));
    const bd2 = BirthDate.create(new Date('1990-01-15'));
    expect(bd1.equals(bd2)).toBe(true);
  });

  it('should not be equal when dates differ', () => {
    const bd1 = BirthDate.create(new Date('1990-01-15'));
    const bd2 = BirthDate.create(new Date('1995-06-20'));
    expect(bd1.equals(bd2)).toBe(false);
  });
});
