---
phase: 2
slug: onboarding
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.0.18 + @testing-library/react 16.3.2 |
| **Config file** | vite.config.ts (test section) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | AUTH-03 | unit | `npx vitest run src/__tests__/AccountGuard.test.tsx -x` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | AUTH-03 | unit | `npx vitest run src/__tests__/AccountGuard.test.tsx -x` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | AUTH-03 | unit | `npx vitest run src/__tests__/AccountGuard.test.tsx -x` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | AUTH-04 | unit | `npx vitest run src/__tests__/OnboardingPage.test.tsx -x` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | AUTH-04 | unit | `npx vitest run src/__tests__/OnboardingPage.test.tsx -x` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 1 | AUTH-04 | unit | `npx vitest run src/__tests__/OnboardingPage.test.tsx -x` | ❌ W0 | ⬜ pending |
| 02-02-04 | 02 | 1 | AUTH-04 | unit | `npx vitest run src/__tests__/cpf-utils.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/AccountGuard.test.tsx` — stubs for AUTH-03 (guard routing logic)
- [ ] `src/__tests__/OnboardingPage.test.tsx` — stubs for AUTH-04 (form submission, validation)
- [ ] `src/__tests__/cpf-utils.test.ts` — stubs for CPF mask/unmask utility functions

*Existing infrastructure covers framework installation (vitest already configured).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CPF mask cursor behavior | AUTH-04 | Browser cursor positioning not testable in jsdom | Type CPF in form, verify cursor stays at end |
| Visual layout matches spec | AUTH-04 | CSS/layout not testable in unit tests | Verify centered card, stacked fields, full-width button |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
