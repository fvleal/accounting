# Account Bounded Context

## What This Is

Um bounded context de Account que gerencia dados de identidade de pessoas fisicas (nome, email, CPF, data de nascimento, telefone). Serve como contexto de identidade central consumido por outros bounded contexts (carteirinhas de estudante/professor, Consumption Context) via API REST. Construido com DDD tatico, Hexagonal Architecture e NestJS. Endpoints protegidos por Auth0 JWT com role-based access.

## Core Value

Fornecer uma fonte unica e confiavel de identidade de conta (Account) que outros contextos possam consumir de forma desacoplada via API REST.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] Criar Account com email extraido do token Auth0, nome completo e CPF obrigatorios
- [ ] Consultar Account por ID, por CPF (admin/M2M), e getMe (usuario autenticado)
- [ ] Atualizar dados opcionais (data de nascimento, telefone — telefone requer verificacao)
- [ ] Listar Accounts
- [ ] Expor API REST protegida por Auth0 Guard com role-based access
- [ ] Dominio modelado com Aggregates, Value Objects, Domain Events e Repository Ports
- [ ] UseCases separados em Commands e Queries (CQRS leve)
- [ ] UseCases dependem de interfaces (ports), seguindo SOLID e Dependency Inversion
- [ ] Persistencia via PostgreSQL como Adapter de RepositoryPort
- [ ] Testes em Domain e UseCases sem depender de infra (ports mockados pelo Vitest)

### Out of Scope

- Autenticacao/login — responsabilidade de outro bounded context
- Carteirinhas de estudante/professor — contexto separado que consome Account
- Consumption Context — contexto separado que consome Account
- Organizacoes/pessoas juridicas — Account representa apenas pessoas fisicas
- CQRS com modelos de leitura separados — apenas separacao de Commands/Queries nos UseCases
- Event Sourcing — nao faz parte do escopo atual

## Context

- Este e o primeiro bounded context de um sistema maior que inclui carteirinhas e consumo
- Outros contextos se identificam consultando Account via API REST
- O Consumption Context usa Account para identificar quem esta registrando um consumo
- Projeto greenfield — sem codigo existente
- Frontend autentica no Auth0 (Google ou codigo por email), getMe retorna 404 se conta nao existe → front redireciona para registro
- CreateAccount extrai email do token Auth0 via userinfo; usuario fornece nome completo + CPF
- Data de nascimento e telefone sao opcionais, atualizados sob demanda; telefone requer verificacao previa
- Rotas protegidas por Auth0 JWT: getMe exige role user, getByCPF exige permissoes admin/M2M

## Constraints

- **Stack**: TypeScript + Node.js com NestJS
- **Arquitetura**: Hexagonal (Ports & Adapters) com DDD tatico completo
- **Design**: Clean Architecture (UseCases como orquestradores), CQRS leve (Commands/Queries separados), SOLID
- **Persistencia**: PostgreSQL via Prisma como adapter de RepositoryPort
- **Escopo**: Apenas o bounded context de Account neste projeto

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Hexagonal Architecture | Facilita manutencao e consulta no codigo, desacopla dominio de infra | — Pending |
| CQRS leve (so UseCases) | Separacao de responsabilidade sem complexidade de modelos separados | — Pending |
| UseCases como orquestradores (Clean Arch) | Dependency Inversion — UseCases dependem de interfaces, nao de implementacoes | — Pending |
| NestJS como framework | Suporte opinado a DDD/hexagonal, bom ecossistema TypeScript | — Pending |
| PostgreSQL via RepositoryPort | Banco relacional robusto, desacoplado do dominio via port/adapter | — Pending |
| Auth0 para autenticacao | Frontend autentica no Auth0, backend valida JWT e extrai email | — Pending |
| Email vem do token, nao do usuario | Garante que email e verificado pelo Auth0, nao auto-declarado | — Pending |
| Telefone requer verificacao | Previne dados invalidos, verificacao antes de persistir | — Pending |
| Testes sem infra (ports mockados) | Domain e UseCases testados isoladamente, Vitest resolve dependencias | — Pending |

---
*Last updated: 2026-03-10 after questioning (Auth0 flow, CPF, phone verification)*
