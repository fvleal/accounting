import { describe, it, expect } from 'vitest';
import { theme } from '../theme';

describe('MUI Dark Theme', () => {
  it('has dark palette mode', () => {
    expect(theme.palette.mode).toBe('dark');
  });

  it('has correct default background color (#121212)', () => {
    expect(theme.palette.background.default).toBe('#121212');
  });

  it('has correct paper background color (#1e1e1e)', () => {
    expect(theme.palette.background.paper).toBe('#1e1e1e');
  });

  it('has correct primary color (#1976d2)', () => {
    expect(theme.palette.primary.main).toBe('#1976d2');
  });

  it('has colorSchemes with dark mode configured', () => {
    expect(theme.colorSchemes).toBeDefined();
    expect(theme.colorSchemes.dark).toBeDefined();
  });
});
