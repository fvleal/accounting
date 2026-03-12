import { Injectable, Inject } from '@nestjs/common';
import { UseCase } from '../../../shared/application/use-case.base';
import { Account } from '../../domain/entities/account.entity';
import type { AccountRepositoryPort } from '../../domain/ports';
import { ACCOUNT_REPOSITORY_PORT } from '../../infrastructure/account-infrastructure.module';
import { AccountNotFoundError } from '../../domain/exceptions';

export interface GetMeInput {
  email: string;
}

export interface GetMeOutput {
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
export class GetMeQuery implements UseCase<GetMeInput, GetMeOutput> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY_PORT)
    private readonly accountRepo: AccountRepositoryPort,
  ) {}

  async execute(input: GetMeInput): Promise<GetMeOutput> {
    const account = await this.accountRepo.findByEmail(input.email);
    if (!account) throw new AccountNotFoundError(input.email);
    return this.toOutput(account);
  }

  private toOutput(account: Account): GetMeOutput {
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
