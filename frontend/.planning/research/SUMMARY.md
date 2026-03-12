# Project Research Summary

**Project:** Account Management Frontend (React SPA)
**Domain:** Account/profile self-service SPA with Auth0 authentication and NestJS backend
**Researched:** 2026-03-11
**Confidence:** HIGH

## Executive Summary

This is a Google Personal Info-style account management SPA where authenticated users view and edit their profile data (name, date of birth, phone, photo) stored in a NestJS backend. The recommended approach follows an established, well-documented pattern: React 19 + Vite 7 as the foundation, TanStack Query as the server state layer, react-hook-form + Zod for modal forms, Headless UI for accessible dialog primitives, and Tailwind CSS 4 for styling and dark mode. Auth0 handles all authentication via the official `@auth0/auth0-react` SDK. The architecture is a clean four-layer separation — Presentation, Custom Hooks, API Service, and External Services — with a thin API client centralizing token injection via an interceptor so auth concerns never bleed into components.

The key differentiator this project has chosen is dark mode as the default aesthetic (versus Google/Apple/Microsoft which all default to light). This is achievable with minimal effort using Tailwind 4's `dark:` class variant and class-based strategy, but it must be applied consistently from the first component to avoid contrast issues. The interaction pattern — read-only cards with per-field edit modals — is the correct choice. Inline editing is an anti-pattern for this use case: it causes validation and cancellation complexity on mobile, and Google deliberately avoided it.

The highest risks are all concentrated in the Auth0 integration and the onboarding routing flow. The critical insight from research is that Auth0 authentication (user exists in Auth0) and backend account existence (Account record in NestJS) are two separate states that must be handled as a state machine from the very beginning. Any architecture that assumes "authenticated = has account" will require rearchitecting later, which is high-recovery-cost. Four Auth0 configuration mistakes — missing `audience`, missing refresh token rotation, missing RBAC permissions in the token, and improper callback handling — must all be addressed and verified in Phase 1 before any other work begins.

## Key Findings

### Recommended Stack

The stack is tightly constrained by project requirements (React, Vite, Auth0) and the research confirms these are the right choices with current stable versions. TanStack Query v5 is the decisive addition: it eliminates all manual loading/error/caching boilerplate that would otherwise appear in every component, and its cache invalidation pattern is the engine behind the edit-then-refresh cycle. For forms, react-hook-form + Zod v4 is the clear winner — lighter than Formik, faster validation than yup, and Zod schemas double as TypeScript types that mirror the NestJS DTOs.

For UI, the deliberate choice of Headless UI (Dialog only) over a full component library like MUI or Radix is correct for this project. A full component library would fight the custom dark theme; this app needs design control, not a design system. The `ky` HTTP client over Axios saves 35kb and its `beforeRequest` hook is sufficient for token injection.

**Core technologies:**
- React 19.2 + Vite 7.3 + TypeScript 5.7: project constraints, all current stable versions
- Tailwind CSS 4.2: first-party Vite plugin, no config file, `dark:` variant covers all theming needs
- @auth0/auth0-react 2.15: official SDK, handles token lifecycle, project constraint
- @tanstack/react-query 5.90: server state management, replaces all fetch/loading/error boilerplate
- ky 1.14: lightweight HTTP client with `beforeRequest` hook for auth token injection
- react-hook-form 7.71 + zod 4.3 + @hookform/resolvers 5.2: form validation, uncontrolled inputs, zero re-renders
- @headlessui/react 2.x: accessible Dialog primitive for modal editing pattern
- react-easy-crop 5.5: 3x4 aspect ratio crop with canvas blob export for S3 upload
- sonner 2.0: zero-config toast notifications for success/error feedback

**Explicitly avoid:** MUI/Ant Design/Chakra (fight Tailwind), Redux/Zustand (no complex client state), Formik (heavier than RHF), styled-components/Emotion (runtime CSS-in-JS, React 19 concerns), CRA (deprecated).

### Expected Features

All research files align on the same feature set. The feature dependency graph is the key planning tool: Auth login gates everything, onboarding gates the profile page, and the profile page gates all edit modals. Photo upload has no downstream dependencies and is the most complex single feature, so it goes last.

**Must have (table stakes) — all P1:**
- Auth0 login/logout with redirect flow — gate to the entire app
- Onboarding screen (full name + CPF) for users without a backend Account record — blocks new users otherwise
- Profile display page with read-only cards (name, email, CPF, birthday, phone, photo) — the core product
- Edit name modal with validation — most commonly edited field
- Edit date of birth modal with date picker — standard profile field
- Edit phone modal with "unverified" badge — contact info management
- Photo upload with 3x4 crop — non-standard ratio (most apps use circular), required by project
- Dark mode as default theme — project requirement and differentiator
- Responsive layout (mobile-first) — non-negotiable, over 50% mobile traffic
- Skeleton loading screens — prevents blank page flash, proven UX improvement
- Toast notifications for success/error — users must know what happened
- Initials-based fallback avatar — polished feel without requiring a photo

**Should have (differentiators) — P2:**
- Optimistic UI updates on edit — makes saves feel instant, low complexity with React Query
- Animated modal transitions — polished feel, low effort
- Field-level "last updated" timestamps — builds trust, backend already stores `updatedAt`

**Defer to v2+:**
- Admin panel (separate SPA per PROJECT.md)
- i18n / multi-language (Portuguese only for now)
- Settings page (no settings exist yet)
- Account deletion (needs backend + legal)
- Phone verification (needs backend v2)

**Anti-features to reject:** inline editing (anti-pattern for this UI), email/CPF editing (immutable in backend), settings page (scope creep), WebSockets (account data is user-controlled and infrequent).

### Architecture Approach

The architecture is a four-layer system with clean separation: Presentation (pages, modals, layout) calls Custom Hooks (TanStack Query wrappers), which call the API Service Layer (ky instance with auth interceptor), which talks to Auth0 and the NestJS backend. Components are auth-unaware — the single API client instance injects the bearer token on every request via a `beforeRequest` hook registered once at app initialization. The critical architectural decision is the AccountGuard component that sits between auth and the profile page, explicitly handling the "authenticated but no account" state (404 from GET /account) and routing to onboarding. This guard must exist from Phase 1, not bolted on later.

**Major components:**
1. Auth0Provider — wraps entire app, manages token lifecycle, configured with refresh token rotation
2. API Client (ky instance) — centralized HTTP with auth interceptor; all other code is auth-unaware
3. AccountGuard — post-auth state machine: checks account existence, routes to onboarding if 404
4. Layout Shell — persistent header with avatar/logout, responsive container, dark theme
5. ProfilePage — thin orchestrator rendering read-only ProfileCard rows, each triggering a modal
6. Edit Modals (per field) — react-hook-form + zod, useMutation on submit, cache invalidation on success
7. OnboardingPage — account creation form (name + CPF), shown to new users once
8. PhotoCropper — react-easy-crop with 3x4 ratio, canvas blob extraction, FormData upload via mutation

**The non-negotiable anti-patterns to avoid:**
- Duplicating server state in useState (creates two sources of truth; use TanStack Query exclusively)
- God component ProfilePage (keep it as a thin orchestrator; modals handle their own logic)
- Calling getAccessTokenSilently in every component (one API client, one interceptor, done)
- Assuming authenticated = has account (the AccountGuard prevents this)

### Critical Pitfalls

Research identified 7 pitfalls, all with well-documented prevention strategies. In order of severity and phase impact:

1. **Missing `audience` yields opaque tokens (Phase 1)** — Without the `audience` param in Auth0Provider, the access token is not a JWT and the backend rejects every API call with 401. Set `audience` to the Auth0 API Identifier from day one. Verify by decoding the token at jwt.io before writing any API code. Recovery cost: LOW.

2. **RBAC permissions not in access token (Phase 1)** — Backend enforces permissions like `create:account`. Auth0 does not include permissions in the token by default. Enable "RBAC" and "Add Permissions in the Access Token" in Auth0 Dashboard > APIs > Settings. Verify by checking for a `permissions` array claim in the decoded token. Recovery cost: LOW.

3. **Third-party cookie blocking breaks silent auth (Phase 1)** — Safari and Brave block third-party cookies, causing users to appear logged out on page refresh. Fix: set `useRefreshTokens={true}` and `cacheLocation="localstorage"` in Auth0Provider, and enable Refresh Token Rotation in the Auth0 dashboard. Must be configured from the start — retrofitting invalidates all active sessions. Recovery cost: MEDIUM.

4. **Onboarding race condition (Phase 1-2)** — New users are authenticated (Auth0) but have no backend Account. If the post-auth flow is not a proper state machine, the profile page crashes on 404 or accounts get duplicated. Solution: AccountGuard component that blocks all routes until account status is confirmed. Recovery cost: HIGH if missed early.

5. **Tainted canvas when cropping S3 images (Phase 3)** — If the app tries to re-crop an already-uploaded photo from an S3 URL without setting `crossOrigin="anonymous"` before `src`, the canvas is tainted and `toBlob()` throws a SecurityError. Solution: design the crop flow to only operate on local file inputs (File/Blob), never on S3 URLs. Also configure S3 CORS headers. Recovery cost: MEDIUM.

6. **FormData serialization for upload (Phase 3)** — Sending a Blob with wrong Content-Type or manually setting `Content-Type: multipart/form-data` (omitting the boundary) causes 400/422 errors. Solution: convert canvas to Blob via `canvas.toBlob()`, wrap in `File`, append to FormData with the correct field name, and let the browser set Content-Type. Recovery cost: LOW.

7. **Auth0 redirect callback loop (Phase 1)** — In React strict mode, the authorization code exchange can fire twice, creating a login loop. Solution: rely on Auth0Provider's built-in callback handling, implement `onRedirectCallback` to navigate and strip code/state from the URL, and test in React strict mode before shipping. Recovery cost: LOW.

## Implications for Roadmap

Based on combined research, a four-phase build order emerges directly from the architectural dependency chain. Each phase is unblockable without the previous one.

### Phase 1: Foundation and Auth

**Rationale:** Every other component depends on Auth0 being correctly configured. The four critical Auth0 pitfalls (audience, RBAC, refresh tokens, callback) must all be solved and verified before any feature work begins. A broken auth foundation has cascading failures in every subsequent phase.

**Delivers:** Working auth flow (login/logout/callback), verified JWT with correct claims, API client with token injection, TypeScript types matching backend DTOs, Vite + Tailwind 4 project scaffold with dark mode applied to the shell.

**Addresses features:** Auth0 login/logout, dark mode theme (shell level), Layout Shell.

**Avoids pitfalls:** Missing audience (opaque tokens), RBAC permissions not in token, third-party cookie blocking, redirect callback loop.

**Verification gates before proceeding:** Decode access token and confirm JWT format with correct `audience` and `permissions` claims. Verify token persists across page refresh in Safari and Brave. Verify no login loop in React strict mode.

### Phase 2: Core Read Path and Onboarding

**Rationale:** Once auth is solid, the app needs to fetch the user's account and handle the "new user" case. This phase implements the AccountGuard state machine and the two possible post-auth destinations: onboarding form for new users, profile display for existing ones. The profile page is read-only here — no editing yet.

**Delivers:** AccountGuard with explicit 404 handling, OnboardingPage (name + CPF form), ProfilePage with read-only cards (name, email, CPF, birthday, phone, photo placeholder), skeleton loading states, initials avatar fallback, responsive layout.

**Addresses features:** Onboarding flow, profile display page, skeleton loading, initials avatar, responsive layout.

**Avoids pitfalls:** Onboarding race condition (AccountGuard gates everything), God component ProfilePage (cards are separate components from the start).

**Research flag:** Standard patterns — no additional research needed. TanStack Query's useQuery + cache pattern for this use case is exhaustively documented.

### Phase 3: Write Path (Edit Modals)

**Rationale:** Once profile display is solid, add the edit interactions. All three field modals (name, birthdate, phone) follow the same pattern: Headless UI Dialog, react-hook-form + zod, useMutation, cache invalidation on success. They can be built in any order and in parallel if needed.

**Delivers:** EditNameModal, EditBirthdateModal, EditPhoneModal — each with form validation, PATCH mutation, success toast, and cache invalidation that causes the ProfilePage to re-render with new data. Also includes the "unverified" phone badge.

**Addresses features:** Edit name, edit birthday, edit phone, toast notifications, error handling.

**Uses stack:** react-hook-form + zod + @hookform/resolvers, @headlessui/react Dialog, sonner, TanStack Query useMutation.

**Avoids pitfalls:** Server state duplication (modals only hold transient form state; TanStack Query is the single source of truth), modal closes on backdrop during submission (disable while isSubmitting).

**Research flag:** Standard patterns — the modal-mutation-invalidation loop is the core TanStack Query use case, well documented.

### Phase 4: Photo Upload and Polish

**Rationale:** Photo upload is the most complex single feature (file input, client-side crop, canvas blob extraction, FormData upload) and has no features depending on it, so it goes last. Once functional, this phase also handles responsive refinements, edge cases, and the P2 polish items (optimistic updates, modal animations).

**Delivers:** EditPhotoModal with react-easy-crop (3x4), canvas blob extraction, FormData PUT mutation, S3-backed photo display. Responsive refinements (full-screen modals on mobile). Optimistic UI updates for edit operations. Error boundaries.

**Addresses features:** Photo upload + crop, responsive polish, optimistic updates, animated modal transitions.

**Avoids pitfalls:** Tainted canvas (crop only operates on local File/Blob, never S3 URLs; S3 CORS headers configured), FormData serialization (browser sets Content-Type automatically), full-resolution photo performance (CSS object-fit, reasonably sized images), crop debouncing (onCropComplete debounced 200-300ms to prevent CPU spikes on mobile).

**Research flag:** The S3 CORS configuration and backend FormData field name must be confirmed with the backend team before building the upload flow. If the backend upload contract is undocumented, brief research into the NestJS Multer configuration is warranted.

### Phase Ordering Rationale

- **Auth before everything:** Auth0 configuration mistakes are the only pitfalls with HIGH recovery cost if discovered late. They must be confirmed working before any feature is built on top.
- **Read before write:** You cannot build edit modals without a profile page to display and trigger them from. The data flow (useAccount -> ProfilePage -> card -> modal) must exist before the mutation flow is added.
- **Onboarding before profile:** The AccountGuard and onboarding flow must be designed into the routing architecture from the start. Retrofitting it after the profile page exists is the high-cost "onboarding race condition" pitfall.
- **Photo upload last:** It's the most complex feature with the most external dependencies (S3 CORS, backend FormData contract) and has zero downstream dependencies. De-risking auth and the edit pattern first reduces total project risk.

### Research Flags

Phases requiring no additional research (standard patterns):
- **Phase 1:** Auth0 React SDK configuration is exhaustively documented with official examples.
- **Phase 2:** TanStack Query useQuery pattern and React Router routing are standard.
- **Phase 3:** The modal-form-mutation-invalidation loop is the canonical TanStack Query use case.

Phases that may need brief targeted research:
- **Phase 4 (photo upload):** Confirm the NestJS backend's exact FormData field name and file size limit before building the upload mutation. If the backend uses a presigned S3 URL pattern instead of a backend proxy, the upload flow changes significantly. One conversation with the backend team or a quick read of the NestJS controller is sufficient — no full research sprint needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified against npm and official release pages. Compatibility matrix confirmed (Zod v4 + resolvers v5, React 19 + Auth0 SDK, Tailwind 4 + Vite plugin). |
| Features | HIGH | Feature set is well-established (Google/Apple/Microsoft as reference). Feature dependency graph is clear. Anti-features are correctly identified with solid rationale. |
| Architecture | HIGH | Four-layer pattern is industry standard for React SPAs with TanStack Query. Component responsibilities and data flow are unambiguous. Build order matches dependency chain exactly. |
| Pitfalls | HIGH | Auth0 pitfalls are exceptionally well-documented (Auth0 community, GitHub issues, official SDK docs). Canvas taint and FormData pitfalls are MDN-documented browser behavior. |

**Overall confidence:** HIGH

### Gaps to Address

- **Backend upload contract:** The exact field name, accepted MIME types, and file size limit for the photo upload endpoint are not in the research. Confirm with the backend team or read the NestJS controller before Phase 4. This is a 10-minute lookup, not a research gap.
- **Auth0 dashboard configuration access:** Several Phase 1 steps require changes in the Auth0 dashboard (enable RBAC, enable Refresh Token Rotation, set API identifier). Confirm the team has dashboard access before Phase 1 begins.
- **CPF validation rules:** The onboarding form accepts a CPF. The research covers that CPF is immutable post-creation but does not cover the exact Brazilian CPF validation algorithm. Implement via a zod `.refine()` with a standard CPF checksum validator (widely available as an npm package or ~20 lines of code).
- **Phone number format:** The project targets Brazil. Phone validation should enforce Brazilian phone format (E.164 or local +55 format). Confirm the backend's expected format before building the EditPhoneModal.

## Sources

### Primary (HIGH confidence)
- [React Versions](https://react.dev/versions) — React 19.2.x as current stable
- [Vite Releases](https://vite.dev/releases) — Vite 7.3.x confirmed
- [Tailwind CSS v4 announcement](https://tailwindcss.com/blog/tailwindcss-v4) — v4 architecture, Vite plugin, no config file
- [Auth0 React SDK Documentation](https://auth0.com/docs/libraries/auth0-react) — Auth0Provider config, token management, callback handling
- [Auth0 Refresh Token Rotation](https://auth0.com/blog/securing-single-page-applications-with-refresh-token-rotation/) — security model for SPAs
- [TanStack Query Official Docs](https://tanstack.com/query/latest) — useQuery, useMutation, cache invalidation patterns
- [Headless UI Dialog](https://headlessui.com/react/dialog) — Dialog component with focus trap, scroll lock
- [MDN: CORS-enabled images and tainted canvas](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image) — canvas taint behavior
- [react-easy-crop GitHub](https://github.com/ValentinH/react-easy-crop) — crop library and blob conversion patterns
- npm registry versions confirmed for: @auth0/auth0-react, @tanstack/react-query, ky, react-hook-form, @hookform/resolvers, zod, react-easy-crop, lucide-react, sonner, react-router

### Secondary (MEDIUM confidence)
- [Baymard Institute: Accounts & Self-Service UX 2025](https://baymard.com/blog/current-state-accounts-selfservice) — feature expectations for account pages
- [Bulletproof React Project Structure](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md) — folder structure rationale
- [Auth0 Community forums](https://community.auth0.com) — third-party cookie issues, RBAC permissions, login loops (multiple threads cited in PITFALLS.md)
- [Nielsen Norman Group: Skeleton Screens](https://www.nngroup.com/articles/skeleton-screens/) — perceived performance improvement
- [LogRocket: Modal UX Best Practices](https://blog.logrocket.com/ux-design/modal-ux-design-patterns-examples-best-practices/) — modal vs inline editing decision

### Tertiary (LOW confidence — validate during implementation)
- Backend FormData field name and file size limit for photo upload — not researched, must be confirmed with backend team
- Brazilian phone number format expected by backend — not researched, must be confirmed before EditPhoneModal implementation

---
*Research completed: 2026-03-11*
*Ready for roadmap: yes*
