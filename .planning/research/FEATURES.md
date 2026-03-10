# Feature Research

**Domain:** Account/Identity Bounded Context (DDD, natural persons only)
**Researched:** 2026-03-10
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features that consuming bounded contexts (Student Card, Consumption) and developers expect. Missing these means the context fails its core purpose as an identity source of truth.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Create Account with identity data (name, email, phone) | Core purpose of the context -- without creation, nothing works | LOW | Single aggregate creation with value object validation |
| Get Account by ID | Other bounded contexts need to resolve identity by ID -- this is the primary integration point | LOW | Simple query, returns Account projection |
| Update Account identity data | People change names, emails, phones -- stale data breaks downstream contexts | LOW | Partial update support, must enforce invariants on each field |
| List Accounts with pagination | Operations and admin UIs need to browse accounts; downstream contexts may need bulk resolution | MEDIUM | Cursor-based or offset pagination. Keep it simple initially with offset |
| Email format validation (Value Object) | Invalid emails corrupt data for every downstream consumer | LOW | Email as Value Object with format validation in constructor |
| Phone format validation (Value Object) | Invalid phone numbers cascade errors to SMS, identity verification contexts | LOW | Phone as Value Object, validate E.164 or national format |
| Name validation (Value Object) | Empty or malformed names break display in every consuming context | LOW | PersonName Value Object with non-empty, trimming, max-length rules |
| Email uniqueness constraint | Duplicate emails create identity ambiguity -- two accounts, same person | MEDIUM | Enforce at domain level (repository check) + DB unique constraint as safety net |
| REST API for cross-context consumption | Explicitly required -- other bounded contexts consume Account via REST | MEDIUM | Well-defined DTOs, proper HTTP status codes, versioned endpoints |
| Domain Events (AccountCreated, AccountUpdated) | Other contexts need to react to identity changes; foundation for eventual consistency | MEDIUM | Publish domain events within the bounded context. Start with in-process events, evolve to integration events later |
| Input validation and error handling | Consumers need clear, structured error responses to handle failures gracefully | LOW | Validation errors with field-level detail, proper HTTP 400/404/422 responses |
| Idempotent creation (optional dedup key) | Retries from consuming contexts should not create duplicate accounts | MEDIUM | Optional client-provided idempotency key or email-based natural dedup |

### Differentiators (Competitive Advantage)

Features that elevate this from a basic CRUD service to a well-engineered identity context. These demonstrate DDD maturity and operational readiness.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Account lifecycle state machine (Active/Suspended/Closed) | Enables downstream contexts to respect account status -- suspended accounts should not consume resources | MEDIUM | Aggregate enforces valid transitions. State as Value Object. Domain events per transition (AccountSuspended, AccountReactivated, AccountClosed) |
| Soft delete with AccountClosed state | Preserves referential integrity for historical records in Consumption Context; compliant with data retention needs | LOW | Never hard-delete. AccountClosed state + `closedAt` timestamp. Closed accounts return 410 Gone or a flag on GET |
| Structured audit trail via domain events | Track who changed what and when -- essential for compliance and debugging cross-context issues | MEDIUM | Store domain events as append-only audit log. Each event captures before/after or changeset |
| Anti-Corruption Layer (ACL) for inbound requests | Protects domain model from external representation drift; consuming contexts send whatever format they want | MEDIUM | Input DTOs map to domain commands via ACL. Domain never exposed directly |
| Account search by email or phone | Downstream contexts often know the email/phone but not the ID -- need reverse lookup | LOW | Query use case with indexed lookups. Return Account or 404 |
| Optimistic concurrency control | Prevents lost updates when multiple contexts or admins update the same account simultaneously | MEDIUM | Version field on aggregate. 409 Conflict on stale writes. ETag header on REST responses |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem natural for an Account context but violate scope boundaries, add unjustified complexity, or belong in other bounded contexts.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Authentication (login, password, sessions, tokens) | "Account context should handle login" | Explicitly out of scope per PROJECT.md. Auth is a separate bounded context with completely different invariants (security, rate limiting, token lifecycle). Coupling auth here bloats the aggregate and violates SRP | Separate Auth bounded context that references Account by ID. Account stays a pure identity store |
| Authorization / RBAC | "Account should know what users can do" | Permissions are policy, not identity. Adding roles to Account couples it to every downstream context's access rules | Separate Authorization context or per-context permission models |
| Profile pictures / avatars | "Identity includes photos" | Binary storage, CDN concerns, resizing -- none of this is identity domain logic. Pollutes the aggregate with infrastructure concerns | Separate media service. Account stores a `profileImageUrl` at most (and even that is debatable) |
| Organization / legal entity support | "Accounts should support companies too" | PROJECT.md explicitly limits scope to natural persons (pessoas fisicas). Organizations have fundamentally different identity models (CNPJ, representatives, hierarchies) | Separate Organization bounded context if needed later |
| Real-time WebSocket notifications | "Push account changes to consumers" | Adds infrastructure complexity (WebSocket server, connection management) for a context that changes infrequently. REST polling or event bus is sufficient | Domain events published to a message broker. Consumers subscribe at their own pace |
| Full-text search across all fields | "Search accounts by anything" | Requires search infrastructure (Elasticsearch) that is overkill for a bounded context with simple lookup needs | Indexed queries on email, phone, name. If full-text is truly needed later, add a read-model projection |
| CQRS with separate read model database | "Use CQRS properly with separate stores" | PROJECT.md specifies CQRS leve (light CQRS) -- command/query separation at use case level only. Separate read DB adds operational complexity with no benefit at this scale | Command and Query use cases share the same PostgreSQL database. Separate read models only if query performance becomes a bottleneck |
| Event Sourcing | "Store all state as events" | Explicitly out of scope per PROJECT.md. Massive complexity increase for an aggregate with simple state (name, email, phone). Audit trail via domain events achieves the traceability benefit without the complexity | Append-only domain event log for audit. Current state in PostgreSQL rows |
| Multi-tenancy | "Support multiple organizations/tenants" | Single-context scope for natural persons. Multi-tenancy adds tenant isolation, routing, and data partitioning complexity with no current requirement | If needed later, implement at infrastructure level (schema-per-tenant or row-level) |

## Feature Dependencies

```
[Email/Phone/Name Value Objects]
    └──required by──> [Create Account]
                          └──required by──> [Get Account by ID]
                          └──required by──> [Update Account]
                          └──required by──> [List Accounts]

[Create Account]
    └──produces──> [Domain Events (AccountCreated)]
                       └──enables──> [Audit Trail]

[Update Account]
    └──produces──> [Domain Events (AccountUpdated)]
                       └──enables──> [Audit Trail]

[Email Uniqueness Constraint]
    └──required by──> [Create Account]
    └──required by──> [Update Account]

[Account Lifecycle States]
    └──enhances──> [Get Account by ID] (status-aware responses)
    └──produces──> [Domain Events (AccountSuspended, AccountClosed)]

[REST API Layer]
    └──requires──> [All Use Cases (Commands + Queries)]
    └──requires──> [Anti-Corruption Layer / DTOs]

[Optimistic Concurrency]
    └──enhances──> [Update Account] (prevents lost updates)
    └──requires──> [Version field on Aggregate]
```

### Dependency Notes

- **Value Objects required by Create/Update Account:** Validation lives in Value Objects. The Account aggregate cannot be created without valid Email, Phone, and PersonName. Build these first.
- **Domain Events required by Audit Trail:** Audit trail is an event consumer. Domain events must exist before audit logging can work.
- **Email Uniqueness required by Create and Update:** Both commands must check uniqueness. This means the repository port needs a `findByEmail` method.
- **REST API requires all use cases:** The API layer is a thin adapter over use cases. Build use cases first (hexagonal architecture), then wire the REST adapter.
- **Optimistic Concurrency enhances Update:** Adding a version field to the aggregate is a design-time decision. Easier to include from the start than retrofit.

## MVP Definition

### Launch With (v1)

Minimum viable identity context -- enough for consuming bounded contexts to start integrating.

- [x] Email, Phone, PersonName Value Objects with validation -- foundation for all operations
- [x] Account Aggregate with identity invariants -- the core domain model
- [x] Create Account (Command) -- with email uniqueness enforcement
- [x] Get Account by ID (Query) -- primary integration point for consumers
- [x] Update Account (Command) -- identity data changes
- [x] List Accounts (Query) -- with basic pagination
- [x] REST API adapter with proper error responses -- the integration contract
- [x] Domain Events (AccountCreated, AccountUpdated) -- in-process, foundation for future integration
- [x] PostgreSQL Repository Adapter -- persistence layer

### Add After Validation (v1.x)

Features to add once the core context is running and consumed by at least one other bounded context.

- [ ] Account search by email or phone -- when consumers need reverse lookups beyond ID
- [ ] Account lifecycle states (Active/Suspended/Closed) -- when business rules require account deactivation
- [ ] Soft delete via Closed state -- when data retention requirements are formalized
- [ ] Optimistic concurrency control -- when concurrent updates become a real problem
- [ ] Idempotent creation with dedup key -- when retry storms or duplicate creation is observed
- [ ] Structured audit trail from domain events -- when compliance or debugging requires change history

### Future Consideration (v2+)

Features to defer until the system matures and requirements emerge from real usage.

- [ ] Integration events (publish to message broker) -- when multiple consumers need async notification of changes
- [ ] Anti-Corruption Layer hardening -- when external API contracts start drifting from domain model
- [ ] Account merge/deduplication -- when duplicate accounts become a real operational problem
- [ ] Bulk operations (batch create/update) -- when data migration or import workflows are needed

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Value Objects (Email, Phone, PersonName) | HIGH | LOW | P1 |
| Account Aggregate | HIGH | MEDIUM | P1 |
| Create Account | HIGH | LOW | P1 |
| Get Account by ID | HIGH | LOW | P1 |
| Update Account | HIGH | LOW | P1 |
| List Accounts (paginated) | MEDIUM | LOW | P1 |
| Email uniqueness constraint | HIGH | MEDIUM | P1 |
| REST API with error handling | HIGH | MEDIUM | P1 |
| Domain Events (in-process) | MEDIUM | MEDIUM | P1 |
| PostgreSQL Repository Adapter | HIGH | MEDIUM | P1 |
| Search by email/phone | MEDIUM | LOW | P2 |
| Account lifecycle states | MEDIUM | MEDIUM | P2 |
| Soft delete (Closed state) | MEDIUM | LOW | P2 |
| Optimistic concurrency | MEDIUM | MEDIUM | P2 |
| Idempotent creation | LOW | MEDIUM | P2 |
| Audit trail | LOW | MEDIUM | P2 |
| Integration events (broker) | MEDIUM | HIGH | P3 |
| Account merge/dedup | LOW | HIGH | P3 |
| Bulk operations | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch -- the context is non-functional without these
- P2: Should have, add when real usage reveals the need
- P3: Nice to have, defer until system maturity demands it

## Competitor Feature Analysis

This is an internal bounded context, not a market product. Instead of competitors, we compare against common patterns in identity management services.

| Feature | Generic CRUD Service | IAM Platforms (Auth0, Keycloak) | Our Approach |
|---------|---------------------|-------------------------------|--------------|
| Identity CRUD | Basic REST with no domain logic | Full identity + auth + sessions | DDD aggregate with rich Value Objects and invariants. No auth |
| Validation | Input-level only (controller) | Schema + policy-based | Domain-level via Value Object constructors. Invalid state is unrepresentable |
| Uniqueness | DB constraint only | Email/username unique + merge | Domain-level check + DB constraint as safety net |
| Events | None or ad-hoc logging | Full audit + webhooks | Domain Events as first-class DDD concept. Audit trail as event consumer |
| Lifecycle | Active/deleted binary | Full lifecycle with MFA, verification | Simple state machine (Active/Suspended/Closed). No auth lifecycle |
| Cross-context integration | Direct DB sharing | OAuth/OIDC federation | REST API with well-defined DTOs. Context mapping via Conformist or ACL |

## Sources

- [Microsoft Azure: Use Tactical DDD to Design Microservices](https://learn.microsoft.com/en-us/azure/architecture/microservices/model/tactical-ddd) -- DDD tactical patterns (entities, value objects, aggregates)
- [DDD Beyond the Basics: Mastering Aggregate Design](https://medium.com/ssense-tech/ddd-beyond-the-basics-mastering-aggregate-design-26591e218c8c) -- Aggregate invariants and boundaries
- [Authentication and Authorization in DDD](https://medium.com/@martinezdelariva/authentication-and-authorization-in-ddd-671f7a5596ac) -- Why auth is a separate concern from identity
- [DDD Context Mapping by Example](https://alok-mishra.com/2021/06/29/ddd-context-mapping-by-example-policy-management/) -- Identity context as dependency for other contexts
- [Implementing Soft Deletes with Extension Fields](https://support.ipaas.com/en/articles/11842743-implementing-soft-deletes-with-extension-fields-in-api-integrations) -- Soft delete patterns
- [LoginRadius Consumer Audit Trail](https://www.loginradius.com/press/loginradius-announces-consumer-audit-trail) -- Audit trail in identity management
- PROJECT.md constraints and scope definitions (primary source for scope boundaries)

---
*Feature research for: Account/Identity Bounded Context*
*Researched: 2026-03-10*
