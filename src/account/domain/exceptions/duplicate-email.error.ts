import { DomainException } from '../../../shared/domain/exceptions/domain-exception.base';

export class DuplicateEmailError extends DomainException {
  public readonly code = 'DUPLICATE_EMAIL';

  constructor(email: string) {
    super(`Email already in use: ${email}`, { email });
  }
}
