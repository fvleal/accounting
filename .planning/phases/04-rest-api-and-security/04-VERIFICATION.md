---
phase: 04-rest-api-and-security
verified: 2026-03-11T00:00:00Z
status: human_needed
score: 4/4 success criteria verified (automated checks pass)
human_verification:
  - test: "POST /accounts without Authorization header"
    expected: "401 Unauthorized response"
    why_human: "JWT guard behavior requires a running NestJS app with Auth0 configured; cannot statically verify 401 response is emitted"
  - test: "POST /accounts with expired or invalid JWT token"
    expected: "401 Unauthorized response"
    why_human: "Passport-jwt + jwks-rsa flow requires live JWKS endpoint resolution"
  - test: "GET /accounts/me with a valid JWT lacking 'read:own-account' permission"
    expected: "403 Forbidden response from RolesGuard"
    why_human: "RolesGuard behavior requires an actual JWT with a permissions claim to test"
  - test: "GET /accounts?cpf=X with a JWT that does not have 'read:accounts' permission"
    expected: "403 Forbidden"
    why_human: "RolesGuard enforcement requires live request execution"
  - test: "POST /accounts with invalid CPF body (e.g., cpf: 'abc')"
    expected: "422 Unprocessable Entity with field error array"
    why_human: "ValidationPipe + exceptionFactory behavior requires a running server; cannot verify 422 vs 400 distinction without executing the pipeline"
  - test: "POST /accounts/:id/phone/verify"
    expected: "501 Not Implemented (explicitly deferred per plan)"
    why_human: "ROADMAP success criterion 1 lists this endpoint as returning 200, but plan 03 explicitly specifies 501. A human must confirm this deviation is intentional and acceptable."
---

# Phase 4: REST API and Security — Verification Report

**Phase Goal:** A fully protected REST API exposes all account operations with proper Auth0 JWT validation, role-based access control, validated request DTOs, and standardized error responses
**Verified:** 2026-03-11
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | All 9 endpoints exist with correct HTTP methods and status codes | VERIFIED | AccountController has all 9 handlers: POST / (201), GET /me, GET /:id, GET /, PATCH /:id, POST /:id/phone/send-code, POST /:id/phone/verify (501), POST /:id/photo — route order is static-before-param |
| 2 | Every route requires valid Auth0 JWT; getMe requires 'read:own-account'; getByCPF requires 'read:accounts' | VERIFIED (code) / NEEDS HUMAN (runtime) | JwtAuthGuard registered as APP_GUARD before RolesGuard; @Roles('read:own-account') on GET /me; @Roles('read:accounts') on GET /; RolesGuard checks user.permissions |
| 3 | Request DTOs validate via class-validator; response DTOs return stable 10-field contract | VERIFIED | All 5 request DTOs have class-validator decorators; AccountResponseDto has static fromOutput() mapping 10 fields; ValidationPipe with exceptionFactory throws 422 |
| 4 | Domain errors map to correct HTTP codes (404/409/422) via global exception filter | VERIFIED | DomainExceptionFilter maps ACCOUNT_NOT_FOUND->404, DUPLICATE_*->409, validation->422, unknown->500; wired in main.ts via useGlobalFilters |

**Score:** 4/4 truths verified (automated), 6 items require human verification for runtime behavior

---

## Required Artifacts

### Plan 04-01 Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `src/shared/infrastructure/auth/strategies/jwt.strategy.ts` | VERIFIED | 31 lines; uses passportJwtSecret with cache=true, rateLimit=true, jwksRequestsPerMinute=5; RS256; validate() returns payload |
| `src/shared/infrastructure/auth/guards/jwt-auth.guard.ts` | VERIFIED | Extends AuthGuard('jwt'); checks IS_PUBLIC_KEY via reflector.getAllAndOverride; returns true for public routes |
| `src/shared/infrastructure/auth/guards/roles.guard.ts` | VERIFIED | Checks ROLES_KEY; reads user.permissions (not roles); returns true if no roles required |
| `src/shared/infrastructure/auth/auth.module.ts` | VERIFIED | Registers JwtStrategy + APP_GUARD:JwtAuthGuard + APP_GUARD:RolesGuard (correct order); exports PassportModule |
| `src/shared/infrastructure/auth/decorators/current-user.decorator.ts` | VERIFIED | createParamDecorator extracting request.user as JwtPayload; supports field selector |
| `src/shared/infrastructure/auth/decorators/roles.decorator.ts` | VERIFIED | ROLES_KEY = 'roles'; Roles = (...roles) => SetMetadata(ROLES_KEY, roles) |
| `src/shared/infrastructure/auth/decorators/public.decorator.ts` | VERIFIED | IS_PUBLIC_KEY = 'isPublic'; Public = () => SetMetadata(IS_PUBLIC_KEY, true) |
| `src/shared/infrastructure/auth/interfaces/jwt-payload.interface.ts` | VERIFIED | All required fields: sub, email, permissions?, gty?, iss, aud, iat, exp |
| `src/shared/infrastructure/auth/index.ts` | VERIFIED | Barrel exports: AuthModule, JwtPayload, CurrentUser, Roles, ROLES_KEY, Public, IS_PUBLIC_KEY, JwtAuthGuard, RolesGuard |

### Plan 04-02 Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `src/account/interface/filters/domain-exception.filter.ts` | VERIFIED | @Catch(); CODE_TO_STATUS map with all 4 codes; handles DomainException, HttpException (with 422 branch), and unknown errors; wired to DomainException via instanceof |
| `src/account/interface/interceptors/response-envelope.interceptor.ts` | VERIFIED | NestInterceptor; isListResponse() detects {data:[],total:number} shape; wraps singles as {data, meta:{timestamp}}; lists as {data, meta:{total,offset,limit,timestamp}} |
| `src/account/interface/dtos/account-response.dto.ts` | VERIFIED | 10 fields; static fromOutput() maps all fields; dates serialized as ISO strings; phoneVerified hardcoded false |
| `src/account/interface/dtos/create-account.dto.ts` | VERIFIED | @IsString, @IsNotEmpty, @Length(2,200) on name; @Matches CPF regex on cpf |
| `src/account/interface/dtos/update-account.dto.ts` | VERIFIED | Optional name (@Length 2-200) and birthDate (@Matches YYYY-MM-DD) |
| `src/account/interface/dtos/list-accounts-query.dto.ts` | VERIFIED | limit (@IsInt, @Min(1), @Max(100), @Type Number); offset (@IsInt, @Min(0), @Type Number); cpf (@IsString) |
| `src/account/interface/dtos/send-phone-code.dto.ts` | VERIFIED | @Matches Brazilian phone regex /^[1-9]{2}[2-9]\d{7,8}$/ |
| `src/account/interface/dtos/verify-phone.dto.ts` | VERIFIED | @Length(6,6) on code |

### Plan 04-03 Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `src/account/interface/controllers/account.controller.ts` | VERIFIED | @Controller('accounts'); all 9 use cases injected; 8 route handlers (GET / handles both cpf and list); route order: /me before /:id |
| `src/account/interface/account-interface.module.ts` | VERIFIED | Imports AccountApplicationModule; registers AccountController |
| `src/main.ts` | VERIFIED | useGlobalPipes(ValidationPipe with whitelist, transform, 422 exceptionFactory); useGlobalFilters(DomainExceptionFilter); useGlobalInterceptors(ResponseEnvelopeInterceptor) |
| `src/app.module.ts` | VERIFIED | Imports: ConfigModule, EventEmitterModule, PrismaModule, AuthModule, AccountInterfaceModule; AccountInfrastructureModule correctly removed (transitive via AccountApplicationModule) |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `auth.module.ts` | `jwt.strategy.ts` | NestJS DI — JwtStrategy provider | WIRED | JwtStrategy imported and listed in providers array |
| `roles.guard.ts` | `roles.decorator.ts` | Reflector reads ROLES_KEY metadata | WIRED | ROLES_KEY imported from roles.decorator.js and used in getAllAndOverride |
| `jwt-auth.guard.ts` | `public.decorator.ts` | Reflector reads IS_PUBLIC_KEY metadata | WIRED | IS_PUBLIC_KEY imported from public.decorator.js and used in getAllAndOverride |
| `account.controller.ts` | `account-application.module.ts` | DI injection of all 9 use cases | WIRED | All 9 use cases imported and injected in constructor |
| `account-interface.module.ts` | `account-application.module.ts` | NestJS module imports | WIRED | AccountApplicationModule in imports array |
| `app.module.ts` | `auth/auth.module.ts` | NestJS module imports | WIRED | AuthModule imported and in imports array |
| `main.ts` | `domain-exception.filter.ts` | app.useGlobalFilters | WIRED | DomainExceptionFilter imported and instantiated in useGlobalFilters |
| `main.ts` | `response-envelope.interceptor.ts` | app.useGlobalInterceptors | WIRED | ResponseEnvelopeInterceptor imported and instantiated in useGlobalInterceptors |
| `domain-exception.filter.ts` | `domain-exception.base.ts` | instanceof check | WIRED | DomainException imported; catch() uses instanceof DomainException |
| `account-response.dto.ts` | use case Output types | static fromOutput() | WIRED | fromOutput() accepts the shared output shape; called in every controller endpoint |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| REST-01 | 04-03 | POST /accounts endpoint | SATISFIED | @Post() @HttpCode(201) @Roles('create:account') in AccountController |
| REST-02 | 04-03 | GET /accounts/:id endpoint | SATISFIED | @Get(':id') calling getById.execute({id}) |
| REST-03 | 04-03 | GET /accounts?cpf=X (admin only) | SATISFIED | GET / handler with query.cpf branch + @Roles('read:accounts') |
| REST-04 | 04-03 | GET /accounts/me endpoint | SATISFIED | @Get('me') declared before @Get(':id') to avoid route conflict |
| REST-05 | 04-03 | PATCH /accounts/:id endpoint | SATISFIED | @Patch(':id') with partial update logic for name and/or birthDate |
| REST-06 | 04-03 | GET /accounts (list) | SATISFIED | GET / handler without cpf branch calls listAccounts.execute |
| REST-07 | 04-02 | Request DTOs with class-validator | SATISFIED | 5 request DTOs with class-validator decorators; ValidationPipe with transform:true |
| REST-08 | 04-02 | Response DTOs with stable contract | SATISFIED | AccountResponseDto with 10 fields + static fromOutput() |
| REST-09 | 04-02 | Standardized error handling | SATISFIED | DomainExceptionFilter + global registration in main.ts |
| REST-10 | 04-03 | POST /accounts/:id/phone/send-code | SATISFIED | @Post(':id/phone/send-code') calling updatePhone.execute |
| REST-11 | 04-03 | POST /accounts/:id/phone/verify | PARTIALLY SATISFIED | Endpoint exists but throws 501 (deferred per plan); ROADMAP success criterion lists it as returning 200 — see note below |
| REST-12 | 04-03 | POST /accounts/:id/photo | SATISFIED | @Post(':id/photo') with FileInterceptor and MaxFileSizeValidator |
| AUTH-01 | 04-01 | Auth0 JWT guard on all routes | SATISFIED | JwtAuthGuard registered as APP_GUARD; protects all routes by default |
| AUTH-02 | 04-01 | Role-based access for getMe | SATISFIED | @Roles('read:own-account') on GET /me; RolesGuard checks permissions claim |
| AUTH-03 | 04-01 | Admin/M2M access for getByCPF | SATISFIED | @Roles('read:accounts') on GET /; RolesGuard checks permissions (works for M2M gty claim) |
| AUTH-04 | 04-01 | Per-route role/permission decorators | SATISFIED | @Roles(), @Public(), @CurrentUser() decorators all functional |

**Note on REST-11:** The ROADMAP Success Criterion 1 states POST /accounts/:id/phone/verify should return 200. The plan explicitly documents this endpoint should return 501 (Not Implemented) because VerifyPhoneCommand does not yet exist. The code correctly throws HttpException with status 501. This is a documented intentional deviation — the endpoint exists and is wired, but returns 501. This is flagged for human confirmation.

**Orphaned requirements check:** All 16 requirement IDs (REST-01 through REST-12, AUTH-01 through AUTH-04) are claimed across the 3 plans. No orphaned requirements.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/account/interface/filters/domain-exception.filter.ts` | 58 | `console.error('Unhandled exception:', exception)` | Info | Intentional: logs truly unexpected errors before returning 500. Not a stub. |
| `src/account/interface/controllers/account.controller.ts` | 152-155 | `throw new HttpException('Phone verification not yet implemented', 501)` | Warning | Intentional 501 placeholder. Documented deviation from ROADMAP success criterion 1 (which says 200). |

No blockers. No missing implementations. No stubs masquerading as real code.

---

## Dependency Check

All required npm packages verified present in package.json:
- `@nestjs/passport`: ^11.0.5
- `passport`: ^0.7.0
- `passport-jwt`: ^4.0.1
- `jwks-rsa`: ^4.0.1
- `class-validator`: ^0.15.1
- `class-transformer`: ^0.5.1
- `@types/passport-jwt`: ^4.0.1 (devDependencies)
- `@types/multer`: present (added in plan 04-03 deviation)

---

## TypeScript Compilation

`npx tsc --noEmit` exits with no errors. All phase 04 files compile cleanly.

---

## Commit Verification

All commits documented in summaries verified present in git log:
- `380bce6` — feat(04-01): auth dependencies, JwtPayload, decorators
- `19289c5` — feat(04-01): JwtStrategy, JwtAuthGuard, RolesGuard, AuthModule
- `528821f` — feat(04-02): request/response DTOs
- `29a60c5` — feat(04-02): DomainExceptionFilter, ResponseEnvelopeInterceptor
- `28bfdbd` — feat(04-03): AccountController
- `8f620cc` — feat(04-03): AccountInterfaceModule, AppModule, main.ts

---

## Human Verification Required

### 1. JWT 401 enforcement (no token)

**Test:** Call any endpoint (e.g., `GET /accounts/me`) without an `Authorization` header.
**Expected:** 401 Unauthorized response.
**Why human:** JwtAuthGuard delegates to passport-jwt's AuthGuard which calls the JWKS endpoint to validate. Cannot verify the 401 path without a running server.

### 2. JWT 401 enforcement (invalid/expired token)

**Test:** Call any endpoint with `Authorization: Bearer invalid.token.here`.
**Expected:** 401 Unauthorized response.
**Why human:** passport-jwt token validation requires live execution; static analysis cannot simulate the JWKS validation failure path.

### 3. RolesGuard 403 enforcement

**Test:** Obtain a valid JWT without `read:own-account` permission, then call `GET /accounts/me`.
**Expected:** 403 Forbidden response.
**Why human:** RolesGuard logic is correct in code, but verifying it actually fires and returns 403 requires a live request with a real JWT containing a controlled permissions claim.

### 4. ValidationPipe 422 response

**Test:** Call `POST /accounts` with body `{"name": "A", "cpf": "invalid"}` (name too short, cpf invalid).
**Expected:** 422 Unprocessable Entity with structured field error array: `{ statusCode: 422, error: 'VALIDATION_ERROR', message: 'Validation failed', details: [{field: 'name', message: '...'}, {field: 'cpf', message: '...'}] }`.
**Why human:** ValidationPipe + exceptionFactory + DomainExceptionFilter chain requires a running NestJS process. Note: ROADMAP success criterion 3 says "return 400" but the plan and implementation use 422. Human should confirm the 422 behavior is correct and acceptable.

### 5. REST-11 / phone verify 501 deviation

**Test:** Call `POST /accounts/:id/phone/verify` with a valid UUID and valid body `{"code": "123456"}`.
**Expected:** 501 Not Implemented.
**Why human:** ROADMAP success criterion 1 explicitly lists this endpoint as returning "200" but plan 03 documents it should return 501 (deferred). The code returns 501. A human must confirm this intentional deviation is acceptable for phase sign-off.

### 6. Response envelope on successful requests

**Test:** Call `GET /accounts/:id` with a valid JWT and an existing account ID.
**Expected:** Response body wrapped in `{ data: { id, name, email, cpf, birthDate, phone, phoneVerified, photoUrl, createdAt, updatedAt }, meta: { timestamp } }`.
**Why human:** ResponseEnvelopeInterceptor behavior requires end-to-end request execution to verify the envelope wraps correctly in production.

---

## Gaps Summary

No structural gaps found. All artifacts exist, are substantive, and are properly wired. All 16 requirement IDs are accounted for by the three plans and implemented in the codebase.

Two deviations from the ROADMAP success criteria are noted but documented as intentional in the plan:
1. POST /accounts/:id/phone/verify returns 501 (ROADMAP says 200) — explicitly deferred per plan 03 task specification.
2. Validation errors return 422 (ROADMAP says "400") — corrected in plan 02 per RESEARCH.md pitfall guidance; 422 is the appropriate status for semantic validation failures.

These deviations do not block goal achievement — the phase goal ("fully protected REST API with proper JWT validation, RBAC, validated DTOs, and standardized error responses") is structurally achieved.

---

_Verified: 2026-03-11_
_Verifier: Claude (gsd-verifier)_
