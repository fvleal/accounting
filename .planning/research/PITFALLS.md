# Pitfalls Research

**Domain:** Account/Identity Bounded Context with DDD + Hexagonal + NestJS
**Researched:** 2026-03-10
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Anemic Domain Model -- Business Logic in Services Instead of Entities

**What goes wrong:**
The Account entity becomes a bag of properties (name, email, phone) with only getters and setters. All validation and business rules live in NestJS services (e.g., `CreateAccountService` validates email format, checks phone uniqueness, enforces name constraints). The "domain model" is just a data transfer structure.

**Why it happens:**
NestJS culture trains developers to put logic in `@Injectable()` services. TypeORM/Prisma encourage entity classes to be schema-decorated property bags. The combination creates a gravitational pull toward anemic models. For an Account context with relatively simple CRUD operations, it feels "natural" to let services do everything.

**How to avoid:**
- Account aggregate must enforce its own invariants: `Account.create({ name, email, phone })` validates and returns a Result, not a raw instance.
- Value Objects (Email, PhoneNumber, PersonName) encapsulate validation rules inside themselves with private constructors and static factory methods.
- Services (UseCases) orchestrate -- they call `Account.create()` or `account.updateEmail(newEmail)`, never validate fields themselves.
- Rule of thumb: if a service method is checking `if (email.includes('@'))`, the logic belongs in the `Email` Value Object.

**Warning signs:**
- Entity classes have no methods beyond getters/setters.
- UseCase/Service classes contain validation logic for domain concepts.
- Value Objects are plain interfaces or type aliases instead of classes with behavior.
- You can construct an Account in an invalid state (e.g., `new Account()` with empty fields).

**Phase to address:**
Phase 1 (Domain Modeling) -- define rich entities and Value Objects from the start. If the domain layer ships anemic, everything built on top inherits the debt.

---

### Pitfall 2: ORM Entities Doubling as Domain Entities

**What goes wrong:**
A single `Account` class is decorated with both `@Entity()` (TypeORM/Prisma) and contains domain behavior. The domain model becomes shaped by database schema requirements rather than business logic. Column types, nullable constraints, and relation decorators leak into the domain. Changing the database schema forces changes to domain logic and vice-versa.

**Why it happens:**
Maintaining two models (domain entity + persistence entity) with mappers feels like unnecessary duplication for a "simple" Account context. Many NestJS tutorials show a single class approach. The overhead seems unjustified -- until the first schema migration breaks domain tests.

**How to avoid:**
- Separate domain entities (`src/domain/account.entity.ts`) from persistence models (`src/infrastructure/persistence/account.orm-entity.ts`).
- Create explicit Mapper classes: `AccountMapper.toDomain(ormEntity)` and `AccountMapper.toPersistence(domainEntity)`.
- Domain entities must have zero ORM decorators. They are plain TypeScript classes.
- Repository adapter implements the port by using the ORM internally and mapping at the boundary.

**Warning signs:**
- Domain entity file imports from `typeorm`, `@prisma/client`, or any ORM package.
- Database column names appear in domain entity property names (e.g., `created_at` snake_case in a domain class).
- Domain unit tests require a database connection or ORM setup to run.
- Changing a column type requires editing domain logic files.

**Phase to address:**
Phase 1 (Domain Modeling) for the domain entities, Phase 2 (Infrastructure/Adapters) for the persistence models and mappers. The separation must be established before any persistence code is written.

---

### Pitfall 3: NestJS Module Structure Leaking Into Hexagonal Layers

**What goes wrong:**
The NestJS module system (`@Module()`) becomes the organizing principle instead of hexagonal layers. Developers create a single `AccountModule` that mixes controllers, services, repositories, and entities in a flat structure. Or worse, they organize by NestJS convention (`controllers/`, `services/`, `entities/`) instead of by architectural layer (`domain/`, `application/`, `infrastructure/`).

**Why it happens:**
NestJS documentation and generators (`nest g resource`) produce a flat module structure by default. The framework's DI system works at the module level, so it feels natural to organize around modules rather than architecture layers. Hexagonal architecture has no first-class concept in NestJS.

**How to avoid:**
- Folder structure follows hexagonal layers, not NestJS conventions:
  ```
  src/account/
    domain/           # Entities, Value Objects, Domain Events, Repository Ports
    application/      # UseCases (Commands/Queries), Application Ports
    infrastructure/   # ORM adapters, Controllers, NestJS module definition
  ```
- The NestJS `@Module()` lives in infrastructure -- it wires ports to adapters.
- Domain and application folders must have zero NestJS imports (no `@Injectable`, no `@nestjs/*`).
- Use `nest g` only for scaffolding, then move files to the correct layer.

**Warning signs:**
- `domain/` folder imports from `@nestjs/common` or `@nestjs/typeorm`.
- UseCase classes are decorated with `@Injectable()` and contain NestJS-specific logic.
- The folder structure mirrors `nest g resource` output without reorganization.
- You cannot extract the domain layer into a standalone npm package without refactoring.

**Phase to address:**
Phase 1 (Project Setup/Domain Modeling) -- folder structure must be established before any code. Refactoring folder structure later triggers cascading import changes.

---

### Pitfall 4: Value Objects Treated as Primitive Types

**What goes wrong:**
Email, PhoneNumber, and PersonName are stored as plain strings throughout the domain. Validation is scattered across controllers (via class-validator DTOs), services, and sometimes even database constraints. The same email format validation appears in 3+ places. When validation rules change, some locations are updated and others are not.

**Why it happens:**
TypeScript makes it easy to pass strings around. NestJS `class-validator` decorators on DTOs feel like "enough" validation. Creating a proper `Email` class with a private constructor and `create()` factory feels like over-engineering for "just a string." Developers conflate DTO validation (input sanitization) with domain invariants (business rules).

**How to avoid:**
- Create Value Objects for every domain concept that has validation rules: `Email`, `PhoneNumber`, `PersonName`.
- Value Objects validate in their factory method: `Email.create('user@example.com')` returns `Result<Email>` or throws.
- Value Objects are immutable -- no setters, only replacement via new factory calls.
- DTO validation (class-validator) catches malformed HTTP input. Value Object validation enforces domain rules. Both exist, they serve different purposes.
- The Account aggregate accepts only Value Objects, never raw strings: `Account.create({ name: PersonName, email: Email, phone: PhoneNumber })`.

**Warning signs:**
- Account entity properties are typed as `string` instead of domain Value Objects.
- The same regex or validation logic appears in both a DTO and a service.
- You can create an Account with `email: ""` without any error from the domain layer.
- Tests validate email format in service tests rather than Value Object tests.

**Phase to address:**
Phase 1 (Domain Modeling) -- Value Objects must be the first thing built, before entities and aggregates that use them.

---

### Pitfall 5: Exposing Domain Model Directly in REST API Responses

**What goes wrong:**
The REST controller returns the Account domain entity directly (or a trivially mapped version). Internal domain structure leaks to API consumers. When the domain model evolves (e.g., splitting `name` into `firstName`/`lastName`, or adding internal audit fields), the API contract breaks for all consuming bounded contexts (Carteirinha, Consumption).

**Why it happens:**
For a simple Account with name/email/phone, the domain model and API response look identical. Creating separate response DTOs feels redundant. Since this API is consumed by internal bounded contexts (not public), developers assume stability.

**How to avoid:**
- Always create explicit Response DTOs: `AccountResponseDto` mapped from the domain entity.
- Controller maps domain result to DTO: `AccountMapper.toResponse(account)`.
- API versioning or at minimum a stable contract: the response DTO is the contract, the domain entity is free to evolve.
- Document the API contract as a Published Language (DDD concept) since downstream contexts depend on it.

**Warning signs:**
- Controller returns domain entity directly: `return account` or `return account.toJSON()`.
- Domain entity has a `toJSON()` or `serialize()` method designed for API output.
- Renaming a domain property requires updating API consumer code in other bounded contexts.
- No dedicated `dto/response/` files exist in the project.

**Phase to address:**
Phase 2 (Application Layer/API) -- when building controllers and API endpoints. Must be in place before any downstream context integrates.

---

### Pitfall 6: Ignoring Domain Events in the Account Aggregate

**What goes wrong:**
Account creation, email changes, and phone updates happen without emitting domain events. When downstream contexts (Carteirinha, Consumption) need to react to account changes, the only option is polling the REST API or adding direct coupling. Retro-fitting events into an aggregate that was not designed for them requires touching every mutation method.

**Why it happens:**
The initial scope is "just CRUD" -- create, read, update accounts. Domain events feel unnecessary when there is no event bus or subscriber yet. The NestJS `@nestjs/cqrs` package provides `AggregateRoot` with event support, but using it couples the domain to NestJS.

**How to avoid:**
- Design the Account aggregate to collect domain events from day one: `AccountCreated`, `AccountEmailChanged`, `AccountPhoneChanged`.
- Use a framework-agnostic approach: the aggregate stores events in an internal array. The application layer (UseCase) extracts and dispatches them after persistence.
- Do not require `@nestjs/cqrs` AggregateRoot in the domain layer. Implement a simple base class: `abstract class AggregateRoot { private events: DomainEvent[] = []; protected addEvent(event: DomainEvent) { this.events.push(event); } }`.
- Events can be dispatched locally (in-process) now and via message broker later -- the aggregate does not care.

**Warning signs:**
- Account aggregate has no `domainEvents` array or event registration mechanism.
- UseCase directly calls external notification services after account creation instead of reacting to events.
- The words "event" or "publish" appear nowhere in the domain layer.
- Discussion about "how will Carteirinha know when an account changes?" has no clear answer.

**Phase to address:**
Phase 1 (Domain Modeling) -- event collection in the aggregate. Phase 2 (Application Layer) -- event dispatching in UseCases. Retrofitting is expensive.

---

### Pitfall 7: Repository Port Interface Shaped by ORM Capabilities

**What goes wrong:**
The `AccountRepositoryPort` interface exposes methods like `findAll(skip, take, orderBy)`, `findByQuery(where: Partial<Account>)`, or `findWithRelations(relations: string[])`. These are ORM query patterns, not domain operations. The port becomes an abstraction over SQL, not over domain persistence needs.

**Why it happens:**
Developers design the port by looking at what TypeORM/Prisma can do and creating an interface that mirrors it. The "list accounts" requirement gets translated directly into generic query methods. It feels pragmatic and flexible.

**How to avoid:**
- Design ports from the domain's perspective: `save(account: Account)`, `findById(id: AccountId)`, `findByEmail(email: Email)`, `exists(email: Email)`.
- No generic query methods. Each method represents a specific domain need.
- Pagination belongs in a Query (CQRS read side), not in the domain repository port. Consider a separate `AccountQueryPort` for read operations that can use ORM-specific features.
- The port interface lives in the domain layer and must not import any ORM types.

**Warning signs:**
- Repository port has methods accepting ORM-specific types (`FindOptionsWhere`, `Prisma.AccountWhereInput`).
- Port interface has a generic `find(criteria)` method that accepts arbitrary filters.
- The port is essentially `interface AccountRepository extends Repository<Account>` from TypeORM.
- Adding a new database feature requires changing the domain-layer port interface.

**Phase to address:**
Phase 1 (Domain Modeling) -- define ports from domain needs. Phase 2 (Infrastructure) -- implement adapters that satisfy the ports using ORM internals.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Single entity for domain + persistence | Less code, fewer files | Domain coupled to DB schema; changing one breaks the other | Never in hexagonal architecture -- defeats the purpose |
| Skipping Value Objects for "simple" strings | Faster initial development | Validation scattered, inconsistent rules, hard to refactor into VOs later | Never -- Email/Phone/Name are textbook VO candidates |
| Using `@nestjs/cqrs` AggregateRoot in domain layer | Built-in event support, less custom code | Domain depends on NestJS; cannot extract to standalone package | Only if you accept permanent NestJS coupling in domain |
| class-validator decorators in domain entities | Single validation point | Domain depends on NestJS ecosystem; DTOs and entities conflated | Never -- use class-validator only in infrastructure DTOs |
| Returning domain entities from controllers | No mapping code needed | API contract couples to domain model; breaking changes propagate to consumers | Early prototyping only; replace before any consumer integrates |
| Generic CRUD repository port | One interface for all operations | Port shaped by ORM, not domain; read operations mixed with write | Never for writes; acceptable for simple read queries behind a QueryPort |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| PostgreSQL via ORM | Letting ORM auto-sync schema in production (`synchronize: true`) | Use explicit migrations; disable auto-sync outside development |
| REST API consumed by downstream contexts | Returning domain entity shape directly, making internal refactors breaking changes | Define a Published Language (stable DTO contract); version the API |
| NestJS DI wiring hexagonal ports | Registering domain services with `@Injectable()` decorator in domain layer | Use NestJS custom providers in the module to bind port tokens to adapter implementations |
| Future message broker (events) | Designing domain events with infrastructure concerns (serialization format, topic names) | Domain events are plain objects with domain semantics; infrastructure adapter handles serialization and transport |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading full Account aggregate for read queries | Slow list/search endpoints; unnecessary Value Object reconstruction | Separate read path (CQRS query) that goes directly to DB, skipping domain model reconstruction | 1K+ accounts in listing queries |
| No database index on email/phone for uniqueness checks | `findByEmail` scans full table; duplicate detection becomes slow | Add unique indexes on email and phone columns from day one | 10K+ accounts |
| Reconstructing Value Objects on every read | CPU overhead from re-validating email/phone format on data already persisted | Trust persisted data; use a `reconstitute()` path that skips validation for data loaded from DB | High-throughput read scenarios |
| N+1 queries in list operations | Each account in a list triggers separate queries for related data | Use eager loading or explicit joins in the repository adapter; keep domain port unaware of this | Any list endpoint with related data |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Email enumeration via error messages ("email already exists" vs generic error) | Attackers discover which emails are registered in the system | Return generic "account could not be created" messages; log specifics server-side |
| No rate limiting on account creation endpoint | Spam account creation; resource exhaustion | Apply rate limiting at infrastructure layer (NestJS guard or API gateway) |
| Exposing internal AccountId (UUID) in API without access control | Any consumer can query any account by guessing/iterating IDs | Implement authorization checks; consider if all fields should be visible to all consuming contexts |
| Phone/email data exposed in list endpoints without scoping | PII leakage to unauthorized consuming contexts | Define different response DTOs per consumer context or implement field-level access control |

## UX Pitfalls

Common user experience mistakes in this domain (API consumer experience, since this is a backend service).

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Inconsistent error response format between endpoints | Consuming contexts must write different error handling per endpoint | Standardize error responses: `{ code, message, details }` across all endpoints |
| No idempotency on account creation | Retried requests create duplicate accounts | Use idempotency keys or check email/phone uniqueness as natural deduplication |
| Validation errors returned as flat strings | Consuming contexts cannot programmatically identify which field failed | Return structured validation errors: `{ field: "email", code: "INVALID_FORMAT", message: "..." }` |
| No pagination metadata in list responses | Consumers cannot build pagination without knowing total count | Return `{ data, total, page, limit }` or cursor-based pagination from the start |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Account creation:** Often missing uniqueness check on email -- verify `exists(email)` is called before `save()`, and a unique DB constraint exists as a safety net.
- [ ] **Value Objects:** Often missing equality comparison -- verify `Email.equals(other)` works correctly (structural equality, not reference).
- [ ] **Repository adapter:** Often missing transaction support -- verify that saving an Account and publishing its domain events can happen atomically.
- [ ] **API contract:** Often missing error response documentation -- verify consuming contexts know the exact error shapes they will receive.
- [ ] **Domain events:** Often missing event metadata (timestamp, aggregate ID, correlation ID) -- verify events carry enough context for consumers.
- [ ] **Update operations:** Often missing optimistic concurrency -- verify concurrent updates to the same Account do not silently overwrite each other (use version field).
- [ ] **Phone/Email update:** Often missing "changed from" information in domain events -- verify `AccountEmailChanged` includes both old and new values for downstream sync.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Anemic domain model | MEDIUM | Extract validation logic from services into Value Objects and entity factory methods; update tests to test domain objects directly |
| ORM entity = Domain entity | HIGH | Create separate persistence models; write mappers; update all repository adapters; re-run all tests. Requires touching every layer. |
| Missing domain events | MEDIUM | Add event array to aggregate; modify mutation methods to emit events; add event dispatching in UseCases. Lower cost if aggregate has proper factory methods. |
| Value Objects as primitives | MEDIUM | Create VO classes; replace `string` types in entity; update mappers and factories. Harder if validation logic is scattered across many services. |
| API contract coupled to domain | HIGH | Create response DTOs; add mapper layer in controllers; coordinate with all consuming contexts to update their integrations. |
| Repository port shaped by ORM | LOW-MEDIUM | Redesign port interface; update adapter implementation. Relatively contained if adapter count is small. |
| No folder structure separation | HIGH | Move files across layers; fix all import paths; update module registrations. Extremely tedious in a large codebase. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Anemic domain model | Phase 1: Domain Modeling | Entity classes have behavior methods; services only orchestrate; domain unit tests test entity logic |
| ORM = Domain entity | Phase 1 (domain) + Phase 2 (persistence) | Domain folder has zero ORM imports; mapper classes exist; domain tests run without DB |
| NestJS module leaking into layers | Phase 1: Project Setup | Domain and application folders have no `@nestjs/*` imports; `grep -r "@nestjs" src/account/domain/` returns nothing |
| Value Objects as primitives | Phase 1: Domain Modeling | All identity fields (email, phone, name) are typed as Value Object classes, not strings |
| API exposing domain model | Phase 2: API Layer | Response DTO classes exist; controller never returns domain entity; API tests verify response shape |
| Missing domain events | Phase 1 (aggregate design) + Phase 2 (dispatching) | Account aggregate has `domainEvents` array; events are collected on create/update; UseCase dispatches after save |
| Repository port shaped by ORM | Phase 1: Domain Modeling | Port interface lives in domain folder; no ORM types in port signatures; methods are domain-named |

## Sources

- [Domain-Driven Hexagon (Sairyss) -- comprehensive guide with NestJS examples](https://github.com/Sairyss/domain-driven-hexagon)
- [DDD vs Reality: Common Pitfalls and Solutions in NestJS](https://medium.com/@an.chmelev/ddd-vs-reality-common-pitfalls-and-their-solutions-in-nestjs-e7f0893de294)
- [Preventing Anemic Domain Models in Hexagonal Architecture with NestJS](https://coldfusion-example.blogspot.com/2026/01/preventing-anemic-domain-models-in.html)
- [Value Objects -- DDD with TypeScript (Khalil Stemmler)](https://khalilstemmler.com/articles/typescript-value-object/)
- [Aggregate Design and Persistence -- DDD with TypeScript](https://khalilstemmler.com/articles/typescript-domain-driven-design/aggregate-design-persistence/)
- [Domain Model Validation (Kamil Grzybek)](https://www.kamilgrzybek.com/blog/posts/domain-model-validation)
- [NestJS CQRS Documentation](https://docs.nestjs.com/recipes/cqrs)
- [Bounded Context Relationships in DDD](https://medium.com/@iamprovidence/relationships-between-bounded-contexts-in-ddd-ce5cfe3aaa04)
- [DDD Beyond the Basics: Multi-Bounded Context Integration](https://medium.com/ssense-tech/ddd-beyond-the-basics-mastering-multi-bounded-context-integration-ca0c7cec6561)
- [From Good to Excellent in DDD: Common Mistakes and Anti-Patterns](https://www.kranio.io/en/blog/de-bueno-a-excelente-en-ddd-errores-comunes-y-anti-patrones-en-domain-driven-design---10-10)
- [Applying DDD Principles to a NestJS Project](https://dev.to/bendix/applying-domain-driven-design-principles-to-a-nest-js-project-5f7b)
- [Microsoft: Tactical DDD for Microservices](https://learn.microsoft.com/en-us/azure/architecture/microservices/model/tactical-ddd)

---
*Pitfalls research for: Account/Identity Bounded Context (DDD + Hexagonal + NestJS)*
*Researched: 2026-03-10*
