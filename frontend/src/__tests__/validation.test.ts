import { describe, it, expect } from 'vitest';
import { nameRules } from '../utils/validation';

describe('nameRules', () => {
  describe('required', () => {
    it('returns error message for required field', () => {
      expect(nameRules.required).toBe('Nome completo e obrigatorio');
    });
  });

  describe('validate', () => {
    it('returns error for single word', () => {
      expect(nameRules.validate('Fulano')).toBe('Informe nome e sobrenome');
    });

    it('returns error for empty string after trim', () => {
      expect(nameRules.validate('   ')).toBe('Informe nome e sobrenome');
    });

    it('returns error when any word has fewer than 2 characters', () => {
      expect(nameRules.validate('Jo A')).toBe(
        'Cada parte do nome deve ter pelo menos 2 caracteres',
      );
    });

    it('returns true for valid two-word name', () => {
      expect(nameRules.validate('Felipe Vieira')).toBe(true);
    });

    it('returns true for name with extra whitespace', () => {
      expect(nameRules.validate('  Felipe   Vieira  ')).toBe(true);
    });

    it('returns true for three-word name', () => {
      expect(nameRules.validate('Felipe Costa Vieira')).toBe(true);
    });
  });
});
