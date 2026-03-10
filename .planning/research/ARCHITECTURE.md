# Architecture Research

**Domain:** Account/Identity Bounded Context (DDD + Hexagonal + CQRS Lite)
**Researched:** 2026-03-10
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Interface Adapters Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐     │
│  │  REST        │  │  Request /   │  │  Response /        │     │
│  │  Controllers │  │  Input DTOs  │  │  Output DTOs       │     │
│  └──────┬───────┘  └──────────────┘  └────────────────────┘     │
│         │ dispatches Commands / Queries                          │
├─────────┴───────────────────────────────────────────────────────┤
│                     Application Layer                            │
│  ┌────────────────────┐  ┌────────────────────┐                  │
│  │  Command Handlers  │  │  Query Handlers    │                  │
│  │  (Use Cases)       │  │  (Use Cases)       │                  │
│  └────────┬───────────┘  └────────┬───────────┘                  │
│           │ calls domain logic     │ reads via port               │
│  ┌────────┴───────────────────────┴───────────┐                  │
│  │          Ports (Interfaces)                 │                  │
│  │  AccountRepositoryPort                      │                  │
│  └────────┬───────────────────────────────────┘                  │
├───────────┴─────────────────────────────────────────────────────┤
│                     Domain Layer (Core)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │  Account     │  │  Value       │  │  Domain      │            │
│  │  Aggregate   │  │  Objects     │  │  Events      │            │
│  │  (Root)      │  │  (Email,     │  │  (Account    │            │
│  │              │  │   Phone,     │  │   Created,   │            │
│  │              │  │   Name)      │  │   Updated)   │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
├─────────────────────────────────────────────────────────────────┤
│                     Infrastructure Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │  PostgreSQL  │  │  ORM Entity  │  │  Mapper      │            │
│  │  Repository  │  │  (Persist.   │  │  (Domain <-> │            │
│  │  Adapter     │  │   Model)     │  │   Persist.)  │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **REST Controllers** | Parse HTTP requests, dispatch commands/queries, return HTTP responses | NestJS `@Controller()` classes, one per aggregate or per use case |
| **Request/Response DTOs** | Validate and shape external data; decouple API contract from domain | `class-validator` decorated classes |
| **Command Handlers** | Orchestrate write use cases: load aggregate, call domain logic, persist | One class per command (e.g., `CreateAccountHandler`) |
| **Query Handlers** | Orchestrate read use cases: fetch data via repository port, return DTO | One class per query (e.g., `GetAccountByIdHandler`) |
| **Ports (Interfaces)** | Define contracts for infrastructure dependencies | TypeScript interfaces (e.g., `AccountRepositoryPort`) |
| **Account Aggregate** | Enforce all business invariants for an Account; the single consistency boundary | Class with factory methods, validation in constructor/methods |
| **Value Objects** | Immutable, self-validating domain primitives (Email, Phone, PersonName) | Classes with private constructor, static `create()` factory |
| **Domain Events** | Signal that something meaningful happened in the domain | Plain classes (e.g., `AccountCreatedEvent`) |
| **Repository Adapter** | Implement `AccountRepositoryPort` using PostgreSQL/ORM | NestJS injectable class using TypeORM or Prisma |
| **Persistence Model** | Database-specific entity representation, separate from domain model | TypeORM `@Entity()` or Prisma model |
| **Mapper** | Translate between domain aggregate and persistence model | Static class with `toDomain()` and `toPersistence()` methods |

## Recommended Project Structure

```
src/
├── account/                          # Bounded context module
│   ├── account.module.ts             # NestJS module wiring
│   │
│   ├── domain/                       # Domain layer (no dependencies)
│   │   ├── model/
│   │   │   ├── account.aggregate.ts  # Aggregate root
│   │   │   ├── account-id.vo.ts      # Value object: identity
│   │   │   ├── email.vo.ts           # Value object
│   │   │   ├── phone.vo.ts           # Value object
│   │   │   └── person-name.vo.ts     # Value object
│   │   ├── event/
│   │   │   ├── account-created.event.ts
│   │   │   └── account-updated.event.ts
│   │   ├── port/
│   │   │   └── account-repository.port.ts   # Repository interface
│   │   └── error/
│   │       ├── invalid-email.error.ts
│   │       └── account-not-found.error.ts
│   │
│   ├── application/                  # Application layer (depends on domain)
│   │   ├── command/
│   │   │   ├── create-account/
│   │   │   │   ├── create-account.command.ts
│   │   │   │   └── create-account.handler.ts
│   │   │   └── update-account/
│   │   │       ├── update-account.command.ts
│   │   │       └── update-account.handler.ts
│   │   └── query/
│   │       ├── get-account-by-id/
│   │       │   ├── get-account-by-id.query.ts
│   │       │   └── get-account-by-id.handler.ts
│   │       └── list-accounts/
│   │           ├── list-accounts.query.ts
│   │           └── list-accounts.handler.ts
│   │
│   ├── infrastructure/               # Infrastructure layer (implements ports)
│   │   ├── persistence/
│   │   │   ├── account.orm-entity.ts       # ORM/persistence model
│   │   │   ├── account.mapper.ts           # Domain <-> persistence mapping
│   │   │   └── account.repository.ts       # Implements AccountRepositoryPort
│   │   └── account.providers.ts            # DI token bindings (port -> adapter)
│   │
│   └── interface/                    # Interface adapters layer
│       ├── rest/
│       │   ├── account.controller.ts
│       │   ├── dto/
│       │   │   ├── create-account.request.dto.ts
│       │   │   ├── update-account.request.dto.ts
│       │   │   └── account.response.dto.ts
│       │   └── account.dto-mapper.ts       # DTO <-> Command/Query mapping
│       └── __tests__/                      # Integration/e2e tests for endpoints
│
├── shared/                           # Cross-cutting concerns
│   ├── domain/
│   │   ├── aggregate-root.base.ts    # Base class for aggregates
│   │   ├── entity.base.ts           # Base class for entities
│   │   ├── value-object.base.ts     # Base class for value objects
│   │   └── domain-event.base.ts     # Base class for domain events
│   └── guard/
│       └── uuid.guard.ts            # Shared validation
│
├── app.module.ts
└── main.ts
```

### Structure Rationale

- **`account/` as bounded context module:** NestJS modules map naturally to bounded contexts. One module encapsulates all layers for Account, making it self-contained and portable.
- **`domain/` has zero external dependencies:** The domain folder imports nothing from NestJS, no ORM decorators, no framework code. This is the purity guarantee of hexagonal architecture. You could copy this folder into a different framework and it would work.
- **`application/command/` and `application/query/` separation:** CQRS lite -- commands and queries are structurally separated at the use case level but share the same persistence model. Each use case gets its own subfolder (vertical slice) containing the command/query DTO and its handler.
- **`infrastructure/persistence/` keeps ORM details contained:** The persistence model (`account.orm-entity.ts`) is separate from the domain aggregate. The mapper handles translation. This prevents ORM decorators from leaking into the domain.
- **`interface/rest/` for HTTP-specific concerns:** Controllers, DTOs, and HTTP-level mapping live here. If you later add GraphQL, add `interface/graphql/` alongside `interface/rest/`.
- **`shared/` for tactical DDD base classes:** Base classes for aggregate roots, entities, and value objects avoid duplication across future bounded contexts.

## Architectural Patterns

### Pattern 1: Aggregate Root with Factory Method and Self-Validation

**What:** The Account aggregate root encapsulates all invariant enforcement. External code never constructs an aggregate directly -- it uses static factory methods that validate all business rules before creating the object.
**When to use:** Always for aggregate creation and state mutation.
**Trade-offs:** More boilerplate than plain objects, but guarantees the domain model is always in a valid state.

**Example:**
```typescript
// domain/model/account.aggregate.ts
export class Account extends AggregateRoot {
  private constructor(
    private readonly id: AccountId,
    private name: PersonName,
    private email: Email,
    private phone: Phone,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {
    super();
  }

  static create(props: {
    name: PersonName;
    email: Email;
    phone: Phone;
  }): Account {
    const account = new Account(
      AccountId.generate(),
      props.name,
      props.email,
      props.phone,
      new Date(),
      new Date(),
    );
    account.addDomainEvent(new AccountCreatedEvent(account.id));
    return account;
  }

  updateIdentity(props: {
    name?: PersonName;
    email?: Email;
    phone?: Phone;
  }): void {
    if (props.name) this.name = props.name;
    if (props.email) this.email = props.email;
    if (props.phone) this.phone = props.phone;
    this.updatedAt = new Date();
    this.addDomainEvent(new AccountUpdatedEvent(this.id));
  }
}
```

### Pattern 2: Value Objects with Self-Validation

**What:** Value objects validate their own invariants at creation time. They are immutable. Invalid data never enters the domain.
**When to use:** For every domain primitive that has business rules (email format, phone format, name constraints).
**Trade-offs:** Each VO is a small class instead of a plain string, adding indirection. Worth it because validation logic is centralized and reusable.

**Example:**
```typescript
// domain/model/email.vo.ts
export class Email extends ValueObject<string> {
  private constructor(private readonly value: string) {
    super();
  }

  static create(raw: string): Email {
    const normalized = raw.trim().toLowerCase();
    if (!Email.isValid(normalized)) {
      throw new InvalidEmailError(raw);
    }
    return new Email(normalized);
  }

  private static isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
```

### Pattern 3: Port-Adapter Binding via NestJS DI

**What:** The repository port (interface) is defined in the domain layer. The adapter (implementation) lives in infrastructure. NestJS dependency injection wires them together using custom provider tokens.
**When to use:** For every infrastructure dependency the application layer needs.
**Trade-offs:** Requires a custom DI token and provider definition, but fully decouples domain from infrastructure.

**Example:**
```typescript
// domain/port/account-repository.port.ts
export interface AccountRepositoryPort {
  save(account: Account): Promise<void>;
  findById(id: AccountId): Promise<Account | null>;
  findAll(): Promise<Account[]>;
}

export const ACCOUNT_REPOSITORY_PORT = Symbol('AccountRepositoryPort');

// infrastructure/account.providers.ts
import { Provider } from '@nestjs/common';
import { ACCOUNT_REPOSITORY_PORT } from '../domain/port/account-repository.port';
import { AccountRepository } from './persistence/account.repository';

export const accountProviders: Provider[] = [
  {
    provide: ACCOUNT_REPOSITORY_PORT,
    useClass: AccountRepository,
  },
];

// application/command/create-account/create-account.handler.ts
@CommandHandler(CreateAccountCommand)
export class CreateAccountHandler
  implements ICommandHandler<CreateAccountCommand>
{
  constructor(
    @Inject(ACCOUNT_REPOSITORY_PORT)
    private readonly accountRepo: AccountRepositoryPort,
  ) {}

  async execute(command: CreateAccountCommand): Promise<string> {
    const account = Account.create({
      name: PersonName.create(command.name),
      email: Email.create(command.email),
      phone: Phone.create(command.phone),
    });
    await this.accountRepo.save(account);
    return account.getId().getValue();
  }
}
```

### Pattern 4: Persistence Model Separation with Mapper

**What:** The ORM entity (persistence model) and the domain aggregate are separate classes. A mapper translates between them. This prevents ORM decorators and database concerns from polluting the domain model.
**When to use:** Always. This is the core principle of hexagonal architecture for persistence.
**Trade-offs:** More code than using the ORM entity as the domain model. Prevents tight coupling that causes painful refactoring later.

**Example:**
```typescript
// infrastructure/persistence/account.orm-entity.ts
@Entity('accounts')
export class AccountOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  phone: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// infrastructure/persistence/account.mapper.ts
export class AccountMapper {
  static toDomain(entity: AccountOrmEntity): Account {
    return Account.reconstitute({
      id: AccountId.from(entity.id),
      name: PersonName.create(entity.firstName, entity.lastName),
      email: Email.create(entity.email),
      phone: Phone.create(entity.phone),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toPersistence(aggregate: Account): AccountOrmEntity {
    const entity = new AccountOrmEntity();
    entity.id = aggregate.getId().getValue();
    entity.firstName = aggregate.getName().getFirstName();
    entity.lastName = aggregate.getName().getLastName();
    entity.email = aggregate.getEmail().getValue();
    entity.phone = aggregate.getPhone().getValue();
    return entity;
  }
}
```

### Pattern 5: CQRS Lite (Command/Query Separation Without Separate Read Models)

**What:** Commands and queries are separated at the use case level. Commands go through the aggregate (domain logic); queries can bypass the domain and read directly from the repository. Both use the same database and persistence model.
**When to use:** This project -- CQRS lite is the explicit constraint. No separate read models, no event sourcing, no separate read database.
**Trade-offs:** Simpler than full CQRS. Queries still go through the repository port, but they can return simpler DTOs without loading the full aggregate if performance matters.

## Data Flow

### Command Flow (Write)

```
HTTP POST /accounts
    |
    v
AccountController.create(dto: CreateAccountRequestDto)
    |  validates DTO (class-validator)
    |  maps DTO -> CreateAccountCommand
    v
CommandBus.execute(CreateAccountCommand)
    |
    v
CreateAccountHandler.execute(command)
    |  creates Value Objects (Email, Phone, PersonName)
    |  calls Account.create() -- domain validates invariants
    |  calls AccountRepositoryPort.save(account)
    v
AccountRepository (adapter)
    |  AccountMapper.toPersistence(account) -> OrmEntity
    |  TypeORM repository.save(ormEntity)
    v
PostgreSQL
    |
    v
Returns account ID -> Controller -> HTTP 201 { id }
```

### Query Flow (Read)

```
HTTP GET /accounts/:id
    |
    v
AccountController.findById(id: string)
    |  maps param -> GetAccountByIdQuery
    v
QueryBus.execute(GetAccountByIdQuery)
    |
    v
GetAccountByIdHandler.execute(query)
    |  calls AccountRepositoryPort.findById(id)
    v
AccountRepository (adapter)
    |  TypeORM repository.findOne({ where: { id } })
    |  AccountMapper.toDomain(ormEntity) -> Account
    v
Returns Account aggregate -> Handler maps to response DTO -> Controller -> HTTP 200 { account }
```

### Key Data Flows

1. **Account Creation:** Controller -> CommandBus -> Handler -> Account.create() (validates invariants, registers domain event) -> Repository.save() -> Mapper.toPersistence() -> PostgreSQL
2. **Account Query:** Controller -> QueryBus -> Handler -> Repository.findById() -> Mapper.toDomain() -> Handler maps to DTO -> Controller returns response
3. **Account Update:** Controller -> CommandBus -> Handler -> Repository.findById() -> Account.updateIdentity() (re-validates, registers event) -> Repository.save()
4. **Cross-context consumption:** External BC -> HTTP GET /accounts/:id -> same query flow -> returns Account DTO via REST

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Current architecture is more than sufficient. Single NestJS process, single PostgreSQL instance. |
| 1k-100k users | Add connection pooling (pgBouncer), database indexing on email (unique constraint already handles this). Consider read replicas if query load grows. |
| 100k+ users | Consider extracting Account to its own deployable service. Add caching layer (Redis) for frequent account lookups by other bounded contexts. The hexagonal architecture makes this migration straightforward -- only infrastructure adapters change. |

### Scaling Priorities

1. **First bottleneck:** Database connections under concurrent cross-context queries. Fix with connection pooling and potentially a caching adapter.
2. **Second bottleneck:** If other bounded contexts hammer the Account API, add a response cache or consider an async event-based approach for data replication.

## Anti-Patterns

### Anti-Pattern 1: Anemic Domain Model

**What people do:** Put all business logic in command handlers (application layer), leaving the aggregate as a plain data holder with getters/setters.
**Why it's wrong:** Loses the primary benefit of DDD -- invariant enforcement. Any handler can put the aggregate in an invalid state. Logic is scattered across handlers instead of centralized in the domain.
**Do this instead:** All business rules and state mutations live inside the aggregate. Handlers orchestrate (load, call domain method, save) but contain zero business logic.

### Anti-Pattern 2: ORM Entity as Domain Model

**What people do:** Use the TypeORM `@Entity()` class directly as the domain aggregate to avoid "duplicate" classes.
**Why it's wrong:** ORM decorators, column definitions, and database nullability leak into the domain. Changing the database schema forces domain model changes. The domain becomes untestable without a database.
**Do this instead:** Separate persistence model + domain model + mapper. Yes, it is more code. It pays for itself at the first schema migration or ORM swap.

### Anti-Pattern 3: Leaking NestJS Decorators into Domain Layer

**What people do:** Use `@Injectable()`, `@Inject()`, or other NestJS decorators on domain classes (aggregates, value objects, domain services).
**Why it's wrong:** Couples the domain to the framework. The domain layer should have zero imports from `@nestjs/*`.
**Do this instead:** Only application-layer handlers and infrastructure-layer adapters use NestJS decorators. Domain classes are plain TypeScript.

### Anti-Pattern 4: Direct Module Imports Between Bounded Contexts

**What people do:** Import `AccountService` directly into another module (e.g., `ConsumptionModule`).
**Why it's wrong:** Creates tight coupling between bounded contexts. Changes to Account internals break Consumption.
**Do this instead:** Other bounded contexts consume Account via the REST API. Within a monolith, if needed, use an anti-corruption layer (ACL) with its own interface.

### Anti-Pattern 5: Fat Controllers

**What people do:** Put validation, business logic, persistence calls, and response mapping all in the controller.
**Why it's wrong:** Controllers become untestable monoliths. Violates single responsibility. Makes it impossible to reuse logic across different interfaces (REST, GraphQL, CLI).
**Do this instead:** Controllers do three things only: (1) validate/parse input DTO, (2) dispatch command/query, (3) map result to response DTO.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| PostgreSQL | TypeORM adapter implementing `AccountRepositoryPort` | Connection via NestJS `TypeOrmModule`. Persistence model separate from domain. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Account <-> Student Card BC | REST API (HTTP) | Student Card context calls Account's REST endpoints to resolve identity. Account exposes read-only endpoints. |
| Account <-> Consumption BC | REST API (HTTP) | Consumption context calls Account's REST endpoints to identify who registered a consumption. |
| Account domain <-> Account infra | Port/Adapter (DI) | `AccountRepositoryPort` interface in domain, implementation in infrastructure, wired via NestJS custom providers. |

## Suggested Build Order

Dependencies between components dictate this build sequence:

1. **Shared base classes** (`shared/domain/`) -- AggregateRoot, Entity, ValueObject, DomainEvent base classes. Everything else depends on these.
2. **Domain layer** (`account/domain/`) -- Value Objects first (Email, Phone, PersonName, AccountId), then Account Aggregate, then Domain Events, then Repository Port interface. Zero dependencies on anything outside.
3. **Application layer** (`account/application/`) -- Command and Query classes first (plain DTOs), then Handlers. Depends on domain layer and ports.
4. **Infrastructure layer** (`account/infrastructure/`) -- ORM Entity, Mapper, Repository adapter. Depends on domain ports and the ORM library.
5. **Interface layer** (`account/interface/`) -- Controllers, Request/Response DTOs, DTO mappers. Depends on application layer (dispatches commands/queries).
6. **Module wiring** (`account/account.module.ts`) -- Ties all layers together via NestJS module definition. Import CqrsModule, register handlers, bind port providers.
7. **Integration/E2E tests** -- Test the full flow from HTTP request to database and back.

**Rationale:** Each layer depends only on the layer(s) below it. Building bottom-up means every component has its dependencies available when you build it. The domain layer being first also forces you to think about business rules before infrastructure, which is the entire point of DDD.

## Sources

- [Domain-Driven Hexagon (Sairyss)](https://github.com/Sairyss/domain-driven-hexagon) - Comprehensive guide combining DDD, Hexagonal Architecture, CQRS with TypeScript/NestJS examples
- [NestJS CQRS Documentation](https://docs.nestjs.com/recipes/cqrs) - Official NestJS CQRS recipe
- [DDD Hexagonal CQRS ES EDA (Bitloops)](https://github.com/bitloops/ddd-hexagonal-cqrs-es-eda) - Complete working example with TypeScript and NestJS
- [Applying DDD to NestJS (Bendix)](https://dev.to/bendix/applying-domain-driven-design-principles-to-a-nest-js-project-5f7b) - Practical NestJS DDD implementation
- [Architecture with Nest: DDD, Hexagonal and CQRS (Leandro Simoes)](https://medium.com/@lesimoes/architecture-with-nest-applying-tactical-ddd-hexagonal-and-cqrs-part-i-36bccd209993) - Series on combining these patterns in NestJS
- [NestJS-DDD-DevOps Template](https://andrea-acampora.github.io/nestjs-ddd-devops/) - NestJS template project with DDD

---
*Architecture research for: Account Bounded Context (DDD + Hexagonal + CQRS Lite)*
*Researched: 2026-03-10*
