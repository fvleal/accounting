# Phase 4: REST API and Security - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

A fully protected REST API exposes all account operations with Auth0 JWT validation, role-based access control, validated request DTOs, standardized error responses, and consistent response envelope. Controllers live in `src/account/interface/`, auth infrastructure in `src/shared/infrastructure/auth/`. No new domain logic or use cases — this phase wires HTTP to existing application layer.

</domain>

<decisions>
## Implementation Decisions

### Auth0 JWT Integration
- @nestjs/passport + passport-jwt for JWT validation
- JwtStrategy validates Auth0-issued tokens (JWKS endpoint)
- Global APP_GUARD applies JWT auth to all routes by default
- @Public() decorator opts out specific routes (if any)
- Custom @CurrentUser() parameter decorator extracts typed JwtPayload from request.user
- Auth module lives in `src/shared/infrastructure/auth/` (cross-cutting, reusable by future bounded contexts)

### Role-Based Access Control
- Auth0 built-in RBAC — permissions claim from Auth0 API settings
- Two roles for v1: `user` (getMe, create account, update own data) and `admin` (getByCPF, listAccounts)
- @Roles() decorator + RolesGuard per route
- M2M tokens: same guard, Auth0 M2M tokens carry `gty: 'client-credentials'` claim; guard checks permissions equally — M2M needs `read:accounts` permission for admin-level endpoints
- Single controller with unified routes — guards differentiate access by role, no separate controllers per actor

### Error Response Format
- Standardized format: `{ statusCode, error, message, details }`
- Global ExceptionFilter with centralized code-to-status mapping: ACCOUNT_NOT_FOUND->404, DUPLICATE_EMAIL->409, DUPLICATE_CPF->409, DUPLICATE_AUTH0_SUB->409, validation->422
- Validation errors (class-validator): array of field errors `[{ field, message }]` in details
- 500 errors: generic message `"Internal server error"` in response, details only in server logs — never exposed to client
- DomainException.code maps to `error` field, DomainException.metadata maps to `details`

### API Response Shape
- Envelope pattern: all responses wrapped in `{ data, meta }`
- Single resource: `{ data: { id, name, ... }, meta: { timestamp } }`
- List: `{ data: [...], meta: { total, offset, limit } }`
- Global NestJS interceptor applies envelope automatically — controllers return plain data
- Pagination meta for lists: offset + limit + total (aligns with existing findAll limit/offset pattern)

### Request DTOs and Validation
- class-validator + class-transformer for request DTO validation
- NestJS ValidationPipe (global) transforms and validates incoming requests
- Validation errors return 422 with structured field error array

### Response DTOs
- Single AccountResponseDto for all endpoints: id, name, email, cpf, birthDate, phone, phoneVerified, photoUrl, createdAt, updatedAt
- No field filtering by role in v1 — all fields returned to all authorized callers
- Controller maps use case Output to response DTO

### Claude's Discretion
- Exact class-validator decorators per DTO field
- ValidationPipe configuration details (whitelist, forbidNonWhitelisted, transform)
- JwtStrategy configuration (audience, issuer, algorithms)
- Interceptor implementation details for envelope
- File upload handling for photo endpoint (multer config)
- Swagger/OpenAPI decorators (if included — APIE-02 is v2 but basic decorators may be useful)

</decisions>

<specifics>
## Specific Ideas

- User wants minimal Auth0 configuration per tenant — Auth0 built-in RBAC chosen specifically to avoid custom Actions/Rules per deployment
- Unified routes with guards, not separate controllers per actor — keeps API surface simple and RESTful
- Error format aligns naturally with existing DomainException (code->error, metadata->details)
- Envelope interceptor keeps controllers clean — they just return data, interceptor wraps it

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DomainException` base class with `code: string` + `metadata: Record<string, unknown>` — maps directly to error response format
- 4 domain exceptions: AccountNotFoundError, DuplicateEmailError, DuplicateCpfError, DuplicateAuth0SubError
- `UseCase<I, O>` interface — all 9 use cases follow this pattern with typed Input/Output
- `AccountApplicationModule` exports all 9 use cases for DI injection in controllers
- `ACCOUNT_REPOSITORY_PORT`, `STORAGE_PORT` string tokens for DI (already wired in infrastructure module)

### Established Patterns
- Use cases return Output interfaces (plain objects), not domain entities
- Each use case has its own Input/Output types co-located in the same file
- DI uses string tokens for ports: `@Inject(ACCOUNT_REPOSITORY_PORT)`
- Static AccountMapper.toDomain/toPersistence pattern
- Domain layer is pure TypeScript — no framework imports (ESLint enforced)

### Integration Points
- `src/account/interface/` — empty (.gitkeep), ready for controllers and DTOs
- `AccountApplicationModule` — import this in the interface module to get all use cases
- `src/shared/infrastructure/auth/` — new directory for AuthModule, JwtStrategy, guards, decorators
- `app.module.ts` — needs AuthModule and AccountInterfaceModule registered
- `main.ts` — needs global ValidationPipe, global exception filter, global response interceptor

</code_context>

<deferred>
## Deferred Ideas

- Swagger/OpenAPI documentation (APIE-02) — v2 requirement, basic decorators may be added at Claude's discretion
- Cursor-based pagination (APIE-01) — v2, current findAll uses limit/offset
- CPF masking per role — v1 returns all fields to all authorized callers
- Rate limiting — not in current scope

</deferred>

---

*Phase: 04-rest-api-and-security*
*Context gathered: 2026-03-11*
