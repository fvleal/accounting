import { describe, it, expect } from 'vitest';
import { DuplicateAuth0SubError } from './duplicate-auth0-sub.error';
import { DomainException } from '../../../shared/domain/exceptions/domain-exception.base';

describe('DuplicateAuth0SubError', () => {
  const auth0Sub = 'auth0|abc123';
  const error = new DuplicateAuth0SubError(auth0Sub);

  it('should extend DomainException', () => {
    expect(error).toBeInstanceOf(DomainException);
  });

  it('should have code DUPLICATE_AUTH0_SUB', () => {
    expect(error.code).toBe('DUPLICATE_AUTH0_SUB');
  });

  it('should include auth0Sub in message', () => {
    expect(error.message).toContain(auth0Sub);
  });

  it('should have metadata with auth0Sub', () => {
    expect(error.metadata).toEqual({ auth0Sub: 'auth0|abc123' });
  });
});
