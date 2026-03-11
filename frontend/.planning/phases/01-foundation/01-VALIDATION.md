---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x (Vite-native) |
| **Config file** | `vite.config.ts` (inline test config) — Wave 0 installs |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 0 | LAYO-02 | unit | `npx vitest run src/__tests__/theme.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 0 | LAYO-03 | unit | `npx vitest run src/__tests__/theme.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | AUTH-01 | manual-only | N/A | N/A | ⬜ pending |
| 01-02-02 | 02 | 1 | AUTH-02 | manual-only | N/A | N/A | ⬜ pending |
| 01-03-01 | 03 | 1 | AUTH-01 | unit | `npx vitest run src/__tests__/api-client.test.ts` | ❌ W0 | ⬜ pending |
| 01-04-01 | 04 | 2 | LAYO-01 | manual-only | N/A | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom` — test framework and utilities
- [ ] `vite.config.ts` — add `test: { environment: 'jsdom' }` to Vite config
- [ ] `src/__tests__/theme.test.ts` — verify theme creates dark palette with correct colors (LAYO-02, LAYO-03)
- [ ] `src/__tests__/api-client.test.ts` — verify Axios interceptor attaches Bearer token header (AUTH-01)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Auth0 redirect login flow | AUTH-01 | Requires browser interaction with Auth0 Universal Login page | 1. Open app in browser 2. Click Login 3. Complete Auth0 login 4. Verify redirect back to app 5. Check jwt.io for correct `audience` and `permissions` claims |
| Logout clears session | AUTH-02 | Requires browser cookie/session verification | 1. While logged in, click avatar menu 2. Click Logout 3. Verify redirect to login page 4. Refresh page — should remain logged out |
| Token persists across refresh | AUTH-01 | Requires Safari/Brave testing for third-party cookie blocking | 1. Login in Safari 2. Refresh page 3. Should remain authenticated (no re-login) 4. Repeat in Brave |
| Layout responsive on mobile | LAYO-01 | Visual verification across breakpoints | 1. Open Chrome DevTools 2. Toggle device toolbar 3. Check xs, sm, md, lg breakpoints 4. Verify header, content, and avatar menu adapt |
| Dark mode renders correctly | LAYO-02 | Visual verification of actual rendering | 1. Open app 2. Verify dark background (#121212) 3. Verify paper surfaces (#1e1e1e) 4. Verify text readability (white/light gray) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
