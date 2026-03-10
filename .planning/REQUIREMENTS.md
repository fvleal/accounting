# Requirements: Account Bounded Context

**Defined:** 2026-03-10
**Core Value:** Fornecer uma fonte unica e confiavel de identidade de conta (Account) que outros contextos possam consumir de forma desacoplada via API REST.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Domain Foundation

- [ ] **DOMN-01**: Base classes reutilizaveis: AggregateRoot, ValueObject, Entity
- [ ] **DOMN-02**: Value Object Email com validacao na construcao
- [ ] **DOMN-03**: Value Object CPF com validacao na construcao
- [ ] **DOMN-04**: Value Object PhoneNumber com validacao na construcao
- [ ] **DOMN-05**: Value Object PersonName com validacao na construcao
- [ ] **DOMN-06**: Value Object BirthDate com validacao na construcao
- [ ] **DOMN-07**: Account Aggregate com campos obrigatorios (nome, email, CPF) e opcionais (data de nascimento, telefone, foto)
- [ ] **DOMN-08**: Account Aggregate coleta domain events (AccountCreated, AccountUpdated)
- [ ] **DOMN-09**: AccountRepositoryPort (interface) definida no dominio

### Application (UseCases)

- [ ] **UCAS-01**: CreateAccountCommand — recebe token Auth0 (extrai email via Auth0 userinfo), nome completo e CPF como dados obrigatorios
- [ ] **UCAS-02**: UpdateAccountCommand — atualiza dados opcionais (data de nascimento); telefone atualizado apenas apos verificacao
- [ ] **UCAS-10**: UploadAccountPhotoCommand — recebe imagem, chama StoragePort para salvar, persiste URL retornada no Account
- [ ] **UCAS-08**: SendPhoneVerificationCommand — envia codigo de verificacao para o telefone informado
- [ ] **UCAS-09**: VerifyPhoneCommand — verifica codigo recebido e, se valido, atualiza telefone na conta
- [ ] **UCAS-03**: GetAccountByIdQuery — consulta conta por ID
- [ ] **UCAS-04**: FindAccountByFieldQuery — consulta conta por campo especifico (CPF, email, etc.)
- [ ] **UCAS-05**: ListAccountsQuery — lista contas
- [ ] **UCAS-06**: UseCases dependem de interfaces (ports), seguindo Dependency Inversion
- [ ] **UCAS-07**: Separacao explicita de Commands e Queries (CQRS leve)

### Infrastructure (Adapters)

- [ ] **INFR-01**: PostgreSQL adapter implementando AccountRepositoryPort
- [ ] **INFR-02**: Prisma schema para tabela de accounts
- [ ] **INFR-03**: Mapper entre domain aggregate e Prisma model
- [ ] **INFR-04**: Database migrations via Prisma Migrate
- [ ] **INFR-05**: Adapter para envio de codigo de verificacao de telefone (SMS/WhatsApp port)
- [ ] **INFR-06**: StoragePort no dominio (interface) + S3 adapter para upload de imagem

### API REST

- [ ] **REST-01**: Controller com endpoint POST /accounts (criar conta — exige token Auth0 de user, extrai email do token)
- [ ] **REST-02**: Controller com endpoint GET /accounts/:id (obter por ID)
- [ ] **REST-03**: Controller com endpoint GET /accounts?cpf=X (obter por CPF — admin/M2M only)
- [ ] **REST-04**: Controller com endpoint GET /accounts/me (obter conta do usuario autenticado; retorna 404 se conta nao existe — front redireciona para registro)
- [ ] **REST-05**: Controller com endpoint PATCH /accounts/:id (atualizar dados opcionais — exceto telefone)
- [ ] **REST-06**: Controller com endpoint GET /accounts (listar contas)
- [ ] **REST-10**: Controller com endpoint POST /accounts/:id/phone/send-code (enviar codigo de verificacao)
- [ ] **REST-11**: Controller com endpoint POST /accounts/:id/phone/verify (verificar codigo e atualizar telefone)
- [ ] **REST-12**: Controller com endpoint POST /accounts/:id/photo (upload de foto)
- [ ] **REST-07**: Request DTOs com class-validator e class-transformer decorators
- [ ] **REST-08**: Response DTOs retornando nome, email, CPF, data de nascimento, telefone, foto
- [ ] **REST-09**: Error handling padronizado (exception filters)

### Auth & Security

- [ ] **AUTH-01**: Auth0 Guard que valida JWT token em todas as rotas protegidas
- [ ] **AUTH-02**: Role-based access: rota getMe exige role "user" no token
- [ ] **AUTH-03**: Role-based access: rota getAccountByCPF exige permissoes de admin/aplicacao (M2M)
- [ ] **AUTH-04**: Decorators ou guards por rota para verificar roles/permissoes especificas

### Testing

- [ ] **TEST-01**: Testes unitarios de Value Objects (Email, CPF, PhoneNumber, PersonName, BirthDate) — sem infra
- [ ] **TEST-02**: Testes unitarios do Account Aggregate — sem infra
- [ ] **TEST-03**: Testes unitarios de Commands (CreateAccount, UpdateAccount) — ports mockados pelo Vitest
- [ ] **TEST-04**: Testes unitarios de Queries (GetAccountById, FindAccountByField, ListAccounts) — ports mockados pelo Vitest
- [ ] **TEST-05**: Testes de integracao do PostgreSQL adapter contra banco real
- [ ] **TEST-06**: Testes E2E dos endpoints REST

### Project Setup

- [ ] **SETP-01**: Estrutura de pastas hexagonal (domain/, application/, infrastructure/, interface/)
- [ ] **SETP-02**: NestJS 11 + Prisma + Vitest 3 configurados
- [ ] **SETP-03**: ESLint com regras de boundary entre camadas

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
| SETP-01 | Phase 1 | Pending |
| SETP-02 | Phase 1 | Pending |
| SETP-03 | Phase 1 | Pending |
| DOMN-01 | Phase 1 | Pending |
| DOMN-02 | Phase 1 | Pending |
| DOMN-03 | Phase 1 | Pending |
| DOMN-04 | Phase 1 | Pending |
| DOMN-05 | Phase 1 | Pending |
| DOMN-06 | Phase 1 | Pending |
| DOMN-07 | Phase 1 | Pending |
| DOMN-08 | Phase 1 | Pending |
| DOMN-09 | Phase 1 | Pending |
| INFR-01 | Phase 2 | Pending |
| INFR-02 | Phase 2 | Pending |
| INFR-03 | Phase 2 | Pending |
| INFR-04 | Phase 2 | Pending |
| INFR-05 | Phase 2 | Pending |
| INFR-06 | Phase 2 | Pending |
| UCAS-01 | Phase 3 | Pending |
| UCAS-02 | Phase 3 | Pending |
| UCAS-03 | Phase 3 | Pending |
| UCAS-04 | Phase 3 | Pending |
| UCAS-05 | Phase 3 | Pending |
| UCAS-06 | Phase 3 | Pending |
| UCAS-07 | Phase 3 | Pending |
| UCAS-08 | Phase 3 | Pending |
| UCAS-09 | Phase 3 | Pending |
| UCAS-10 | Phase 3 | Pending |
| REST-01 | Phase 4 | Pending |
| REST-02 | Phase 4 | Pending |
| REST-03 | Phase 4 | Pending |
| REST-04 | Phase 4 | Pending |
| REST-05 | Phase 4 | Pending |
| REST-06 | Phase 4 | Pending |
| REST-07 | Phase 4 | Pending |
| REST-08 | Phase 4 | Pending |
| REST-09 | Phase 4 | Pending |
| REST-10 | Phase 4 | Pending |
| REST-11 | Phase 4 | Pending |
| REST-12 | Phase 4 | Pending |
| AUTH-01 | Phase 4 | Pending |
| AUTH-02 | Phase 4 | Pending |
| AUTH-03 | Phase 4 | Pending |
| AUTH-04 | Phase 4 | Pending |
| TEST-01 | Phase 5 | Pending |
| TEST-02 | Phase 5 | Pending |
| TEST-03 | Phase 5 | Pending |
| TEST-04 | Phase 5 | Pending |
| TEST-05 | Phase 5 | Pending |
| TEST-06 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 50 total
- Mapped to phases: 50
- Unmapped: 0

---
*Requirements defined: 2026-03-10*
*Last updated: 2026-03-10 after roadmap creation*
