import { Injectable, Inject } from '@nestjs/common';
import { UseCase } from '../../../shared/application/use-case.base';
import { Account } from '../../domain/entities/account.entity';
import { AccountRepositoryPort } from '../../domain/ports';
import { ACCOUNT_REPOSITORY_PORT } from '../../infrastructure/account-infrastructure.module';
import { AccountNotFoundError } from '../../domain/exceptions';

export interface GetAccountByIdInput {
  id: string;
}

export interface GetAccountByIdOutput {
  id: string;
  auth0Sub: string;
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
export class GetAccountByIdQuery
  implements UseCase<GetAccountByIdInput, GetAccountByIdOutput>
{
  constructor(
    @Inject(ACCOUNT_REPOSITORY_PORT)
    private readonly accountRepo: AccountRepositoryPort,
  ) {}

  async execute(input: GetAccountByIdInput): Promise<GetAccountByIdOutput> {
    const account = await this.accountRepo.findById(input.id);
    if (!account) throw new AccountNotFoundError(input.id);
    return this.toOutput(account);
  }

  private toOutput(account: Account): GetAccountByIdOutput {
    return {
      id: account.id,
      auth0Sub: account.auth0Sub,
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
