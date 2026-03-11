import { Injectable, Inject } from '@nestjs/common';
import { UseCase } from '../../../shared/application/use-case.base';
import { Account } from '../../domain/entities/account.entity';
import { AccountRepositoryPort } from '../../domain/ports';
import { ACCOUNT_REPOSITORY_PORT } from '../../infrastructure/account-infrastructure.module';
import { AccountNotFoundError } from '../../domain/exceptions';

export interface UpdatePhoneInput {
  accountId: string;
  phone: string;
}

export interface UpdatePhoneOutput {
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
export class UpdatePhoneCommand
  implements UseCase<UpdatePhoneInput, UpdatePhoneOutput>
{
  constructor(
    @Inject(ACCOUNT_REPOSITORY_PORT)
    private readonly accountRepo: AccountRepositoryPort,
  ) {}

  async execute(input: UpdatePhoneInput): Promise<UpdatePhoneOutput> {
    const account = await this.accountRepo.findById(input.accountId);
    if (!account) throw new AccountNotFoundError(input.accountId);

    account.updatePhone(input.phone);
    await this.accountRepo.save(account);

    return this.toOutput(account);
  }

  private toOutput(account: Account): UpdatePhoneOutput {
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
