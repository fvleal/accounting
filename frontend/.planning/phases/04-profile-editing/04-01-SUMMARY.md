---
phase: 04-profile-editing
plan: 01
subsystem: ui
tags: [react-hook-form, react-query, mui-dialog, validation, mutation]

requires:
  - phase: 03-profile-display
    provides: ProfileFieldRow, ProfilePage layout, useAccount hook
provides:
  - Shared nameRules validation utility
  - useUpdateAccount mutation hook for PATCH /accounts/:id
  - EditNameModal component with form validation and error handling
  - Clickable ProfileFieldRow with onClick prop
affects: [04-02-birthday-editing, 05-photo-upload]

tech-stack:
  added: []
  patterns: [shared validation extraction, conditional modal rendering to avoid stale defaultValues]

key-files:
  created:
    - src/utils/validation.ts
    - src/hooks/useUpdateAccount.ts
    - src/components/profile/EditNameModal.tsx
    - src/__tests__/validation.test.ts
    - src/__tests__/EditNameModal.test.tsx
  modified:
    - src/pages/OnboardingPage.tsx
    - src/components/profile/ProfileFieldRow.tsx

key-decisions:
  - "Conditional render (if !open return null) prevents stale defaultValues in EditNameModal"
  - "disableEscapeKeyDown + backdropClick guard prevents accidental modal dismissal"

patterns-established:
  - "Shared validation: extract form rules to src/utils/validation.ts for reuse across pages"
  - "Edit modal pattern: conditional render, useForm with defaultValues from account, mutation with call-site callbacks"

requirements-completed: [EDIT-01, EDIT-04]

duration: 6min
completed: 2026-03-12
---

# Phase 04 Plan 01: Edit Infrastructure and Name Modal Summary

**Shared validation utilities, useUpdateAccount mutation hook, clickable ProfileFieldRow, and EditNameModal with react-hook-form validation and error toasts**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-12T13:40:37Z
- **Completed:** 2026-03-12T13:46:48Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Extracted nameRules to shared validation.ts, removing duplication from OnboardingPage
- Created useUpdateAccount hook mirroring useCreateAccount pattern with cache update
- Built EditNameModal with pre-filled name, blur validation, PATCH mutation, and success/error toasts
- Added onClick prop and accessibility attributes to ProfileFieldRow for editable rows
- Full test coverage: 7 validation tests + 9 EditNameModal integration tests all passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract shared validation and create useUpdateAccount hook** - `ac1af16` (feat)
2. **Task 2: Add onClick to ProfileFieldRow and create EditNameModal** - `4b2958e` (feat)
3. **Task 3: Create EditNameModal integration tests** - `4d2138a` (test)

## Files Created/Modified
- `src/utils/validation.ts` - Shared nameRules validation object
- `src/hooks/useUpdateAccount.ts` - PATCH mutation hook with React Query cache update
- `src/components/profile/EditNameModal.tsx` - Name edit dialog with form validation
- `src/components/profile/ProfileFieldRow.tsx` - Added onClick, cursor, role, tabIndex for editable rows
- `src/pages/OnboardingPage.tsx` - Replaced local nameRules with shared import
- `src/__tests__/validation.test.ts` - Unit tests for nameRules
- `src/__tests__/EditNameModal.test.tsx` - Integration tests for EditNameModal

## Decisions Made
- Conditional render (`if (!open) return null`) prevents stale defaultValues when modal reopens after account update
- `disableEscapeKeyDown` and `backdropClick` guard on Dialog prevents accidental dismissal during editing

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing `api-client.test.ts` failure (baseURL mismatch) is unrelated to this plan's changes and was not addressed per scope boundary rules.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- EditNameModal ready to be wired into ProfilePage (next plan 04-02)
- useUpdateAccount hook reusable for birthday editing modal
- Shared validation pattern established for future form modals

## Self-Check: PASSED

All 5 created files verified on disk. All 3 task commits verified in git log.

---
*Phase: 04-profile-editing*
*Completed: 2026-03-12*
