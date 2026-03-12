import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { SnackbarProvider } from 'notistack';
import { EditNameModal } from '../components/profile/EditNameModal';
import type { Account } from '../types/account';

// Mock useUpdateAccount
const mockMutate = vi.fn();
const mockUseUpdateAccount = vi.fn();
vi.mock('../hooks/useUpdateAccount', () => ({
  useUpdateAccount: () => mockUseUpdateAccount(),
}));

// Mock notistack useSnackbar
const mockEnqueueSnackbar = vi.fn();
vi.mock('notistack', async () => {
  const actual = await vi.importActual<typeof import('notistack')>('notistack');
  return {
    ...actual,
    useSnackbar: () => ({
      enqueueSnackbar: mockEnqueueSnackbar,
      closeSnackbar: vi.fn(),
    }),
  };
});

const testAccount: Account = {
  id: 'acc-1',
  name: 'Felipe Vieira',
  email: 'felipe@test.com',
  cpf: '52998224725',
  birthDate: '2000-01-15',
  phone: '11987654321',
  phoneVerified: false,
  photoUrl: null,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <SnackbarProvider>
          <MemoryRouter>{children}</MemoryRouter>
        </SnackbarProvider>
      </QueryClientProvider>
    );
  };
}

describe('EditNameModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUpdateAccount.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
  });

  it('renders nothing when open=false', () => {
    const { container } = render(
      <EditNameModal open={false} onClose={mockOnClose} account={testAccount} />,
      { wrapper: createWrapper() },
    );
    expect(container.innerHTML).toBe('');
  });

  it('shows "Editar nome" title and pre-filled name when open=true', () => {
    render(
      <EditNameModal open={true} onClose={mockOnClose} account={testAccount} />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('Editar nome')).toBeInTheDocument();
    expect(screen.getByLabelText(/nome completo/i)).toHaveValue('Felipe Vieira');
  });

  it('Cancel button calls onClose', async () => {
    const user = userEvent.setup();
    render(
      <EditNameModal open={true} onClose={mockOnClose} account={testAccount} />,
      { wrapper: createWrapper() },
    );

    await user.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('shows validation error for single word name on blur', async () => {
    const user = userEvent.setup();
    render(
      <EditNameModal open={true} onClose={mockOnClose} account={testAccount} />,
      { wrapper: createWrapper() },
    );

    const nameField = screen.getByLabelText(/nome completo/i);
    await user.clear(nameField);
    await user.type(nameField, 'Fulano');
    await user.tab(); // trigger blur

    await waitFor(() => {
      expect(screen.getByText('Informe nome e sobrenome')).toBeInTheDocument();
    });
  });

  it('submitting valid name calls mutate with correct payload', async () => {
    const user = userEvent.setup();
    render(
      <EditNameModal open={true} onClose={mockOnClose} account={testAccount} />,
      { wrapper: createWrapper() },
    );

    const nameField = screen.getByLabelText(/nome completo/i);
    await user.clear(nameField);
    await user.type(nameField, 'New Name');

    await user.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        { id: 'acc-1', data: { name: 'New Name' } },
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        }),
      );
    });
  });

  it('does not call API when submitting invalid name', async () => {
    const user = userEvent.setup();
    render(
      <EditNameModal open={true} onClose={mockOnClose} account={testAccount} />,
      { wrapper: createWrapper() },
    );

    const nameField = screen.getByLabelText(/nome completo/i);
    await user.clear(nameField);
    await user.type(nameField, 'Fulano');

    await user.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(screen.getByText('Informe nome e sobrenome')).toBeInTheDocument();
    });
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('calls onClose and shows success toast on success', async () => {
    mockMutate.mockImplementation(
      (_input: any, options?: { onSuccess?: () => void }) => {
        options?.onSuccess?.();
      },
    );

    const user = userEvent.setup();
    render(
      <EditNameModal open={true} onClose={mockOnClose} account={testAccount} />,
      { wrapper: createWrapper() },
    );

    const nameField = screen.getByLabelText(/nome completo/i);
    await user.clear(nameField);
    await user.type(nameField, 'New Name');
    await user.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Nome atualizado!', {
        variant: 'success',
      });
    });
  });

  it('does NOT call onClose and shows error toast on error', async () => {
    const apiError = new Error('Server error');
    (apiError as any).response = {
      data: { message: 'Nome invalido' },
    };

    mockMutate.mockImplementation(
      (_input: any, options?: { onError?: (error: any) => void }) => {
        options?.onError?.(apiError);
      },
    );

    const user = userEvent.setup();
    render(
      <EditNameModal open={true} onClose={mockOnClose} account={testAccount} />,
      { wrapper: createWrapper() },
    );

    const nameField = screen.getByLabelText(/nome completo/i);
    await user.clear(nameField);
    await user.type(nameField, 'New Name');
    await user.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Nome invalido', {
        variant: 'error',
      });
    });
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('Save and Cancel buttons disabled when isPending', () => {
    mockUseUpdateAccount.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
    });

    render(
      <EditNameModal open={true} onClose={mockOnClose} account={testAccount} />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /salvar/i })).toBeDisabled();
  });
});
