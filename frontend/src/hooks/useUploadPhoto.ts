import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadPhoto } from '../api/accounts';
import type { Account } from '../types/account';

export function useUploadPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadPhoto(file),
    onSuccess: (account: Account) => {
      queryClient.setQueryData(['account', 'me'], account);
    },
  });
}
