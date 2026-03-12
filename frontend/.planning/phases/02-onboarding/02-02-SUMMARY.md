---
phase: 02-onboarding
plan: 02
subsystem: ui
tags: [react-hook-form, cpf-cnpj-validator, react-query, mutation, form-validation, mui]

# Dependency graph
requires:
  - phase: 02-onboarding
    plan: 01
    provides: AccountGuard, useAccount hook, createAccount API, CPF utilities, OnboardingPage placeholder, route wiring
provides:
  - Full OnboardingPage with name + CPF form, blur validation, CPF auto-masking
  - useCreateAccount mutation hook with React Query cache seeding
  - 10 OnboardingPage tests covering validation, submission, error handling, loading
affects: [profile pages, future form patterns]

# Tech tracking
tech-stack:
  added: ["@testing-library/user-event"]
  patterns: [react-hook-form Controller with MUI TextField, mutation with component-level onSuccess/onError callbacks, CPF mask integration in Controller onChange]

key-files:
  created:
    - src/hooks/useCreateAccount.ts
    - src/__tests__/OnboardingPage.test.tsx
  modified:
    - src/pages/OnboardingPage.tsx

key-decisions:
  - "Used valid CPF (52998224725) in tests instead of 12345678909 which fails check-digit validation"
  - "Mutation onSuccess/onError callbacks passed at call site (component) not in hook, enabling form setError and navigation"
  - "MUI v7 Button loading prop renders disabled + MuiButton-loading class (no data-loading attribute)"

patterns-established:
  - "react-hook-form Controller pattern: Controller wraps MUI TextField, custom onChange for masking"
  - "Mutation callback pattern: onSuccess/onError at mutate() call site for component-specific side effects"
  - "Form validation pattern: mode onBlur, nameRules and cpfRules as extracted constants"

requirements-completed: [AUTH-04]

# Metrics
duration: 4min
completed: 2026-03-12
---

# Phase 2 Plan 2: Onboarding Form Summary

**Onboarding form with react-hook-form, CPF auto-masking, blur validation, and React Query cache seeding on account creation**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-12T00:47:45Z
- **Completed:** 2026-03-12T00:51:50Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Full onboarding form with name (2+ words, 2+ chars each) and CPF (check-digit validated) fields
- CPF auto-masks as user types (XXX.XXX.XXX-XX format)
- Successful submission seeds React Query cache and redirects to profile with toast
- Backend 409 errors show inline CPF field error; unexpected errors show toast
- 10 comprehensive tests covering all form behaviors
- All 34 project tests pass, TypeScript clean, build succeeds

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useCreateAccount hook and OnboardingPage tests (TDD RED)** - `e36b115` (test)
2. **Task 2: Implement full OnboardingPage with form, validation, and submission (TDD GREEN)** - `1fd6f30` (feat)

## Files Created/Modified
- `src/hooks/useCreateAccount.ts` - React Query mutation for POST /accounts with cache seeding on ['account', 'me']
- `src/pages/OnboardingPage.tsx` - Full onboarding form replacing placeholder, with react-hook-form, CPF masking, blur validation
- `src/__tests__/OnboardingPage.test.tsx` - 10 tests: field rendering, required errors, name validation, CPF validation, masking, submission, toast, 409 error, loading state

## Decisions Made
- Used valid CPF (52998224725) in tests -- 12345678909 fails cpf-cnpj-validator check-digit algorithm
- Mutation onSuccess/onError callbacks are at component call site (not in hook) to access navigate, enqueueSnackbar, and setError
- MUI v7 Button loading prop makes button disabled with MuiButton-loading class (no data-loading attribute)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed invalid CPF in test data**
- **Found during:** Task 2 (GREEN phase -- tests failing on submit)
- **Issue:** Plan specified CPF "12345678909" but this fails cpf-cnpj-validator check-digit validation, blocking form submission in tests
- **Fix:** Replaced with valid CPF "52998224725" in all submission/masking tests
- **Files modified:** src/__tests__/OnboardingPage.test.tsx
- **Verification:** All 10 OnboardingPage tests pass
- **Committed in:** 1fd6f30 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Test data correction only. No scope creep.

## Issues Encountered
None beyond the CPF test data fix above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Onboarding flow complete: AccountGuard detects new users, redirects to /onboarding, form creates account, redirects to profile
- Phase 2 fully done -- ready for Phase 3 (profile pages)
- React Query cache seeded on account creation ensures instant profile page render

---
*Phase: 02-onboarding*
*Completed: 2026-03-12*
