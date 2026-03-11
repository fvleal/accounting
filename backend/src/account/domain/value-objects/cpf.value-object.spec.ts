import { describe, it, expect } from 'vitest';
import { CPF } from './cpf.value-object';

describe('CPF', () => {
  it('should create with valid masked CPF', () => {
    const cpf = CPF.create('529.982.247-25');
    expect(cpf.value).toBe('52998224725');
  });

  it('should create with valid unmasked CPF', () => {
    const cpf = CPF.create('52998224725');
    expect(cpf.value).toBe('52998224725');
  });

  it('should throw on all-same-digit CPF (111.111.111-11)', () => {
    expect(() => CPF.create('111.111.111-11')).toThrow();
  });

  it('should throw on all-zeros CPF (000.000.000-00)', () => {
    expect(() => CPF.create('000.000.000-00')).toThrow();
  });

  it('should throw on too-short input', () => {
    expect(() => CPF.create('12345')).toThrow();
  });

  it('should throw on empty string', () => {
    expect(() => CPF.create('')).toThrow();
  });

  it('should return digits only via value getter', () => {
    const cpf = CPF.create('529.982.247-25');
    expect(cpf.value).toMatch(/^\d{11}$/);
  });

  it('should return formatted string via formatted getter', () => {
    const cpf = CPF.create('52998224725');
    expect(cpf.formatted).toBe('529.982.247-25');
  });

  it('should be equal when digits match', () => {
    const cpf1 = CPF.create('529.982.247-25');
    const cpf2 = CPF.create('52998224725');
    expect(cpf1.equals(cpf2)).toBe(true);
  });
});
