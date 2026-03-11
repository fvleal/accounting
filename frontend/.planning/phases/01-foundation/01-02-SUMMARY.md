---
phase: 01-foundation
plan: 02
subsystem: auth
tags: [auth0, axios, react-router, protected-routes, layout, mui-appbar, token-interceptor]

# Dependency graph
requires:
  - "01-01: Vite scaffold, MUI dark theme, Tailwind CSS layers, provider stack"
provides:
  - "Auth0 redirect login/logout with refresh token rotation"
  - "Axios API client with Bearer token interceptor"
  - "Responsive layout shell (Header + centered content)"
  - "Protected route HOC with loading screen"
  - "Login page with branded card and Entrar button"
  - "Account type interface for backend model"
affects: [02-onboarding, 03-profile-display, 04-profile-edit, 05-photo-upload]

# Tech tracking
tech-stack:
  added: []
  patterns: [auth0-provider-with-navigate, token-getter-injection, protected-route-hoc, avatar-menu-logout, layout-shell-outlet]

key-files:
  created: [src/auth/AuthProviderWithNavigate.tsx, src/auth/ProtectedRoute.tsx, src/api/client.ts, src/components/ui/LoadingScreen.tsx, src/types/account.ts, src/components/layout/Header.tsx, src/components/layout/AppLayout.tsx, src/pages/LoginPage.tsx, src/pages/HomePage.tsx, "src/__tests__/api-client.test.ts"]
  modified: [src/App.tsx]

key-decisions:
  - "TokenGetterInitializer child component inside Auth0Provider to wire setTokenGetter via useEffect"
  - "Auth0Provider placed inside App.tsx (child of BrowserRouter in main.tsx) for useNavigate access"
  - "Container maxWidth sm (~600px) for centered content matching Google Personal Info layout"
  - "Test ordering matters for module-level state -- no-getter test runs before setTokenGetter test"

patterns-established:
  - "Auth0Provider wraps routes inside BrowserRouter via AuthProviderWithNavigate"
  - "Token injection via setTokenGetter -- never import useAuth0 in api/client.ts"
  - "Protected routes use withAuthenticationRequired HOC with LoadingScreen"
  - "Header avatar menu pattern: IconButton > Avatar > Menu with user info and logout"
  - "Layout shell: AppLayout renders Header + Container + Outlet"

requirements-completed: [AUTH-01, AUTH-02, LAYO-01]

# Metrics
duration: 3min
completed: 2026-03-11
---

# Phase 1 Plan 02: Auth & Layout Summary

**Auth0 redirect login with refresh token rotation, Axios client with Bearer interceptor, responsive header+content layout shell with avatar menu logout**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-11T23:05:54Z
- **Completed:** 2026-03-11T23:09:00Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments
- Auth0Provider wrapper with useNavigate redirect callback, refresh token rotation, and localStorage caching
- Axios API client with request interceptor that injects Bearer token via setTokenGetter pattern
- Responsive layout shell with sticky AppBar header (app name + avatar menu with logout)
- Branded login page with "Entrar" button (not auto-redirect per user decision)
- Protected route HOC with full-screen loading screen during auth redirects
- 4 API client unit tests passing alongside 5 theme tests (9 total)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Auth0 provider, protected route, API client, and loading screen** - `fd1eb3a` (feat)
2. **Task 2: Create layout shell, pages, and wire routing** - `9a78f34` (feat)
3. **Task 3: Create API client test and run full test suite** - `75ced1a` (test)

## Files Created/Modified
- `src/auth/AuthProviderWithNavigate.tsx` - Auth0Provider wrapper with useNavigate + TokenGetterInitializer
- `src/auth/ProtectedRoute.tsx` - withAuthenticationRequired HOC wrapper
- `src/api/client.ts` - Axios instance with Bearer token request interceptor
- `src/components/ui/LoadingScreen.tsx` - Full-screen centered spinner with app name
- `src/types/account.ts` - Account interface matching backend model
- `src/components/layout/Header.tsx` - AppBar with avatar menu (name, email, logout)
- `src/components/layout/AppLayout.tsx` - Header + Container(sm) + Outlet
- `src/pages/LoginPage.tsx` - Branded landing with "Entrar" button, redirects if authenticated
- `src/pages/HomePage.tsx` - Placeholder welcome page with user name
- `src/App.tsx` - Routes: /login -> LoginPage, / -> AppLayout > ProtectedRoute(HomePage)
- `src/__tests__/api-client.test.ts` - 4 tests for baseURL, interceptor, token attachment

## Decisions Made
- Created TokenGetterInitializer as a child component inside Auth0Provider to call setTokenGetter via useEffect -- this keeps the API client decoupled from React hooks
- Auth0Provider lives in App.tsx (inside AuthProviderWithNavigate), not main.tsx, because it needs useNavigate from BrowserRouter
- Container maxWidth="sm" for centered content (~600px) matching Google Personal Info reference
- Test ordering used to handle module-level token getter state (no-getter test runs first)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

Auth0 dashboard configuration is required before the login flow will work. The plan's `user_setup` section documents:
- Create Auth0 SPA application and get VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID, VITE_AUTH0_AUDIENCE
- Set Allowed Callback/Logout/Web Origins URLs to http://localhost:5173
- Enable Refresh Token Rotation and RBAC with permissions in access token
- Create `.env.local` with the three Auth0 env vars

## Next Phase Readiness
- Authenticated app shell complete -- login, logout, protected routes, API client all wired
- Layout shell ready for profile page content in Phase 3
- Account type interface ready for onboarding guard in Phase 2
- All 9 automated tests passing (theme + api-client)

## Self-Check: PASSED

- All 11 key files verified present on disk
- All 3 task commits verified in git log (fd1eb3a, 9a78f34, 75ced1a)
- Build succeeds, all 9 tests pass

---
*Phase: 01-foundation*
*Completed: 2026-03-11*
