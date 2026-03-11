# Phase 3: Application Layer - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Command and Query use cases as thin orchestrators depending on port interfaces, with explicit CQRS separation. Use cases load aggregates, invoke domain methods, persist results, and dispatch domain events. No HTTP endpoints, controllers, or DTOs in this phase — those belong to Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Auth0 Email Extraction
- Controller extracts email and Auth0 sub from JWT payload, passes them as strings to the use case
- Use case stays pure — no Auth0 dependency, no Auth0Port
- Auth0 sub (user ID) is stored on the Account aggregate for identity linking
- Requires adding auth0Sub field to Account entity and Prisma schema
- findByAuth0Sub method added to AccountRepositoryPort for GetMeQuery and idempotency checks

### CreateAccount Idempotency
- If auth0Sub already has an account, return the existing account instead of throwing
- Prevents duplicate accounts from retry/race conditions
- Uniqueness checks (email, CPF) happen in the use case before creating — use case calls findByEmail/findByCpf first
- DB unique constraints remain as a safety net, not the primary check

### GetMe Query
- Dedicated GetMeQuery use case (not reused FindAccountByFieldQuery)
- Takes auth0Sub, returns account Output
- Cleaner semantics, easier to add getMe-specific logic later

### Email Immutability
- Email is immutable — set once at creation from Auth0 token, never updated in this bounded context
- No UpdateEmailCommand

### Phone Verification Scope
- UCAS-08 (SendPhoneVerificationCommand) and UCAS-09 (VerifyPhoneCommand) are DEFERRED — not built in Phase 3
- No PhoneVerificationPort created
- UpdatePhoneCommand allows setting phone unverified (phoneVerified=false) — matches Phase 2 schema
- Verification flow added in a future phase when real SMS adapter is built

### Update Commands — One Field Per Command
- Separate commands: UpdateNameCommand, UpdatePhoneCommand, UpdateBirthDateCommand
- Each is its own use case class — granular CQRS
- UploadAccountPhotoCommand handles full flow: receives buffer + contentType, calls StoragePort.upload() to get URL, then calls account.updatePhoto(url) and saves

### Error Handling
- Custom domain exceptions (not NestJS HttpExceptions, not Result types)
- Base DomainException class in shared/domain/exceptions/ with structured metadata and a 'code' string
- Specific exceptions in account domain: AccountNotFoundError({id}), DuplicateEmailError({email}), DuplicateCpfError({cpf}), DuplicateAuth0SubError({auth0Sub})
- Controller layer catches and maps to HTTP status codes (Phase 4)
- Authorization handled entirely by controller/guard layer — use cases assume caller is authorized

### Use Case Input/Output Pattern
- Use cases define Input and Output interfaces co-located in the same file
- Use case receives Input, returns Output (plain interface, not domain entity)
- Controller maps Output to response DTO
- All use cases implement UseCase<I, O> { execute(input: I): Promise<O> } base interface
- Base UseCase interface lives in shared/application/

### Claude's Discretion
- Exact Output interface shapes per use case
- NestJS module structure for application layer (AccountApplicationModule or per-use-case providers)
- DI registration approach for use cases
- Whether to group commands/queries in subfolders or flat in application/

</decisions>

<specifics>
## Specific Ideas

- Use cases return Output interfaces (not domain entities) — controller maps Output to response DTO. User explicitly requested this Input/Output pattern.
- One command per field update — user prefers granular CQRS over batch updates
- Auth0 sub stored on Account for identity linking — enables dedicated GetMeQuery

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- Account.create({name, email, cpf}) — factory method for new accounts (needs auth0Sub added)
- Account.reconstitute(id, props) — rehydration from DB
- Account update methods: updateName(), updatePhone(), updateBirthDate(), updatePhoto()
- AccountRepositoryPort with save, findById, findByEmail, findByCpf, findAll, exists (needs findByAuth0Sub added)
- StoragePort with upload(key, buffer, contentType) and delete(key)
- AggregateRoot.addEvent() / getEvents() / clearEvents() — event collection
- PrismaAccountRepository — save() dispatches events inside transaction automatically

### Established Patterns
- Domain layer is pure TypeScript — no framework imports (ESLint enforced)
- Account getters return primitive strings (VO.value), not VO instances
- UUID generated via node:crypto randomUUID()
- DI uses string tokens: ACCOUNT_REPOSITORY_PORT, STORAGE_PORT
- Static AccountMapper.toDomain/toPersistence pattern
- Event dispatch via EventEmitter2 inside repository transaction

### Integration Points
- src/account/application/ — currently empty (.gitkeep), ready for use cases
- AccountInfrastructureModule provides ACCOUNT_REPOSITORY_PORT and STORAGE_PORT via DI
- PrismaAccountRepository handles event dispatch on save — use cases don't dispatch events manually
- Account entity needs auth0Sub field added (domain change)
- Prisma schema needs auth0_sub column added (infrastructure change)
- AccountRepositoryPort needs findByAuth0Sub method added

</code_context>

<deferred>
## Deferred Ideas

- SendPhoneVerificationCommand (UCAS-08) — deferred until phone verification adapter is built
- VerifyPhoneCommand (UCAS-09) — deferred until phone verification adapter is built
- PhoneVerificationPort — deferred, no port or adapter in v1
- UpdateEmailCommand — email is immutable in this bounded context

</deferred>

---

*Phase: 03-application-layer*
*Context gathered: 2026-03-11*
