---
phase: 5
slug: testing-and-hardening
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 |
| **Config file (unit)** | `vitest.config.ts` |
| **Config file (E2E)** | `test/vitest-e2e.config.ts` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test && npm run test:e2e` |
| **Estimated runtime** | ~30 seconds (unit ~5s, E2E ~25s) |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test && npm run test:e2e`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | TEST-01 | unit | `npx vitest run src/account/domain/value-objects/ --reporter=verbose` | ✅ | ⬜ pending |
| 05-01-02 | 01 | 1 | TEST-02 | unit | `npx vitest run src/account/domain/entities/account.entity.spec.ts` | ✅ | ⬜ pending |
| 05-01-03 | 01 | 1 | TEST-03 | unit | `npx vitest run src/account/application/commands/ --reporter=verbose` | ✅ | ⬜ pending |
| 05-01-04 | 01 | 1 | TEST-04 | unit | `npx vitest run src/account/application/queries/ --reporter=verbose` | ✅ | ⬜ pending |
| 05-01-05 | 01 | 1 | — | unit | `npx vitest run src/account/domain/exceptions/` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 1 | — | unit+E2E | `npm test && npm run test:e2e` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 1 | — | unit | `npm test` | ❌ W0 | ⬜ pending |
| 05-02-03 | 02 | 1 | — | unit | `npm test` | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 2 | TEST-05 | E2E | `npm run test:e2e` | ✅ | ⬜ pending |
| 05-03-02 | 03 | 2 | TEST-06 | E2E | `npm run test:e2e` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/account/domain/exceptions/duplicate-auth0-sub.error.spec.ts` — unit test for DuplicateAuth0SubError (user decision)
- [ ] `npm install @nestjs/terminus joi` — new dependencies for hardening
- [ ] Health check E2E smoke test — `GET /health` expects 200

*Existing infrastructure covers TEST-01 through TEST-06 requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Graceful shutdown | — | Requires SIGTERM signal during active request | 1. Start app, 2. Send long request, 3. Send SIGTERM, 4. Verify response completes and app exits cleanly |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
