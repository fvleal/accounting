# Phase 3: Application Layer - Research

**Researched:** 2026-03-11
**Domain:** NestJS use cases, CQRS command/query separation, hexagonal architecture application layer
**Confidence:** HIGH

## Summary

Phase 3 builds the application layer -- thin use case orchestrators that sit between the domain and infrastructure layers. The codebase already has a mature domain layer (Account aggregate, value objects, events) and a complete infrastructure layer (PrismaAccountRepository, S3StorageAdapter, EventEmitter2 dispatch). The application layer needs to wire these together through use cases that depend only on port interfaces.

The main work involves: (1) adding auth0Sub to the Account entity and Prisma schema, (2) creating a base UseCase interface in shared/application, (3) building domain exception classes, (4) implementing command and query use cases with Input/Output interfaces, and (5) registering everything in a NestJS module. The user has made very specific decisions about patterns (one command per field, dedicated GetMeQuery, idempotent CreateAccount, deferred phone verification), so the implementation path is well-defined.

**Primary recommendation:** Follow the user's prescribed Input/Output per-use-case pattern exactly, keep use cases as thin orchestrators (load -> validate uniqueness -> delegate to aggregate -> save), and ensure all DI uses string tokens consistent with existing ACCOUNT_REPOSITORY_PORT / STORAGE_PORT pattern.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Controller extracts email and Auth0 sub from JWT payload, passes them as strings to the use case. Use case stays pure -- no Auth0 dependency, no Auth0Port. Auth0 sub stored on Account for identity linking. Requires adding auth0Sub field to Account entity and Prisma schema. findByAuth0Sub method added to AccountRepositoryPort.
- If auth0Sub already has an account, return the existing account instead of throwing (idempotent CreateAccount). Uniqueness checks (email, CPF) happen in the use case before creating. DB unique constraints remain as safety net.
- Dedicated GetMeQuery use case (not reused FindAccountByFieldQuery). Takes auth0Sub, returns account Output.
- Email is immutable -- set once at creation, never updated.
- UCAS-08 (SendPhoneVerificationCommand) and UCAS-09 (VerifyPhoneCommand) are DEFERRED -- not built in Phase 3. No PhoneVerificationPort. UpdatePhoneCommand allows setting phone unverified (phoneVerified=false).
- Separate commands: UpdateNameCommand, UpdatePhoneCommand, UpdateBirthDateCommand. Each is its own use case class.
- UploadAccountPhotoCommand handles full flow: receives buffer + contentType, calls StoragePort.upload() to get URL, then calls account.updatePhoto(url) and saves.
- Custom domain exceptions (not NestJS HttpExceptions, not Result types). Base DomainException class in shared/domain/exceptions/ with structured metadata and a 'code' string. Specific exceptions: AccountNotFoundError, DuplicateEmailError, DuplicateCpfError, DuplicateAuth0SubError.
- Authorization handled entirely by controller/guard layer -- use cases assume caller is authorized.
- Use cases define Input and Output interfaces co-located in the same file. Use case receives Input, returns Output (plain interface, not domain entity). All use cases implement UseCase<I, O> { execute(input: I): Promise<O> } base interface. Base lives in shared/application/.
- One command per field update -- granular CQRS.

### Claude's Discretion
- Exact Output interface shapes per use case
- NestJS module structure for application layer (AccountApplicationModule or per-use-case providers)
- DI registration approach for use cases
- Whether to group commands/queries in subfolders or flat in application/

### Deferred Ideas (OUT OF SCOPE)
- SendPhoneVerificationCommand (UCAS-08) -- deferred until phone verification adapter is built
- VerifyPhoneCommand (UCAS-09) -- deferred until phone verification adapter is built
- PhoneVerificationPort -- deferred, no port or adapter in v1
- UpdateEmailCommand -- email is immutable in this bounded context
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UCAS-01 | CreateAccountCommand -- receives Auth0 sub + email (from controller), name, CPF | Domain changes (auth0Sub field), idempotency pattern, uniqueness checks via repository ports |
| UCAS-02 | UpdateAccountCommand -- updates optional data (birth date); phone updated separately | Split into UpdateNameCommand, UpdatePhoneCommand, UpdateBirthDateCommand per user decision |
| UCAS-03 | GetAccountByIdQuery -- query account by ID | Simple repository delegation, Output interface pattern |
| UCAS-04 | FindAccountByFieldQuery -- query by specific field (CPF, email) | Repository findByEmail/findByCpf delegation |
| UCAS-05 | ListAccountsQuery -- list accounts | Repository findAll with pagination delegation |
| UCAS-06 | UseCases depend on interfaces (ports), following Dependency Inversion | DI token injection pattern (ACCOUNT_REPOSITORY_PORT, STORAGE_PORT), NestJS module exports |
| UCAS-07 | Explicit separation of Commands and Queries (lightweight CQRS) | Folder structure: commands/ and queries/ subdirectories |
| UCAS-08 | SendPhoneVerificationCommand | DEFERRED per user decision -- not built in Phase 3 |
| UCAS-09 | VerifyPhoneCommand | DEFERRED per user decision -- not built in Phase 3 |
| UCAS-10 | UploadAccountPhotoCommand -- receives image, calls StoragePort, persists URL | StoragePort.upload() integration, buffer + contentType input |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| NestJS | 11.x | DI framework, module system | Already in project, provides @Inject, @Injectable |
| Vitest | 4.x | Unit testing with mocks | Already configured, vi.fn() for port mocking |
| Prisma | 7.x | Schema migrations (auth0Sub column) | Already in project for persistence |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @nestjs/event-emitter | 3.x | Event dispatch (already handled by repository) | Use cases don't dispatch events directly -- repository does on save() |
| node:crypto | built-in | UUID generation (already in Account.create) | No new usage needed |

### Not Needed
| Library | Reason |
|---------|--------|
| @nestjs/cqrs | Overkill -- project uses lightweight CQRS (folder separation), not MediatR-style bus |
| class-validator | Phase 4 concern (DTOs), not application layer |
| class-transformer | Phase 4 concern (DTOs), not application layer |

**Installation:** No new packages required. All dependencies already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
  shared/
    application/
      use-case.base.ts              # UseCase<I, O> interface
    domain/
      exceptions/
        domain-exception.base.ts     # Base DomainException class
  account/
    application/
      commands/
        create-account.command.ts
        update-name.command.ts
        update-phone.command.ts
        update-birth-date.command.ts
        upload-account-photo.command.ts
      queries/
        get-account-by-id.query.ts
        get-me.query.ts
        find-account-by-field.query.ts
        list-accounts.query.ts
      account-application.module.ts
    domain/
      exceptions/
        account-not-found.error.ts
        duplicate-email.error.ts
        duplicate-cpf.error.ts
        duplicate-auth0-sub.error.ts
        index.ts
```

**Rationale for commands/ and queries/ subfolders:** The user explicitly requested CQRS separation (UCAS-07). With 5 commands and 4 queries, flat structure would be cluttered. Subdirectories make the separation visible and enforceable.

### Pattern 1: UseCase Base Interface
**What:** Generic interface all use cases implement
**When to use:** Every use case in the application layer
```typescript
// src/shared/application/use-case.base.ts
export interface UseCase<I, O> {
  execute(input: I): Promise<O>;
}
```

### Pattern 2: Use Case with Co-located Input/Output
**What:** Each use case file defines its Input, Output, and implementation
**When to use:** All use cases
```typescript
// src/account/application/commands/create-account.command.ts
import { Injectable, Inject } from '@nestjs/common';
import { UseCase } from '../../../shared/application/use-case.base';
import { Account } from '../../domain/entities/account.entity';
import { AccountRepositoryPort } from '../../domain/ports';
import { ACCOUNT_REPOSITORY_PORT } from '../../infrastructure/account-infrastructure.module';
import { DuplicateEmailError, DuplicateCpfError } from '../../domain/exceptions';

export interface CreateAccountInput {
  auth0Sub: string;
  email: string;
  name: string;
  cpf: string;
}

export interface CreateAccountOutput {
  id: string;
  name: string;
  email: string;
  cpf: string;
  birthDate: Date | null;
  phone: string | null;
  photoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CreateAccountCommand implements UseCase<CreateAccountInput, CreateAccountOutput> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY_PORT)
    private readonly accountRepo: AccountRepositoryPort,
  ) {}

  async execute(input: CreateAccountInput): Promise<CreateAccountOutput> {
    // Idempotency: return existing if auth0Sub already linked
    const existing = await this.accountRepo.findByAuth0Sub(input.auth0Sub);
    if (existing) {
      return this.toOutput(existing);
    }

    // Uniqueness checks
    const byEmail = await this.accountRepo.findByEmail(input.email);
    if (byEmail) throw new DuplicateEmailError(input.email);

    const byCpf = await this.accountRepo.findByCpf(input.cpf);
    if (byCpf) throw new DuplicateCpfError(input.cpf);

    // Create and persist
    const account = Account.create({
      auth0Sub: input.auth0Sub,
      name: input.name,
      email: input.email,
      cpf: input.cpf,
    });

    await this.accountRepo.save(account);

    return this.toOutput(account);
  }

  private toOutput(account: Account): CreateAccountOutput {
    return {
      id: account.id,
      name: account.name,
      email: account.email,
      cpf: account.cpf,
      birthDate: account.birthDate,
      phone: account.phone,
      photoUrl: account.photoUrl,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }
}
```

### Pattern 3: Query Use Case (read-only)
**What:** Queries that never modify state
```typescript
// src/account/application/queries/get-account-by-id.query.ts
export interface GetAccountByIdInput {
  id: string;
}

export interface GetAccountByIdOutput {
  id: string;
  name: string;
  email: string;
  cpf: string;
  birthDate: Date | null;
  phone: string | null;
  photoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class GetAccountByIdQuery implements UseCase<GetAccountByIdInput, GetAccountByIdOutput> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY_PORT)
    private readonly accountRepo: AccountRepositoryPort,
  ) {}

  async execute(input: GetAccountByIdInput): Promise<GetAccountByIdOutput> {
    const account = await this.accountRepo.findById(input.id);
    if (!account) throw new AccountNotFoundError(input.id);
    return this.toOutput(account);
  }
}
```

### Pattern 4: DomainException Base
**What:** Base exception class for all domain errors
```typescript
// src/shared/domain/exceptions/domain-exception.base.ts
export abstract class DomainException extends Error {
  public abstract readonly code: string;
  public readonly metadata: Record<string, unknown>;

  constructor(message: string, metadata: Record<string, unknown> = {}) {
    super(message);
    this.name = this.constructor.name;
    this.metadata = metadata;
  }
}
```

### Pattern 5: Specific Domain Exception
```typescript
// src/account/domain/exceptions/account-not-found.error.ts
import { DomainException } from '../../../shared/domain/exceptions/domain-exception.base';

export class AccountNotFoundError extends DomainException {
  public readonly code = 'ACCOUNT_NOT_FOUND';

  constructor(identifier: string) {
    super(`Account not found: ${identifier}`, { identifier });
  }
}
```

### Pattern 6: NestJS Module Registration
**What:** Application module that imports infrastructure and provides use cases
```typescript
// src/account/application/account-application.module.ts
import { Module } from '@nestjs/common';
import { AccountInfrastructureModule } from '../infrastructure/account-infrastructure.module';
import { CreateAccountCommand } from './commands/create-account.command';
// ... other imports

@Module({
  imports: [AccountInfrastructureModule],
  providers: [
    CreateAccountCommand,
    UpdateNameCommand,
    UpdatePhoneCommand,
    UpdateBirthDateCommand,
    UploadAccountPhotoCommand,
    GetAccountByIdQuery,
    GetMeQuery,
    FindAccountByFieldQuery,
    ListAccountsQuery,
  ],
  exports: [
    CreateAccountCommand,
    UpdateNameCommand,
    UpdatePhoneCommand,
    UpdateBirthDateCommand,
    UploadAccountPhotoCommand,
    GetAccountByIdQuery,
    GetMeQuery,
    FindAccountByFieldQuery,
    ListAccountsQuery,
  ],
})
export class AccountApplicationModule {}
```

**Recommendation:** Single AccountApplicationModule is simpler and sufficient. Use cases are just @Injectable() classes -- no need for per-use-case modules. The module imports AccountInfrastructureModule to get the port tokens.

### Pattern 7: UploadAccountPhoto with StoragePort
```typescript
export interface UploadAccountPhotoInput {
  accountId: string;
  buffer: Buffer;
  contentType: string;
}

@Injectable()
export class UploadAccountPhotoCommand implements UseCase<UploadAccountPhotoInput, UploadAccountPhotoOutput> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY_PORT)
    private readonly accountRepo: AccountRepositoryPort,
    @Inject(STORAGE_PORT)
    private readonly storage: StoragePort,
  ) {}

  async execute(input: UploadAccountPhotoInput): Promise<UploadAccountPhotoOutput> {
    const account = await this.accountRepo.findById(input.accountId);
    if (!account) throw new AccountNotFoundError(input.accountId);

    const key = `accounts/${account.id}/photo`;
    const url = await this.storage.upload(key, input.buffer, input.contentType);

    account.updatePhoto(url);
    await this.accountRepo.save(account);

    return this.toOutput(account);
  }
}
```

### Anti-Patterns to Avoid
- **Importing NestJS HttpException in domain/application layers:** Use DomainException. HTTP mapping happens in Phase 4 controllers.
- **Use case directly dispatching events:** The PrismaAccountRepository already dispatches events inside its save() transaction. Use cases just call `repo.save(account)`.
- **Returning domain entities from use cases:** Always return Output interfaces (plain objects). This prevents leaking domain internals to controllers.
- **Batch update commands:** User explicitly chose one-command-per-field. Don't create a generic UpdateAccountCommand that takes partial fields.
- **Importing from infrastructure in use cases:** Import DI tokens from infrastructure module is acceptable (string constants), but never import concrete adapter classes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Event dispatch | Manual event emitting in use cases | Repository.save() auto-dispatches | Already implemented in PrismaAccountRepository |
| UUID generation | Custom ID generator | Account.create() uses randomUUID() | Already in domain layer |
| Validation | Manual field validation in use cases | Value Objects validate on creation | VOs throw on invalid input (Email, CPF, etc.) |
| DI wiring | Manual instantiation | NestJS @Injectable + @Inject tokens | Framework handles lifecycle and injection |

## Common Pitfalls

### Pitfall 1: Forgetting to Add auth0Sub to Domain Layer
**What goes wrong:** CreateAccountCommand needs auth0Sub, but Account entity currently only has name/email/cpf in CreateAccountProps.
**Why it happens:** Domain changes required by application layer decisions.
**How to avoid:** Must modify Account entity BEFORE building use cases: add auth0Sub to CreateAccountProps, ReconstituteAccountProps, private field, and getter. Also add auth0Sub to AccountCreated event, AccountMapper, and Prisma schema.
**Warning signs:** TypeScript compilation errors when passing auth0Sub to Account.create().

### Pitfall 2: Circular Module Dependencies
**What goes wrong:** AccountApplicationModule imports AccountInfrastructureModule, but if infrastructure somehow imports application, NestJS throws circular dependency error.
**Why it happens:** Layering violation.
**How to avoid:** Strict one-way dependency: application -> infrastructure -> shared. Never import application layer from infrastructure.
**Warning signs:** NestJS "Circular dependency" error at startup.

### Pitfall 3: Missing findByAuth0Sub in Repository Port
**What goes wrong:** CreateAccountCommand and GetMeQuery need findByAuth0Sub, but the port interface currently lacks it.
**Why it happens:** New requirement from Phase 3 decisions.
**How to avoid:** Add findByAuth0Sub(auth0Sub: string): Promise<Account | null> to AccountRepositoryPort, then implement in PrismaAccountRepository.
**Warning signs:** TypeScript error on this.accountRepo.findByAuth0Sub call.

### Pitfall 4: Prisma Schema Migration for auth0_sub
**What goes wrong:** Adding auth0_sub column to existing table requires a migration. If the column is non-nullable and there's existing data, migration fails.
**Why it happens:** Schema evolution.
**How to avoid:** Add auth0_sub as nullable first OR as unique + nullable. Since this is dev with no production data, a non-nullable unique column with a migration reset is also acceptable.
**Warning signs:** Prisma migrate dev fails with "column cannot be null" on existing rows.

### Pitfall 5: DI Token Import Path
**What goes wrong:** Use cases need ACCOUNT_REPOSITORY_PORT and STORAGE_PORT string tokens, which are currently exported from AccountInfrastructureModule.
**Why it happens:** Token constants are defined in infrastructure module file.
**How to avoid:** This is acceptable for now -- importing a string constant from infrastructure is not a layering violation (it's just a string). Alternatively, tokens could be moved to a shared constants file, but the current pattern works and is already established.

### Pitfall 6: toOutput Duplication
**What goes wrong:** Every use case has a nearly identical toOutput() helper mapping Account to Output.
**Why it happens:** Output interfaces are co-located per use case but often have the same shape.
**How to avoid:** Accept the duplication for now -- it's intentional. Each Output can diverge independently (e.g., GetMeQuery might add auth0Sub, ListAccountsQuery might omit some fields). A shared AccountOutputMapper would couple use cases together.

## Code Examples

### Domain Exception Hierarchy
```typescript
// src/shared/domain/exceptions/domain-exception.base.ts
export abstract class DomainException extends Error {
  public abstract readonly code: string;
  public readonly metadata: Record<string, unknown>;

  constructor(message: string, metadata: Record<string, unknown> = {}) {
    super(message);
    this.name = this.constructor.name;
    this.metadata = metadata;
  }
}

// src/account/domain/exceptions/account-not-found.error.ts
export class AccountNotFoundError extends DomainException {
  public readonly code = 'ACCOUNT_NOT_FOUND';
  constructor(identifier: string) {
    super(`Account not found: ${identifier}`, { identifier });
  }
}

// src/account/domain/exceptions/duplicate-email.error.ts
export class DuplicateEmailError extends DomainException {
  public readonly code = 'DUPLICATE_EMAIL';
  constructor(email: string) {
    super(`Email already in use: ${email}`, { email });
  }
}

// src/account/domain/exceptions/duplicate-cpf.error.ts
export class DuplicateCpfError extends DomainException {
  public readonly code = 'DUPLICATE_CPF';
  constructor(cpf: string) {
    super(`CPF already in use: ${cpf}`, { cpf });
  }
}

// src/account/domain/exceptions/duplicate-auth0-sub.error.ts
export class DuplicateAuth0SubError extends DomainException {
  public readonly code = 'DUPLICATE_AUTH0_SUB';
  constructor(auth0Sub: string) {
    super(`Auth0 subject already linked: ${auth0Sub}`, { auth0Sub });
  }
}
```

### Unit Test Pattern for Use Cases (Vitest)
```typescript
// src/account/application/commands/create-account.command.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateAccountCommand } from './create-account.command';
import { AccountRepositoryPort } from '../../domain/ports';
import { Account } from '../../domain/entities/account.entity';
import { DuplicateEmailError } from '../../domain/exceptions';

describe('CreateAccountCommand', () => {
  let command: CreateAccountCommand;
  let mockRepo: AccountRepositoryPort;

  beforeEach(() => {
    mockRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn().mockResolvedValue(null),
      findByCpf: vi.fn().mockResolvedValue(null),
      findByAuth0Sub: vi.fn().mockResolvedValue(null),
      findAll: vi.fn(),
      exists: vi.fn(),
    } as unknown as AccountRepositoryPort;

    command = new CreateAccountCommand(mockRepo);
  });

  it('should create account when no duplicates', async () => {
    const input = { auth0Sub: 'auth0|123', email: 'a@b.com', name: 'John Doe', cpf: '52998224725' };
    const output = await command.execute(input);
    expect(output.email).toBe('a@b.com');
    expect(mockRepo.save).toHaveBeenCalledOnce();
  });

  it('should return existing account when auth0Sub already linked', async () => {
    const existing = Account.create({ auth0Sub: 'auth0|123', name: 'John', email: 'a@b.com', cpf: '52998224725' });
    (mockRepo.findByAuth0Sub as ReturnType<typeof vi.fn>).mockResolvedValue(existing);

    const output = await command.execute({ auth0Sub: 'auth0|123', email: 'a@b.com', name: 'John', cpf: '52998224725' });
    expect(output.id).toBe(existing.id);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('should throw DuplicateEmailError when email taken', async () => {
    const other = Account.create({ auth0Sub: 'auth0|456', name: 'Jane', email: 'a@b.com', cpf: '11144477735' });
    (mockRepo.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(other);

    await expect(command.execute({ auth0Sub: 'auth0|123', email: 'a@b.com', name: 'John', cpf: '52998224725' }))
      .rejects.toThrow(DuplicateEmailError);
  });
});
```

### FindAccountByFieldQuery Pattern
```typescript
export interface FindAccountByFieldInput {
  field: 'email' | 'cpf';
  value: string;
}

@Injectable()
export class FindAccountByFieldQuery implements UseCase<FindAccountByFieldInput, FindAccountByFieldOutput> {
  async execute(input: FindAccountByFieldInput): Promise<FindAccountByFieldOutput> {
    let account: Account | null;
    switch (input.field) {
      case 'email':
        account = await this.accountRepo.findByEmail(input.value);
        break;
      case 'cpf':
        account = await this.accountRepo.findByCpf(input.value);
        break;
      default:
        throw new Error(`Unsupported field: ${input.field}`);
    }
    if (!account) throw new AccountNotFoundError(input.value);
    return this.toOutput(account);
  }
}
```

## Required Domain Changes (Pre-requisites)

These changes to existing code MUST happen before use cases can be built:

### 1. Account Entity -- Add auth0Sub
- Add `auth0Sub: string` to `CreateAccountProps`
- Add `auth0Sub: string` to `ReconstituteAccountProps`
- Add `private _auth0Sub!: string` field
- Add `get auth0Sub(): string` getter
- Add private `setAuth0Sub()` setter
- Include auth0Sub in Account.create() and Account.reconstitute()
- Include auth0Sub in AccountCreated event payload

### 2. Prisma Schema -- Add auth0_sub column
```prisma
model Account {
  id            String    @id @db.Uuid
  auth0Sub      String    @unique @map("auth0_sub")
  name          String
  email         String    @unique
  cpf           String    @unique
  // ... rest unchanged
}
```
- Run `npx prisma migrate dev --name add-auth0-sub`

### 3. AccountRepositoryPort -- Add findByAuth0Sub
```typescript
export interface AccountRepositoryPort {
  // ... existing methods
  findByAuth0Sub(auth0Sub: string): Promise<Account | null>;
}
```

### 4. PrismaAccountRepository -- Implement findByAuth0Sub
```typescript
async findByAuth0Sub(auth0Sub: string): Promise<Account | null> {
  const raw = await this.prisma.account.findUnique({ where: { auth0Sub } });
  return raw ? AccountMapper.toDomain(raw) : null;
}
```

### 5. AccountMapper -- Include auth0Sub in both directions
- toDomain: pass raw.auth0Sub
- toPersistence: include account.auth0Sub

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @nestjs/cqrs with CommandBus/QueryBus | Simple @Injectable use cases with UseCase<I,O> | Common in hexagonal NestJS | Less boilerplate, same separation |
| Result<T, E> pattern | Domain exceptions thrown | User decision | Simpler error handling, caught by exception filters in Phase 4 |
| Single UpdateCommand with partial fields | One command per field | User decision | More granular, more files, clearer intent |

## Open Questions

1. **DI Token Location**
   - What we know: ACCOUNT_REPOSITORY_PORT and STORAGE_PORT are currently exported from AccountInfrastructureModule file
   - What's unclear: Whether to move tokens to a shared constants file for cleaner imports
   - Recommendation: Keep in infrastructure module for now (established pattern). Can refactor later if needed.

2. **auth0Sub Field on Account -- phoneVerified Interaction**
   - What we know: Prisma schema has phoneVerified boolean, AccountMapper hardcodes it to false
   - What's unclear: Whether auth0Sub addition requires phoneVerified to be on the domain entity
   - Recommendation: Keep phoneVerified out of Account entity for now (deferred phone verification). Mapper continues hardcoding false.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | vitest.config.ts (root) |
| Quick run command | `npx vitest run src/account/application` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UCAS-01 | CreateAccount: idempotent by auth0Sub, uniqueness checks, creates aggregate, dispatches events via save | unit | `npx vitest run src/account/application/commands/create-account.command.spec.ts -t` | No - Wave 0 |
| UCAS-02 | UpdateName/Phone/BirthDate: loads account, calls aggregate method, saves | unit | `npx vitest run src/account/application/commands/update-name.command.spec.ts -t` | No - Wave 0 |
| UCAS-03 | GetAccountById: returns account by ID, throws AccountNotFoundError | unit | `npx vitest run src/account/application/queries/get-account-by-id.query.spec.ts -t` | No - Wave 0 |
| UCAS-04 | FindAccountByField: finds by email or CPF | unit | `npx vitest run src/account/application/queries/find-account-by-field.query.spec.ts -t` | No - Wave 0 |
| UCAS-05 | ListAccounts: returns paginated list | unit | `npx vitest run src/account/application/queries/list-accounts.query.spec.ts -t` | No - Wave 0 |
| UCAS-06 | All use cases inject port interfaces via @Inject tokens | unit | Verified by all use case tests (constructor injection with mocked ports) | No - Wave 0 |
| UCAS-07 | Commands and Queries in separate folders | structural | `ls src/account/application/commands src/account/application/queries` | No - Wave 0 |
| UCAS-08 | SendPhoneVerificationCommand | DEFERRED | N/A | N/A |
| UCAS-09 | VerifyPhoneCommand | DEFERRED | N/A | N/A |
| UCAS-10 | UploadAccountPhoto: calls StoragePort.upload, updates aggregate, saves | unit | `npx vitest run src/account/application/commands/upload-account-photo.command.spec.ts -t` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/account/application`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before /gsd:verify-work

### Wave 0 Gaps
- [ ] `src/account/application/commands/create-account.command.spec.ts` -- covers UCAS-01
- [ ] `src/account/application/commands/update-name.command.spec.ts` -- covers UCAS-02 (name)
- [ ] `src/account/application/commands/update-phone.command.spec.ts` -- covers UCAS-02 (phone)
- [ ] `src/account/application/commands/update-birth-date.command.spec.ts` -- covers UCAS-02 (birth date)
- [ ] `src/account/application/commands/upload-account-photo.command.spec.ts` -- covers UCAS-10
- [ ] `src/account/application/queries/get-account-by-id.query.spec.ts` -- covers UCAS-03
- [ ] `src/account/application/queries/get-me.query.spec.ts` -- covers GetMe (from CONTEXT decisions)
- [ ] `src/account/application/queries/find-account-by-field.query.spec.ts` -- covers UCAS-04
- [ ] `src/account/application/queries/list-accounts.query.spec.ts` -- covers UCAS-05

## Sources

### Primary (HIGH confidence)
- Codebase inspection: Account entity, repository port, infrastructure module, Prisma schema, mapper, events -- all read directly
- CONTEXT.md: User decisions locked all major architectural choices

### Secondary (MEDIUM confidence)
- NestJS @Injectable + @Inject pattern -- well-established, verified in existing codebase (AccountInfrastructureModule)
- Vitest mocking pattern -- vi.fn() for port mocking, standard practice

### Tertiary (LOW confidence)
- None -- all patterns are either codebase-verified or based on locked user decisions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries needed, all existing
- Architecture: HIGH -- user decisions are very specific, existing codebase patterns are clear
- Pitfalls: HIGH -- identified from direct codebase analysis (missing auth0Sub, missing findByAuth0Sub)

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable -- no fast-moving dependencies)
