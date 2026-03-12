import { useQuery } from '@tanstack/react-query';
import { getMe } from '../api/accounts';
import type { Account } from '../types/account';

export function useAccount() {
  return useQuery<Account>({
    queryKey: ['account', 'me'],
    queryFn: getMe,
    retry: (failureCount, error: any) => {
      // Don't retry 404 -- it means "no account"
      if (error?.response?.status === 404) return false;
      return failureCount < 1;
    },
  });
}
