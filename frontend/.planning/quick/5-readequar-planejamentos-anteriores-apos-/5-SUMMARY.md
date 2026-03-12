---
phase: quick-5
plan: 1
subsystem: tests
tags: [test-fix, alignment]
dependency_graph:
  requires: []
  provides: [all-tests-passing]
  affects: [test-suite]
key_files:
  modified:
    - src/__tests__/ProfilePage.test.tsx
    - src/__tests__/AppDialog.test.tsx
    - src/__tests__/api-client.test.ts
    - src/utils/initials.ts
decisions: []
metrics:
  duration: 2min
  completed: 2026-03-12
---

# Quick Task 5: Fix Test Failures After Manual Code Changes Summary

Fixed 4 failing tests across 3 test files by aligning assertions with user's manual changes to ProfileHero (avatar-only, no text), ProfileFieldRow ("Inserir" placeholder), AppDialog (backdrop close enabled), and api-client (baseURL now /api). Renamed initials.ts parameter from fullName to name for Account type consistency.

## Task Completion

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix ProfilePage, AppDialog, and api-client test assertions | 8815370 | ProfilePage.test.tsx, AppDialog.test.tsx, api-client.test.ts, initials.ts |

## Changes Made

### ProfilePage.test.tsx
- Name/email assertions: changed from `toBeGreaterThanOrEqual(2)` to `toHaveLength(1)` since ProfileHero no longer renders text
- Null fields test: renamed from "Nao informado" to "Inserir" matching ProfileFieldRow fallback
- Updated comments to reflect current behavior

### AppDialog.test.tsx
- Renamed test from "does NOT call onClose on backdrop click" to "calls onClose on backdrop click"
- Changed assertion from `not.toHaveBeenCalled()` to `toHaveBeenCalled()` matching simplified AppDialog

### api-client.test.ts
- Changed expected baseURL from `'http://localhost:3000'` to `'/api'` matching VITE_API_URL config

### src/utils/initials.ts
- Renamed `fullName` parameter to `name` in `getInitials()` for consistency with Account type

## Verification

- All 94 tests passing (0 failures)
- No stale references to `fullName`, `dateOfBirth`, `Nao informado`, `PaperProps`, or `disableEscapeKeyDown` in src/

## Deviations from Plan

None - plan executed exactly as written.
