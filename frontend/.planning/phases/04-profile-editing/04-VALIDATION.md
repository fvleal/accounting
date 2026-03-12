---
phase: 4
slug: profile-editing
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + @testing-library/react 16.x |
| **Config file** | vite.config.ts (test section) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | EDIT-01 | integration | `npx vitest run src/__tests__/EditNameModal.test.tsx -x` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | EDIT-02 | integration | `npx vitest run src/__tests__/EditBirthdayModal.test.tsx -x` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | EDIT-04 | integration | Covered in EDIT-01 and EDIT-02 test files (error scenarios) | ❌ W0 | ⬜ pending |
| 04-01-04 | 01 | 1 | — | unit | `npx vitest run src/__tests__/validation.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/EditNameModal.test.tsx` — stubs for EDIT-01, EDIT-04 (name error scenarios)
- [ ] `src/__tests__/EditBirthdayModal.test.tsx` — stubs for EDIT-02, EDIT-04 (birthday error scenarios)
- [ ] Update `src/__tests__/ProfilePage.test.tsx` — remove phone row expectations, add modal open tests
- [ ] `src/__tests__/validation.test.ts` — shared name rules unit tests

*Existing infrastructure covers test framework — only test files needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Native date input dark mode styling | EDIT-02 | Browser-dependent rendering | Open birthday modal in Chrome dark mode, verify date picker is visible and usable |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
