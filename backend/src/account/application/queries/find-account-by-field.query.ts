import { Injectable, Inject } from '@nestjs/common';
import { UseCase } from '../../../shared/application/use-case.base';
import { Account } from '../../domain/entities/account.entity';
import type { AccountRepositoryPort } from '../../domain/ports';
import { ACCOUNT_REPOSITORY_PORT } from '../../infrastructure/account-infrastructure.module';
import { AccountNotFoundError } from '../../domain/exceptions';

export interface FindAccountByFieldInput {
  field: 'email' | 'cpf';
  value: string;
}

export interface FindAccountByFieldOutput {
  id: string;
  name: string;
  email: string;
  cpf: string;
  birthDate: Date | null;
  phone: string | null;
  photoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class FindAccountByFieldQuery implements UseCase<
  FindAccountByFieldInput,
  FindAccountByFieldOutput
> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY_PORT)
    private readonly accountRepo: AccountRepositoryPort,
  ) {}

  async execute(
    input: FindAccountByFieldInput,
  ): Promise<FindAccountByFieldOutput> {
    let account: Account | null;

    switch (input.field) {
      case 'email':
        account = await this.accountRepo.findByEmail(input.value);
        break;
      case 'cpf':
        account = await this.accountRepo.findByCpf(input.value);
        break;
      default:
        throw new Error(`Unsupported field: ${input.field}`);
    }

    if (!account) throw new AccountNotFoundError(input.value);
    return this.toOutput(account);
  }

  private toOutput(account: Account): FindAccountByFieldOutput {
    return {
      id: account.id,
      name: account.name,
      email: account.email,
      cpf: account.cpf,
      birthDate: account.birthDate,
      phone: account.phone,
      photoUrl: account.photoUrl,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }
}
