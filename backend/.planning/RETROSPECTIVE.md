# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Account Bounded Context

**Shipped:** 2026-03-11
**Phases:** 6 | **Plans:** 14 | **Commits:** 101

### What Was Built
- Complete Account bounded context with hexagonal architecture and DDD patterns
- 9 REST endpoints protected by Auth0 JWT with RBAC (permissions-based)
- PostgreSQL persistence via Prisma 7, S3/MinIO photo storage
- 123 unit tests + 76 E2E tests covering all layers
- Health check with Postgres and MinIO indicators
- Env validation, graceful shutdown

### What Worked
- GSD workflow kept phases focused and verifiable — each phase produced a coherent layer
- TDD approach for domain and use cases caught issues early
- Hexagonal architecture made each layer independently testable
- Audit-driven gap closure (Phase 6) caught real issues: missing @Roles decorators, dead code, incorrect status codes
- Fast execution: 14 plans completed in 2 days

### What Was Inefficient
- Phases 1-2 ROADMAP checkboxes never updated (show `[ ]` despite being complete) — only phases 3+ tracked correctly
- Phone verification was planned in requirements but deferred late — could have been scoped out earlier
- SUMMARY.md files lack `one_liner` field, making automated accomplishment extraction fail
- Nyquist validation partial across all phases — validation gap coverage incomplete

### Patterns Established
- DI string tokens (`ACCOUNT_REPOSITORY_PORT`, `STORAGE_PORT`) for hexagonal port binding
- Static mapper pattern (not injectable) for domain-persistence mapping
- Each use case has its own co-located Input/Output types with toOutput()
- DomainException hierarchy with abstract code + metadata for structured error handling
- Global APP_GUARD with @Public() opt-out pattern for JWT
- RolesGuard checks `permissions` (not `roles`) for Auth0 RBAC

### Key Lessons
1. Run `/gsd:audit-milestone` before marking complete — it caught 5 real issues that Phase 6 resolved
2. Deferred requirements should be explicitly marked from the start, not discovered at audit time
3. E2E tests requiring Docker need CI pipeline documentation — testing gap without it
4. Domain events without consumers are fine for v1 (infrastructure ready for future use)

### Cost Observations
- Model mix: primarily opus for planning/execution, sonnet for research agents
- Sessions: ~10 across 2 days
- Notable: 14 plans averaging 3-6 min each — very fast execution cycle

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Commits | Phases | Key Change |
|-----------|---------|--------|------------|
| v1.0 | 101 | 6 | Baseline — GSD workflow with audit-driven gap closure |

### Cumulative Quality

| Milestone | Unit Tests | E2E Tests | LOC |
|-----------|-----------|-----------|-----|
| v1.0 | 123 | 76 | 5,569 |

### Top Lessons (Verified Across Milestones)

1. Audit milestone before completion — catches real gaps
2. (More lessons will emerge from future milestones)
