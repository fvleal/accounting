import { Injectable, Inject } from '@nestjs/common';
import { UseCase } from '../../../shared/application/use-case.base';
import { Account } from '../../domain/entities/account.entity';
import type { AccountRepositoryPort } from '../../domain/ports';
import { ACCOUNT_REPOSITORY_PORT } from '../../infrastructure/account-infrastructure.module';
import {
  DuplicateEmailError,
  DuplicateCpfError,
} from '../../domain/exceptions';

export interface CreateAccountInput {
  email: string;
  name: string;
  cpf: string;
}

export interface CreateAccountOutput {
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
export class CreateAccountCommand implements UseCase<
  CreateAccountInput,
  CreateAccountOutput
> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY_PORT)
    private readonly accountRepo: AccountRepositoryPort,
  ) {}

  async execute(input: CreateAccountInput): Promise<CreateAccountOutput> {
    // Idempotency: return existing if email already linked
    const byEmail = await this.accountRepo.findByEmail(input.email);
    if (byEmail) {
      return this.toOutput(byEmail);
    }

    // Uniqueness check
    const byCpf = await this.accountRepo.findByCpf(input.cpf);
    if (byCpf) throw new DuplicateCpfError(input.cpf);

    // Create and persist
    const account = Account.create({
      name: input.name,
      email: input.email,
      cpf: input.cpf,
    });

    await this.accountRepo.save(account);

    return this.toOutput(account);
  }

  private toOutput(account: Account): CreateAccountOutput {
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
