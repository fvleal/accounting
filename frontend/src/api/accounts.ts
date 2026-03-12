import apiClient from './client';
import type { Account } from '../types/account';

export function getMe(): Promise<Account> {
  return apiClient.get<Account>('/accounts/me').then((r) => r.data);
}

export function createAccount(data: { name: string; cpf: string }): Promise<Account> {
  return apiClient.post<Account>('/accounts', data).then((r) => r.data);
}
