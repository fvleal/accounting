# Stack Research

**Domain:** Account Bounded Context (DDD + Hexagonal Architecture + CQRS Lite)
**Researched:** 2026-03-10
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Node.js | >= 20 LTS | Runtime | Required by NestJS 11; v20 is current LTS with ESM support |
| TypeScript | ~5.7 | Language | NestJS 11 requires >= 4.8; 5.7 is current stable with decorator metadata support needed for DI |
| NestJS | 11.1.x | Application framework | Opinionated DI container maps naturally to Hexagonal Architecture (modules = bounded contexts, providers = adapters, interfaces = ports). v11 adds ESM first-class support, JSON logging, Vitest default, Express v5 |
| MikroORM | 6.6.x | ORM / Persistence adapter | Only mainstream TS ORM implementing Unit of Work + Identity Map + Data Mapper together -- the three patterns DDD persistence demands. Entities are plain classes, not framework-coupled decorators. Clean separation between domain model and persistence mapping |
| PostgreSQL | 16+ | Database | Robust relational DB, JSONB for flexible value object storage, excellent indexing. Project constraint |
| Vitest | ^3.x | Testing | NestJS 11 defaults to Vitest. 10-20x faster than Jest in watch mode, native ESM/TS support, Jest-compatible API. Critical for DDD where domain layer has high test density |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @mikro-orm/nestjs | 6.x | NestJS-MikroORM integration | Always -- provides MikroOrmModule.forRoot(), request-scoped EntityManager, proper context handling |
| @mikro-orm/postgresql | 6.x | PostgreSQL driver for MikroORM | Always -- database-specific adapter |
| @mikro-orm/migrations | 6.x | Schema migrations | Always -- manage database schema changes via code |
| @mikro-orm/cli | 6.x | CLI tooling for MikroORM | Always -- generate migrations, manage schema |
| @nestjs/cqrs | 11.0.x | CQRS command/query bus | Optional -- provides CommandBus/QueryBus/EventBus. For this project's "CQRS lite" approach, manual Command/Query handler classes (plain NestJS services) may be simpler and more explicit. Use @nestjs/cqrs only if you want EventBus for domain events |
| uuid | ^11.x | UUIDv7 generation | Always -- UUIDv7 provides time-sortable IDs for domain entities, better than UUIDv4 for database index performance |
| class-validator | ^0.14 | DTO validation (input adapter) | For REST input validation at the adapter layer. Still works despite maintenance concerns, and NestJS 11 ValidationPipe integrates natively. Use only at adapter boundary, never in domain |
| class-transformer | ^0.5 | DTO transformation | Pair with class-validator for REST DTOs. Same adapter-boundary-only rule |
| @nestjs/swagger | 11.x | OpenAPI documentation | For REST API documentation. Integrates with class-validator decorators |
| @nestjs/config | 11.x | Configuration management | Environment-based config with validation |
| @nestjs/platform-express | 11.x | HTTP adapter | Default NestJS HTTP platform (Express v5 in NestJS 11) |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| @swc/core + unplugin-swc | Fast TypeScript compilation | NestJS 11 uses SWC by default for builds and tests. 20x faster than tsc for development |
| eslint + @typescript-eslint | Linting | Enforce architectural boundaries (e.g., domain layer cannot import from infrastructure) |
| prettier | Code formatting | Consistent style across team |
| tsx | Script runner | For running one-off scripts and MikroORM CLI commands |

## Installation

```bash
# Core framework
npm install @nestjs/common @nestjs/core @nestjs/platform-express reflect-metadata rxjs

# ORM + Database
npm install @mikro-orm/core @mikro-orm/nestjs @mikro-orm/postgresql @mikro-orm/migrations

# Validation & Swagger (adapter layer)
npm install class-validator class-transformer @nestjs/swagger

# Config
npm install @nestjs/config

# UUID generation (domain layer)
npm install uuid

# Dev dependencies
npm install -D typescript @types/node @swc/core unplugin-swc
npm install -D vitest @vitest/coverage-v8 @nestjs/testing
npm install -D @mikro-orm/cli
npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser prettier
npm install -D @types/uuid tsx
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| MikroORM 6 | TypeORM | Never for DDD -- TypeORM's Active Record mode encourages domain-persistence coupling; its Data Mapper mode lacks Unit of Work and Identity Map. Repository pattern feels bolted-on |
| MikroORM 6 | Prisma | When you want schema-first development with simple CRUD. Prisma's generated client is not a domain entity -- it forces an extra mapping layer. No Unit of Work, no Identity Map, no custom repository classes. Poor fit for DDD tactical patterns |
| MikroORM 6 | Drizzle | When you want a thin SQL query builder, not an ORM. Drizzle is excellent for read-heavy CQRS query sides but lacks the domain modeling patterns (UoW, Identity Map, Data Mapper) needed for the write/command side |
| class-validator | Zod | When building a new project without NestJS Swagger integration needs. Zod is better maintained but lacks official NestJS integration (no @nestjs/zod yet). NestJS 12 (Q3 2026) will add StandardSchemaValidationPipe supporting Zod natively -- migrate then |
| Vitest | Jest | Only if stuck on NestJS 10 or below. NestJS 11 defaults to Vitest; no reason to use Jest for greenfield projects |
| Manual CQRS | @nestjs/cqrs module | Use @nestjs/cqrs when you need EventBus for domain event dispatching across modules. For single bounded context with "CQRS lite" (just separating Command/Query use cases), plain NestJS services with clear naming (CreateAccountCommand, GetAccountByIdQuery) are simpler and more debuggable |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| TypeORM | Active Record encourages anemic domain models; Data Mapper mode is half-baked compared to MikroORM; maintenance has slowed significantly | MikroORM 6 |
| Prisma for write-side | Schema-first approach forces domain model to match DB schema; generated client is not a domain entity; no repository pattern support | MikroORM 6 for writes (Prisma acceptable for read-side queries if needed later) |
| Sequelize | Legacy ORM, poor TypeScript support, Active Record only | MikroORM 6 |
| NestJS 10 | EOL trajectory; misses ESM support, Vitest default, Express v5, performance improvements | NestJS 11 |
| Node.js < 20 | Not supported by NestJS 11 | Node.js 20 LTS or 22 LTS |
| nestjs-zod (community) | Unmaintained, incomplete Swagger support | class-validator now, Zod with NestJS 12 later |
| @nestjs/typeorm | Pulls in TypeORM; wrong ORM for DDD | @mikro-orm/nestjs |
| Mongoose / MongoDB | Project constraint is PostgreSQL; document DBs encourage schema-less design that conflicts with DDD aggregate boundaries | PostgreSQL via MikroORM |

## Stack Patterns by Variant

**If you need domain events across bounded contexts later:**
- Add @nestjs/cqrs for its EventBus
- Domain events stay in domain layer as plain classes
- EventBus dispatches at application layer (use case) after aggregate mutation
- Because event dispatching is infrastructure, it belongs in the adapter layer

**If you need read-model optimization later (full CQRS):**
- Add Drizzle ORM as a read-side query adapter
- Keep MikroORM for the write side (command handlers)
- Because Drizzle's SQL builder is more efficient for complex read queries without ORM overhead

**If NestJS 12 arrives during development (Q3 2026):**
- Migrate class-validator to Zod via new StandardSchemaValidationPipe
- Because Zod is better maintained and the official NestJS integration will be first-class

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| @nestjs/core@11.x | Node.js >= 20 | v16 and v18 dropped in NestJS 11 |
| @nestjs/core@11.x | TypeScript >= 4.8 | Recommend 5.7+ for latest features |
| @nestjs/core@11.x | Express 5.x | Route syntax changed: wildcards must be named (*splat), optional params need braces |
| @mikro-orm/core@6.6.x | @mikro-orm/nestjs@6.x | Must match major versions across all @mikro-orm/* packages |
| @nestjs/cqrs@11.x | @nestjs/core@11.x | Major version must match NestJS core |
| @nestjs/swagger@11.x | class-validator@0.14.x | Swagger reads class-validator decorators for schema generation |
| vitest@3.x | @swc/core | Use unplugin-swc for Vitest SWC integration |

## Key Architecture Decisions Driven by Stack

### MikroORM enables proper DDD persistence

MikroORM's Data Mapper pattern means domain entities are plain TypeScript classes. Persistence metadata lives in separate mapping configuration (or decorators that don't affect runtime behavior). This is critical for Hexagonal Architecture: the domain layer has zero dependency on the ORM.

```typescript
// Domain entity -- pure TypeScript, no ORM imports
export class Account {
  private constructor(
    private readonly id: AccountId,
    private name: PersonName,
    private email: Email,
    private phone: Phone,
  ) {}
  // domain logic here
}

// Infrastructure mapping -- separate file in adapter layer
@Entity()
export class AccountEntity {
  @PrimaryKey()
  id!: string;
  // ... MikroORM decorators map to DB
}
```

### Unit of Work replaces manual transaction management

MikroORM tracks all entity changes and flushes them in a single transaction. Use cases call `em.flush()` once at the end -- no manual BEGIN/COMMIT/ROLLBACK.

### class-validator stays at the adapter boundary

Validation decorators exist ONLY on DTOs in the REST adapter layer (controllers). Domain validation lives in Value Objects and Entity factory methods as plain TypeScript. This maintains the hexagonal boundary.

## Sources

- [NestJS GitHub Releases](https://github.com/nestjs/nest/releases) -- verified v11.1.16 is latest stable (March 5, 2026) [HIGH confidence]
- [NestJS 11 Announcement](https://trilon.io/blog/announcing-nestjs-11-whats-new) -- Node >= 20 requirement, ESM first-class, Vitest default [HIGH confidence]
- [MikroORM GitHub Releases](https://github.com/mikro-orm/mikro-orm/releases) -- verified v6.6.9 is latest stable (March 5, 2026) [HIGH confidence]
- [MikroORM NestJS Integration Docs](https://mikro-orm.io/docs/usage-with-nestjs) -- @mikro-orm/nestjs package usage [HIGH confidence]
- [MikroORM Competitive Analysis](https://github.com/mikro-orm/mikro-orm/issues/7170) -- UoW + Identity Map + Data Mapper unique combination [HIGH confidence]
- [NestJS v12 PR](https://github.com/nestjs/nest/pull/16391) -- StandardSchemaValidationPipe with Zod planned for Q3 2026 [MEDIUM confidence]
- [Node.js ORM Comparison 2025](https://thedataguy.pro/blog/2025/12/nodejs-orm-comparison-2025/) -- ecosystem landscape [MEDIUM confidence]
- [NestJS CQRS npm](https://www.npmjs.com/package/@nestjs/cqrs) -- v11.0.3 latest [HIGH confidence]
- [Vitest vs Jest for NestJS](https://blog.ablo.ai/jest-to-vitest-in-nestjs) -- migration patterns and performance gains [MEDIUM confidence]
- [domain-driven-hexagon reference](https://github.com/Sairyss/domain-driven-hexagon) -- community standard NestJS + DDD + Hexagonal reference architecture [MEDIUM confidence]

---
*Stack research for: Account Bounded Context (DDD + Hexagonal + NestJS)*
*Researched: 2026-03-10*
