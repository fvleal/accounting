import { describe, it, expect } from 'vitest';
import { getInitials, getAvatarColor } from '../utils/initials';

describe('getInitials', () => {
  it('returns first and last initials for two-word name', () => {
    expect(getInitials('Felipe Vieira')).toBe('FV');
  });

  it('returns single initial for single name', () => {
    expect(getInitials('Felipe')).toBe('F');
  });

  it('returns "?" for empty string', () => {
    expect(getInitials('')).toBe('?');
  });

  it('returns "?" for whitespace-only string', () => {
    expect(getInitials('   ')).toBe('?');
  });

  it('returns first + last initials for three-word name', () => {
    expect(getInitials('Ana Maria Santos')).toBe('AS');
  });
});

describe('getAvatarColor', () => {
  it('returns the same color for the same name', () => {
    const color1 = getAvatarColor('Felipe');
    const color2 = getAvatarColor('Felipe');
    expect(color1).toBe(color2);
  });

  it('returns a valid hex color string', () => {
    const color = getAvatarColor('Felipe');
    expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('likely returns different colors for different names', () => {
    const color1 = getAvatarColor('Felipe');
    const color2 = getAvatarColor('Ana');
    expect(color1).not.toBe(color2);
  });
});
