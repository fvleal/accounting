import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendPhoneCode } from '../api/accounts';
import type { Account } from '../types/account';

export function useSendPhoneCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (phone: string) => sendPhoneCode(phone),
    onSuccess: (account: Account) => {
      queryClient.setQueryData(['account', 'me'], account);
    },
  });
}
