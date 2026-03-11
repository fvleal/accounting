import { Injectable, Inject } from '@nestjs/common';
import { UseCase } from '../../../shared/application/use-case.base';
import { Account } from '../../domain/entities/account.entity';
import type { AccountRepositoryPort } from '../../domain/ports';
import { ACCOUNT_REPOSITORY_PORT } from '../../infrastructure/account-infrastructure.module';
import { AccountNotFoundError } from '../../domain/exceptions';

export interface GetMeInput {
  auth0Sub: string;
}

export interface GetMeOutput {
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
export class GetMeQuery implements UseCase<GetMeInput, GetMeOutput> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY_PORT)
    private readonly accountRepo: AccountRepositoryPort,
  ) {}

  async execute(input: GetMeInput): Promise<GetMeOutput> {
    const account = await this.accountRepo.findByAuth0Sub(input.auth0Sub);
    if (!account) throw new AccountNotFoundError(input.auth0Sub);
    return this.toOutput(account);
  }

  private toOutput(account: Account): GetMeOutput {
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
