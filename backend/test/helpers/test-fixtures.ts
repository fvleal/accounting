import type { JwtPayload } from '../../src/shared/infrastructure/auth/index.js';

// ── Test Users ──────────────────────────────────────────────

export const USER_PAYLOAD: JwtPayload = {
  sub: 'auth0|user-123',
  email: 'john@example.com',
  permissions: ['create:account', 'read:own-account', 'update:own-account'],
  iss: 'https://test.auth0.com/',
  aud: 'test-api',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
};

export const ADMIN_PAYLOAD: JwtPayload = {
  sub: 'auth0|admin-456',
  email: 'admin@example.com',
  permissions: [
    'create:account',
    'read:own-account',
    'read:accounts',
    'update:own-account',
  ],
  iss: 'https://test.auth0.com/',
  aud: 'test-api',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
};

export const M2M_PAYLOAD: JwtPayload = {
  sub: 'machine|service-789',
  email: 'service@machine.local',
  permissions: ['read:accounts'],
  gty: 'client-credentials',
  iss: 'https://test.auth0.com/',
  aud: 'test-api',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
};

export const NO_PERMISSIONS_PAYLOAD: JwtPayload = {
  sub: 'auth0|noperm-000',
  email: 'noperm@example.com',
  permissions: [],
  iss: 'https://test.auth0.com/',
  aud: 'test-api',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
};

// ── Helper ──────────────────────────────────────────────────

export function authHeader(payload: JwtPayload): string {
  return JSON.stringify(payload);
}
