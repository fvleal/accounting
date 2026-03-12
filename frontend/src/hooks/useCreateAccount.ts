import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAccount } from '../api/accounts';
import type { Account } from '../types/account';

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; cpf: string }) => createAccount(data),
    onSuccess: (account: Account) => {
      queryClient.setQueryData(['account', 'me'], account);
    },
  });
}
