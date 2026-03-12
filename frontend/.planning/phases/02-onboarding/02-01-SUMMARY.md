---
phase: 02-onboarding
plan: 01
subsystem: auth
tags: [react-query, route-guard, cpf, axios, vitest, testing-library]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: ProtectedRoute, apiClient with token interceptor, LoadingScreen, Account type, App.tsx routing
provides:
  - AccountGuard route wrapper (loading/404-redirect/error/outlet states)
  - useAccount React Query hook for GET /accounts/me
  - getMe() and createAccount() API functions
  - maskCpf/unmaskCpf CPF formatting utilities
  - AccountErrorFallback error screen with retry
  - OnboardingPage placeholder
  - Route wiring with /onboarding outside AccountGuard
affects: [02-onboarding plan 02, profile pages]

# Tech tracking
tech-stack:
  added: [react-hook-form, cpf-cnpj-validator]
  patterns: [AccountGuard layout route wrapper, React Query 404-as-signal, CPF progressive masking]

key-files:
  created:
    - src/auth/AccountGuard.tsx
    - src/hooks/useAccount.ts
    - src/api/accounts.ts
    - src/utils/cpf.ts
    - src/components/ui/AccountErrorFallback.tsx
    - src/pages/OnboardingPage.tsx
    - src/__tests__/cpf-utils.test.ts
    - src/__tests__/AccountGuard.test.tsx
    - src/test-setup.ts
  modified:
    - src/App.tsx
    - vite.config.ts

key-decisions:
  - "Vitest setup file added for @testing-library/jest-dom matchers (was missing from project)"
  - "404 treated as signal (not error) in AccountGuard -- React Query retry skipped for 404"
  - "OnboardingPage is placeholder -- Plan 02 replaces with full form"

patterns-established:
  - "AccountGuard pattern: layout route wrapper checking account existence via React Query"
  - "CPF progressive masking: strip non-digits, cap at 11, apply format by length"
  - "Test setup: vitest with @testing-library/jest-dom/vitest in setupFiles"

requirements-completed: [AUTH-03]

# Metrics
duration: 3min
completed: 2026-03-12
---

# Phase 2 Plan 1: Account Guard Summary

**AccountGuard route wrapper with React Query account check, CPF mask/unmask utilities, and onboarding route wiring**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-12T00:41:46Z
- **Completed:** 2026-03-12T00:44:50Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- AccountGuard detects new users (404 from GET /accounts/me) and redirects to /onboarding
- Existing users pass through AccountGuard to protected routes
- Network errors show AccountErrorFallback with retry button
- CPF mask/unmask utilities with full test coverage (10 tests)
- AccountGuard has 5 unit tests covering all states (loading, account exists, 404, network error, timeout)
- All 24 project tests pass, TypeScript clean, build succeeds

## Task Commits

Each task was committed atomically:

1. **Task 1: Create account API layer, useAccount hook, CPF utilities, and their tests** - `8648bf2` (feat)
2. **Task 2: Create AccountGuard, AccountErrorFallback, wire routing in App.tsx, placeholder OnboardingPage** - `dd22ddf` (feat)

## Files Created/Modified
- `src/auth/AccountGuard.tsx` - Route guard checking account existence via useAccount hook
- `src/hooks/useAccount.ts` - React Query hook for GET /accounts/me with 404 retry skip
- `src/api/accounts.ts` - Account API layer (getMe, createAccount)
- `src/utils/cpf.ts` - CPF mask (progressive XXX.XXX.XXX-XX) and unmask utilities
- `src/components/ui/AccountErrorFallback.tsx` - Error screen with retry for account check failures
- `src/pages/OnboardingPage.tsx` - Placeholder page for Plan 02 to replace
- `src/App.tsx` - Route tree with AccountGuard and /onboarding route
- `src/__tests__/cpf-utils.test.ts` - 10 tests for maskCpf/unmaskCpf
- `src/__tests__/AccountGuard.test.tsx` - 5 tests for AccountGuard states
- `src/test-setup.ts` - Vitest setup for @testing-library/jest-dom matchers
- `vite.config.ts` - Added test setupFiles configuration

## Decisions Made
- Added vitest setup file for @testing-library/jest-dom matchers -- was missing from project, needed for DOM assertions in component tests
- 404 response treated as "no account" signal rather than error -- retry disabled for 404 in useAccount hook
- OnboardingPage is a minimal placeholder (Typography in Container) -- Plan 02 replaces with full form

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added vitest test setup for @testing-library/jest-dom**
- **Found during:** Task 2 (AccountGuard tests)
- **Issue:** `toBeInTheDocument()` matcher not available -- setupFiles was empty in vite.config.ts
- **Fix:** Created `src/test-setup.ts` importing `@testing-library/jest-dom/vitest`, added to vite.config.ts setupFiles
- **Files modified:** src/test-setup.ts (created), vite.config.ts (modified)
- **Verification:** All tests pass with DOM matchers
- **Committed in:** dd22ddf (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential for test infrastructure. No scope creep.

## Issues Encountered
None beyond the test setup deviation above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- AccountGuard and routing backbone ready for Plan 02 (onboarding form)
- OnboardingPage placeholder exists at /onboarding route
- createAccount() API function ready for the form mutation
- CPF utilities ready for form masking
- react-hook-form and cpf-cnpj-validator already installed

---
*Phase: 02-onboarding*
*Completed: 2026-03-12*
