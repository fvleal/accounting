# Phase 2: Onboarding - Research

**Researched:** 2026-03-11
**Domain:** React route guards, form handling, CPF validation, React Query cache seeding
**Confidence:** HIGH

## Summary

Phase 2 introduces an `AccountGuard` component that checks `GET /accounts/me` via React Query, routing new users (404 response) to an onboarding form and letting existing users pass through. The onboarding form collects full name and CPF, validates client-side, submits via `POST /accounts`, seeds the React Query cache with the response, and redirects to the profile page.

The existing codebase already provides all integration points: `apiClient` with token injection, the `Account` type, `ProtectedRoute` as a composition model, `LoadingScreen`, `AuthErrorFallback` pattern, and `notistack` for toasts. MUI v7 (installed at `^7.3.9`) has a built-in `loading` prop on `Button` -- no `@mui/lab` needed.

**Primary recommendation:** Use react-hook-form for form state (lightweight, great MUI integration via Controller), `cpf-cnpj-validator` for CPF validation, and a simple custom onChange handler for CPF masking (no mask library needed for a single pattern).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- AccountGuard as separate route wrapper from ProtectedRoute; ProtectedRoute handles auth, AccountGuard handles onboarding routing
- Check account status via GET /accounts/me on every protected route load (React Query caches result)
- Show existing LoadingScreen while account check is in progress
- On network error (non-404): show error screen with retry button, similar to AuthErrorFallback
- Centered MUI Card with fields stacked vertically, matching maxWidth="sm" Container pattern
- Page wrapped in AppLayout (header visible with avatar/logout)
- Short welcome message + explanation above fields (e.g., "Bem-vindo! Complete seu cadastro para continuar.")
- Full-width submit button
- Auto-mask CPF input as user types (XXX.XXX.XXX-XX format)
- Use `cpf-cnpj-validator` npm package for CPF validation
- Validation triggers on blur
- Name field: minimum 2 words, each 2+ characters
- On success: brief toast ("Conta criada!"), then redirect to profile page
- Submit button disabled with spinner while request is in flight (MUI loading button pattern)
- Backend errors (e.g., CPF already exists): inline error under relevant field; toast only for network/unexpected errors
- Seed React Query cache with POST /accounts response data

### Claude's Discretion
- Exact welcome message wording
- Toast duration before redirect
- Error screen layout for account check failures
- Form validation library choice (react-hook-form, formik, or native)
- CPF masking implementation approach (input mask library vs custom handler)

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-03 | User without an Account record is redirected to onboarding screen | AccountGuard component pattern using React Query + GET /accounts/me; 404 = redirect to /onboarding, success = render Outlet |
| AUTH-04 | User can create an Account by submitting full name and CPF on onboarding screen | Onboarding form with react-hook-form, cpf-cnpj-validator, POST /accounts mutation, cache seeding, redirect to profile |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-query | ^5.90.21 | Server state for GET /accounts/me + POST mutation | Already in project, caching makes guard instant on subsequent navigations |
| @mui/material | ^7.3.9 | Card, TextField, Button (with loading prop), Typography | Already in project; v7 Button has built-in `loading` prop |
| notistack | ^3.0.2 | Toast notifications ("Conta criada!") | Already in project, SnackbarProvider already in main.tsx |
| react-router | ^7.13.1 | Navigate component, useNavigate for redirects | Already in project |
| axios | ^1.13.6 | API calls via existing apiClient | Already configured with token interceptor |

### New Dependencies
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hook-form | ^7 (latest) | Form state management, validation, error handling | Onboarding form -- lightweight, excellent TypeScript support, Controller for MUI integration |
| cpf-cnpj-validator | ^1.0.3 | CPF check-digit validation algorithm | `cpf.isValid(value)` in form validation rule |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-hook-form | formik | Formik is heavier, more re-renders; RHF is the modern standard for React forms |
| react-hook-form | native useState | Works for 2 fields but loses structured validation, error state management, and dirty tracking |
| CPF mask library (react-imask) | Custom onChange handler | For a single mask pattern (###.###.###-##), a ~10 line handler is simpler than adding a dependency |

**Installation:**
```bash
npm install react-hook-form cpf-cnpj-validator
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  auth/
    AccountGuard.tsx          # NEW: route guard checking account existence
  pages/
    OnboardingPage.tsx        # NEW: onboarding form page
  api/
    client.ts                 # EXISTING: axios client
    accounts.ts               # NEW: account API functions (getMe, createAccount)
  hooks/
    useAccount.ts             # NEW: React Query hook for GET /accounts/me
    useCreateAccount.ts       # NEW: React Query mutation for POST /accounts
  utils/
    cpf.ts                    # NEW: CPF mask + validation helpers
  types/
    account.ts                # EXISTING: Account interface
```

### Pattern 1: AccountGuard as Layout Route Wrapper
**What:** Mirrors ProtectedRoute pattern -- renders `<Outlet />` if account exists, redirects to `/onboarding` if not.
**When to use:** Wraps all routes that require an existing Account record.
**Example:**
```typescript
// AccountGuard.tsx
import { Navigate, Outlet } from 'react-router';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { useAccount } from '../hooks/useAccount';

export function AccountGuard() {
  const { data: account, isLoading, error } = useAccount();

  if (isLoading) return <LoadingScreen />;
  if (error) {
    // 404 = new user, redirect to onboarding
    if (error.response?.status === 404) {
      return <Navigate to="/onboarding" replace />;
    }
    // Other errors: show error screen with retry
    return <AccountErrorFallback error={error} />;
  }

  return <Outlet />;
}
```

### Pattern 2: Route Nesting in App.tsx
**What:** AccountGuard nests inside ProtectedRoute, onboarding route sits outside AccountGuard but inside ProtectedRoute.
**Example:**
```typescript
// App.tsx
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route element={<ProtectedRoute />}>
    {/* Onboarding: authenticated but no account yet */}
    <Route path="/onboarding" element={<AppLayout />}>
      <Route index element={<OnboardingPage />} />
    </Route>
    {/* All other routes: require account */}
    <Route element={<AccountGuard />}>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<HomePage />} />
      </Route>
    </Route>
  </Route>
</Routes>
```

### Pattern 3: React Query Cache Seeding After Mutation
**What:** After POST /accounts succeeds, set the query cache for `["account", "me"]` so AccountGuard and profile page read instantly.
**Example:**
```typescript
// useCreateAccount.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; cpf: string }) =>
      apiClient.post<Account>('/accounts', data).then(r => r.data),
    onSuccess: (account) => {
      queryClient.setQueryData(['account', 'me'], account);
    },
  });
}
```

### Pattern 4: CPF Masking via Custom onChange
**What:** Simple function that strips non-digits and applies XXX.XXX.XXX-XX format.
**Example:**
```typescript
// utils/cpf.ts
export function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function unmaskCpf(value: string): string {
  return value.replace(/\D/g, '');
}
```

### Pattern 5: react-hook-form with MUI TextField via Controller
**What:** Controller wraps MUI TextField for controlled form state with validation.
**Example:**
```typescript
import { Controller, useForm } from 'react-hook-form';
import { TextField } from '@mui/material';
import { cpf } from 'cpf-cnpj-validator';
import { maskCpf, unmaskCpf } from '../utils/cpf';

interface OnboardingFormData {
  name: string;
  cpf: string;
}

const { control, handleSubmit } = useForm<OnboardingFormData>({
  defaultValues: { name: '', cpf: '' },
});

// CPF field with masking and validation
<Controller
  name="cpf"
  control={control}
  rules={{
    required: 'CPF e obrigatorio',
    validate: (value) =>
      cpf.isValid(unmaskCpf(value)) || 'CPF invalido',
  }}
  render={({ field, fieldState }) => (
    <TextField
      {...field}
      onChange={(e) => field.onChange(maskCpf(e.target.value))}
      label="CPF"
      placeholder="000.000.000-00"
      error={!!fieldState.error}
      helperText={fieldState.error?.message}
      fullWidth
    />
  )}
/>
```

### Anti-Patterns to Avoid
- **Checking account in ProtectedRoute:** Keep auth guard and account guard separate -- different concerns, different error states
- **Fetching account without React Query:** Loses caching, refetch-on-focus, and cache seeding benefits
- **Redirecting to `/` after account creation without cache seed:** Causes a redundant GET /accounts/me and potential flash of loading state
- **Validating CPF on every keystroke:** Aggressive and confusing UX; blur validation is the user's chosen pattern
- **Using `useEffect` + `useState` for the account check:** React Query handles loading/error/data states cleanly

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CPF check-digit validation | Custom modular arithmetic | `cpf-cnpj-validator` (`cpf.isValid()`) | User-specified; handles edge cases (all-same-digit CPFs, check-digit algorithm) |
| Form state + validation | Custom useState + error tracking | `react-hook-form` | Handles dirty/touched states, validation modes (onBlur), error messages, submit prevention |
| Server state caching | Custom fetch + context | `@tanstack/react-query` | Already in project; handles stale/fresh, refetch-on-focus, cache seeding |
| Toast notifications | Custom snackbar component | `notistack` (`enqueueSnackbar`) | Already configured in main.tsx |

**Key insight:** With only 2 form fields, it might seem like react-hook-form is overkill -- but the blur-validation, mask integration, inline error display, and submit-disabled-while-loading requirements together make structured form handling worthwhile.

## Common Pitfalls

### Pitfall 1: AccountGuard Infinite Redirect Loop
**What goes wrong:** User without account hits AccountGuard -> redirects to /onboarding -> onboarding is also inside AccountGuard -> redirects again
**Why it happens:** Onboarding route is nested inside AccountGuard
**How to avoid:** Onboarding route MUST be outside AccountGuard but inside ProtectedRoute. See route nesting pattern above.
**Warning signs:** Browser console shows "too many redirects" or page never loads

### Pitfall 2: 404 Not Caught as "New User"
**What goes wrong:** Axios interceptor or React Query default error handler treats 404 as a real error
**Why it happens:** The existing response interceptor handles 401 but passes others through; React Query `retry: 1` may retry the 404
**How to avoid:** In the useAccount hook, configure `retry: false` or use `retry: (count, error) => error.response?.status !== 404` to avoid retrying 404s. The query function should let 404 propagate as an error so AccountGuard can check `error.response?.status`.
**Warning signs:** Flashing error screen before redirect, or double network requests for /accounts/me

### Pitfall 3: Stale Account Cache After Creation
**What goes wrong:** User creates account, redirects to profile, but AccountGuard still sees stale "no account" state
**Why it happens:** React Query cache not seeded after mutation, or cache key mismatch
**How to avoid:** Use `queryClient.setQueryData(['account', 'me'], account)` in mutation `onSuccess` with the EXACT same query key used in useAccount hook
**Warning signs:** User bounces back to onboarding after successful account creation

### Pitfall 4: CPF Mask Cursor Jump
**What goes wrong:** When user types in the middle of the CPF field, cursor jumps to end
**Why it happens:** Setting the entire value via onChange resets cursor position
**How to avoid:** For this use case, it's acceptable -- users typically type CPF left-to-right sequentially. If needed, save and restore `selectionStart` after the onChange.
**Warning signs:** Manual testing shows awkward cursor behavior when editing middle characters

### Pitfall 5: Name Validation Regex Edge Cases
**What goes wrong:** Names like "Jo Jo" (2-char words) pass but single names like "Fulano" fail, or names with accented characters are rejected
**Why it happens:** Regex doesn't account for Portuguese diacritics or is too strict/loose
**How to avoid:** Use `/^\s*\S{2,}(\s+\S{2,})+\s*$/` which requires 2+ words of 2+ non-space chars, and naturally handles accented characters since `\S` matches any non-whitespace
**Warning signs:** Valid Brazilian names rejected

### Pitfall 6: Backend Error Field Mapping
**What goes wrong:** Backend returns `{ message: "CPF already exists" }` but form doesn't show error on the CPF field
**Why it happens:** No mapping between backend error response and react-hook-form `setError`
**How to avoid:** In the mutation's `onError`, parse the error response and call `setError('cpf', { message })` for known field errors. Use toast for unknown errors.
**Warning signs:** Backend rejects submission but user sees no field-level feedback

## Code Examples

### MUI v7 Button with Loading Prop
```typescript
// MUI v7: loading is built into Button -- NO @mui/lab needed
import { Button } from '@mui/material';

<Button
  type="submit"
  variant="contained"
  fullWidth
  loading={isSubmitting}
>
  Criar Conta
</Button>
```
Source: MUI v7 Button API -- `loading` prop was promoted from @mui/lab to core Button in v6.4.0 and carries forward into v7.

### useAccount Hook (GET /accounts/me)
```typescript
// hooks/useAccount.ts
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { Account } from '../types/account';

export function useAccount() {
  return useQuery<Account>({
    queryKey: ['account', 'me'],
    queryFn: () => apiClient.get<Account>('/accounts/me').then(r => r.data),
    retry: (failureCount, error: any) => {
      // Don't retry 404 -- it means "no account"
      if (error?.response?.status === 404) return false;
      return failureCount < 1;
    },
  });
}
```

### Toast + Redirect After Account Creation
```typescript
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router';

const { enqueueSnackbar } = useSnackbar();
const navigate = useNavigate();

// In mutation onSuccess:
onSuccess: (account) => {
  queryClient.setQueryData(['account', 'me'], account);
  enqueueSnackbar('Conta criada!', { variant: 'success' });
  navigate('/', { replace: true });
},
```

### Name Validation Rule
```typescript
// For react-hook-form rules
const nameRules = {
  required: 'Nome completo e obrigatorio',
  validate: (value: string) => {
    const words = value.trim().split(/\s+/);
    if (words.length < 2) return 'Informe nome e sobrenome';
    if (words.some((w) => w.length < 2)) return 'Cada parte do nome deve ter pelo menos 2 caracteres';
    return true;
  },
};
```

### cpf-cnpj-validator Usage
```typescript
import { cpf } from 'cpf-cnpj-validator';

cpf.isValid('12345678909');  // true/false (checks digit algorithm)
cpf.isValid('111.111.111-11'); // false (all same digits)
cpf.format('12345678909');    // '123.456.789-09'
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@mui/lab` LoadingButton | `Button` with `loading` prop | MUI v6.4.0 (2024) | No extra package needed; project already on v7 |
| formik for forms | react-hook-form | ~2021 onwards | RHF is now the React ecosystem default; fewer re-renders, smaller bundle |
| Manual fetch + useEffect | React Query useQuery/useMutation | Standard since ~2022 | Already adopted in this project |

**Deprecated/outdated:**
- `LoadingButton` from `@mui/lab`: use standard `Button` `loading` prop in MUI v7
- `react-input-mask`: unmaintained (last update 8 years ago); prefer custom handler or `react-imask` if a library is needed

## Open Questions

1. **Backend error response shape for duplicate CPF**
   - What we know: POST /accounts returns error when CPF already exists
   - What's unclear: Exact response structure (status code, error body shape)
   - Recommendation: Assume 409 Conflict with `{ message: string }` body; handle generically and refine after testing

2. **Backend field name for POST /accounts body**
   - What we know: Account type has `fullName` and `cpf`
   - What's unclear: Whether POST body uses `fullName` or `name` for the name field
   - Recommendation: Assume `{ name: string, cpf: string }` based on CONTEXT.md; verify during integration

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 + @testing-library/react 16.3.2 |
| Config file | vite.config.ts (test section) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-03 | AccountGuard redirects to /onboarding when GET /accounts/me returns 404 | unit | `npx vitest run src/__tests__/AccountGuard.test.tsx -x` | No - Wave 0 |
| AUTH-03 | AccountGuard renders children when account exists | unit | `npx vitest run src/__tests__/AccountGuard.test.tsx -x` | No - Wave 0 |
| AUTH-03 | AccountGuard shows error screen on network error | unit | `npx vitest run src/__tests__/AccountGuard.test.tsx -x` | No - Wave 0 |
| AUTH-04 | Onboarding form submits name + CPF and redirects on success | unit | `npx vitest run src/__tests__/OnboardingPage.test.tsx -x` | No - Wave 0 |
| AUTH-04 | Onboarding form shows inline error for invalid CPF | unit | `npx vitest run src/__tests__/OnboardingPage.test.tsx -x` | No - Wave 0 |
| AUTH-04 | Onboarding form shows inline error for invalid name | unit | `npx vitest run src/__tests__/OnboardingPage.test.tsx -x` | No - Wave 0 |
| AUTH-04 | CPF mask formats input as XXX.XXX.XXX-XX | unit | `npx vitest run src/__tests__/cpf-utils.test.ts -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/AccountGuard.test.tsx` -- covers AUTH-03 (guard routing logic)
- [ ] `src/__tests__/OnboardingPage.test.tsx` -- covers AUTH-04 (form submission, validation)
- [ ] `src/__tests__/cpf-utils.test.ts` -- covers CPF mask/unmask utility functions

## Sources

### Primary (HIGH confidence)
- MUI v7 Button API: `loading` prop confirmed built-in since v6.4.0, carries forward to v7 -- [Button API - Material UI](https://mui.com/material-ui/api/button/)
- Existing codebase: ProtectedRoute pattern, apiClient, Account type, React Query setup, notistack setup -- all verified by reading source files
- cpf-cnpj-validator GitHub: API verified (`cpf.isValid()`, `cpf.format()`) -- [GitHub](https://github.com/carvalhoviniciusluiz/cpf-cnpj-validator)

### Secondary (MEDIUM confidence)
- react-hook-form + MUI integration pattern (Controller approach) -- [LogRocket Blog](https://blog.logrocket.com/using-material-ui-with-react-hook-form/), [react-hook-form docs](https://react-hook-form.com/get-started)
- MUI v7 migration confirms CSS layer and slots API changes but no breaking changes to Button loading -- [MUI v7 announcement](https://mui.com/blog/material-ui-v7-is-here/)

### Tertiary (LOW confidence)
- Backend POST /accounts body shape (assumed `{ name, cpf }` from CONTEXT.md, not verified against backend code)
- Backend error response shape for duplicate CPF (assumed 409 with message)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all core libraries already in package.json, only adding react-hook-form + cpf-cnpj-validator
- Architecture: HIGH - follows established ProtectedRoute pattern, React Query patterns already in project
- Pitfalls: HIGH - redirect loop and cache seeding are well-known patterns; verified against route structure
- Form handling: MEDIUM - react-hook-form + MUI Controller is well-documented but not yet in this codebase

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable libraries, unlikely to change)

---
*Phase: 02-onboarding*
*Researched: 2026-03-11*
