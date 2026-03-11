import { DomainException } from '../../../shared/domain/exceptions/domain-exception.base';

export class AccountNotFoundError extends DomainException {
  public readonly code = 'ACCOUNT_NOT_FOUND';

  constructor(identifier: string) {
    super(`Account not found: ${identifier}`, { identifier });
  }
}
