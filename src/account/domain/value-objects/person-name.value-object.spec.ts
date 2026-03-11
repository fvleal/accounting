import { describe, it, expect } from 'vitest';
import { PersonName } from './person-name.value-object';

describe('PersonName', () => {
  it('should create with two words', () => {
    const name = PersonName.create('John Doe');
    expect(name.value).toBe('John Doe');
  });

  it('should create with three or more words', () => {
    const name = PersonName.create('Maria da Silva');
    expect(name.value).toBe('Maria da Silva');
  });

  it('should throw on single word', () => {
    expect(() => PersonName.create('John')).toThrow();
  });

  it('should throw on empty string', () => {
    expect(() => PersonName.create('')).toThrow();
  });

  it('should throw on whitespace only', () => {
    expect(() => PersonName.create('  ')).toThrow();
  });

  it('should return the full name via value getter', () => {
    const name = PersonName.create('John Doe');
    expect(name.value).toBe('John Doe');
  });
});
