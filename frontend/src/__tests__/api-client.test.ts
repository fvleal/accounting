import { describe, it, expect } from 'vitest';
import apiClient, { setTokenGetter } from '../api/client';

describe('API Client', () => {
  it('has correct default baseURL', () => {
    expect(apiClient.defaults.baseURL).toBe('/api');
  });

  it('has at least one request interceptor registered', () => {
    const interceptorCount = (apiClient.interceptors.request as any).handlers.length;
    expect(interceptorCount).toBeGreaterThanOrEqual(1);
  });

  // This test must run before setTokenGetter is called (module-level state)
  it('proceeds without Authorization header when no token getter is set', async () => {
    const interceptors = (apiClient.interceptors.request as any).handlers;
    const requestInterceptor = interceptors[0];

    const config = {
      headers: {},
    } as any;

    const result = await requestInterceptor.fulfilled(config);
    expect(result.headers.Authorization).toBeUndefined();
  });

  it('attaches Authorization header after setTokenGetter is called', async () => {
    const mockToken = 'test-token-123';
    setTokenGetter(() => Promise.resolve(mockToken));

    const interceptors = (apiClient.interceptors.request as any).handlers;
    const requestInterceptor = interceptors[0];
    const config = {
      headers: {
        set Authorization(_v: string) {
          Object.defineProperty(this, 'Authorization', {
            value: _v,
            writable: true,
            enumerable: true,
            configurable: true,
          });
        },
      },
    } as any;

    const result = await requestInterceptor.fulfilled(config);
    expect(result.headers.Authorization).toBe(`Bearer ${mockToken}`);
  });
});
