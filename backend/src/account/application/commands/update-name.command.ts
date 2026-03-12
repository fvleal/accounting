import { Injectable, Inject } from '@nestjs/common';
import { UseCase } from '../../../shared/application/use-case.base';
import { Account } from '../../domain/entities/account.entity';
import type { AccountRepositoryPort } from '../../domain/ports';
import { ACCOUNT_REPOSITORY_PORT } from '../../infrastructure/account-infrastructure.module';
import {
  AccountNotFoundError,
  AccountOwnershipError,
} from '../../domain/exceptions';

export interface UpdateNameInput {
  accountId: string;
  email: string;
  name: string;
}

export interface UpdateNameOutput {
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
export class UpdateNameCommand implements UseCase<
  UpdateNameInput,
  UpdateNameOutput
> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY_PORT)
    private readonly accountRepo: AccountRepositoryPort,
  ) {}

  async execute(input: UpdateNameInput): Promise<UpdateNameOutput> {
    const account = await this.accountRepo.findById(input.accountId);
    if (!account) throw new AccountNotFoundError(input.accountId);
    if (account.email !== input.email)
      throw new AccountOwnershipError(input.accountId);

    account.updateName(input.name);
    await this.accountRepo.save(account);

    return this.toOutput(account);
  }

  private toOutput(account: Account): UpdateNameOutput {
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
