---
phase: 02-onboarding
verified: 2026-03-11T21:54:00Z
status: human_needed
score: 6/6 must-haves verified
human_verification:
  - test: "New Auth0 user without a backend Account record is redirected to /onboarding after login"
    expected: "User lands on /onboarding after Auth0 login completes when GET /accounts/me returns 404"
    why_human: "Requires a real Auth0 login with a user that has no Account record; cannot simulate the full redirect flow programmatically"
  - test: "Existing user with an Account record proceeds to profile page without seeing onboarding"
    expected: "User is never shown /onboarding; AccountGuard renders Outlet and the profile page loads"
    why_human: "Requires a real Auth0 user with an existing Account record; needs end-to-end verification in a browser"
  - test: "CPF auto-masks as user types on the onboarding form"
    expected: "Typing 52998224725 displays 529.982.247-25 in the CPF field in real time"
    why_human: "Masking behavior is covered by unit tests but the integration with MUI TextField in a real browser should be confirmed"
  - test: "Successful account creation redirects to profile page with no blank-page flash"
    expected: "After submitting valid name and CPF, user lands on '/' with no loading flicker (React Query cache already seeded)"
    why_human: "Cache seeding timing and visual smoothness cannot be verified without a running app and real network call"
---

# Phase 2: Onboarding Verification Report

**Phase Goal:** New users (authenticated in Auth0 but without a backend Account record) are caught and routed to account creation; existing users proceed to the profile page
**Verified:** 2026-03-11T21:54:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A new Auth0 user without a backend Account gets redirected to /onboarding after login | ✓ VERIFIED | AccountGuard checks `error.response?.status === 404` and returns `<Navigate to="/onboarding" replace />`; unit test "redirects to /onboarding when GET /accounts/me returns 404" passes |
| 2 | An existing user with an Account record is never shown the onboarding screen | ✓ VERIFIED | AccountGuard returns `<Outlet />` when no error and data is present; unit test "renders Outlet when account exists" passes; /onboarding route is outside AccountGuard in App.tsx |
| 3 | Network errors on the account check show an error screen with retry, not a redirect | ✓ VERIFIED | AccountGuard returns `<AccountErrorFallback>` with `onRetry={() => refetch()}` for non-404 errors; unit tests for 500 and timeout cases both pass |
| 4 | User can submit full name and CPF on the onboarding form and is redirected to the profile page on success | ✓ VERIFIED | OnboardingPage calls `mutation.mutate()` with trimmed name and unmasked CPF; onSuccess handler calls `navigate('/', { replace: true })`; "submits and redirects on success" test passes |
| 5 | Submitting an invalid CPF shows an inline validation error without navigating away | ✓ VERIFIED | CPF field Controller uses `cpf.isValid(unmaskCpf(value)) || 'CPF invalido'`; "validates CPF check digits" test passes showing inline error for 111.111.111-11 |
| 6 | Submitting an invalid name (single word or short parts) shows an inline validation error | ✓ VERIFIED | nameRules.validate splits on whitespace, requires 2+ words each 2+ chars; two separate tests cover "Informe nome e sobrenome" and "Cada parte do nome deve ter pelo menos 2 caracteres" |

**Score:** 6/6 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/auth/AccountGuard.tsx` | Route guard that checks account existence | ✓ VERIFIED | 21 lines, exports `AccountGuard`, wired to `useAccount()`, handles all 4 states |
| `src/hooks/useAccount.ts` | React Query hook for GET /accounts/me | ✓ VERIFIED | 15 lines, exports `useAccount`, queryKey `['account', 'me']`, 404 retry disabled |
| `src/api/accounts.ts` | Account API functions | ✓ VERIFIED | Exports `getMe` and `createAccount`, uses `apiClient`, correct return types |
| `src/utils/cpf.ts` | CPF mask and unmask utilities | ✓ VERIFIED | Exports `maskCpf` and `unmaskCpf`, progressive masking to 11 digits, 10 passing tests |
| `src/components/ui/AccountErrorFallback.tsx` | Error screen with retry | ✓ VERIFIED | 46 lines, props `{ error: Error; onRetry: () => void }`, renders "Tentar Novamente" button |
| `src/pages/OnboardingPage.tsx` | Full onboarding form with name + CPF fields, validation, submission | ✓ VERIFIED | 141 lines (well above 80-line minimum), react-hook-form with Controller, CPF masking, blur validation, mutation with cache seeding |
| `src/hooks/useCreateAccount.ts` | React Query mutation for POST /accounts with cache seeding | ✓ VERIFIED | 14 lines, exports `useCreateAccount`, calls `createAccount`, seeds `['account', 'me']` cache on success |
| `src/__tests__/OnboardingPage.test.tsx` | Tests for form validation, submission, error handling | ✓ VERIFIED | 10 tests covering all behaviors: field rendering, required errors, name validation (2 cases), CPF validation, masking, submit+redirect, toast, 409 inline error, loading state |
| `src/App.tsx` | Route tree with AccountGuard and /onboarding route | ✓ VERIFIED | /onboarding is inside ProtectedRoute but outside AccountGuard; AccountGuard wraps the '/' route |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/auth/AccountGuard.tsx` | `src/hooks/useAccount.ts` | `useAccount()` hook call | ✓ WIRED | `const { data: _account, isLoading, error, refetch } = useAccount()` at line 7 |
| `src/hooks/useAccount.ts` | `src/api/accounts.ts` | `queryFn` calling `getMe` | ✓ WIRED | `queryFn: getMe` at line 8; `getMe` imported from `../api/accounts` |
| `src/auth/AccountGuard.tsx` | `/onboarding` | `Navigate` component on 404 | ✓ WIRED | `return <Navigate to="/onboarding" replace />` on `error.response?.status === 404` |
| `src/App.tsx` | `src/auth/AccountGuard.tsx` | Route wrapper element | ✓ WIRED | `<Route element={<AccountGuard />}>` wrapping all non-onboarding protected routes |
| `src/pages/OnboardingPage.tsx` | `src/hooks/useCreateAccount.ts` | `useCreateAccount()` hook call | ✓ WIRED | `const mutation = useCreateAccount()` at line 45 |
| `src/hooks/useCreateAccount.ts` | `src/api/accounts.ts` | `mutationFn` calling `createAccount` | ✓ WIRED | `mutationFn: (data) => createAccount(data)` at line 9 |
| `src/hooks/useCreateAccount.ts` | queryClient cache | `setQueryData` on success | ✓ WIRED | `queryClient.setQueryData(['account', 'me'], account)` at line 11; key matches `useAccount` |
| `src/pages/OnboardingPage.tsx` | react-hook-form | `useForm` + `Controller` | ✓ WIRED | `useForm<OnboardingFormData>` at line 40; `Controller` wraps both MUI TextFields |
| `src/pages/OnboardingPage.tsx` | `src/utils/cpf.ts` | `maskCpf` in onChange, `unmaskCpf` before submit | ✓ WIRED | `onChange={(e) => field.onChange(maskCpf(e.target.value))}` in CPF field; `unmaskCpf(data.cpf)` in submit handler |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| AUTH-03 | 02-01-PLAN.md | User without an Account record is redirected to onboarding screen | ✓ SATISFIED | AccountGuard detects 404 from GET /accounts/me and navigates to /onboarding; 5 passing unit tests |
| AUTH-04 | 02-02-PLAN.md | User can create an Account by submitting full name and CPF on onboarding screen | ✓ SATISFIED | OnboardingPage form with name + CPF validation calls POST /accounts via useCreateAccount; 10 passing unit tests |

Both Phase 2 requirements are satisfied. No orphaned requirements detected — REQUIREMENTS.md maps exactly AUTH-03 and AUTH-04 to Phase 2, matching the plan frontmatter.

### Anti-Patterns Found

No anti-patterns found.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | — | — | No issues found |

Scanned files: `src/auth/AccountGuard.tsx`, `src/hooks/useAccount.ts`, `src/api/accounts.ts`, `src/utils/cpf.ts`, `src/components/ui/AccountErrorFallback.tsx`, `src/pages/OnboardingPage.tsx`, `src/hooks/useCreateAccount.ts`, `src/App.tsx`. No TODOs, FIXMEs, placeholder comments, empty returns, or console.log-only implementations found. `OnboardingPage.tsx` placeholder that existed after Plan 01 was correctly replaced in Plan 02 with the full form.

### Human Verification Required

#### 1. New-user onboarding redirect in real browser

**Test:** Register a new Auth0 user (or use a user that has never created an Account). Log in via the Auth0 redirect flow. Observe where the app lands after the callback.
**Expected:** The app navigates to `/onboarding` without any intermediate flash of the home page or blank screen.
**Why human:** The full redirect chain — Auth0 callback, token injection, GET /accounts/me returning 404, AccountGuard reacting — requires a live browser session with a real backend.

#### 2. Existing-user bypass of onboarding

**Test:** Log in as a user who already has an Account record in the backend. Attempt to navigate to `/onboarding` directly.
**Expected:** The home page (or protected content) is shown normally; the user is never redirected to onboarding. Direct navigation to `/onboarding` may show the onboarding UI (it is inside ProtectedRoute but outside AccountGuard), which is acceptable — the important check is that AccountGuard does not redirect existing users.
**Why human:** Requires a backend with a real Account record and an authenticated session.

#### 3. CPF masking in real browser input

**Test:** Open the onboarding form and type `52998224725` into the CPF field.
**Expected:** The field displays `529.982.247-25` in real time after each keystroke.
**Why human:** Controller `onChange` wrapping with `maskCpf` is tested in isolation but real-browser controlled-input behavior with MUI TextField and react-hook-form can have edge cases not caught by jsdom tests (e.g., cursor position, paste events).

#### 4. Cache seeding and instant profile page

**Test:** Complete the onboarding form with valid data. After redirect to `/`, observe whether the profile page data is immediately available or if there is a loading flash.
**Expected:** The profile page renders without a loading skeleton because the React Query cache was seeded by `useCreateAccount`'s `onSuccess` handler before navigation.
**Why human:** Timing of `setQueryData` relative to navigation and the profile page's query initialization requires a running app with a real API response.

### Gaps Summary

No gaps. All automated verifications passed:

- All 34 project tests pass (10 cpf-utils, 5 AccountGuard, 10 OnboardingPage, 4 api-client, 5 theme).
- TypeScript compiles with zero errors (`npx tsc --noEmit` exits clean).
- All 9 key links are wired end-to-end.
- Both requirements (AUTH-03, AUTH-04) are satisfied with implementation evidence.
- No anti-patterns or stub implementations detected.

Status is `human_needed` because 4 behaviors that are central to the phase goal depend on live browser + real Auth0 + real backend interaction that cannot be verified through static analysis or unit tests alone.

---

_Verified: 2026-03-11T21:54:00Z_
_Verifier: Claude (gsd-verifier)_
