import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadPhoto } from '../api/accounts';
import type { Account } from '../types/account';

export function useUploadPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadPhoto(file),
    onSuccess: (account: Account) => {
      const busted = account.photoUrl
        ? { ...account, photoUrl: `${account.photoUrl}?t=${Date.now()}` }
        : account;
      queryClient.setQueryData(['account', 'me'], busted);
    },
  });
}
