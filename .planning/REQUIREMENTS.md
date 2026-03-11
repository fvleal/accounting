# Requirements: Account Bounded Context

**Defined:** 2026-03-10
**Core Value:** Fornecer uma fonte unica e confiavel de identidade de conta (Account) que outros contextos possam consumir de forma desacoplada via API REST.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Domain Foundation

- [x] **DOMN-01**: Base classes reutilizaveis: AggregateRoot, ValueObject, Entity
- [x] **DOMN-02**: Value Object Email com validacao na construcao
- [x] **DOMN-03**: Value Object CPF com validacao na construcao
- [x] **DOMN-04**: Value Object PhoneNumber com validacao na construcao
- [x] **DOMN-05**: Value Object PersonName com validacao na construcao
- [x] **DOMN-06**: Value Object BirthDate com validacao na construcao
- [x] **DOMN-07**: Account Aggregate com campos obrigatorios (nome, email, CPF) e opcionais (data de nascimento, telefone, foto)
- [x] **DOMN-08**: Account Aggregate coleta domain events (AccountCreated, AccountUpdated)
- [x] **DOMN-09**: AccountRepositoryPort (interface) definida no dominio

### Application (UseCases)

- [x] **UCAS-01**: CreateAccountCommand — recebe token Auth0 (extrai email via Auth0 userinfo), nome completo e CPF como dados obrigatorios
- [x] **UCAS-02**: UpdateAccountCommand — atualiza dados opcionais (data de nascimento); telefone atualizado apenas apos verificacao
- [x] **UCAS-10**: UploadAccountPhotoCommand — recebe imagem, chama StoragePort para salvar, persiste URL retornada no Account
- [x] **UCAS-08**: SendPhoneVerificationCommand — envia codigo de verificacao para o telefone informado
- [x] **UCAS-09**: VerifyPhoneCommand — verifica codigo recebido e, se valido, atualiza telefone na conta
- [x] **UCAS-03**: GetAccountByIdQuery — consulta conta por ID
- [x] **UCAS-04**: FindAccountByFieldQuery — consulta conta por campo especifico (CPF, email, etc.)
- [x] **UCAS-05**: ListAccountsQuery — lista contas
- [x] **UCAS-06**: UseCases dependem de interfaces (ports), seguindo Dependency Inversion
- [x] **UCAS-07**: Separacao explicita de Commands e Queries (CQRS leve)

### Infrastructure (Adapters)

- [x] **INFR-01**: PostgreSQL adapter implementando AccountRepositoryPort
- [x] **INFR-02**: Prisma schema para tabela de accounts
- [x] **INFR-03**: Mapper entre domain aggregate e Prisma model
- [x] **INFR-04**: Database migrations via Prisma Migrate
- [x] **INFR-05**: Adapter para envio de codigo de verificacao de telefone (SMS/WhatsApp port)
- [x] **INFR-06**: StoragePort no dominio (interface) + S3 adapter para upload de imagem

### API REST

- [x] **REST-01**: Controller com endpoint POST /accounts (criar conta — exige token Auth0 de user, extrai email do token)
- [x] **REST-02**: Controller com endpoint GET /accounts/:id (obter por ID)
- [x] **REST-03**: Controller com endpoint GET /accounts?cpf=X (obter por CPF — admin/M2M only)
- [x] **REST-04**: Controller com endpoint GET /accounts/me (obter conta do usuario autenticado; retorna 404 se conta nao existe — front redireciona para registro)
- [x] **REST-05**: Controller com endpoint PATCH /accounts/:id (atualizar dados opcionais — exceto telefone)
- [x] **REST-06**: Controller com endpoint GET /accounts (listar contas)
- [x] **REST-10**: Controller com endpoint POST /accounts/:id/phone/send-code (enviar codigo de verificacao)
- [x] **REST-11**: Controller com endpoint POST /accounts/:id/phone/verify (verificar codigo e atualizar telefone)
- [x] **REST-12**: Controller com endpoint POST /accounts/:id/photo (upload de foto)
- [x] **REST-07**: Request DTOs com class-validator e class-transformer decorators
- [x] **REST-08**: Response DTOs retornando nome, email, CPF, data de nascimento, telefone, foto
- [x] **REST-09**: Error handling padronizado (exception filters)

### Auth & Security

- [x] **AUTH-01**: Auth0 Guard que valida JWT token em todas as rotas protegidas
- [x] **AUTH-02**: Role-based access: rota getMe exige role "user" no token
- [x] **AUTH-03**: Role-based access: rota getAccountByCPF exige permissoes de admin/aplicacao (M2M)
- [x] **AUTH-04**: Decorators ou guards por rota para verificar roles/permissoes especificas

### Testing

- [x] **TEST-01**: Testes unitarios de Value Objects (Email, CPF, PhoneNumber, PersonName, BirthDate) — sem infra
- [x] **TEST-02**: Testes unitarios do Account Aggregate — sem infra
- [x] **TEST-03**: Testes unitarios de Commands (CreateAccount, UpdateAccount) — ports mockados pelo Vitest
- [x] **TEST-04**: Testes unitarios de Queries (GetAccountById, FindAccountByField, ListAccounts) — ports mockados pelo Vitest
- [x] **TEST-05**: Testes de integracao do PostgreSQL adapter contra banco real
- [x] **TEST-06**: Testes E2E dos endpoints REST

### Project Setup

- [x] **SETP-01**: Estrutura de pastas hexagonal (domain/, application/, infrastructure/, interface/)
- [x] **SETP-02**: NestJS 11 + Prisma + Vitest 3 configurados
- [x] **SETP-03**: ESLint com regras de boundary entre camadas

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Lifecycle & Operations

- **LIFE-01**: Account lifecycle states (active/suspended/deactivated)
- **LIFE-02**: Soft delete de accounts
- **LIFE-03**: Optimistic concurrency (version field)
- **LIFE-04**: Audit trail via domain events

### API Enhancements

- **APIE-01**: Paginacao cursor-based no ListAccounts
- **APIE-02**: OpenAPI/Swagger documentation

## Out of Scope

| Feature | Reason |
|---------|--------|
| Autenticacao/login | Responsabilidade de outro bounded context (Auth0 cuida) |
| Carteirinhas estudante/professor | Contexto separado que consome Account |
| Consumption Context | Contexto separado que consome Account |
| Organizacoes/pessoas juridicas | Account representa apenas pessoas fisicas |
| CQRS com modelos de leitura separados | CQRS leve — apenas separacao de Commands/Queries nos UseCases |
| Event Sourcing | Complexidade desnecessaria para este contexto |
| Real-time/WebSocket | Comunicacao sincrona via REST e suficiente |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SETP-01 | Phase 1 | Complete |
| SETP-02 | Phase 1 | Complete |
| SETP-03 | Phase 1 | Complete |
| DOMN-01 | Phase 1 | Complete |
| DOMN-02 | Phase 1 | Complete |
| DOMN-03 | Phase 1 | Complete |
| DOMN-04 | Phase 1 | Complete |
| DOMN-05 | Phase 1 | Complete |
| DOMN-06 | Phase 1 | Complete |
| DOMN-07 | Phase 1 | Complete |
| DOMN-08 | Phase 1 | Complete |
| DOMN-09 | Phase 1 | Complete |
| INFR-01 | Phase 2 | Complete |
| INFR-02 | Phase 2 | Complete |
| INFR-03 | Phase 2 | Complete |
| INFR-04 | Phase 2 | Complete |
| INFR-05 | Phase 2 | Complete |
| INFR-06 | Phase 2 | Complete |
| UCAS-01 | Phase 3 | Complete |
| UCAS-02 | Phase 3 | Complete |
| UCAS-03 | Phase 3 | Complete |
| UCAS-04 | Phase 3 | Complete |
| UCAS-05 | Phase 3 | Complete |
| UCAS-06 | Phase 3 | Complete |
| UCAS-07 | Phase 3 | Complete |
| UCAS-08 | Phase 3 | Complete |
| UCAS-09 | Phase 3 | Complete |
| UCAS-10 | Phase 3 | Complete |
| REST-01 | Phase 4 | Complete |
| REST-02 | Phase 4 | Complete |
| REST-03 | Phase 4 | Complete |
| REST-04 | Phase 4 | Complete |
| REST-05 | Phase 4 | Complete |
| REST-06 | Phase 4 | Complete |
| REST-07 | Phase 4 | Complete |
| REST-08 | Phase 4 | Complete |
| REST-09 | Phase 4 | Complete |
| REST-10 | Phase 4 | Complete |
| REST-11 | Phase 4 | Complete |
| REST-12 | Phase 4 | Complete |
| AUTH-01 | Phase 4 | Complete |
| AUTH-02 | Phase 4 | Complete |
| AUTH-03 | Phase 4 | Complete |
| AUTH-04 | Phase 4 | Complete |
| TEST-01 | Phase 5 | Complete |
| TEST-02 | Phase 5 | Complete |
| TEST-03 | Phase 5 | Complete |
| TEST-04 | Phase 5 | Complete |
| TEST-05 | Phase 5 | Complete |
| TEST-06 | Phase 5 | Complete |

**Coverage:**
- v1 requirements: 50 total
- Mapped to phases: 50
- Unmapped: 0

---
*Requirements defined: 2026-03-10*
*Last updated: 2026-03-10 after roadmap creation*
