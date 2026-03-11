# Roadmap: Account Bounded Context

## Overview

This roadmap delivers an Account bounded context that serves as the central identity source for natural persons, consumed by other bounded contexts via REST API. The build order follows hexagonal architecture dependency direction: domain first (pure business rules), then infrastructure adapters, then application orchestration, then the REST interface, and finally systematic testing. Each phase produces a coherent, independently verifiable layer.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Project Setup and Domain Modeling** - Hexagonal folder structure, tooling, base classes, Value Objects, Account aggregate, domain events, and repository port
- [ ] **Phase 2: Infrastructure and Persistence** - PostgreSQL adapter via Prisma implementing AccountRepositoryPort, migrations, mappers, storage and phone verification adapters
- [ ] **Phase 3: Application Layer** - Command and Query use cases as orchestrators depending on ports, with explicit CQRS separation
- [ ] **Phase 4: REST API and Security** - Controllers, DTOs, Auth0 JWT guard, role-based access, error handling, and all HTTP endpoints
- [ ] **Phase 5: Testing and Hardening** - Unit tests for domain and use cases, integration tests for adapters, E2E tests for endpoints

## Phase Details

### Phase 1: Project Setup and Domain Modeling
**Goal**: A pure domain layer with enforced hexagonal boundaries exists, containing all Value Objects, the Account aggregate with domain event collection, and the repository port interface -- all without any framework or infrastructure dependencies
**Depends on**: Nothing (first phase)
**Requirements**: SETP-01, SETP-02, SETP-03, DOMN-01, DOMN-02, DOMN-03, DOMN-04, DOMN-05, DOMN-06, DOMN-07, DOMN-08, DOMN-09
**Success Criteria** (what must be TRUE):
  1. NestJS 11 project runs and Vitest executes a trivial test successfully
  2. Folder structure follows hexagonal layers (domain/, application/, infrastructure/, interface/) and ESLint rejects any @nestjs/* import inside domain/
  3. Each Value Object (Email, CPF, PhoneNumber, PersonName, BirthDate) rejects invalid input at construction time and enforces immutability
  4. Account aggregate can be created with required fields (name, email, CPF), collects AccountCreated and AccountUpdated domain events, and exposes an AccountRepositoryPort interface with domain-named methods
**Plans:** 3 plans

Plans:
- [ ] 01-01-PLAN.md — Scaffold NestJS 11 project, replace Jest with Vitest 3, create hexagonal folder structure, configure ESLint boundaries
- [ ] 01-02-PLAN.md — Build DDD base classes (ValueObject, Entity, AggregateRoot, DomainEvent) and all 5 Value Objects via TDD
- [ ] 01-03-PLAN.md — Build Account aggregate with factory methods, domain events (AccountCreated/AccountUpdated), and AccountRepositoryPort via TDD

### Phase 2: Infrastructure and Persistence
**Goal**: The domain's repository port has a working PostgreSQL adapter via Prisma that can persist and retrieve Account aggregates, with a clean mapper separating domain and persistence models
**Depends on**: Phase 1
**Requirements**: INFR-01, INFR-02, INFR-03, INFR-04, INFR-05, INFR-06
**Success Criteria** (what must be TRUE):
  1. Prisma schema defines the accounts table with appropriate columns and unique constraints, and migrations run successfully against PostgreSQL
  2. AccountRepository adapter implements all AccountRepositoryPort methods (save, findById, findByCpf, findByEmail, findAll) using Prisma client
  3. Mapper correctly translates between domain Account aggregate and Prisma persistence model in both directions (toDomain reconstitutes without re-validating trusted DB data)
  4. StoragePort interface exists in domain with an S3 adapter, and a phone verification adapter (SMS/WhatsApp) implements its port
**Plans:** 2 plans

Plans:
- [ ] 02-01-PLAN.md — Docker Compose (PostgreSQL 17 + MinIO), Prisma schema with Account model, migration, PrismaService/Module, NestJS root module wiring
- [ ] 02-02-PLAN.md — AccountRepositoryPort findAll, StoragePort, AccountMapper, PrismaAccountRepository with transactional events, S3StorageAdapter, infrastructure module

### Phase 3: Application Layer
**Goal**: All use cases exist as thin orchestrators that load aggregates, invoke domain methods, persist results, and dispatch domain events -- depending only on port interfaces, never on concrete adapters
**Depends on**: Phase 2
**Requirements**: UCAS-01, UCAS-02, UCAS-03, UCAS-04, UCAS-05, UCAS-06, UCAS-07, UCAS-08, UCAS-09, UCAS-10
**Success Criteria** (what must be TRUE):
  1. CreateAccountCommand extracts email from Auth0 token (via userinfo), enforces email/CPF uniqueness, creates an Account aggregate, persists it, and dispatches AccountCreated event
  2. UpdateAccountCommand and UploadAccountPhotoCommand modify account data through aggregate methods and persist changes; phone update is blocked unless verification is completed first via SendPhoneVerificationCommand and VerifyPhoneCommand
  3. GetAccountByIdQuery, FindAccountByFieldQuery, and ListAccountsQuery return account data from the repository without modifying state
  4. All use cases inject port interfaces (not implementations), and Commands are structurally separated from Queries in the codebase
**Plans:** 3 plans

Plans:
- [ ] 03-01-PLAN.md — Add auth0Sub to Account entity/schema/port/adapter, create UseCase base interface, DomainException base, account domain exceptions, CQRS folder structure
- [ ] 03-02-PLAN.md — Build 5 command use cases via TDD: CreateAccount (idempotent), UpdateName, UpdatePhone, UpdateBirthDate, UploadAccountPhoto
- [ ] 03-03-PLAN.md — Build 4 query use cases via TDD: GetAccountById, GetMe, FindAccountByField, ListAccounts + AccountApplicationModule

### Phase 4: REST API and Security
**Goal**: A fully protected REST API exposes all account operations with proper Auth0 JWT validation, role-based access control, validated request DTOs, and standardized error responses
**Depends on**: Phase 3
**Requirements**: REST-01, REST-02, REST-03, REST-04, REST-05, REST-06, REST-07, REST-08, REST-09, REST-10, REST-11, REST-12, AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):
  1. All endpoints exist and return correct HTTP status codes: POST /accounts (201), GET /accounts/:id (200/404), GET /accounts/me (200/404), GET /accounts?cpf=X (200, admin only), PATCH /accounts/:id (200), GET /accounts (200), POST /accounts/:id/phone/send-code (200), POST /accounts/:id/phone/verify (200), POST /accounts/:id/photo (200)
  2. Every route requires a valid Auth0 JWT token; requests without a token or with an invalid token receive 401; getMe requires role "user", getByCPF requires admin/M2M permissions
  3. Request DTOs validate input via class-validator decorators and return 400 with structured error details on invalid input; response DTOs return a stable contract (name, email, CPF, birthDate, phone, photo) decoupled from the domain model
  4. Domain errors (not found, duplicate, invalid) are mapped to appropriate HTTP status codes (404, 409, 422) via a global exception filter with a standardized error format
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

### Phase 5: Testing and Hardening
**Goal**: The entire bounded context is covered by automated tests at every layer, confirming domain invariants, use case orchestration, adapter correctness, and API contract stability
**Depends on**: Phase 4
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06
**Success Criteria** (what must be TRUE):
  1. Value Object unit tests cover valid construction, invalid input rejection, and equality semantics for all five VOs (Email, CPF, PhoneNumber, PersonName, BirthDate) -- running without any database or framework dependency
  2. Account aggregate unit tests verify creation with required fields, domain event emission, and invariant enforcement -- running without any database or framework dependency
  3. Command and Query use case tests verify correct orchestration behavior (uniqueness checks, aggregate method calls, event dispatch, error mapping) using mocked ports via Vitest
  4. Integration tests confirm the PostgreSQL adapter correctly persists and retrieves accounts against a real database
  5. E2E tests send HTTP requests to the running application and verify full request-to-database round trips for all endpoints, including auth enforcement
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Project Setup and Domain Modeling | 0/3 | Planning complete | - |
| 2. Infrastructure and Persistence | 0/2 | Planning complete | - |
| 3. Application Layer | 0/3 | Planning complete | - |
| 4. REST API and Security | 0/? | Not started | - |
| 5. Testing and Hardening | 0/? | Not started | - |
