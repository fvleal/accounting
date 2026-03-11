---
phase: 2
slug: infrastructure-and-persistence
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-xx | 01 | 1 | INFR-02 | smoke | `npx prisma migrate dev --name test` | N/A | ⬜ pending |
| 02-01-xx | 01 | 1 | INFR-04 | smoke | `npx prisma migrate deploy` | N/A | ⬜ pending |
| 02-02-xx | 02 | 1 | INFR-03 | unit | `npx vitest run src/account/infrastructure/mappers/account.mapper.spec.ts` | ❌ W0 | ⬜ pending |
| 02-02-xx | 02 | 1 | INFR-01 | integration | `npx vitest run src/account/infrastructure/adapters/prisma-account.repository.spec.ts` | ❌ W0 | ⬜ pending |
| 02-02-xx | 02 | 2 | INFR-06 | integration | `npx vitest run src/account/infrastructure/adapters/s3-storage.adapter.spec.ts` | ❌ W0 | ⬜ pending |
| N/A | N/A | N/A | INFR-05 | N/A | DEFERRED | N/A | ⬜ deferred |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/account/infrastructure/mappers/account.mapper.spec.ts` — stubs for INFR-03 (unit test, no DB needed)
- [ ] `src/account/infrastructure/adapters/prisma-account.repository.spec.ts` — stubs for INFR-01 (integration, needs running PostgreSQL)
- [ ] `src/account/infrastructure/adapters/s3-storage.adapter.spec.ts` — stubs for INFR-06 (integration, needs running MinIO)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Docker Compose starts PostgreSQL + MinIO | INFR-04 | Environment setup | Run `docker compose up -d`, verify both services healthy |
| Prisma migrations run against real DB | INFR-02/INFR-04 | DB state dependent | Run `npx prisma migrate dev`, verify tables created |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
