import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import React from 'react';
import { useUploadPhoto } from '../hooks/useUploadPhoto';
import type { Account } from '../types/account';

// Mock the accounts API module
vi.mock('../api/accounts', () => ({
  uploadPhoto: vi.fn(),
}));

import { uploadPhoto } from '../api/accounts';

const mockUploadPhoto = vi.mocked(uploadPhoto);

const fakeAccount: Account = {
  id: '123',
  name: 'Test User',
  email: 'test@example.com',
  cpf: '12345678901',
  birthDate: null,
  phone: null,
  phoneVerified: false,
  photoUrl: 'https://example.com/photo.jpg',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

let queryClient: QueryClient;

function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
});

describe('useUploadPhoto', () => {
  it('calls uploadPhoto API with the provided File', async () => {
    mockUploadPhoto.mockResolvedValue(fakeAccount);
    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });

    const { result } = renderHook(() => useUploadPhoto(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(file);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockUploadPhoto).toHaveBeenCalledWith(file);
  });

  it('updates React Query cache for account on success', async () => {
    mockUploadPhoto.mockResolvedValue(fakeAccount);
    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });

    const { result } = renderHook(() => useUploadPhoto(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(file);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const cachedAccount = queryClient.getQueryData(['account', 'me']);
    expect(cachedAccount).toEqual(fakeAccount);
  });
});
