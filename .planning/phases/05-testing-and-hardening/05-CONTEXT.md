# Phase 5: Testing and Hardening - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Fechar gaps de cobertura de testes existentes e preparar o bounded context para produção com health check, graceful shutdown e config validation. A maioria dos testes já existe (119 unitários + 37 E2E) — esta fase fecha o que falta e adiciona hardening operacional.

</domain>

<decisions>
## Implementation Decisions

### Coverage gaps
- PrismaService (0% coverage): **ignorar** — são lifecycle hooks do NestJS, E2E já prova que funciona
- prisma-account.repository (81.8%): **E2E já cobre** — os caminhos faltantes são exercitados via API com banco real
- DuplicateAuth0SubError (0%): **manter e adicionar teste** — guarda defensiva caso uma conta já exista com determinado auth0Sub. Adicionar cobertura de teste
- Código gerado pelo Prisma (prisma/internal): **ignorar** — não faz sentido testar código gerado

### Adapter vs E2E (TEST-05)
- **E2E já supre TEST-05** — os testes E2E exercitam PrismaAccountRepository e S3StorageAdapter contra infra real (Docker)
- Não criar teste isolado do adapter contra banco — seria redundante com E2E
- Se no futuro precisar testar adapter isolado, extrair do E2E

### Hardening
- **Health check endpoint** (`GET /health`) — verifica se Postgres e MinIO estão acessíveis. Essencial para outros bounded contexts verificarem disponibilidade antes de chamar Account
- **Graceful shutdown** — terminar requests em andamento antes de fechar conexões. Evita erros 500 durante deploys
- **Config validation no boot** — validar que variáveis de ambiente obrigatórias existem (DATABASE_URL, S3_ENDPOINT, etc.) antes de subir. Fail fast com mensagem clara

### Claude's Discretion
- Escolha de lib para health check (@nestjs/terminus ou implementação manual)
- Estratégia de timeout no graceful shutdown
- Formato exato do response do health check

</decisions>

<specifics>
## Specific Ideas

- Health check deve verificar Postgres (query simples) e MinIO (bucket exists ou similar)
- Outros bounded contexts (Carteirinhas, Consumption) vão usar o health check pra saber se Account está de pé
- Config validation deve falhar na inicialização, não quando a primeira request chega

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `setupApp()` em `src/setup-app.ts`: configuração compartilhada entre main.ts e testes
- `PrismaService` em `src/shared/infrastructure/prisma/`: já tem onModuleInit/onModuleDestroy
- `S3StorageAdapter`: já configurado com ConfigService para ler env vars
- 22 spec files + 1 E2E spec: padrões de teste bem estabelecidos

### Established Patterns
- Testes unitários: co-locados com código fonte (`.spec.ts` ao lado do `.ts`)
- E2E: em `test/` com helpers separados (`mock-auth.guard.ts`, `test-fixtures.ts`)
- Mock de Auth0: `MockJwtAuthGuard` lê `x-test-auth` header — único mock nos E2E
- Vitest com configs separadas: `vitest.config.ts` (unit) e `test/vitest-e2e.config.ts` (E2E)

### Integration Points
- Health check: novo módulo em `src/shared/infrastructure/health/`
- Graceful shutdown: `app.enableShutdownHooks()` no `main.ts` ou `setupApp()`
- Config validation: `ConfigModule.forRoot()` no `AppModule` já existe, adicionar validação

</code_context>

<deferred>
## Deferred Ideas

- CI pipeline (GitHub Actions com docker-compose) — decidido ficar fora desta fase
- OpenAPI/Swagger documentation (APIE-02) — v2 requirement

</deferred>

---

*Phase: 05-testing-and-hardening*
*Context gathered: 2026-03-11*
