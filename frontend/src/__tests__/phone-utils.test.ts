import { describe, it, expect } from 'vitest';
import { formatPhone } from '../utils/phone';

describe('formatPhone', () => {
  it('formats 11-digit mobile number', () => {
    expect(formatPhone('11987654321')).toBe('(11) 98765-4321');
  });

  it('formats 10-digit landline number', () => {
    expect(formatPhone('1134567890')).toBe('(11) 3456-7890');
  });

  it('strips country code 55 from 13-digit number', () => {
    expect(formatPhone('5511987654321')).toBe('(11) 98765-4321');
  });

  it('returns null for null input', () => {
    expect(formatPhone(null)).toBeNull();
  });

  it('returns raw input for unexpected format', () => {
    expect(formatPhone('123')).toBe('123');
  });

  it('handles already-formatted input by stripping non-digits first', () => {
    expect(formatPhone('(11) 98765-4321')).toBe('(11) 98765-4321');
  });
});
