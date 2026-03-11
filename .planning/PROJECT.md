# Account Bounded Context

## What This Is

Um bounded context de Account que gerencia dados de identidade de pessoas fisicas (nome, email, CPF, data de nascimento, telefone, foto). Serve como contexto de identidade central consumido por outros bounded contexts (carteirinhas de estudante/professor, Consumption Context) via API REST. Construido com DDD tatico, Hexagonal Architecture e NestJS 11. Endpoints protegidos por Auth0 JWT com role-based access (RBAC por permissions). Persistencia via PostgreSQL/Prisma 7 e armazenamento de fotos via S3/MinIO.

## Core Value

Fornecer uma fonte unica e confiavel de identidade de conta (Account) que outros contextos possam consumir de forma desacoplada via API REST.

## Requirements

### Validated

- ✓ Criar Account com email extraido do token Auth0, nome completo e CPF obrigatorios — v1.0
- ✓ Consultar Account por ID, por CPF (admin/M2M), e getMe (usuario autenticado) — v1.0
- ✓ Atualizar dados opcionais (data de nascimento) — v1.0
- ✓ Upload de foto de perfil via StoragePort (S3) — v1.0
- ✓ Listar Accounts com paginacao — v1.0
- ✓ API REST protegida por Auth0 Guard com role-based access (permissions) — v1.0
- ✓ Dominio modelado com Aggregates, Value Objects, Domain Events e Repository Ports — v1.0
- ✓ UseCases separados em Commands e Queries (CQRS leve) — v1.0
- ✓ UseCases dependem de interfaces (ports), seguindo SOLID e Dependency Inversion — v1.0
- ✓ Persistencia via PostgreSQL como Adapter de RepositoryPort — v1.0
- ✓ Testes unitarios (123) e E2E (76) cobrindo todas as camadas — v1.0
- ✓ Health check com indicadores Postgres e MinIO — v1.0

### Active

- [ ] Verificacao de telefone via SMS/WhatsApp (SendPhoneVerification + VerifyPhone)
- [ ] Account lifecycle states (active/suspended/deactivated)
- [ ] Soft delete de accounts
- [ ] Optimistic concurrency (version field)
- [ ] Audit trail via domain events (event consumers)
- [ ] Paginacao cursor-based no ListAccounts
- [ ] OpenAPI/Swagger documentation
- [ ] CI pipeline para E2E tests com Docker

### Out of Scope

- Autenticacao/login — responsabilidade de outro bounded context (Auth0 cuida)
- Carteirinhas de estudante/professor — contexto separado que consome Account
- Consumption Context — contexto separado que consome Account
- Organizacoes/pessoas juridicas — Account representa apenas pessoas fisicas
- CQRS com modelos de leitura separados — apenas separacao de Commands/Queries nos UseCases
- Event Sourcing — complexidade desnecessaria para este contexto
- Real-time/WebSocket — comunicacao sincrona via REST e suficiente
- Mobile app — web-first approach

## Context

Shipped v1.0 with 5,569 LOC TypeScript across 6 phases (14 plans).
Tech stack: NestJS 11, Prisma 7 (PrismaPg driver adapter), PostgreSQL 17, MinIO/S3, Auth0 JWT, Vitest 4.
Testing: 123 unit tests + 76 E2E tests (require Docker for postgres + minio).
Domain events (AccountCreated, AccountUpdated) emitted via EventEmitter2 — no consumers yet (ready for v2 audit trail).
Phone verification deferred to v2 — endpoint POST /accounts/:id/phone/verify returns 501.

## Constraints

- **Stack**: TypeScript + Node.js com NestJS 11
- **Arquitetura**: Hexagonal (Ports & Adapters) com DDD tatico completo
- **Design**: Clean Architecture (UseCases como orquestradores), CQRS leve (Commands/Queries separados), SOLID
- **Persistencia**: PostgreSQL via Prisma 7 como adapter de RepositoryPort
- **Storage**: S3/MinIO via StoragePort adapter
- **Auth**: Auth0 JWT com RBAC por permissions (nao roles)
- **Escopo**: Apenas o bounded context de Account neste projeto

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Hexagonal Architecture | Facilita manutencao e consulta no codigo, desacopla dominio de infra | ✓ Good — clean layer separation, ESLint boundaries enforced |
| CQRS leve (so UseCases) | Separacao de responsabilidade sem complexidade de modelos separados | ✓ Good — 5 commands + 4 queries, clear separation |
| UseCases como orquestradores (Clean Arch) | Dependency Inversion — UseCases dependem de interfaces, nao de implementacoes | ✓ Good — all use cases inject ports, not implementations |
| NestJS como framework | Suporte opinado a DDD/hexagonal, bom ecossistema TypeScript | ✓ Good — DI, guards, pipes, interceptors all leveraged |
| PostgreSQL via RepositoryPort | Banco relacional robusto, desacoplado do dominio via port/adapter | ✓ Good — Prisma 7 PrismaPg adapter pattern works well |
| Auth0 para autenticacao | Frontend autentica no Auth0, backend valida JWT e extrai email | ✓ Good — JWKS validation with cache + rate limiting |
| Email vem do token, nao do usuario | Garante que email e verificado pelo Auth0, nao auto-declarado | ✓ Good — prevents self-declared emails |
| Telefone requer verificacao | Previne dados invalidos, verificacao antes de persistir | ⚠️ Revisit — deferred to v2, phone stored unverified for now |
| Testes sem infra (ports mockados) | Domain e UseCases testados isoladamente, Vitest resolve dependencias | ✓ Good — 123 unit tests run fast without DB |
| Prisma 7 PrismaPg driver adapter | Modern Prisma driver adapter pattern for PostgreSQL | ✓ Good — moduleFormat=cjs for NestJS compatibility |
| Static AccountMapper (not injectable) | Simpler than DI for stateless mapping | ✓ Good — toDomain/toPersistence with no dependencies |
| DI string tokens for ports | ACCOUNT_REPOSITORY_PORT, STORAGE_PORT | ✓ Good — hexagonal port binding pattern |
| RolesGuard checks permissions (not roles) | Auth0 RBAC uses permissions claim | ✓ Good — correct Auth0 RBAC integration |
| Validation errors return 422 (not 400) | RFC 4918 semantic correctness | ✓ Good — intentional correction from original 400 spec |

---
*Last updated: 2026-03-11 after v1.0 milestone*
