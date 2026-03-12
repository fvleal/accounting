---
phase: 3
slug: profile-display
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + @testing-library/react 16.x |
| **Config file** | vite.config.ts (test section) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~5 seconds |

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
| 03-01-01 | 01 | 1 | PROF-04 | unit | `npx vitest run src/__tests__/initials-utils.test.ts --reporter=verbose` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | -- | unit | `npx vitest run src/__tests__/phone-utils.test.ts --reporter=verbose` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | -- | unit | `npx vitest run src/__tests__/date-utils.test.ts --reporter=verbose` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | PROF-01 | unit | `npx vitest run src/__tests__/ProfilePage.test.tsx -t "displays" --reporter=verbose` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | PROF-02 | unit | `npx vitest run src/__tests__/ProfilePage.test.tsx -t "skeleton" --reporter=verbose` | ❌ W0 | ⬜ pending |
| 03-02-03 | 02 | 2 | PROF-03 | unit | `npx vitest run src/__tests__/ProfilePage.test.tsx -t "toast" --reporter=verbose` | ❌ W0 | ⬜ pending |
| 03-02-04 | 02 | 2 | PROF-04 | unit | `npx vitest run src/__tests__/ProfilePage.test.tsx -t "initials" --reporter=verbose` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/initials-utils.test.ts` — stubs for getInitials + getAvatarColor
- [ ] `src/__tests__/phone-utils.test.ts` — stubs for phone formatting
- [ ] `src/__tests__/date-utils.test.ts` — stubs for birthday formatting
- [ ] `src/__tests__/ProfilePage.test.tsx` — stubs for PROF-01, PROF-02, PROF-03, PROF-04

*Existing infrastructure covers framework installation (vitest already configured).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Skeleton-to-data transition smoothness | PROF-02 | Animation timing not testable in jsdom | Throttle network, verify no layout shift |
| Visual layout matches Google Personal Info style | PROF-01 | CSS/layout not verifiable in unit tests | Compare with myaccount.google.com reference |
| Avatar color consistency across reloads | PROF-04 | Color hash produces consistent result | Reload page, verify same color for same name |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
