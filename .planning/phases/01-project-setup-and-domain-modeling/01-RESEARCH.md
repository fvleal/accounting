# Phase 1: Project Setup and Domain Modeling - Research

**Researched:** 2026-03-10
**Domain:** NestJS 11, Hexagonal Architecture, DDD Value Objects & Aggregates, Vitest 3
**Confidence:** HIGH

## Summary

This phase establishes a greenfield NestJS 11 project with hexagonal folder structure, DDD base classes, Value Objects, the Account aggregate with domain events, and the repository port interface. The domain layer must be pure TypeScript with zero framework dependencies -- enforced by ESLint boundary rules.

The core stack is NestJS 11 (v11.1.x) + Vitest 3 + unplugin-swc for testing + eslint-plugin-boundaries (v5.4.x) for architectural enforcement. UUID generation uses Node.js built-in `crypto.randomUUID()` (no external dependency). CPF validation uses the `cpf-cnpj-validator` package as explicitly decided by the user.

**Primary recommendation:** Scaffold with `nest new --strict`, replace Jest with Vitest 3 + unplugin-swc, configure eslint-plugin-boundaries with flat config to enforce domain purity, then build the pure domain layer bottom-up: base classes, value objects, events, aggregate, port.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- CPF: validated using `cpf-cnpj-validator` library -- accepts both masked (123.456.789-09) and unmasked (12345678909)
- PhoneNumber: Brazilian format -- DDD + 8 or 9 digits (supports landlines and mobile with the leading 9)
- PersonName: single fullName field, minimum 2 words
- Email: simple format validation (regex), even though it arrives pre-verified from Auth0
- BirthDate: any valid date in the past, no minimum age restriction
- Photo URL: validates that the value is a valid URL
- AccountCreated: carries full snapshot of the Account at creation time
- AccountUpdated: carries only the changed fields (before/after diff)
- Only AccountCreated and AccountUpdated events in Phase 1
- UUID v4 generated in the domain layer (not by the database)
- Two factory methods: `Account.create()` and `Account.reconstitute()`
- Constructor calls `validate()` -- both create and reconstitute validate invariants
- Validation via private setters: each private setter validates its field before assignment
- Public getters for encapsulation
- Specific update methods: `updateName()`, `updatePhone()`, `updateBirthDate()`, `updatePhoto()`
- Base classes: Entity (ID + equals by ID), AggregateRoot extends Entity (domain event collection), ValueObject (equals by structural comparison)
- Folder structure: `src/account/domain/`, `src/account/application/`, `src/account/infrastructure/`, `src/account/interface/`
- Domain internals: `domain/entities/`, `domain/value-objects/`, `domain/events/`, `domain/ports/`
- File naming: kebab-case with type suffix -- `email.value-object.ts`, `account.entity.ts`, etc.

### Claude's Discretion
- ESLint boundary rule configuration details
- Exact Vitest configuration
- ValueObject base class implementation approach
- tsconfig strictness level

### Deferred Ideas (OUT OF SCOPE)
- PhoneVerified domain event -- Phase 3
- PhotoUploaded domain event -- Phase 3
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SETP-01 | Hexagonal folder structure (domain/, application/, infrastructure/, interface/) | Folder structure pattern documented in Architecture Patterns section |
| SETP-02 | NestJS 11 + Prisma + Vitest 3 configured | Standard Stack section covers all three with versions and config |
| SETP-03 | ESLint with boundary rules between layers | eslint-plugin-boundaries config documented with flat config example |
| DOMN-01 | Base classes: AggregateRoot, ValueObject, Entity | Architecture Patterns section with code examples |
| DOMN-02 | Value Object Email with construction validation | Code Examples section with regex pattern |
| DOMN-03 | Value Object CPF with construction validation | cpf-cnpj-validator usage documented |
| DOMN-04 | Value Object PhoneNumber with construction validation | Brazilian phone regex pattern provided |
| DOMN-05 | Value Object PersonName with construction validation | Validation rule documented |
| DOMN-06 | Value Object BirthDate with construction validation | Date validation pattern provided |
| DOMN-07 | Account Aggregate with required (name, email, CPF) and optional fields | Aggregate pattern with factory methods documented |
| DOMN-08 | Account Aggregate collects domain events (AccountCreated, AccountUpdated) | Domain event collection pattern documented |
| DOMN-09 | AccountRepositoryPort (interface) defined in domain | Port interface pattern documented |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @nestjs/core | ^11.1 | Application framework | Latest stable, official NestJS 11 release |
| @nestjs/cli | ^11.0 | Project scaffolding and build | Official CLI for NestJS 11 |
| @nestjs/common | ^11.1 | Common decorators and utilities | Core NestJS companion package |
| typescript | ^5.7 | Language | NestJS 11 ships with TS 5.7+ |
| prisma | ^6.x | ORM (schema only in Phase 1) | User decision -- schema defined but no adapter yet |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | ^3.x | Test runner | Replaces Jest -- faster, ESM-native |
| unplugin-swc | ^1.x | SWC transformer for Vitest | Required: esbuild cannot emit decorator metadata |
| @swc/core | ^1.x | SWC compiler | Peer dependency of unplugin-swc |
| vite-tsconfig-paths | ^5.x | Path alias resolution in Vitest | Resolves tsconfig paths in test environment |
| eslint-plugin-boundaries | ^5.4 | Architectural boundary enforcement | Enforces hexagonal layer rules via ESLint |
| cpf-cnpj-validator | ^1.0 | CPF validation | User decision -- validates CPF format and check digits |
| @vitest/coverage-v8 | ^3.x | Code coverage | V8-based coverage for Vitest |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| crypto.randomUUID() | uuid npm package | Built-in is 3x faster, zero dependencies, sufficient for UUID v4 |
| eslint-plugin-boundaries | eslint-plugin-hexagonal-architecture | boundaries is more flexible, actively maintained (v5.4 Feb 2026), supports flat config |

**Installation:**
```bash
# Scaffold project
npx @nestjs/cli@11 new account-service --strict --package-manager npm

# Remove Jest (comes with scaffold)
npm uninstall jest @types/jest ts-jest @nestjs/testing

# Install Vitest + SWC
npm install --save-dev vitest unplugin-swc @swc/core vite-tsconfig-paths @vitest/coverage-v8

# Install ESLint boundaries
npm install --save-dev eslint-plugin-boundaries

# Install domain dependency
npm install cpf-cnpj-validator
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── account/
│   ├── domain/
│   │   ├── entities/
│   │   │   └── account.entity.ts
│   │   ├── value-objects/
│   │   │   ├── email.value-object.ts
│   │   │   ├── cpf.value-object.ts
│   │   │   ├── phone-number.value-object.ts
│   │   │   ├── person-name.value-object.ts
│   │   │   └── birth-date.value-object.ts
│   │   ├── events/
│   │   │   ├── account-created.event.ts
│   │   │   └── account-updated.event.ts
│   │   └── ports/
│   │       └── account.repository.port.ts
│   ├── application/        # empty in Phase 1
│   ├── infrastructure/     # empty in Phase 1
│   └── interface/          # empty in Phase 1
├── shared/
│   └── domain/
│       ├── entity.base.ts
│       ├── aggregate-root.base.ts
│       ├── value-object.base.ts
│       └── domain-event.base.ts
├── app.module.ts
└── main.ts
```

### Pattern 1: ValueObject Base Class
**What:** Immutable objects compared by structural equality, validated at construction.
**When to use:** Every domain primitive (Email, CPF, etc.)
**Example:**
```typescript
// src/shared/domain/value-object.base.ts
export abstract class ValueObject<T extends Record<string, unknown>> {
  protected readonly props: Readonly<T>;

  protected constructor(props: T) {
    this.validate(props);
    this.props = Object.freeze({ ...props });
  }

  protected abstract validate(props: T): void;

  public equals(other: ValueObject<T>): boolean {
    if (other === null || other === undefined) return false;
    if (other.constructor !== this.constructor) return false;
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }
}
```

### Pattern 2: Entity and AggregateRoot Base Classes
**What:** Entity identified by ID, AggregateRoot adds domain event collection.
**When to use:** Account is the AggregateRoot.
**Example:**
```typescript
// src/shared/domain/entity.base.ts
export abstract class Entity<ID = string> {
  constructor(private readonly _id: ID) {}

  get id(): ID {
    return this._id;
  }

  public equals(other: Entity<ID>): boolean {
    if (other === null || other === undefined) return false;
    if (!(other instanceof Entity)) return false;
    return this._id === other._id;
  }
}

// src/shared/domain/aggregate-root.base.ts
import { Entity } from './entity.base';
import { DomainEvent } from './domain-event.base';

export abstract class AggregateRoot<ID = string> extends Entity<ID> {
  private _domainEvents: DomainEvent[] = [];

  protected addEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  public getEvents(): ReadonlyArray<DomainEvent> {
    return [...this._domainEvents];
  }

  public clearEvents(): void {
    this._domainEvents = [];
  }
}
```

### Pattern 3: Domain Event
**What:** Immutable record of something that happened in the domain.
**When to use:** AccountCreated, AccountUpdated.
**Example:**
```typescript
// src/shared/domain/domain-event.base.ts
export abstract class DomainEvent {
  public readonly occurredOn: Date;

  constructor() {
    this.occurredOn = new Date();
  }
}
```

### Pattern 4: Account Aggregate with Factory Methods
**What:** Static `create()` for new accounts, static `reconstitute()` for rehydration.
**When to use:** Account entity creation.
**Example:**
```typescript
// Simplified pattern -- Account.create()
public static create(props: CreateAccountProps): Account {
  const id = crypto.randomUUID();
  const account = new Account(id, props);
  account.addEvent(new AccountCreated(/* full snapshot */));
  return account;
}

// Account.reconstitute() -- no ID generation, no event
public static reconstitute(id: string, props: AccountProps): Account {
  return new Account(id, props);
}
```

### Pattern 5: Repository Port Interface
**What:** Domain-defined interface for persistence, implemented by infrastructure.
**When to use:** AccountRepositoryPort in domain/ports/.
**Example:**
```typescript
// src/account/domain/ports/account.repository.port.ts
import { Account } from '../entities/account.entity';

export interface AccountRepositoryPort {
  save(account: Account): Promise<void>;
  findById(id: string): Promise<Account | null>;
  findByEmail(email: string): Promise<Account | null>;
  findByCpf(cpf: string): Promise<Account | null>;
  exists(id: string): Promise<boolean>;
}
```

### Anti-Patterns to Avoid
- **Importing @nestjs/* in domain layer:** Domain must be pure TypeScript. No decorators, no NestJS imports. ESLint boundary rule enforces this.
- **Mutable value objects:** ValueObject props must be frozen. Never expose setters.
- **Validation in constructor body:** Use private setters that validate before assignment per user decision.
- **Generating IDs in infrastructure:** UUID must be generated in the domain layer using `crypto.randomUUID()`.
- **Skipping validation in reconstitute:** User decided both create and reconstitute must validate (protects against DB corruption).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CPF validation | Custom check-digit algorithm | `cpf-cnpj-validator` (`cpf.isValid()`) | User decision; handles masked/unmasked, check digits, known invalid sequences |
| UUID generation | Custom ID generator | `crypto.randomUUID()` | Built-in Node.js, RFC 4122 compliant, cryptographically secure |
| ESLint boundary rules | Custom import checker script | `eslint-plugin-boundaries` | Mature plugin, flat config support, handles complex patterns |
| Deep equality for VOs | Custom recursive comparison | `JSON.stringify` comparison or `structuredClone` | Sufficient for simple value objects with primitive props |

**Key insight:** The domain layer has few external dependencies by design. Only `cpf-cnpj-validator` is imported in domain code. Everything else (NestJS, Prisma, etc.) stays outside.

## Common Pitfalls

### Pitfall 1: Vitest Cannot Transpile NestJS Decorators
**What goes wrong:** Tests fail with "experimentalDecorators" or "emitDecoratorMetadata" errors.
**Why it happens:** Vitest uses esbuild by default, which does not support `emitDecoratorMetadata`.
**How to avoid:** Use `unplugin-swc` plugin in vitest.config.ts. This replaces esbuild with SWC for TypeScript compilation.
**Warning signs:** "Unable to resolve signature" errors, DI containers failing to inject.

### Pitfall 2: ESLint Flat Config Misconfiguration
**What goes wrong:** Boundary rules don't fire or fire incorrectly.
**Why it happens:** eslint-plugin-boundaries requires correct `settings["boundaries/elements"]` with glob patterns matching your folder structure.
**How to avoid:** Use `pattern: ["src/*/domain/**"]` style globs that match the hexagonal structure. Test with a deliberate violation.
**Warning signs:** No ESLint errors when importing `@nestjs/common` in a domain file.

### Pitfall 3: Value Object Mutability Leak
**What goes wrong:** Value object properties get mutated externally.
**Why it happens:** Object.freeze is shallow; if props contain objects/arrays, inner values are still mutable.
**How to avoid:** Use only primitive values in ValueObject props (string, number, boolean, Date). For Date, store as ISO string or timestamp.
**Warning signs:** Tests pass but domain invariants can be broken after construction.

### Pitfall 4: Domain Event Timing
**What goes wrong:** Events are collected but contain stale data.
**Why it happens:** Event created before all mutations are complete.
**How to avoid:** Add event at the END of the factory method/update method, after all state is set.
**Warning signs:** AccountCreated event has undefined/null fields.

### Pitfall 5: Circular Dependencies in Domain Layer
**What goes wrong:** Runtime errors or undefined imports.
**Why it happens:** Value objects import each other, or entity imports from events which import from entity.
**How to avoid:** Domain events reference primitive types (strings, plain objects) not entity/VO classes. Events carry data snapshots, not references.
**Warning signs:** `Cannot access 'X' before initialization` errors.

### Pitfall 6: NestJS 11 Strict Mode tsconfig
**What goes wrong:** Compilation errors from strict null checks, no implicit any, etc.
**Why it happens:** `nest new --strict` enables `strictNullChecks`, `noImplicitAny`, `strictBindCallApply`, `forceConsistentCasingInFileNames`.
**How to avoid:** This is desired behavior. Embrace strict mode from day one. Use explicit types, null checks.
**Warning signs:** Many TS errors after scaffold -- expected and good.

## Code Examples

### Vitest Configuration for NestJS
```typescript
// vitest.config.ts
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
  test: {
    globals: true,
    root: './',
  },
});
```

### ESLint Flat Config with Boundaries
```typescript
// eslint.config.mjs
import boundaries from 'eslint-plugin-boundaries';

export default [
  // ... other configs (typescript-eslint, etc.)
  {
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'domain', pattern: ['src/*/domain/**'], mode: 'full' },
        { type: 'application', pattern: ['src/*/application/**'], mode: 'full' },
        { type: 'infrastructure', pattern: ['src/*/infrastructure/**'], mode: 'full' },
        { type: 'interface', pattern: ['src/*/interface/**'], mode: 'full' },
        { type: 'shared-domain', pattern: ['src/shared/domain/**'], mode: 'full' },
      ],
    },
    rules: {
      'boundaries/element-types': [2, {
        default: 'disallow',
        rules: [
          // Domain can only import from domain and shared-domain
          { from: 'domain', allow: ['domain', 'shared-domain'] },
          // Application can import domain and shared-domain
          { from: 'application', allow: ['domain', 'application', 'shared-domain'] },
          // Infrastructure can import everything except interface
          { from: 'infrastructure', allow: ['domain', 'application', 'infrastructure', 'shared-domain'] },
          // Interface can import everything
          { from: 'interface', allow: ['domain', 'application', 'infrastructure', 'interface', 'shared-domain'] },
          // Shared domain only imports from shared domain
          { from: 'shared-domain', allow: ['shared-domain'] },
        ],
      }],
      'boundaries/external': [2, {
        default: 'allow',
        rules: [
          // Domain layer cannot import any NestJS or infrastructure packages
          { from: 'domain', disallow: ['@nestjs/*', '@prisma/*', 'prisma'] },
          { from: 'shared-domain', disallow: ['@nestjs/*', '@prisma/*', 'prisma'] },
        ],
      }],
    },
  },
];
```

### Email Value Object
```typescript
// src/account/domain/value-objects/email.value-object.ts
import { ValueObject } from '../../../shared/domain/value-object.base';

interface EmailProps {
  value: string;
}

export class Email extends ValueObject<EmailProps> {
  // Simple regex -- email arrives pre-verified from Auth0
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(props: EmailProps) {
    super(props);
  }

  public static create(value: string): Email {
    return new Email({ value: value.toLowerCase().trim() });
  }

  protected validate(props: EmailProps): void {
    if (!Email.EMAIL_REGEX.test(props.value)) {
      throw new Error(`Invalid email format: ${props.value}`);
    }
  }

  get value(): string {
    return this.props.value;
  }
}
```

### CPF Value Object
```typescript
// src/account/domain/value-objects/cpf.value-object.ts
import { cpf as cpfValidator } from 'cpf-cnpj-validator';
import { ValueObject } from '../../../shared/domain/value-object.base';

interface CpfProps {
  value: string;
}

export class CPF extends ValueObject<CpfProps> {
  private constructor(props: CpfProps) {
    super(props);
  }

  public static create(value: string): CPF {
    // Strip mask before storing -- store only digits
    const stripped = value.replace(/\D/g, '');
    return new CPF({ value: stripped });
  }

  protected validate(props: CpfProps): void {
    if (!cpfValidator.isValid(props.value)) {
      throw new Error(`Invalid CPF: ${props.value}`);
    }
  }

  get value(): string {
    return this.props.value;
  }

  get formatted(): string {
    return cpfValidator.format(this.props.value);
  }
}
```

### PhoneNumber Value Object
```typescript
// src/account/domain/value-objects/phone-number.value-object.ts
import { ValueObject } from '../../../shared/domain/value-object.base';

interface PhoneNumberProps {
  value: string;
}

export class PhoneNumber extends ValueObject<PhoneNumberProps> {
  // DDD (2 digits) + number (8 or 9 digits)
  private static readonly PHONE_REGEX = /^[1-9]{2}[2-9]\d{7,8}$/;

  private constructor(props: PhoneNumberProps) {
    super(props);
  }

  public static create(value: string): PhoneNumber {
    const stripped = value.replace(/\D/g, '');
    return new PhoneNumber({ value: stripped });
  }

  protected validate(props: PhoneNumberProps): void {
    if (!PhoneNumber.PHONE_REGEX.test(props.value)) {
      throw new Error(`Invalid Brazilian phone number: ${props.value}`);
    }
  }

  get value(): string {
    return this.props.value;
  }
}
```

### UUID Generation in Domain
```typescript
// Use Node.js built-in -- no import needed in modern Node
import { randomUUID } from 'node:crypto';

// In Account.create():
const id = randomUUID(); // Returns UUID v4 string
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Jest with ts-jest | Vitest 3 with unplugin-swc | 2024-2025 | 5-10x faster test execution, ESM native |
| .eslintrc (legacy) | eslint.config.mjs (flat config) | ESLint 9 (2024) | eslint-plugin-boundaries v5.4 supports flat config |
| uuid npm package | crypto.randomUUID() | Node 14.17+ | Zero dependency, 3x faster |
| NestJS 10 | NestJS 11 (Jan 2025) | Jan 2025 | IntrinsicException, JSON logging, faster startup |

**Deprecated/outdated:**
- `.eslintrc.*` format: deprecated in ESLint 9, use `eslint.config.mjs`
- `jest` in NestJS: still default scaffold but Vitest is the community direction
- `uuid` npm package for simple v4: unnecessary when `crypto.randomUUID()` exists

## Open Questions

1. **eslint-plugin-boundaries external rule exact syntax**
   - What we know: The plugin has a `boundaries/external` rule for controlling external package imports
   - What's unclear: Exact glob pattern syntax for blocking `@nestjs/*` in domain may need testing
   - Recommendation: Configure and test with a deliberate violation early; adjust patterns if needed

2. **NestJS 11 scaffold default ESLint version**
   - What we know: NestJS 11 scaffold may ship with ESLint 8 or 9
   - What's unclear: Whether the scaffold uses flat config by default
   - Recommendation: After scaffold, check ESLint version and migrate to flat config if needed

3. **Shared domain folder and NestJS module boundaries**
   - What we know: Base classes (Entity, ValueObject, AggregateRoot) live in `src/shared/domain/`
   - What's unclear: Whether NestJS module resolution conflicts with this structure
   - Recommendation: Shared domain is pure TS, no NestJS module needed -- should work fine

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x |
| Config file | `vitest.config.ts` (created in Wave 0) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --coverage` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SETP-01 | Hexagonal folder structure exists | smoke | `ls src/account/domain src/account/application` | No -- Wave 0 |
| SETP-02 | NestJS boots, Vitest runs trivial test | smoke | `npx vitest run src/app.spec.ts` | No -- Wave 0 |
| SETP-03 | ESLint rejects @nestjs import in domain | unit | `npx eslint src/account/domain/ --max-warnings 0` (with violation file) | No -- Wave 0 |
| DOMN-01 | Base classes (Entity, AggregateRoot, ValueObject) | unit | `npx vitest run src/shared/domain/ -x` | No -- Wave 0 |
| DOMN-02 | Email VO rejects invalid input | unit | `npx vitest run src/account/domain/value-objects/email.value-object.spec.ts -x` | No -- Wave 0 |
| DOMN-03 | CPF VO rejects invalid input | unit | `npx vitest run src/account/domain/value-objects/cpf.value-object.spec.ts -x` | No -- Wave 0 |
| DOMN-04 | PhoneNumber VO rejects invalid input | unit | `npx vitest run src/account/domain/value-objects/phone-number.value-object.spec.ts -x` | No -- Wave 0 |
| DOMN-05 | PersonName VO rejects invalid input | unit | `npx vitest run src/account/domain/value-objects/person-name.value-object.spec.ts -x` | No -- Wave 0 |
| DOMN-06 | BirthDate VO rejects invalid input | unit | `npx vitest run src/account/domain/value-objects/birth-date.value-object.spec.ts -x` | No -- Wave 0 |
| DOMN-07 | Account aggregate create/reconstitute | unit | `npx vitest run src/account/domain/entities/account.entity.spec.ts -x` | No -- Wave 0 |
| DOMN-08 | Account collects domain events | unit | `npx vitest run src/account/domain/entities/account.entity.spec.ts -x` | No -- Wave 0 |
| DOMN-09 | AccountRepositoryPort interface defined | unit | TypeScript compilation check (interface existence) | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --coverage`
- **Phase gate:** Full suite green + ESLint clean before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` -- Vitest configuration with unplugin-swc
- [ ] `src/shared/domain/*.spec.ts` -- base class tests
- [ ] `src/account/domain/value-objects/*.spec.ts` -- all VO tests
- [ ] `src/account/domain/entities/account.entity.spec.ts` -- aggregate tests
- [ ] `eslint.config.mjs` -- flat config with boundaries plugin
- [ ] Framework install: `npm install --save-dev vitest unplugin-swc @swc/core vite-tsconfig-paths @vitest/coverage-v8`

## Sources

### Primary (HIGH confidence)
- [NestJS 11 release notes](https://trilon.io/blog/announcing-nestjs-11-whats-new) - Features, version numbers
- [@nestjs/core npm](https://www.npmjs.com/package/@nestjs/core) - Latest version 11.1.x
- [Vitest 3 config docs](https://v3.vitest.dev/config/) - Configuration options
- [eslint-plugin-boundaries GitHub](https://github.com/javierbrea/eslint-plugin-boundaries) - v5.4, flat config support
- [cpf-cnpj-validator npm](https://www.npmjs.com/package/cpf-cnpj-validator) - API: cpf.isValid(), cpf.format()
- [Node.js crypto.randomUUID() MDN](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID) - Built-in UUID v4

### Secondary (MEDIUM confidence)
- [NestJS Vitest setup guide](https://zenn.dev/maronn/articles/nestjs-vitest-migrate) - unplugin-swc configuration verified against NestJS docs recipe
- [NestJS SWC recipe](https://docs.nestjs.com/recipes/swc) - Official Vitest integration docs

### Tertiary (LOW confidence)
- eslint-plugin-boundaries `boundaries/external` rule exact syntax for blocking `@nestjs/*` -- needs validation by testing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - versions verified on npm, NestJS 11 is stable release
- Architecture: HIGH - hexagonal/DDD patterns are well-established, user decisions are clear
- Pitfalls: HIGH - Vitest+SWC requirement is well-documented, boundary enforcement approach verified
- ESLint external rule: MEDIUM - plugin supports it but exact glob syntax needs testing

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable stack, 30-day window)
