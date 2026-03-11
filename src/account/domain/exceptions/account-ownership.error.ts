import { DomainException } from '../../../shared/domain/exceptions/domain-exception.base';

export class AccountOwnershipError extends DomainException {
  public readonly code = 'ACCOUNT_OWNERSHIP_VIOLATION';

  constructor(accountId: string) {
    super(`You do not own account: ${accountId}`, { accountId });
  }
}
