import { Injectable, Inject } from '@nestjs/common';
import { UseCase } from '../../../shared/application/use-case.base';
import { Account } from '../../domain/entities/account.entity';
import type { AccountRepositoryPort } from '../../domain/ports';
import { ACCOUNT_REPOSITORY_PORT } from '../../infrastructure/account-infrastructure.module';

export interface ListAccountsInput {
  limit: number;
  offset: number;
}

export interface AccountSummary {
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

export interface ListAccountsOutput {
  data: AccountSummary[];
  total: number;
}

@Injectable()
export class ListAccountsQuery implements UseCase<
  ListAccountsInput,
  ListAccountsOutput
> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY_PORT)
    private readonly accountRepo: AccountRepositoryPort,
  ) {}

  async execute(input: ListAccountsInput): Promise<ListAccountsOutput> {
    const result = await this.accountRepo.findAll({
      limit: input.limit,
      offset: input.offset,
    });

    return {
      data: result.data.map((account) => this.toOutput(account)),
      total: result.total,
    };
  }

  private toOutput(account: Account): AccountSummary {
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
