import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import React from 'react';
import type { ReactNode } from 'react';
import { CropPhotoModal } from '../components/profile/CropPhotoModal';

// Mock react-easy-crop
vi.mock('react-easy-crop', () => ({
  default: (props: Record<string, unknown>) => (
    <div data-testid="cropper" data-zoom={props.zoom} data-aspect={props.aspect} />
  ),
}));

// Mock utilities
vi.mock('../utils/cropImage', () => ({
  getCroppedImg: vi.fn(),
}));

vi.mock('../hooks/useUploadPhoto', () => ({
  useUploadPhoto: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

let queryClient: QueryClient;

function Wrapper({ children }: { children: ReactNode }) {
  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    React.createElement(SnackbarProvider, null, children),
  );
}

const defaultProps = {
  open: true,
  imageUrl: 'blob:http://localhost/fake-image',
  onClose: vi.fn(),
  onUploaded: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
});

describe('CropPhotoModal', () => {
  it('renders crop modal with Cropper when open', () => {
    render(<CropPhotoModal {...defaultProps} />, { wrapper: Wrapper });

    expect(screen.getByText('Recortar foto')).toBeInTheDocument();
    expect(screen.getByTestId('cropper')).toBeInTheDocument();
    expect(screen.getByText('Salvar')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('renders zoom slider with correct range', () => {
    render(<CropPhotoModal {...defaultProps} />, { wrapper: Wrapper });

    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuemin', '1');
    expect(slider).toHaveAttribute('aria-valuemax', '3');
  });

  it('calls onClose when Cancelar is clicked', async () => {
    const user = userEvent.setup();
    render(<CropPhotoModal {...defaultProps} />, { wrapper: Wrapper });

    await user.click(screen.getByText('Cancelar'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});
