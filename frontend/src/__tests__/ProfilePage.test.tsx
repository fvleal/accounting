import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

// Mock edit modals to avoid deep rendering
vi.mock('../components/profile/EditNameModal', () => ({
  EditNameModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="edit-name-modal" /> : null,
}));
vi.mock('../components/profile/EditBirthdayModal', () => ({
  EditBirthdayModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="edit-birthday-modal" /> : null,
}));

const fullAccount: Account = {
  id: '1',
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

      // Phone field removed (deferred to v2)
      expect(screen.queryByText('(11) 98765-4321')).not.toBeInTheDocument();
      expect(screen.queryByText('Telefone')).not.toBeInTheDocument();
    });

    it('displays Nao informado for null fields', () => {
      mockUseAccount.mockReturnValue({
        data: { ...fullAccount, birthDate: null },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<ProfilePage />, { wrapper: createWrapper() });

      // Only birthDate can be null now (phone row removed)
      const naoInformado = screen.getAllByText('Nao informado');
      expect(naoInformado).toHaveLength(1);
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
      // Nome, Nascimento = 2 editable rows (phone removed)
      expect(chevrons).toHaveLength(2);
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

  // EDIT: Modal opening tests
  describe('EDIT - Modal wiring', () => {
    it('clicking name row opens EditNameModal', async () => {
      const user = userEvent.setup();
      mockUseAccount.mockReturnValue({
        data: fullAccount,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<ProfilePage />, { wrapper: createWrapper() });

      // EditNameModal should not be visible initially
      expect(screen.queryByTestId('edit-name-modal')).not.toBeInTheDocument();

      // Click the name row (has role="button" from ProfileFieldRow)
      const nameRow = screen.getByText('Nome').closest('[role="button"]')!;
      await user.click(nameRow);

      expect(screen.getByTestId('edit-name-modal')).toBeInTheDocument();
    });

    it('clicking birthday row opens EditBirthdayModal', async () => {
      const user = userEvent.setup();
      mockUseAccount.mockReturnValue({
        data: fullAccount,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<ProfilePage />, { wrapper: createWrapper() });

      // EditBirthdayModal should not be visible initially
      expect(screen.queryByTestId('edit-birthday-modal')).not.toBeInTheDocument();

      // Click the birthday row
      const birthdayRow = screen.getByText('Nascimento').closest('[role="button"]')!;
      await user.click(birthdayRow);

      expect(screen.getByTestId('edit-birthday-modal')).toBeInTheDocument();
    });
  });
});
