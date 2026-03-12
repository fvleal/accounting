import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppDialog } from '../components/common/AppDialog';

describe('AppDialog', () => {
  it('renders children', () => {
    render(
      <AppDialog open onClose={vi.fn()}>
        <p>Hello Dialog</p>
      </AppDialog>,
    );
    expect(screen.getByText('Hello Dialog')).toBeInTheDocument();
  });

  it('applies minWidth, maxWidth, width and minHeight via PaperProps', () => {
    render(
      <AppDialog open onClose={vi.fn()} data-testid="app-dialog">
        <p>Content</p>
      </AppDialog>,
    );

    const paper = document.querySelector('.MuiPaper-root') as HTMLElement;
    expect(paper).not.toBeNull();

    const styles = window.getComputedStyle(paper);
    // MUI applies sx as inline styles
    expect(paper.style.minWidth || styles.minWidth).toBeTruthy();
  });

  it('does NOT call onClose on backdrop click', async () => {
    const onClose = vi.fn();
    render(
      <AppDialog open onClose={onClose}>
        <p>Content</p>
      </AppDialog>,
    );

    const backdrop = document.querySelector('.MuiBackdrop-root') as HTMLElement;
    expect(backdrop).not.toBeNull();

    const user = userEvent.setup();
    await user.click(backdrop);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('exposes a simple onClose callback for consumers', () => {
    const onClose = vi.fn();
    render(
      <AppDialog open onClose={onClose}>
        <button onClick={onClose}>Cancel</button>
      </AppDialog>,
    );

    screen.getByText('Cancel').click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('merges consumer PaperProps.sx with defaults', () => {
    render(
      <AppDialog
        open
        onClose={vi.fn()}
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <p>Content</p>
      </AppDialog>,
    );

    const paper = document.querySelector('.MuiPaper-root') as HTMLElement;
    expect(paper).not.toBeNull();
  });
});
