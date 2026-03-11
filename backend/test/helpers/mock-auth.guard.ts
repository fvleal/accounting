import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../src/shared/infrastructure/auth/index.js';
import type { JwtPayload } from '../../src/shared/infrastructure/auth/index.js';

/**
 * Test replacement for JwtAuthGuard.
 *
 * Reads the JWT payload from the `x-test-auth` header (JSON-encoded).
 * If the header is absent and the route is not @Public(), returns 401.
 * This lets E2E tests simulate any Auth0 user/permission combination
 * without a real Auth0 tenant.
 */
@Injectable()
export class MockJwtAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['x-test-auth'] as string | undefined;

    if (!authHeader) {
      return false;
    }

    try {
      const payload: JwtPayload = JSON.parse(authHeader);
      request.user = payload;
      return true;
    } catch {
      return false;
    }
  }
}
