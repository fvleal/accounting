import { Account } from '../entities/account.entity';

export interface AccountRepositoryPort {
  save(account: Account): Promise<void>;
  findById(id: string): Promise<Account | null>;
  findByEmail(email: string): Promise<Account | null>;
  findByCpf(cpf: string): Promise<Account | null>;
  exists(id: string): Promise<boolean>;
}
