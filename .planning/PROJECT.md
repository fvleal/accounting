# Account Bounded Context

## What This Is

Um bounded context de Account que gerencia dados de identidade de pessoas fisicas (nome, email, telefone). Serve como contexto de identidade central consumido por outros bounded contexts (carteirinhas de estudante/professor, Consumption Context) via API REST. Construido com DDD tatico, Hexagonal Architecture e NestJS.

## Core Value

Fornecer uma fonte unica e confiavel de identidade de conta (Account) que outros contextos possam consumir de forma desacoplada via API REST.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] Criar Account com dados de identidade (nome, email, telefone)
- [ ] Consultar Account por ID
- [ ] Atualizar dados de identidade de um Account
- [ ] Listar Accounts
- [ ] Expor API REST para consumo por outros bounded contexts
- [ ] Dominio modelado com Aggregates, Value Objects, Domain Events e Repository Ports
- [ ] UseCases separados em Commands e Queries (CQRS leve)
- [ ] UseCases dependem de interfaces (ports), seguindo SOLID e Dependency Inversion
- [ ] Persistencia via PostgreSQL como Adapter de RepositoryPort

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

## Constraints

- **Stack**: TypeScript + Node.js com NestJS
- **Arquitetura**: Hexagonal (Ports & Adapters) com DDD tatico completo
- **Design**: Clean Architecture (UseCases como orquestradores), CQRS leve (Commands/Queries separados), SOLID
- **Persistencia**: PostgreSQL como adapter de RepositoryPort
- **Escopo**: Apenas o bounded context de Account neste projeto

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Hexagonal Architecture | Facilita manutencao e consulta no codigo, desacopla dominio de infra | — Pending |
| CQRS leve (so UseCases) | Separacao de responsabilidade sem complexidade de modelos separados | — Pending |
| UseCases como orquestradores (Clean Arch) | Dependency Inversion — UseCases dependem de interfaces, nao de implementacoes | — Pending |
| NestJS como framework | Suporte opinado a DDD/hexagonal, bom ecossistema TypeScript | — Pending |
| PostgreSQL via RepositoryPort | Banco relacional robusto, desacoplado do dominio via port/adapter | — Pending |

---
*Last updated: 2026-03-10 after initialization*
