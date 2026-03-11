---
phase: 4
slug: rest-api-and-security
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --testPathPattern="interface\|auth"` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --testPathPattern="interface|auth"`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | AUTH-01 | unit | `npx vitest run src/shared/infrastructure/auth/guards/jwt-auth.guard.spec.ts` | No - Wave 0 | ⬜ pending |
| 04-01-02 | 01 | 1 | AUTH-04 | unit | `npx vitest run src/shared/infrastructure/auth/decorators/roles.decorator.spec.ts` | No - Wave 0 | ⬜ pending |
| 04-01-03 | 01 | 1 | AUTH-02, AUTH-03 | unit | `npx vitest run src/shared/infrastructure/auth/guards/roles.guard.spec.ts` | No - Wave 0 | ⬜ pending |
| 04-02-01 | 02 | 2 | REST-01 through REST-06, REST-10, REST-11, REST-12 | unit | `npx vitest run src/account/interface/controllers/account.controller.spec.ts` | No - Wave 0 | ⬜ pending |
| 04-02-02 | 02 | 2 | REST-07 | unit | `npx vitest run src/account/interface/dtos/*.spec.ts` | No - Wave 0 | ⬜ pending |
| 04-02-03 | 02 | 2 | REST-08 | unit | `npx vitest run src/account/interface/dtos/account-response.dto.spec.ts` | No - Wave 0 | ⬜ pending |
| 04-02-04 | 02 | 2 | REST-09 | unit | `npx vitest run src/account/interface/filters/domain-exception.filter.spec.ts` | No - Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/account/interface/controllers/account.controller.spec.ts` — stubs for REST-01 through REST-12
- [ ] `src/account/interface/filters/domain-exception.filter.spec.ts` — covers REST-09
- [ ] `src/account/interface/interceptors/response-envelope.interceptor.spec.ts` — covers envelope wrapping
- [ ] `src/account/interface/dtos/account-response.dto.spec.ts` — covers REST-08
- [ ] `src/shared/infrastructure/auth/guards/jwt-auth.guard.spec.ts` — covers AUTH-01
- [ ] `src/shared/infrastructure/auth/guards/roles.guard.spec.ts` — covers AUTH-02, AUTH-03, AUTH-04

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Auth0 JWT token validation against real JWKS | AUTH-01 | Requires live Auth0 tenant | Send request with valid/invalid Auth0 token; verify 200/401 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
