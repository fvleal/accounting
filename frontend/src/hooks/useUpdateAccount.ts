import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateAccount } from '../api/accounts';
import type { Account } from '../types/account';

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; data: { name?: string; birthDate?: string } }) =>
      updateAccount(input.id, input.data),
    onSuccess: (account: Account) => {
      queryClient.setQueryData(['account', 'me'], account);
    },
  });
}
