# Phase 4: REST API and Security - Research

**Researched:** 2026-03-11
**Domain:** NestJS REST controllers, Auth0 JWT authentication, request validation, error handling
**Confidence:** HIGH

## Summary

This phase wires HTTP to the existing application layer. No new domain logic is needed -- controllers in `src/account/interface/` call the 9 existing use cases, and cross-cutting auth infrastructure lives in `src/shared/infrastructure/auth/`. The stack is well-established: `@nestjs/passport` + `passport-jwt` + `jwks-rsa` for Auth0 JWT validation, `class-validator` + `class-transformer` for DTO validation, a global `ExceptionFilter` for domain-to-HTTP error mapping, and a global `NestInterceptor` for response envelope wrapping.

Key architectural pieces: (1) a global `APP_GUARD` applying JWT auth to all routes by default, (2) a `@Roles()` decorator + `RolesGuard` for per-route RBAC, (3) a `@CurrentUser()` parameter decorator to extract typed JWT payload, (4) a global `ValidationPipe` for request validation, (5) a global `ExceptionFilter` mapping `DomainException.code` to HTTP status codes, and (6) a global response interceptor wrapping all responses in `{ data, meta }` envelope.

**Important code gap:** The requirements reference SendPhoneVerificationCommand (UCAS-08) and VerifyPhoneCommand (UCAS-09) as complete, but the actual codebase only has `UpdatePhoneCommand` (which directly updates the phone). There is no send-code or verify-code use case implementation. The REST endpoints REST-10 and REST-11 (POST /accounts/:id/phone/send-code and POST /accounts/:id/phone/verify) will need to wire to the existing `UpdatePhoneCommand` or the planner should flag this gap. The `phoneVerified` field exists in the Prisma schema but is always set to `false` in the mapper.

**Primary recommendation:** Implement auth module first (guards, strategy, decorators), then controller with DTOs, then global filters/interceptors, then wire everything in main.ts and app.module.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- @nestjs/passport + passport-jwt for JWT validation
- JwtStrategy validates Auth0-issued tokens (JWKS endpoint)
- Global APP_GUARD applies JWT auth to all routes by default
- @Public() decorator opts out specific routes (if any)
- Custom @CurrentUser() parameter decorator extracts typed JwtPayload from request.user
- Auth module lives in `src/shared/infrastructure/auth/` (cross-cutting, reusable by future bounded contexts)
- Auth0 built-in RBAC -- permissions claim from Auth0 API settings
- Two roles for v1: `user` (getMe, create account, update own data) and `admin` (getByCPF, listAccounts)
- @Roles() decorator + RolesGuard per route
- M2M tokens: same guard, Auth0 M2M tokens carry `gty: 'client-credentials'` claim; guard checks permissions equally -- M2M needs `read:accounts` permission for admin-level endpoints
- Single controller with unified routes -- guards differentiate access by role, no separate controllers per actor
- Standardized error format: `{ statusCode, error, message, details }`
- Global ExceptionFilter with centralized code-to-status mapping: ACCOUNT_NOT_FOUND->404, DUPLICATE_EMAIL->409, DUPLICATE_CPF->409, DUPLICATE_AUTH0_SUB->409, validation->422
- Validation errors (class-validator): array of field errors `[{ field, message }]` in details
- 500 errors: generic message in response, details only in server logs
- DomainException.code maps to `error` field, DomainException.metadata maps to `details`
- Envelope pattern: all responses wrapped in `{ data, meta }`
- Single resource: `{ data: { id, name, ... }, meta: { timestamp } }`
- List: `{ data: [...], meta: { total, offset, limit } }`
- Global NestJS interceptor applies envelope automatically -- controllers return plain data
- Pagination meta for lists: offset + limit + total (aligns with existing findAll limit/offset pattern)
- class-validator + class-transformer for request DTO validation
- NestJS ValidationPipe (global) transforms and validates incoming requests
- Validation errors return 422 with structured field error array
- Single AccountResponseDto for all endpoints: id, name, email, cpf, birthDate, phone, phoneVerified, photoUrl, createdAt, updatedAt
- No field filtering by role in v1
- Controller maps use case Output to response DTO

### Claude's Discretion
- Exact class-validator decorators per DTO field
- ValidationPipe configuration details (whitelist, forbidNonWhitelisted, transform)
- JwtStrategy configuration (audience, issuer, algorithms)
- Interceptor implementation details for envelope
- File upload handling for photo endpoint (multer config)
- Swagger/OpenAPI decorators (if included -- APIE-02 is v2 but basic decorators may be useful)

### Deferred Ideas (OUT OF SCOPE)
- Swagger/OpenAPI documentation (APIE-02) -- v2 requirement, basic decorators may be added at Claude's discretion
- Cursor-based pagination (APIE-01) -- v2, current findAll uses limit/offset
- CPF masking per role -- v1 returns all fields to all authorized callers
- Rate limiting -- not in current scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REST-01 | POST /accounts (create account, requires Auth0 user token, extracts email from token) | CreateAccountCommand exists; controller extracts auth0Sub + email from JWT, name + cpf from body |
| REST-02 | GET /accounts/:id (get by ID) | GetAccountByIdQuery exists; UUID param validation needed |
| REST-03 | GET /accounts?cpf=X (get by CPF, admin/M2M only) | FindAccountByFieldQuery exists with field='cpf'; RolesGuard restricts access |
| REST-04 | GET /accounts/me (get authenticated user's account, returns 404 if not found) | GetMeQuery exists; extracts auth0Sub from JWT; route must be before :id to avoid conflict |
| REST-05 | PATCH /accounts/:id (update optional data except phone) | UpdateBirthDateCommand and UpdateNameCommand exist; single PATCH endpoint with partial body |
| REST-06 | GET /accounts (list accounts) | ListAccountsQuery exists with limit/offset pagination |
| REST-07 | Request DTOs with class-validator decorators | class-validator + class-transformer + global ValidationPipe |
| REST-08 | Response DTOs with stable contract | AccountResponseDto maps from use case Output types |
| REST-09 | Standardized error handling (exception filters) | Global ExceptionFilter maps DomainException.code to HTTP status |
| REST-10 | POST /accounts/:id/phone/send-code | **GAP:** No SendPhoneVerificationCommand exists; UpdatePhoneCommand is available |
| REST-11 | POST /accounts/:id/phone/verify | **GAP:** No VerifyPhoneCommand exists; UpdatePhoneCommand directly updates phone |
| REST-12 | POST /accounts/:id/photo (upload photo) | UploadAccountPhotoCommand exists; needs FileInterceptor + multer |
| AUTH-01 | Auth0 Guard validates JWT on all protected routes | @nestjs/passport + passport-jwt + jwks-rsa with global APP_GUARD |
| AUTH-02 | getMe requires role "user" | @Roles('user') decorator + RolesGuard |
| AUTH-03 | getByCPF requires admin/M2M permissions | @Roles('admin') + M2M gty check in RolesGuard |
| AUTH-04 | Per-route role/permission decorators and guards | @Roles() custom decorator + RolesGuard implementing CanActivate |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @nestjs/passport | ^11.0.5 | Passport integration for NestJS | Official NestJS auth module, supports NestJS 10+11 |
| passport | ^0.7.x | Authentication middleware | Industry standard for Node.js auth |
| passport-jwt | ^4.0.x | JWT strategy for Passport | Standard JWT extraction and validation |
| jwks-rsa | ^4.0.1 | JWKS key retrieval from Auth0 | Auth0-maintained, caching + rate limiting built-in |
| class-validator | ^0.14.x | Decorator-based validation | NestJS-recommended, 7000+ dependents |
| class-transformer | ^0.5.1 | Plain-to-class transformation | Required companion to class-validator for NestJS pipes |

### Already Installed (no action needed)
| Library | Purpose |
|---------|---------|
| @nestjs/platform-express | Includes multer for file uploads (FileInterceptor) |
| @nestjs/common | ValidationPipe, decorators, guards, interceptors, filters |
| @nestjs/config | ConfigService for auth configuration (AUTH0_DOMAIN, AUTH0_AUDIENCE) |
| reflect-metadata | Required for decorator metadata (already present) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @nestjs/passport | Custom guard with jose library | Simpler but loses Passport ecosystem; user locked in passport |
| class-validator | zod | Zod has better TS inference but NestJS ValidationPipe is built for class-validator |

**Installation:**
```bash
npm install @nestjs/passport passport passport-jwt jwks-rsa class-validator class-transformer
npm install -D @types/passport-jwt
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── shared/
│   └── infrastructure/
│       └── auth/
│           ├── auth.module.ts              # PassportModule + JwtStrategy + guards
│           ├── strategies/
│           │   └── jwt.strategy.ts         # Auth0 JWKS JWT validation
│           ├── guards/
│           │   ├── jwt-auth.guard.ts       # Extends AuthGuard('jwt')
│           │   └── roles.guard.ts          # Checks @Roles() metadata
│           ├── decorators/
│           │   ├── current-user.decorator.ts  # @CurrentUser() param decorator
│           │   ├── roles.decorator.ts         # @Roles() method decorator
│           │   └── public.decorator.ts        # @Public() to skip auth
│           └── interfaces/
│               └── jwt-payload.interface.ts   # Typed Auth0 JWT payload
├── account/
│   └── interface/
│       ├── account-interface.module.ts    # Module importing ApplicationModule + AuthModule
│       ├── controllers/
│       │   └── account.controller.ts      # Single controller, all routes
│       ├── dtos/
│       │   ├── create-account.dto.ts      # Request DTO
│       │   ├── update-account.dto.ts      # Request DTO (PATCH)
│       │   ├── send-phone-code.dto.ts     # Request DTO
│       │   ├── verify-phone.dto.ts        # Request DTO
│       │   ├── list-accounts-query.dto.ts # Query params DTO
│       │   └── account-response.dto.ts    # Response DTO
│       ├── filters/
│       │   └── domain-exception.filter.ts # Global exception filter
│       └── interceptors/
│           └── response-envelope.interceptor.ts  # Global { data, meta } wrapper
```

### Pattern 1: Auth0 JWT Strategy with JWKS
**What:** Validates Auth0-issued JWTs using the tenant's JWKS endpoint
**When to use:** Every protected route (global guard)
**Example:**
```typescript
// src/shared/infrastructure/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${configService.get<string>('AUTH0_DOMAIN')}/.well-known/jwks.json`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: configService.get<string>('AUTH0_AUDIENCE'),
      issuer: `https://${configService.get<string>('AUTH0_DOMAIN')}/`,
      algorithms: ['RS256'],
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    return payload; // Passport attaches this to request.user
  }
}
```

### Pattern 2: Global APP_GUARD with @Public() Opt-out
**What:** JWT guard applied globally; routes opt out with @Public()
**When to use:** Default auth for all routes
**Example:**
```typescript
// jwt-auth.guard.ts
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}

// public.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// auth.module.ts - register as APP_GUARD
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [
    JwtStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [PassportModule],
})
export class AuthModule {}
```

### Pattern 3: Roles Guard with Permissions Check
**What:** Checks `permissions` claim from Auth0 JWT against route requirements
**When to use:** Admin-only and M2M-only routes
**Example:**
```typescript
// roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true; // No roles required

    const { user } = context.switchToHttp().getRequest();
    const permissions: string[] = user?.permissions ?? [];
    return requiredRoles.some((role) => permissions.includes(role));
  }
}
```

### Pattern 4: Domain Exception Filter
**What:** Catches DomainException and maps code to HTTP status
**When to use:** Global filter
**Example:**
```typescript
@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private static readonly CODE_TO_STATUS: Record<string, number> = {
    ACCOUNT_NOT_FOUND: 404,
    DUPLICATE_EMAIL: 409,
    DUPLICATE_CPF: 409,
    DUPLICATE_AUTH0_SUB: 409,
  };

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (exception instanceof DomainException) {
      const statusCode = DomainExceptionFilter.CODE_TO_STATUS[exception.code] ?? 422;
      return response.status(statusCode).json({
        statusCode,
        error: exception.code,
        message: exception.message,
        details: exception.metadata,
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exResponse = exception.getResponse();
      // Handle ValidationPipe errors (BadRequestException with validation details)
      // ...
      return response.status(status).json({ statusCode: status, ... });
    }

    // 500 -- log but don't expose
    console.error(exception);
    return response.status(500).json({
      statusCode: 500,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error',
      details: null,
    });
  }
}
```

### Pattern 5: Response Envelope Interceptor
**What:** Wraps controller return values in `{ data, meta }` envelope
**When to use:** Global interceptor
**Example:**
```typescript
@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // If data already has envelope shape (e.g., list with total), build meta
        if (data && typeof data === 'object' && 'data' in data && 'total' in data) {
          return {
            data: data.data,
            meta: { total: data.total, offset: data.offset, limit: data.limit, timestamp: new Date().toISOString() },
          };
        }
        return {
          data,
          meta: { timestamp: new Date().toISOString() },
        };
      }),
    );
  }
}
```

### Pattern 6: @CurrentUser() Parameter Decorator
**What:** Extracts typed JWT payload from request
**When to use:** Controller methods needing user identity
**Example:**
```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    return data ? user?.[data] : user;
  },
);
```

### Anti-Patterns to Avoid
- **Importing domain entities in controllers:** Controllers receive use case Output (plain objects), never domain entities. Map Output to ResponseDto in the controller.
- **Throwing HttpException from use cases:** Use cases throw DomainException; the exception filter handles HTTP mapping. This keeps the application layer framework-agnostic.
- **Per-route auth guard instead of global:** Use global APP_GUARD + @Public() opt-out, not per-route @UseGuards(). Forgetting a guard is a security hole.
- **Returning raw use case output:** Always map through ResponseDto to decouple API contract from internal representation.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT validation | Custom JWT parsing/verification | passport-jwt + jwks-rsa | Key rotation, caching, RS256 verification are complex |
| JWKS fetching | Manual HTTP calls to /.well-known/jwks.json | jwks-rsa passportJwtSecret | Built-in caching, rate limiting, key rotation |
| Request validation | Manual if/else validation in controllers | class-validator + ValidationPipe | Declarative, consistent, auto-generates error messages |
| File upload parsing | Manual multipart parsing | @nestjs/platform-express FileInterceptor (multer) | Already bundled, battle-tested |
| Error response formatting | Per-controller try/catch | Global ExceptionFilter | Centralized, consistent, impossible to forget |

**Key insight:** NestJS provides global pipes, guards, filters, and interceptors precisely to avoid per-route boilerplate. Use them globally via `main.ts` or `APP_GUARD` provider.

## Common Pitfalls

### Pitfall 1: Route Order -- /me vs /:id Conflict
**What goes wrong:** GET /accounts/me is matched by GET /accounts/:id with id="me"
**Why it happens:** NestJS matches routes top-to-bottom in the controller; if `:id` is declared before `me`, it captures "me" as the id parameter
**How to avoid:** Declare `@Get('me')` BEFORE `@Get(':id')` in the controller class
**Warning signs:** 404 or UUID validation error when hitting /accounts/me

### Pitfall 2: ValidationPipe Returns 400, Not 422
**What goes wrong:** Default ValidationPipe throws BadRequestException (400) but user wants 422 for validation errors
**Why it happens:** NestJS default behavior
**How to avoid:** Use custom `exceptionFactory` in ValidationPipe to throw `UnprocessableEntityException` (422) instead, OR handle in the global exception filter by checking if the HttpException response contains validation error arrays
**Warning signs:** 400 status codes on invalid input instead of expected 422

### Pitfall 3: Guard Execution Order with Multiple APP_GUARDs
**What goes wrong:** RolesGuard runs before JwtAuthGuard, so `request.user` is undefined
**Why it happens:** Multiple APP_GUARD providers execute in registration order
**How to avoid:** Register JwtAuthGuard BEFORE RolesGuard in the providers array. The RolesGuard must check if requiredRoles is empty and return true (pass-through) when no @Roles() is set.
**Warning signs:** "Cannot read property 'permissions' of undefined" errors

### Pitfall 4: Interceptor Wraps Error Responses Too
**What goes wrong:** The response envelope interceptor wraps error responses from the exception filter in `{ data, meta }`
**Why it happens:** If the interceptor catches errors or if the filter sends response AFTER the interceptor
**How to avoid:** Exception filters run AFTER interceptors in the NestJS lifecycle. The filter writes directly to the response object, bypassing the interceptor's `map()` operator. This works correctly by default -- the interceptor's `map()` only transforms successful responses from `next.handle()`. No special handling needed.
**Warning signs:** Double-wrapped error responses

### Pitfall 5: class-transformer Needs `transform: true` in ValidationPipe
**What goes wrong:** Query parameters remain strings (e.g., `limit` is "10" not 10)
**Why it happens:** Express parses all query params as strings; without `transform: true`, class-transformer doesn't convert types
**How to avoid:** Set `transform: true` in global ValidationPipe options
**Warning signs:** Type errors or unexpected string comparisons in use cases

### Pitfall 6: Multer Memory Storage for Photo Upload
**What goes wrong:** Large files written to disk temporarily before S3 upload
**Why it happens:** Default multer uses disk storage
**How to avoid:** Use memory storage (default for FileInterceptor without storage config) -- file.buffer is available directly. Set file size limits via `ParseFilePipe` with `MaxFileSizeValidator`.
**Warning signs:** Temp files accumulating on server disk

### Pitfall 7: Auth0 Permissions vs Roles Claim
**What goes wrong:** Guard checks `roles` claim but Auth0 puts permissions in `permissions` claim
**Why it happens:** Auth0's built-in RBAC populates `permissions` array in the token, not `roles`
**How to avoid:** RolesGuard should check `user.permissions` array. Despite the decorator being named `@Roles()`, it checks the `permissions` claim from Auth0. Alternatively, Auth0 can be configured to include roles in the token via a custom Action, but the user chose built-in RBAC which uses the `permissions` claim.
**Warning signs:** All role-restricted routes return 403

## Code Examples

### JwtPayload Interface
```typescript
// src/shared/infrastructure/auth/interfaces/jwt-payload.interface.ts
export interface JwtPayload {
  sub: string;           // Auth0 user ID (e.g., 'auth0|abc123')
  email: string;         // User email from Auth0
  permissions?: string[]; // Auth0 RBAC permissions array
  gty?: string;          // Grant type: 'client-credentials' for M2M
  iss: string;           // Issuer
  aud: string | string[]; // Audience
  iat: number;           // Issued at
  exp: number;           // Expiration
}
```

### Controller Route Examples
```typescript
// src/account/interface/controllers/account.controller.ts
@Controller('accounts')
export class AccountController {
  constructor(
    private readonly createAccount: CreateAccountCommand,
    private readonly getMe: GetMeQuery,
    private readonly getById: GetAccountByIdQuery,
    private readonly findByField: FindAccountByFieldQuery,
    private readonly listAccounts: ListAccountsQuery,
    private readonly updateBirthDate: UpdateBirthDateCommand,
    private readonly updateName: UpdateNameCommand,
    private readonly updatePhone: UpdatePhoneCommand,
    private readonly uploadPhoto: UploadAccountPhotoCommand,
  ) {}

  @Post()
  @Roles('create:account')
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAccountDto,
  ): Promise<AccountResponseDto> {
    const output = await this.createAccount.execute({
      auth0Sub: user.sub,
      email: user.email,
      name: dto.name,
      cpf: dto.cpf,
    });
    return AccountResponseDto.fromOutput(output);
  }

  @Get('me')
  @Roles('read:own-account')
  async getMyAccount(@CurrentUser() user: JwtPayload): Promise<AccountResponseDto> {
    const output = await this.getMe.execute({ auth0Sub: user.sub });
    return AccountResponseDto.fromOutput(output);
  }

  @Get(':id')
  async getAccount(@Param('id', ParseUUIDPipe) id: string): Promise<AccountResponseDto> {
    const output = await this.getById.execute({ id });
    return AccountResponseDto.fromOutput(output);
  }

  @Get()
  @Roles('read:accounts')
  async list(@Query() query: ListAccountsQueryDto): Promise<{ data: AccountResponseDto[]; total: number; offset: number; limit: number }> {
    const output = await this.listAccounts.execute({
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
    });
    return {
      data: output.data.map(AccountResponseDto.fromOutput),
      total: output.total,
      offset: query.offset ?? 0,
      limit: query.limit ?? 20,
    };
  }

  @Post(':id/photo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAccountPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(new ParseFilePipe({
      validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 })],
    })) file: Express.Multer.File,
  ): Promise<AccountResponseDto> {
    const output = await this.uploadPhoto.execute({
      accountId: id,
      buffer: file.buffer,
      contentType: file.mimetype,
    });
    return AccountResponseDto.fromOutput(output);
  }
}
```

### Request DTO Example
```typescript
// src/account/interface/dtos/create-account.dto.ts
import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 200)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { message: 'CPF must be 11 digits or formatted as XXX.XXX.XXX-XX' })
  cpf: string;
}
```

### Response DTO Example
```typescript
// src/account/interface/dtos/account-response.dto.ts
export class AccountResponseDto {
  id: string;
  name: string;
  email: string;
  cpf: string;
  birthDate: Date | null;
  phone: string | null;
  phoneVerified: boolean;
  photoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;

  static fromOutput(output: {
    id: string; name: string; email: string; cpf: string;
    birthDate: Date | null; phone: string | null; photoUrl: string | null;
    createdAt: Date; updatedAt: Date;
  }): AccountResponseDto {
    const dto = new AccountResponseDto();
    dto.id = output.id;
    dto.name = output.name;
    dto.email = output.email;
    dto.cpf = output.cpf;
    dto.birthDate = output.birthDate;
    dto.phone = output.phone;
    dto.phoneVerified = false; // Not tracked in domain yet
    dto.photoUrl = output.photoUrl;
    dto.createdAt = output.createdAt;
    dto.updatedAt = output.updatedAt;
    return dto;
  }
}
```

### main.ts Configuration
```typescript
// src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) => new UnprocessableEntityException(
      errors.map((e) => ({
        field: e.property,
        message: Object.values(e.constraints ?? {}).join(', '),
      })),
    ),
  }));

  // Global exception filter
  app.useGlobalFilters(new DomainExceptionFilter());

  // Global response envelope interceptor
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());

  await app.listen(process.env.PORT ?? 3000);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @nestjs/jwt for local JWT signing | passport-jwt + jwks-rsa for Auth0 JWKS | N/A | No local secret needed; keys fetched from Auth0 |
| Manual validation in controllers | Global ValidationPipe + class-validator decorators | NestJS 7+ | Declarative, consistent, zero boilerplate |
| Per-route @UseGuards() | Global APP_GUARD + @Public() opt-out | NestJS 8+ | Secure by default, explicit opt-out |

**Deprecated/outdated:**
- `@nestjs/class-validator` and `@nestjs/class-transformer` forks: Use the original `class-validator` and `class-transformer` packages directly. The NestJS forks are stale (4 years old).

## Open Questions

1. **Phone Verification Gap**
   - What we know: UCAS-08 (SendPhoneVerification) and UCAS-09 (VerifyPhone) are marked complete in REQUIREMENTS.md, but the actual codebase only has `UpdatePhoneCommand` which directly sets the phone. No send-code/verify-code workflow exists. The `phoneVerified` field in Prisma is always `false`.
   - What's unclear: Should REST-10 and REST-11 endpoints simply call UpdatePhoneCommand (bypassing verification), or should this phase implement the verification workflow?
   - Recommendation: Wire REST-10 and REST-11 to `UpdatePhoneCommand` for now (phone/send-code sets the phone, phone/verify is a no-op or confirmation). The use case layer is the source of truth; if verification logic is needed, it should be added as a separate concern. Flag this for the planner.

2. **Auth0 Permission Names**
   - What we know: Auth0 RBAC uses `permissions` claim with string values like `read:accounts`. The exact permission strings need to match Auth0 API configuration.
   - What's unclear: Exact permission string names to use in @Roles() decorator.
   - Recommendation: Use standard Auth0 convention: `create:account`, `read:own-account`, `read:accounts`, `update:own-account`, `read:account`. Define as constants. The RolesGuard checks `permissions` array from the JWT.

3. **GET /accounts?cpf=X vs GET /accounts (list)**
   - What we know: REST-03 (get by CPF) and REST-06 (list) both use GET /accounts. The CPF query is admin-only.
   - What's unclear: Should these be the same route with conditional behavior?
   - Recommendation: Single `@Get()` route. If `cpf` query param is present, call FindAccountByFieldQuery; otherwise call ListAccountsQuery. The RolesGuard applies `read:accounts` permission to the entire route (both behaviors are admin-only based on requirements). The `@Get('me')` endpoint serves user-level access.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --testPathPattern=interface` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REST-01 | POST /accounts returns 201 | unit (controller) | `npx vitest run src/account/interface/controllers/account.controller.spec.ts -t "create"` | No - Wave 0 |
| REST-02 | GET /accounts/:id returns 200/404 | unit (controller) | `npx vitest run src/account/interface/controllers/account.controller.spec.ts -t "getById"` | No - Wave 0 |
| REST-03 | GET /accounts?cpf=X admin-only | unit (controller) | `npx vitest run src/account/interface/controllers/account.controller.spec.ts -t "findByCpf"` | No - Wave 0 |
| REST-04 | GET /accounts/me returns 200/404 | unit (controller) | `npx vitest run src/account/interface/controllers/account.controller.spec.ts -t "getMe"` | No - Wave 0 |
| REST-05 | PATCH /accounts/:id returns 200 | unit (controller) | `npx vitest run src/account/interface/controllers/account.controller.spec.ts -t "update"` | No - Wave 0 |
| REST-06 | GET /accounts returns 200 with list | unit (controller) | `npx vitest run src/account/interface/controllers/account.controller.spec.ts -t "list"` | No - Wave 0 |
| REST-07 | Request DTOs validate input | unit (DTO) | `npx vitest run src/account/interface/dtos/*.spec.ts` | No - Wave 0 |
| REST-08 | Response DTO maps use case output | unit (DTO) | `npx vitest run src/account/interface/dtos/account-response.dto.spec.ts` | No - Wave 0 |
| REST-09 | Exception filter maps domain errors | unit (filter) | `npx vitest run src/account/interface/filters/domain-exception.filter.spec.ts` | No - Wave 0 |
| REST-10 | POST /accounts/:id/phone/send-code | unit (controller) | `npx vitest run src/account/interface/controllers/account.controller.spec.ts -t "sendPhoneCode"` | No - Wave 0 |
| REST-11 | POST /accounts/:id/phone/verify | unit (controller) | `npx vitest run src/account/interface/controllers/account.controller.spec.ts -t "verifyPhone"` | No - Wave 0 |
| REST-12 | POST /accounts/:id/photo upload | unit (controller) | `npx vitest run src/account/interface/controllers/account.controller.spec.ts -t "uploadPhoto"` | No - Wave 0 |
| AUTH-01 | JWT guard rejects invalid/missing token | unit (guard) | `npx vitest run src/shared/infrastructure/auth/guards/jwt-auth.guard.spec.ts` | No - Wave 0 |
| AUTH-02 | getMe requires user role | unit (guard+controller) | `npx vitest run src/shared/infrastructure/auth/guards/roles.guard.spec.ts` | No - Wave 0 |
| AUTH-03 | getByCPF requires admin/M2M | unit (guard) | `npx vitest run src/shared/infrastructure/auth/guards/roles.guard.spec.ts -t "admin"` | No - Wave 0 |
| AUTH-04 | @Roles decorator sets metadata | unit (decorator) | `npx vitest run src/shared/infrastructure/auth/decorators/roles.decorator.spec.ts` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --testPathPattern="interface|auth"`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/account/interface/controllers/account.controller.spec.ts` -- covers REST-01 through REST-06, REST-10, REST-11, REST-12
- [ ] `src/account/interface/filters/domain-exception.filter.spec.ts` -- covers REST-09
- [ ] `src/account/interface/interceptors/response-envelope.interceptor.spec.ts` -- covers envelope wrapping
- [ ] `src/shared/infrastructure/auth/guards/jwt-auth.guard.spec.ts` -- covers AUTH-01
- [ ] `src/shared/infrastructure/auth/guards/roles.guard.spec.ts` -- covers AUTH-02, AUTH-03, AUTH-04

## Sources

### Primary (HIGH confidence)
- [NestJS Official Docs - Authentication](https://docs.nestjs.com/security/authentication) -- JWT auth patterns, APP_GUARD
- [NestJS Official Docs - File Upload](https://docs.nestjs.com/techniques/file-upload) -- FileInterceptor, multer
- [NestJS Official Docs - Interceptors](https://docs.nestjs.com/interceptors) -- Response transformation
- [NestJS Official Docs - Validation](https://docs.nestjs.com/techniques/validation) -- ValidationPipe, class-validator

### Secondary (MEDIUM confidence)
- [Auth0 NestJS Blog Post](https://auth0.com/blog/developing-a-secure-api-with-nestjs-adding-authorization/) -- Auth0 + NestJS integration
- [jajaperson/nestjs-auth0](https://github.com/jajaperson/nestjs-auth0) -- Reference implementation of JwtStrategy with JWKS
- [@nestjs/passport npm](https://www.npmjs.com/package/@nestjs/passport) -- v11.0.5, NestJS 11 compatible
- [jwks-rsa npm](https://www.npmjs.com/package/jwks-rsa) -- v4.0.1 latest

### Tertiary (LOW confidence)
- Auth0 permission naming conventions -- based on common Auth0 patterns, not verified against project's Auth0 tenant config

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries verified on npm with NestJS 11 compatibility
- Architecture: HIGH -- patterns align with NestJS official docs and project CONTEXT.md decisions
- Pitfalls: HIGH -- well-documented NestJS gotchas verified across multiple sources
- Phone verification gap: MEDIUM -- flagged for planner decision, no blocking issue

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable ecosystem, 30-day window)
