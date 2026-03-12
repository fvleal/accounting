import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { AccountGuard } from '../auth/AccountGuard';

// Mock useAccount hook
const mockUseAccount = vi.fn();
vi.mock('../hooks/useAccount', () => ({
  useAccount: () => mockUseAccount(),
}));

// Mock LoadingScreen
vi.mock('../components/ui/LoadingScreen', () => ({
  LoadingScreen: () => <div data-testid="loading-screen">Loading...</div>,
}));

// Mock AccountErrorFallback
vi.mock('../components/ui/AccountErrorFallback', () => ({
  AccountErrorFallback: ({ error, onRetry }: { error: Error; onRetry: () => void }) => (
    <div data-testid="error-fallback">
      <span>{error.message}</span>
      <button onClick={onRetry}>Retry</button>
    </div>
  ),
}));

function renderWithRouter(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route element={<AccountGuard />}>
          <Route path="/" element={<div data-testid="home">Home</div>} />
        </Route>
        <Route path="/onboarding" element={<div data-testid="onboarding">Onboarding</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AccountGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows LoadingScreen while loading', () => {
    mockUseAccount.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    renderWithRouter();
    expect(screen.getByTestId('loading-screen')).toBeInTheDocument();
  });

  it('renders Outlet when account exists', () => {
    mockUseAccount.mockReturnValue({
      data: { id: '1', fullName: 'Test User' },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithRouter();
    expect(screen.getByTestId('home')).toBeInTheDocument();
  });

  it('redirects to /onboarding when GET /accounts/me returns 404', () => {
    const error404 = new Error('Not Found');
    (error404 as any).response = { status: 404 };

    mockUseAccount.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: error404,
      refetch: vi.fn(),
    });

    renderWithRouter();
    expect(screen.getByTestId('onboarding')).toBeInTheDocument();
  });

  it('shows AccountErrorFallback on network error (non-404)', () => {
    const networkError = new Error('Network Error');
    (networkError as any).response = { status: 500 };

    mockUseAccount.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: networkError,
      refetch: vi.fn(),
    });

    renderWithRouter();
    expect(screen.getByTestId('error-fallback')).toBeInTheDocument();
    expect(screen.getByText('Network Error')).toBeInTheDocument();
  });

  it('shows AccountErrorFallback when error has no response (e.g., timeout)', () => {
    const timeoutError = new Error('timeout');

    mockUseAccount.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: timeoutError,
      refetch: vi.fn(),
    });

    renderWithRouter();
    expect(screen.getByTestId('error-fallback')).toBeInTheDocument();
  });
});
