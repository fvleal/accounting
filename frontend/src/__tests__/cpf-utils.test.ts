import { describe, it, expect } from 'vitest';
import { maskCpf, unmaskCpf } from '../utils/cpf';

describe('maskCpf', () => {
  it('returns empty string for empty input', () => {
    expect(maskCpf('')).toBe('');
  });

  it('returns digits only for 3 or fewer digits', () => {
    expect(maskCpf('123')).toBe('123');
  });

  it('adds first dot after 3 digits', () => {
    expect(maskCpf('1234')).toBe('123.4');
  });

  it('formats up to 7 digits with one dot', () => {
    expect(maskCpf('1234567')).toBe('123.456.7');
  });

  it('formats full 11-digit CPF', () => {
    expect(maskCpf('12345678909')).toBe('123.456.789-09');
  });

  it('truncates input beyond 11 digits', () => {
    expect(maskCpf('123456789091234')).toBe('123.456.789-09');
  });

  it('strips non-digit characters before masking', () => {
    expect(maskCpf('123.456.789-09')).toBe('123.456.789-09');
  });
});

describe('unmaskCpf', () => {
  it('removes dots and dash from formatted CPF', () => {
    expect(unmaskCpf('123.456.789-09')).toBe('12345678909');
  });

  it('returns digits only from any input', () => {
    expect(unmaskCpf('abc123def')).toBe('123');
  });

  it('returns empty string for empty input', () => {
    expect(unmaskCpf('')).toBe('');
  });
});
