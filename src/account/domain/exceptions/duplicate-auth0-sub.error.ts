import { DomainException } from '../../../shared/domain/exceptions/domain-exception.base';

export class DuplicateAuth0SubError extends DomainException {
  public readonly code = 'DUPLICATE_AUTH0_SUB';

  constructor(auth0Sub: string) {
    super(`Auth0 subject already linked: ${auth0Sub}`, { auth0Sub });
  }
}
