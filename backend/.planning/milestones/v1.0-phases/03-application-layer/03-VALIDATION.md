---
phase: 03
slug: application-layer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
| **Config file** | vitest.config.ts (root) |
| **Quick run command** | `npx vitest run src/account/application` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/account/application`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | UCAS-01 | unit | `npx vitest run src/account/application/commands/create-account.command.spec.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | UCAS-02 | unit | `npx vitest run src/account/application/commands/update-name.command.spec.ts` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | UCAS-02 | unit | `npx vitest run src/account/application/commands/update-phone.command.spec.ts` | ❌ W0 | ⬜ pending |
| 03-01-04 | 01 | 1 | UCAS-02 | unit | `npx vitest run src/account/application/commands/update-birth-date.command.spec.ts` | ❌ W0 | ⬜ pending |
| 03-01-05 | 01 | 1 | UCAS-10 | unit | `npx vitest run src/account/application/commands/upload-account-photo.command.spec.ts` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | UCAS-03 | unit | `npx vitest run src/account/application/queries/get-account-by-id.query.spec.ts` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 1 | UCAS-04 | unit | `npx vitest run src/account/application/queries/find-account-by-field.query.spec.ts` | ❌ W0 | ⬜ pending |
| 03-02-03 | 02 | 1 | UCAS-05 | unit | `npx vitest run src/account/application/queries/list-accounts.query.spec.ts` | ❌ W0 | ⬜ pending |
| 03-02-04 | 02 | 1 | UCAS-03 | unit | `npx vitest run src/account/application/queries/get-me.query.spec.ts` | ❌ W0 | ⬜ pending |
| 03-02-05 | 02 | 1 | UCAS-06 | structural | All use case tests verify DI injection | ❌ W0 | ⬜ pending |
| 03-02-06 | 02 | 1 | UCAS-07 | structural | `ls src/account/application/commands src/account/application/queries` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/account/application/commands/create-account.command.spec.ts` — stubs for UCAS-01
- [ ] `src/account/application/commands/update-name.command.spec.ts` — stubs for UCAS-02 (name)
- [ ] `src/account/application/commands/update-phone.command.spec.ts` — stubs for UCAS-02 (phone)
- [ ] `src/account/application/commands/update-birth-date.command.spec.ts` — stubs for UCAS-02 (birth date)
- [ ] `src/account/application/commands/upload-account-photo.command.spec.ts` — stubs for UCAS-10
- [ ] `src/account/application/queries/get-account-by-id.query.spec.ts` — stubs for UCAS-03
- [ ] `src/account/application/queries/get-me.query.spec.ts` — stubs for GetMe
- [ ] `src/account/application/queries/find-account-by-field.query.spec.ts` — stubs for UCAS-04
- [ ] `src/account/application/queries/list-accounts.query.spec.ts` — stubs for UCAS-05

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| UCAS-08 SendPhoneVerification | UCAS-08 | Deferred to future phase | N/A |
| UCAS-09 VerifyPhone | UCAS-09 | Deferred to future phase | N/A |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
