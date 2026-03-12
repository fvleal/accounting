import { describe, it, expect } from 'vitest';
import { formatBirthday } from '../utils/date';

describe('formatBirthday', () => {
  it('formats ISO date string to DD/MM/YYYY', () => {
    expect(formatBirthday('2000-01-15')).toBe('15/01/2000');
  });

  it('formats ISO datetime string to DD/MM/YYYY (strips T suffix)', () => {
    expect(formatBirthday('2000-01-15T00:00:00.000Z')).toBe('15/01/2000');
  });

  it('returns null for null input', () => {
    expect(formatBirthday(null)).toBeNull();
  });

  it('handles end-of-year date correctly', () => {
    expect(formatBirthday('1995-12-31')).toBe('31/12/1995');
  });

  it('returns raw input for unexpected format', () => {
    expect(formatBirthday('invalid')).toBe('invalid');
  });
});
