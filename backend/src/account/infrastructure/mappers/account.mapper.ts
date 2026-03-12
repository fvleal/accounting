import { Account } from '../../domain/entities/account.entity';
import type { AccountModel } from '../../../generated/prisma/models/Account';

export class AccountMapper {
  static toDomain(raw: AccountModel): Account {
    return Account.reconstitute(raw.id, {
      name: raw.name,
      email: raw.email,
      cpf: raw.cpf,
      birthDate: raw.birthDate,
      phone: raw.phone,
      photoUrl: raw.photoUrl,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(account: Account) {
    return {
      id: account.id,
      name: account.name,
      email: account.email,
      cpf: account.cpf,
      birthDate: account.birthDate,
      phone: account.phone,
      phoneVerified: false,
      photoUrl: account.photoUrl,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }
}
