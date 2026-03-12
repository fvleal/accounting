import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { SnackbarProvider } from 'notistack';
import { OnboardingPage } from '../pages/OnboardingPage';

// Mock useCreateAccount
const mockMutate = vi.fn();
const mockUseCreateAccount = vi.fn();
vi.mock('../hooks/useCreateAccount', () => ({
  useCreateAccount: () => mockUseCreateAccount(),
}));

// Mock react-router useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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

describe('OnboardingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCreateAccount.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    });
  });

  it('renders name and CPF fields', () => {
    render(<OnboardingPage />, { wrapper: createWrapper() });

    expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cpf/i)).toBeInTheDocument();
  });

  it('shows required errors on empty submit', async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />, { wrapper: createWrapper() });

    const submitButton = screen.getByRole('button', { name: /criar conta/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Nome completo e obrigatorio')).toBeInTheDocument();
    });
    expect(screen.getByText('CPF e obrigatorio')).toBeInTheDocument();
  });

  it('validates name requires two words', async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />, { wrapper: createWrapper() });

    const nameField = screen.getByLabelText(/nome completo/i);
    await user.type(nameField, 'Fulano');
    await user.tab(); // trigger blur

    await waitFor(() => {
      expect(screen.getByText('Informe nome e sobrenome')).toBeInTheDocument();
    });
  });

  it('validates name word length', async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />, { wrapper: createWrapper() });

    const nameField = screen.getByLabelText(/nome completo/i);
    await user.type(nameField, 'Jo A');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('Cada parte do nome deve ter pelo menos 2 caracteres')).toBeInTheDocument();
    });
  });

  it('validates CPF check digits', async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />, { wrapper: createWrapper() });

    const cpfField = screen.getByLabelText(/cpf/i);
    await user.type(cpfField, '11111111111');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('CPF invalido')).toBeInTheDocument();
    });
  });

  it('masks CPF input', async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />, { wrapper: createWrapper() });

    const cpfField = screen.getByLabelText(/cpf/i);
    await user.type(cpfField, '52998224725');

    expect(cpfField).toHaveValue('529.982.247-25');
  });

  it('submits and redirects on success', async () => {
    // Make mutate call onSuccess immediately
    mockMutate.mockImplementation(
      (data: { name: string; cpf: string }, options?: { onSuccess?: (account: any) => void; onError?: (error: any) => void }) => {
        const account = {
          id: '1',
          fullName: data.name,
          email: 'test@example.com',
          cpf: data.cpf,
          dateOfBirth: null,
          phone: null,
          photoUrl: null,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        };
        options?.onSuccess?.(account);
      },
    );

    const user = userEvent.setup();
    render(<OnboardingPage />, { wrapper: createWrapper() });

    const nameField = screen.getByLabelText(/nome completo/i);
    const cpfField = screen.getByLabelText(/cpf/i);

    await user.type(nameField, 'Fulano Silva');
    await user.type(cpfField, '52998224725');

    const submitButton = screen.getByRole('button', { name: /criar conta/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        { name: 'Fulano Silva', cpf: '52998224725' },
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        }),
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('shows toast on success', async () => {
    mockMutate.mockImplementation(
      (_data: { name: string; cpf: string }, options?: { onSuccess?: (account: any) => void }) => {
        const account = { id: '1', fullName: 'Fulano Silva', email: 'test@example.com', cpf: '52998224725', dateOfBirth: null, phone: null, photoUrl: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' };
        options?.onSuccess?.(account);
      },
    );

    const user = userEvent.setup();
    render(<OnboardingPage />, { wrapper: createWrapper() });

    await user.type(screen.getByLabelText(/nome completo/i), 'Fulano Silva');
    await user.type(screen.getByLabelText(/cpf/i), '52998224725');
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Conta criada!', { variant: 'success' });
    });
  });

  it('shows inline CPF error on backend 409', async () => {
    const error409 = new Error('CPF already exists');
    (error409 as any).response = { status: 409, data: { message: 'CPF ja cadastrado' } };

    mockMutate.mockImplementation(
      (_data: { name: string; cpf: string }, options?: { onError?: (error: any) => void }) => {
        options?.onError?.(error409);
      },
    );

    const user = userEvent.setup();
    render(<OnboardingPage />, { wrapper: createWrapper() });

    await user.type(screen.getByLabelText(/nome completo/i), 'Fulano Silva');
    await user.type(screen.getByLabelText(/cpf/i), '52998224725');
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => {
      expect(screen.getByText('CPF ja cadastrado')).toBeInTheDocument();
    });
  });

  it('shows loading state on submit button', () => {
    mockUseCreateAccount.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isError: false,
      error: null,
    });

    render(<OnboardingPage />, { wrapper: createWrapper() });

    const submitButton = screen.getByRole('button', { name: /criar conta/i });
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveClass('MuiButton-loading');
  });
});
