import { Injectable, Inject } from '@nestjs/common';
import { UseCase } from '../../../shared/application/use-case.base';
import { Account } from '../../domain/entities/account.entity';
import { AccountRepositoryPort, StoragePort } from '../../domain/ports';
import {
  ACCOUNT_REPOSITORY_PORT,
  STORAGE_PORT,
} from '../../infrastructure/account-infrastructure.module';
import { AccountNotFoundError } from '../../domain/exceptions';

export interface UploadAccountPhotoInput {
  accountId: string;
  buffer: Buffer;
  contentType: string;
}

export interface UploadAccountPhotoOutput {
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
export class UploadAccountPhotoCommand
  implements UseCase<UploadAccountPhotoInput, UploadAccountPhotoOutput>
{
  constructor(
    @Inject(ACCOUNT_REPOSITORY_PORT)
    private readonly accountRepo: AccountRepositoryPort,
    @Inject(STORAGE_PORT)
    private readonly storage: StoragePort,
  ) {}

  async execute(
    input: UploadAccountPhotoInput,
  ): Promise<UploadAccountPhotoOutput> {
    const account = await this.accountRepo.findById(input.accountId);
    if (!account) throw new AccountNotFoundError(input.accountId);

    const key = `accounts/${account.id}/photo`;
    const url = await this.storage.upload(key, input.buffer, input.contentType);

    account.updatePhoto(url);
    await this.accountRepo.save(account);

    return this.toOutput(account);
  }

  private toOutput(account: Account): UploadAccountPhotoOutput {
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
