# Phase 2: Onboarding - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Account guard state machine and new-user account creation flow. New users (authenticated in Auth0 but without a backend Account record) are detected via GET /accounts/me (404 = new user), redirected to an onboarding form (name + CPF), and upon successful creation redirected to the profile page. Existing users bypass onboarding entirely.

</domain>

<decisions>
## Implementation Decisions

### Account guard flow
- Check account status on every protected route load via GET /accounts/me (React Query caches the result for instant subsequent navigations)
- New `AccountGuard` route wrapper component, separate from `ProtectedRoute` — ProtectedRoute handles auth, AccountGuard handles onboarding routing
- Show the existing `LoadingScreen` (full-screen spinner) while the account check is in progress — consistent with Auth0 loading transition
- On network error (non-404): show error screen with retry button, similar to AuthErrorFallback

### Onboarding form design
- Centered MUI Card with fields stacked vertically, matching the maxWidth="sm" Container pattern from Phase 1
- Page wrapped in AppLayout (header visible with avatar/logout available)
- Short welcome message + explanation above the fields (e.g., "Bem-vindo! Complete seu cadastro para continuar.")
- Full-width submit button

### CPF validation & masking
- Auto-mask CPF input as user types (XXX.XXX.XXX-XX format)
- Use `cpf-cnpj-validator` npm package for CPF validation (full check-digit algorithm)
- Validation triggers on blur (not real-time, not on-submit-only)
- Name field: minimum 2 words, each 2+ characters (enforces "nome completo")

### Post-creation redirect
- On success: show brief toast success message ("Conta criada!"), then redirect to profile page
- Submit button: disabled with MUI spinner inside while request is in flight (MUI LoadingButton pattern)
- Backend errors (e.g., CPF already exists): inline error under the relevant field. Toast only for network/unexpected errors
- Seed React Query cache with the Account data returned from POST /accounts response — profile page renders instantly without extra GET

### Claude's Discretion
- Exact welcome message wording
- Toast duration before redirect
- Error screen layout for account check failures
- Form validation library choice (react-hook-form, formik, or native)
- CPF masking implementation approach (input mask library vs custom handler)

</decisions>

<specifics>
## Specific Ideas

- User explicitly requested `cpf-cnpj-validator` npm package for CPF validation
- MUI has built-in LoadingButton component — user confirmed to use it ("botao fica disable com um spinner dentro, MUI tem isso")
- Visual reference remains Google Personal Info style from Phase 1

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `LoadingScreen` component: reuse for account guard loading state
- `AuthErrorFallback` component: pattern reference for account check error screen
- `ProtectedRoute` component: composition model — AccountGuard layers on top
- `apiClient` (Axios): already configured with token injection for GET /accounts/me and POST /accounts
- `Account` type (`src/types/account.ts`): already defined with all fields

### Established Patterns
- Route guards as layout route wrappers (ProtectedRoute renders Outlet)
- React Query for server state management (caching, refetch on focus)
- MUI + Tailwind: MUI for structure, Tailwind for adjustments
- Centered Container maxWidth="sm" for content

### Integration Points
- `GET /accounts/me` — detect new vs existing user (returns Account or 404)
- `POST /accounts` — create account, body: `{ name, cpf }`, email comes from JWT
- App.tsx routing: AccountGuard wraps routes inside ProtectedRoute
- React Query cache: seed with POST response data for instant profile page render

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-onboarding*
*Context gathered: 2026-03-11*
