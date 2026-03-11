import { Account } from '../entities/account.entity';

export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export interface AccountRepositoryPort {
  save(account: Account): Promise<void>;
  findById(id: string): Promise<Account | null>;
  findByEmail(email: string): Promise<Account | null>;
  findByCpf(cpf: string): Promise<Account | null>;
  findByAuth0Sub(auth0Sub: string): Promise<Account | null>;
  findAll(params: PaginationParams): Promise<PaginatedResult<Account>>;
}
