# Phase 1: Project Setup and Domain Modeling - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Hexagonal folder structure, NestJS 11 + Prisma + Vitest 3 tooling, DDD base classes (AggregateRoot, ValueObject, Entity), all Value Objects (Email, CPF, PhoneNumber, PersonName, BirthDate), Account aggregate with domain event collection, and AccountRepositoryPort interface. No infrastructure adapters or HTTP endpoints in this phase.

</domain>

<decisions>
## Implementation Decisions

### Validation Rules
- CPF: validated using `cpf-cnpj-validator` library — accepts both masked (123.456.789-09) and unmasked (12345678909)
- PhoneNumber: Brazilian format — DDD + 8 or 9 digits (supports landlines and mobile with the leading 9)
- PersonName: single fullName field, minimum 2 words
- Email: simple format validation (regex), even though it arrives pre-verified from Auth0
- BirthDate: any valid date in the past, no minimum age restriction
- Photo URL: validates that the value is a valid URL

### Domain Events
- AccountCreated: carries full snapshot of the Account at creation time
- AccountUpdated: carries only the changed fields (before/after diff)
- Only these two events in Phase 1 — PhoneVerified and PhotoUploaded deferred to later phases

### Account Identity & Entity Design
- UUID v4 generated in the domain layer (not by the database)
- Two factory methods: `Account.create()` for new accounts (generates ID, validates, collects AccountCreated event) and `Account.reconstitute()` for rehydration from database (no new ID, no event, but still validates)
- Constructor calls `validate()` — both create and reconstitute validate invariants
- Validation in entity uses private setters: each private setter validates its field before assignment
- Public getters for encapsulation — no direct property access
- Specific update methods: `updateName()`, `updatePhone()`, `updateBirthDate()`, `updatePhoto()` — each validates and collects AccountUpdated event
- Base classes: Entity (ID + equals by ID), AggregateRoot extends Entity (adds domain event collection with addEvent/clearEvents/getEvents)
- ValueObject base class with equals() by structural comparison

### Folder Organization
- Hexagonal by context + layer: `src/account/domain/`, `src/account/application/`, `src/account/infrastructure/`, `src/account/interface/`
- Domain internals by DDD type: `domain/entities/`, `domain/value-objects/`, `domain/events/`, `domain/ports/`
- File naming: kebab-case with type suffix — `email.value-object.ts`, `account.entity.ts`, `account.repository.port.ts`, `account-created.event.ts`

### Claude's Discretion
- ESLint boundary rule configuration details
- Exact Vitest configuration
- ValueObject base class implementation approach
- tsconfig strictness level

</decisions>

<specifics>
## Specific Ideas

- Use `cpf-cnpj-validator` npm package for CPF validation — user explicitly requested this library
- Reconstitute always validates (protects against corrupted DB data)
- Private setters enforce invariants at the field level, not just at construction time

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project

### Established Patterns
- None yet — this phase establishes the foundational patterns

### Integration Points
- AccountRepositoryPort will be implemented by Prisma adapter in Phase 2
- Domain events will be dispatched by use cases in Phase 3

</code_context>

<deferred>
## Deferred Ideas

- PhoneVerified domain event — Phase 3 (use cases)
- PhotoUploaded domain event — Phase 3 (use cases)

</deferred>

---

*Phase: 01-project-setup-and-domain-modeling*
*Context gathered: 2026-03-10*
