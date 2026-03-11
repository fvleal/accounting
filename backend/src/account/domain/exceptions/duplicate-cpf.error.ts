import { DomainException } from '../../../shared/domain/exceptions/domain-exception.base';

export class DuplicateCpfError extends DomainException {
  public readonly code = 'DUPLICATE_CPF';

  constructor(cpf: string) {
    super(`CPF already in use: ${cpf}`, { cpf });
  }
}
