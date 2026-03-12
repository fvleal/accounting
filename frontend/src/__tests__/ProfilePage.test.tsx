import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { SnackbarProvider } from 'notistack';
import { ProfilePage } from '../pages/ProfilePage';
import type { Account } from '../types/account';

// Mock useAccount hook
const mockUseAccount = vi.fn();
vi.mock('../hooks/useAccount', () => ({
  useAccount: () => mockUseAccount(),
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

const fullAccount: Account = {
  id: '1',
  fullName: 'Felipe Vieira',
  email: 'felipe@test.com',
  cpf: '52998224725',
  dateOfBirth: '2000-01-15',
  phone: '11987654321',
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

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // PROF-01: Profile fields displayed
  describe('PROF-01 - Profile fields displayed', () => {
    it('displays all profile fields with formatted values', () => {
      mockUseAccount.mockReturnValue({
        data: fullAccount,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<ProfilePage />, { wrapper: createWrapper() });

      // Name appears in hero and in Nome field row
      const nameElements = screen.getAllByText('Felipe Vieira');
      expect(nameElements.length).toBeGreaterThanOrEqual(2);

      // Email appears in hero and in Email field row
      const emailElements = screen.getAllByText('felipe@test.com');
      expect(emailElements.length).toBeGreaterThanOrEqual(2);

      // Formatted CPF
      expect(screen.getByText('529.982.247-25')).toBeInTheDocument();

      // Formatted birthday
      expect(screen.getByText('15/01/2000')).toBeInTheDocument();

      // Formatted phone
      expect(screen.getByText('(11) 98765-4321')).toBeInTheDocument();
    });

    it('displays Nao informado for null fields', () => {
      mockUseAccount.mockReturnValue({
        data: { ...fullAccount, dateOfBirth: null, phone: null },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<ProfilePage />, { wrapper: createWrapper() });

      const naoInformado = screen.getAllByText('Nao informado');
      expect(naoInformado).toHaveLength(2);
    });

    it('shows chevron for editable rows only', () => {
      mockUseAccount.mockReturnValue({
        data: fullAccount,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<ProfilePage />, { wrapper: createWrapper() });

      const chevrons = screen.getAllByTestId('chevron-icon');
      // Nome, Nascimento, Telefone = 3 editable rows
      expect(chevrons).toHaveLength(3);
    });
  });

  // PROF-02: Skeleton loading
  describe('PROF-02 - Skeleton loading', () => {
    it('shows skeleton while loading', () => {
      mockUseAccount.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      });

      const { container } = render(<ProfilePage />, { wrapper: createWrapper() });

      // MUI Skeleton elements should be present
      const skeletons = container.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);

      // Real content should not be visible
      expect(screen.queryByText('Felipe Vieira')).not.toBeInTheDocument();
      expect(screen.queryByText('Informacoes basicas')).not.toBeInTheDocument();
    });
  });

  // PROF-03: Toast on error
  describe('PROF-03 - Toast on error', () => {
    it('shows error toast on fetch failure', () => {
      mockUseAccount.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('fail'),
      });

      render(<ProfilePage />, { wrapper: createWrapper() });

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Erro ao carregar perfil.',
        { variant: 'error' },
      );
    });
  });

  // PROF-04: Initials avatar
  describe('PROF-04 - Initials avatar', () => {
    it('shows initials avatar when no photo', () => {
      mockUseAccount.mockReturnValue({
        data: { ...fullAccount, photoUrl: null },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<ProfilePage />, { wrapper: createWrapper() });

      // Avatar should show initials "FV"
      expect(screen.getByText('FV')).toBeInTheDocument();
    });

    it('shows photo avatar when photoUrl exists', () => {
      mockUseAccount.mockReturnValue({
        data: { ...fullAccount, photoUrl: 'https://example.com/photo.jpg' },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<ProfilePage />, { wrapper: createWrapper() });

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
    });
  });
});
