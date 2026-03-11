# Project Research Summary

**Project:** Account Bounded Context
**Domain:** Identity / DDD + Hexagonal Architecture + CQRS Lite (NestJS)
**Researched:** 2026-03-10
**Confidence:** HIGH

## Executive Summary

This project implements an Account bounded context following Domain-Driven Design tactical patterns, Hexagonal Architecture, and a lightweight CQRS approach (command/query use-case separation without separate read stores). The context is the source of truth for natural-person identity data (name, email, phone) consumed by other bounded contexts (Student Card, Consumption) over REST. Research confirms that this is a well-documented archetype in the NestJS/DDD ecosystem with a clear recommended approach: NestJS 11 as the application framework, MikroORM 6 as the ORM (the only mainstream TypeScript ORM that combines Unit of Work + Identity Map + Data Mapper — the three persistence patterns DDD demands), and PostgreSQL 16+ as the database. The tech stack is mature and version-stable with no significant unknowns.

The recommended architecture separates the codebase into four strict layers — domain (pure TypeScript, zero framework imports), application (use-case handlers dispatching commands and queries), infrastructure (ORM adapters implementing domain ports), and interface (REST controllers and DTOs). The single most important structural decision is establishing this folder structure and layer purity before writing any code, because refactoring it later is the highest-cost recovery operation identified in pitfalls research. Features are well-scoped: an MVP of Value Objects, Account aggregate, CRUD use cases, and a REST API adapter is sufficient for consuming contexts to start integrating. Domain events should be wired from the start (in-process) to avoid expensive retrofitting.

The primary risks are architectural, not technical. The gravitational pull of NestJS conventions (flat module structure, service-centric logic, ORM-as-entity) will push the implementation toward an anemic domain model and a persistence-coupled architecture if not actively resisted from day one. The mitigation is straightforward: establish a non-negotiable rule that the `domain/` folder has zero imports from `@nestjs/*` or any ORM package, and enforce it early with linting. All seven critical pitfalls identified in research are preventable during Phase 1 (domain modeling and project setup) if addressed proactively.

## Key Findings

### Recommended Stack

NestJS 11 with MikroORM 6 is the unambiguous recommended combination for this project. NestJS 11 requires Node.js 20+ and TypeScript 4.8+ (recommend 5.7), ships with Vitest as the default test runner (10-20x faster than Jest in watch mode), and provides first-class ESM support. MikroORM 6 is the only mainstream TypeScript ORM that implements all three patterns DDD persistence requires — Unit of Work, Identity Map, and Data Mapper — allowing domain entities to remain plain TypeScript classes with zero ORM coupling.

TypeORM is explicitly ruled out (Active Record mode encourages anemic models; Data Mapper mode lacks Unit of Work and Identity Map; maintenance has slowed). Prisma is acceptable for a read-side query adapter later but is wrong for the write/command side because its generated client is not a domain entity and forces a schema-first design that fights DDD aggregate boundaries. For CQRS at this "lite" level, plain NestJS services with clear naming conventions (`CreateAccountHandler`, `GetAccountByIdQuery`) are preferable to the `@nestjs/cqrs` module — unless an EventBus for cross-module domain event dispatching is needed.

**Core technologies:**
- Node.js 20 LTS: runtime — required minimum for NestJS 11
- TypeScript ~5.7: language — decorator metadata support needed for DI; latest stable features
- NestJS 11.1.x: application framework — DI container maps naturally to Hexagonal Architecture (modules = bounded contexts, providers = adapters)
- MikroORM 6.6.x: ORM — only mainstream TS ORM combining Unit of Work + Identity Map + Data Mapper; entities are plain classes with no framework coupling
- PostgreSQL 16+: database — project constraint; JSONB for flexible value object storage; strong indexing
- Vitest ^3.x: testing — NestJS 11 default; native ESM/TS support; Jest-compatible API; critical for high domain test density

### Expected Features

The MVP scope is well-defined. All P1 features are straightforward to implement and unambiguously required. The Account aggregate with Value Objects for Email, Phone, and PersonName is the foundation — nothing else works without it. Email uniqueness is required at both the domain level (repository check before save) and the database level (unique constraint as safety net).

Domain events (`AccountCreated`, `AccountUpdated`) are classified P1 because retroactively adding event collection to an aggregate that did not design for it is costly. They should be implemented in-process from day one; integration event publishing (message broker) is deferred to P3.

Authentication, authorization, profile pictures, organization/legal entity support, WebSocket notifications, full-text search, separate CQRS read databases, event sourcing, and multi-tenancy are all explicitly out of scope per project constraints and feature research.

**Must have (table stakes):**
- Email, Phone, PersonName Value Objects with validation — foundation for all domain operations
- Account aggregate with identity invariants — the single consistency boundary
- Create Account command — with email uniqueness enforcement at domain and DB level
- Get Account by ID query — primary integration point for consuming bounded contexts
- Update Account command — identity data changes with invariant re-enforcement
- List Accounts query — with offset-based pagination and pagination metadata in response
- REST API adapter — well-defined DTOs, proper HTTP status codes, standardized error responses
- Domain events (AccountCreated, AccountUpdated) — in-process collection in aggregate; dispatch in use cases
- PostgreSQL repository adapter — implements AccountRepositoryPort via MikroORM

**Should have (v1.x after validation):**
- Account search by email or phone — reverse lookup for consuming contexts that know email/phone but not ID
- Account lifecycle state machine (Active/Suspended/Closed) — when business rules require account deactivation
- Soft delete via Closed state — preserves referential integrity for historical records
- Optimistic concurrency control (version field) — prevents lost updates under concurrent writes
- Idempotent creation with dedup key — prevents duplicate accounts from retry storms
- Structured audit trail from domain events — compliance and debugging

**Defer (v2+):**
- Integration events via message broker — when multiple consumers need async notification
- Account merge/deduplication — when operational experience surfaces duplicate account problems
- Bulk create/update operations — when data migration or import workflows emerge

### Architecture Approach

The architecture follows four strictly layered hexagonal rings: domain (core business rules, pure TypeScript), application (use-case orchestration via command and query handlers), infrastructure (port implementations: ORM repository adapter, persistence model, mapper), and interface (REST controllers, request/response DTOs, DTO mappers). Each layer depends only on layers interior to it. The domain layer must have zero imports from `@nestjs/*` or any ORM — it must be extractable as a standalone package without modification. NestJS custom providers wire port interfaces to their adapter implementations in the module definition, keeping the DI binding outside the domain.

CQRS is applied at the use-case level only: commands (write) load an aggregate, call a domain mutation method, and save; queries (read) can bypass aggregate reconstruction and return projections directly from the repository for performance. The same PostgreSQL database backs both sides. The persistence model (ORM entity) and domain aggregate are separate classes connected by an explicit Mapper — this is the critical pattern that keeps ORM concerns out of the domain.

**Major components:**
1. Domain layer (account/domain/) — Account aggregate, Value Objects (Email, Phone, PersonName, AccountId), Domain Events, AccountRepositoryPort interface, domain errors
2. Application layer (account/application/) — Command handlers (CreateAccount, UpdateAccount), Query handlers (GetAccountById, ListAccounts), command/query DTOs
3. Infrastructure layer (account/infrastructure/) — AccountOrmEntity (MikroORM persistence model), AccountMapper (domain <-> persistence translation), AccountRepository (implements AccountRepositoryPort)
4. Interface layer (account/interface/rest/) — AccountController, Request DTOs (class-validator), Response DTOs, DTO-to-command/query mapper
5. Shared base classes (shared/domain/) — AggregateRoot, Entity, ValueObject, DomainEvent base classes consumed across future bounded contexts

**Build order (driven by dependency direction):**
1. Shared base classes
2. Domain layer (Value Objects first, then aggregate, then events, then port interface)
3. Application layer (command/query DTOs, then handlers)
4. Infrastructure layer (ORM entity, mapper, repository adapter)
5. Interface layer (controllers, DTOs, DTO mappers)
6. Module wiring (NestJS module binding ports to adapters)
7. Integration/E2E tests

### Critical Pitfalls

1. **Anemic domain model** — Put all business logic (validation, invariants, state transitions) inside the Account aggregate and Value Objects. Command handlers orchestrate only (load, call domain method, save). The rule: if a handler is checking `email.includes('@')`, that logic belongs in the `Email` Value Object. Prevention window: Phase 1 (domain modeling).

2. **ORM entities doubling as domain entities** — Maintain two separate classes: `Account` (domain aggregate, plain TypeScript) and `AccountOrmEntity` (MikroORM decorated persistence model). The mapper translates between them. Domain unit tests must run without any database connection. Prevention window: Phase 1 establishes domain entities; Phase 2 establishes persistence models.

3. **NestJS module structure overriding hexagonal layers** — Folder structure must follow `domain/`, `application/`, `infrastructure/`, `interface/` — not NestJS generator conventions (`controllers/`, `services/`, `entities/`). Domain and application folders must contain zero `@nestjs/*` imports. Enforce this with an ESLint rule that makes imports from `@nestjs/*` in `src/*/domain/**` a linting error. Prevention window: Phase 1 project setup — refactoring folder structure later is the highest-recovery-cost pitfall.

4. **Value Objects treated as primitive strings** — Email, Phone, and PersonName must be proper VO classes with private constructors, static `create()` factory methods, immutability, and structural equality. `class-validator` decorators on DTOs are for HTTP input sanitization only; domain invariants live in VO constructors. Prevention window: Phase 1, before the aggregate is written.

5. **Missing domain events from the start** — The Account aggregate must have a `domainEvents` array and `addDomainEvent()` on its base class from day one. `AccountCreated` and `AccountUpdated` events are collected in aggregate factory and mutation methods and dispatched by use-case handlers after persistence. Retrofitting event support into an aggregate that was not designed for it requires touching every mutation method. Prevention window: Phase 1 aggregate design.

6. **Exposing domain model directly in REST responses** — Controllers must never return domain entities. Explicit `AccountResponseDto` classes with an `AccountDtoMapper` provide the stable API contract. The domain model is free to evolve without breaking consuming contexts. Prevention window: Phase 3 (interface/REST layer).

7. **Repository port shaped by ORM capabilities** — `AccountRepositoryPort` methods must be named from the domain's perspective (`save`, `findById`, `findByEmail`, `exists`) with no ORM types in signatures. Generic query methods (`find(where: Partial<Account>)`) and ORM-specific types (`FindOptionsWhere`) must not appear in the port interface. Prevention window: Phase 1 port design.

## Implications for Roadmap

Based on combined research across stack, features, architecture, and pitfalls, the following phase structure is strongly recommended. The ordering is driven by dependency direction (each phase has all prerequisites from prior phases) and pitfall prevention timing (the most expensive pitfalls to fix are architectural and must be addressed first).

### Phase 1: Foundation and Domain Modeling

**Rationale:** Every subsequent phase depends on domain layer correctness. The most expensive pitfalls (anemic model, ORM-coupled entities, wrong folder structure, primitive Value Objects, missing domain events) are all preventable only in this phase. Building infrastructure or the API before the domain is solid is the root cause of all the high-recovery-cost debt patterns identified in research.

**Delivers:**
- Project structure with enforced hexagonal layers (ESLint boundary rules)
- NestJS 11 + MikroORM 6 project bootstrapped and configured
- `shared/domain/` base classes: AggregateRoot (with domainEvents array), Entity, ValueObject, DomainEvent
- Value Objects: Email (format validation, normalization), Phone (format validation), PersonName (non-empty, trim, max-length), AccountId (UUIDv7)
- Account aggregate: factory method `Account.create()`, `Account.reconstitute()`, `Account.updateIdentity()`, domain event emission on each mutation
- Domain events: AccountCreated, AccountUpdated (with timestamp, aggregate ID)
- AccountRepositoryPort interface (domain-named methods, no ORM types)
- Domain error types: InvalidEmailError, AccountNotFoundError, DuplicateEmailError

**Addresses (from FEATURES.md):** All Value Object features, Account aggregate invariants, email uniqueness domain logic, domain events foundation

**Avoids (from PITFALLS.md):** Anemic domain model, Value Objects as primitives, missing domain events, repository port shaped by ORM, NestJS leaking into domain layer

**Research flag:** Standard patterns — well-documented DDD tactical patterns; no deeper research needed

### Phase 2: Infrastructure and Persistence

**Rationale:** With domain layer complete and ports defined, the infrastructure adapters can be built against the contracts. MikroORM configuration, the persistence model, and the mapper must be established before any use case can persist data. This phase produces the repository adapter that all use-case handlers depend on.

**Delivers:**
- MikroORM 6 configuration (PostgreSQL, migrations, request-scoped EntityManager)
- AccountOrmEntity (separate from domain aggregate, MikroORM decorated)
- AccountMapper (toDomain, toPersistence, with reconstitute path that skips validation for trusted DB data)
- AccountRepository adapter implementing AccountRepositoryPort (save, findById, findByEmail, exists, findAll with pagination)
- Database migrations for the accounts table (id UUID PK, firstName, lastName, email UNIQUE INDEX, phone, createdAt, updatedAt)
- MikroORM Unit of Work integration (single `em.flush()` per use case, no manual transaction management)

**Uses (from STACK.md):** MikroORM 6.6.x, @mikro-orm/nestjs, @mikro-orm/postgresql, @mikro-orm/migrations, UUIDv7 via `uuid` package

**Implements (from ARCHITECTURE.md):** Persistence model separation with mapper, Port-Adapter binding via NestJS DI

**Avoids (from PITFALLS.md):** ORM entity doubling as domain entity, `synchronize: true` in production, N+1 queries in list operations, missing indexes on email/phone

**Research flag:** Standard patterns — MikroORM NestJS integration is well-documented

### Phase 3: Application Layer (Use Cases)

**Rationale:** With domain and infrastructure complete, command and query handlers can be built as pure orchestrators. This phase wires the domain layer to the persistence layer via use-case logic without any HTTP concerns — making handlers independently testable.

**Delivers:**
- CreateAccountHandler: validates email uniqueness, calls Account.create(), saves, dispatches domain events
- UpdateAccountHandler: loads aggregate, calls updateIdentity(), saves, dispatches domain events
- GetAccountByIdHandler: loads account by ID, maps to response projection
- ListAccountsHandler: queries repository with pagination parameters, returns paginated result
- Domain event dispatching: after-save event publication (in-process, framework-agnostic)
- Application-layer error handling: domain errors mapped to application exceptions

**Addresses (from FEATURES.md):** Create Account, Get Account by ID, Update Account, List Accounts (all P1 use cases), email uniqueness constraint enforcement, domain event dispatching

**Avoids (from PITFALLS.md):** Business logic in handlers (stays in domain), missing domain event dispatch after persistence

**Research flag:** Standard patterns — CQRS lite command/query handler pattern is straightforward with NestJS

### Phase 4: REST API Layer (Interface Adapter)

**Rationale:** The interface layer is the last to be built because it is a thin adapter over use cases. Building it last ensures it adapts to use-case contracts rather than shaping them. The REST API is the integration contract for consuming bounded contexts — it must be stable, well-documented, and return structured errors from day one.

**Delivers:**
- AccountController with endpoints: POST /accounts, GET /accounts/:id, PATCH /accounts/:id, GET /accounts
- CreateAccountRequestDto, UpdateAccountRequestDto (class-validator, only at adapter boundary)
- AccountResponseDto (stable API contract, decoupled from domain model)
- AccountDtoMapper (DTO to command/query, domain to response DTO)
- Standardized error response format: `{ code, message, details, field? }` across all endpoints
- Proper HTTP status codes: 201 Created, 200 OK, 400 Bad Request, 404 Not Found, 409 Conflict, 422 Unprocessable Entity
- OpenAPI documentation via @nestjs/swagger
- NestJS GlobalExceptionFilter mapping domain errors to HTTP responses

**Addresses (from FEATURES.md):** REST API adapter, input validation and error handling, idempotent creation foundation, pagination metadata in list responses

**Avoids (from PITFALLS.md):** Domain model exposed in REST responses, inconsistent error response format, no pagination metadata

**Research flag:** Standard patterns — NestJS controller + class-validator + Swagger is heavily documented

### Phase 5: Testing and Hardening

**Rationale:** With all layers complete, systematic testing validates layer isolation, domain invariants, use-case correctness, and API contract stability. This phase also adds the remaining v1 hardening items before the context is ready for consuming bounded context integration.

**Delivers:**
- Domain unit tests: Value Object validation edge cases, aggregate invariant enforcement, domain event emission
- Application unit tests: command/query handler behavior with mocked repository
- Infrastructure integration tests: repository adapter against a real PostgreSQL instance (Testcontainers or local Docker)
- API E2E tests: full HTTP request to database round-trips for all endpoints
- ESLint boundary rules enforcing zero `@nestjs/*` imports in domain/application layers
- Performance baseline: database indexes verified, reconstitute path skips re-validation of persisted data

**Research flag:** Standard patterns — Vitest + NestJS testing utilities are well-documented; integration testing with MikroORM follows standard patterns

### Phase Ordering Rationale

- **Domain before infrastructure** is non-negotiable in Hexagonal Architecture. The domain defines the port (interface); infrastructure implements it. Reversing the order causes ORM capabilities to shape the domain contract.
- **Infrastructure before application** because command handlers inject the repository port — the adapter must exist for the NestJS DI container to wire it.
- **Application before interface** because controllers dispatch to use-case handlers — handlers must exist before controllers are wired.
- **Testing as a final phase** is intentional for this bounded context: domain and application unit tests can be written phase-by-phase, but the hardening pass (boundary enforcement, integration tests, E2E) requires all layers to be complete.
- **v1.x features (account lifecycle, optimistic concurrency, search, audit trail) are deliberately excluded from this roadmap.** They belong in a follow-on iteration after at least one consuming bounded context validates the core API.

### Research Flags

Phases likely needing deeper research during planning:
- None identified. All patterns in this stack (NestJS + MikroORM + DDD Hexagonal + CQRS lite) are well-documented with multiple reference implementations. The domain-driven-hexagon repository (Sairyss) is an authoritative reference for the exact combination used here.

Phases with standard patterns (research-phase can be skipped):
- **Phase 1 (Domain Modeling):** DDD Value Objects, aggregate roots, domain events — canonical patterns with extensive documentation
- **Phase 2 (Infrastructure):** MikroORM + NestJS integration is thoroughly documented in official MikroORM docs
- **Phase 3 (Application Layer):** CQRS lite command/query handler pattern in NestJS — standard recipe
- **Phase 4 (REST API):** NestJS controller + class-validator + Swagger — one of the most documented NestJS patterns
- **Phase 5 (Testing):** Vitest + NestJS testing — NestJS 11 default toolchain

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Versions verified against GitHub releases as of 2026-03-10. NestJS 11.1.16 and MikroORM 6.6.9 confirmed latest stable. Version compatibility matrix validated. |
| Features | HIGH | MVP scope is constrained and explicit. Project constraints (no auth, natural persons only, CQRS lite) are unambiguous. Feature dependencies are clear. |
| Architecture | HIGH | Hexagonal Architecture + DDD + CQRS lite in NestJS is a well-established archetype with multiple authoritative reference implementations (domain-driven-hexagon, bitloops). Build order is dictated by hard dependency direction. |
| Pitfalls | HIGH | Seven critical pitfalls identified, all with root cause analysis, warning signs, phase assignments, and recovery cost estimates. Sources include both authoritative guides and NestJS-specific practical experience. |

**Overall confidence:** HIGH

### Gaps to Address

- **NestJS 12 migration (Q3 2026):** If development extends past Q3 2026, `class-validator` should be migrated to Zod via the `StandardSchemaValidationPipe` planned for NestJS 12. This is a known upcoming change, not a risk, but plan for it if timeline extends.

- **Domain event dispatching mechanism:** Research is clear that aggregates collect events and use cases dispatch them, but the exact in-process dispatcher (custom event emitter vs. `@nestjs/cqrs` EventBus vs. Node.js `EventEmitter`) is a design-time decision that should be made in Phase 1. Recommendation: start with a simple framework-agnostic event bus (array flush after save) to keep the domain decoupled from NestJS; switch to `@nestjs/cqrs` EventBus only when cross-module or async dispatching becomes necessary.

- **Optimistic concurrency timing:** Research recommends including a `version` field on the aggregate from the start rather than retrofitting. This is a Phase 1 design decision (domain aggregate property) with Phase 2 implications (ORM entity column, MikroORM version decorator). If the MVP timeline is aggressive, this can be deferred to v1.x — the recovery cost is LOW-MEDIUM per pitfalls research.

- **`@nestjs/cqrs` vs manual command/query bus:** Research recommends plain NestJS services for CQRS lite. If the team wants a formal CommandBus/QueryBus with interceptor support, `@nestjs/cqrs` is the option. This choice should be made before Phase 3 since it affects how handlers are registered and injected.

## Sources

### Primary (HIGH confidence)
- [NestJS GitHub Releases](https://github.com/nestjs/nest/releases) — v11.1.16 verified latest stable (2026-03-10)
- [NestJS 11 Announcement](https://trilon.io/blog/announcing-nestjs-11-whats-new) — Node >= 20 requirement, ESM, Vitest default
- [MikroORM GitHub Releases](https://github.com/mikro-orm/mikro-orm/releases) — v6.6.9 verified latest stable (2026-03-10)
- [MikroORM NestJS Integration Docs](https://mikro-orm.io/docs/usage-with-nestjs) — @mikro-orm/nestjs configuration
- [NestJS CQRS Documentation](https://docs.nestjs.com/recipes/cqrs) — official CQRS recipe
- [Microsoft Azure: Tactical DDD for Microservices](https://learn.microsoft.com/en-us/azure/architecture/microservices/model/tactical-ddd) — DDD tactical patterns

### Secondary (MEDIUM confidence)
- [Domain-Driven Hexagon (Sairyss)](https://github.com/Sairyss/domain-driven-hexagon) — comprehensive NestJS + DDD + Hexagonal reference implementation
- [DDD Hexagonal CQRS ES EDA (Bitloops)](https://github.com/bitloops/ddd-hexagonal-cqrs-es-eda) — complete working example with NestJS
- [DDD vs Reality: Common Pitfalls in NestJS (Chmelev)](https://medium.com/@an.chmelev/ddd-vs-reality-common-pitfalls-and-their-solutions-in-nestjs-e7f0893de294) — pitfall identification
- [Value Objects — DDD with TypeScript (Khalil Stemmler)](https://khalilstemmler.com/articles/typescript-value-object/) — VO pattern implementation
- [Authentication and Authorization in DDD](https://medium.com/@martinezdelariva/authentication-and-authorization-in-ddd-671f7a5596ac) — why auth is separate from identity
- [MikroORM Competitive Analysis](https://github.com/mikro-orm/mikro-orm/issues/7170) — UoW + Identity Map + Data Mapper unique combination

### Tertiary (LOW confidence)
- [NestJS v12 PR](https://github.com/nestjs/nest/pull/16391) — StandardSchemaValidationPipe with Zod planned for Q3 2026 (not yet shipped)
- [Node.js ORM Comparison 2025](https://thedataguy.pro/blog/2025/12/nodejs-orm-comparison-2025/) — ecosystem landscape overview

---
*Research completed: 2026-03-10*
*Ready for roadmap: yes*
