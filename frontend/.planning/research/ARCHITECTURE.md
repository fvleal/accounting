# Architecture Research

**Domain:** React SPA for Account Management (profile viewing/editing)
**Researched:** 2026-03-11
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                       │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌─────────────┐  │
│  │  Layout   │  │ Onboarding│  │  Profile   │  │Edit Modals  │  │
│  │  Shell    │  │  Page     │  │  Page      │  │(per field)  │  │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └──────┬──────┘  │
│        │              │              │               │          │
├────────┴──────────────┴──────────────┴───────────────┴──────────┤
│                     Custom Hooks Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ useAccount   │  │ usePhotoUpload│ │ useAuth (Auth0 SDK)  │   │
│  │ (TanStack Q) │  │ (TanStack Q) │  │                      │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
│         │                 │                      │              │
├─────────┴─────────────────┴──────────────────────┴──────────────┤
│                       API Service Layer                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               api-client (Axios instance)                │   │
│  │          (base URL, Auth0 token interceptor)             │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│  ┌──────────────┐  ┌────┴─────────┐                             │
│  │ accountApi   │  │  photoApi    │                             │
│  │ (CRUD calls) │  │ (upload)     │                             │
│  └──────────────┘  └──────────────┘                             │
├─────────────────────────────────────────────────────────────────┤
│                   External Services                             │
│  ┌──────────────┐  ┌──────────────────────────────────────┐     │
│  │  Auth0 SPA   │  │  Backend REST API (NestJS)           │     │
│  │  SDK         │  │  localhost:3000                       │     │
│  └──────────────┘  └──────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Auth0Provider | Wraps entire app, manages auth state, provides tokens | `@auth0/auth0-react` Auth0Provider at root |
| Layout Shell | Persistent chrome: header with avatar/logout, responsive container | Single layout component with `<Outlet />` |
| Onboarding Page | Account creation form (full name + CPF) for new users | Simple form, shown when GET /account returns 404 |
| Profile Page | Displays account data in card rows (Google Personal Info style) | Read-only cards, each row clickable to open modal |
| Edit Modals | Per-field editing: name, birthdate, phone | Controlled modals with form validation, PATCH on submit |
| Photo Upload | Crop (3:4 ratio) and upload profile photo | File input + cropper library + PUT to upload endpoint |
| API Client | Centralized HTTP client with auth token injection | Axios instance with request interceptor for Bearer token |
| Account hooks | Server state: fetch, update, cache invalidation | TanStack Query `useQuery` / `useMutation` wrappers |

## Recommended Project Structure

```
frontend/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx                 # ReactDOM.createRoot, providers
    ├── App.tsx                  # Router setup
    ├── api/                     # API service layer
    │   ├── client.ts            # Axios instance + auth interceptor
    │   ├── account.ts           # Account endpoint functions
    │   └── photo.ts             # Photo upload endpoint
    ├── auth/                    # Auth0 integration
    │   ├── AuthProvider.tsx     # Auth0Provider config wrapper
    │   ├── ProtectedRoute.tsx   # Route guard (withAuthenticationRequired)
    │   └── useAuthToken.ts      # Hook to get access token for API calls
    ├── hooks/                   # Custom hooks (data layer)
    │   ├── useAccount.ts        # useQuery for GET /account
    │   ├── useUpdateAccount.ts  # useMutation for PATCH /account
    │   ├── useCreateAccount.ts  # useMutation for POST /account
    │   └── useUploadPhoto.ts    # useMutation for PUT /account/photo
    ├── components/              # Shared/reusable UI components
    │   ├── ui/                  # Primitives: Button, Input, Modal, Card
    │   ├── layout/              # Shell, Header, Container
    │   └── PhotoCropper.tsx     # 3:4 crop component
    ├── pages/                   # Route-level components
    │   ├── ProfilePage.tsx      # Main profile view
    │   ├── OnboardingPage.tsx   # Account creation
    │   └── CallbackPage.tsx     # Auth0 redirect handler
    ├── modals/                  # Edit modals (one per field)
    │   ├── EditNameModal.tsx
    │   ├── EditBirthdateModal.tsx
    │   ├── EditPhoneModal.tsx
    │   └── EditPhotoModal.tsx
    ├── types/                   # TypeScript interfaces
    │   └── account.ts           # Account, CreateAccountDto, etc.
    ├── utils/                   # Helpers
    │   ├── formatters.ts        # CPF mask, phone mask, date format
    │   └── validators.ts        # Form validation rules
    └── styles/                  # Global styles / theme
        ├── globals.css
        └── theme.ts             # Dark mode tokens / CSS variables
```

### Structure Rationale

- **api/:** Isolates all HTTP communication. Components never call Axios directly. Changing the backend contract means editing only this folder.
- **auth/:** Auth0 is a cross-cutting concern. Isolating it means swapping auth providers later touches one folder.
- **hooks/:** Each hook wraps one TanStack Query operation. This is the "server state" layer -- components consume hooks, not API functions directly.
- **pages/ vs modals/:** Modals are separated from pages because they are reused/triggered from profile cards, not from routes. This matches the Google Personal Info interaction pattern where the page stays loaded and modals overlay.
- **components/ui/:** Small, composable primitives. Keeps pages/modals lean by extracting shared visual elements.
- **types/:** Shared TypeScript types that match the backend DTOs. Single source of truth for the Account shape.

## Architectural Patterns

### Pattern 1: API Client with Auth Token Interceptor

**What:** A single Axios instance configured with the backend base URL and a request interceptor that attaches the Auth0 Bearer token to every request.
**When to use:** Always -- every API call needs authentication.
**Trade-offs:** Centralizes auth header logic (good), but requires passing `getAccessTokenSilently` from Auth0 SDK into the Axios layer (slight coupling).

**Example:**
```typescript
// api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Token getter is set once during app initialization
let tokenGetter: (() => Promise<string>) | null = null;

export function setTokenGetter(getter: () => Promise<string>) {
  tokenGetter = getter;
}

apiClient.interceptors.request.use(async (config) => {
  if (tokenGetter) {
    const token = await tokenGetter();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

### Pattern 2: TanStack Query as Server State Layer

**What:** All server data (account info) is managed exclusively through TanStack Query. No local state duplication of server data.
**When to use:** For all data that comes from the API -- the account object, photo URL, etc.
**Trade-offs:** Eliminates manual loading/error/caching logic (large win). Adds a dependency. For this app size, the benefit far outweighs the cost.

**Example:**
```typescript
// hooks/useAccount.ts
import { useQuery } from '@tanstack/react-query';
import { getAccount } from '../api/account';

export function useAccount() {
  return useQuery({
    queryKey: ['account'],
    queryFn: getAccount,
    retry: false, // Don't retry 404 -- means account doesn't exist yet
  });
}

// hooks/useUpdateAccount.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateAccount } from '../api/account';

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account'] });
    },
  });
}
```

### Pattern 3: Route-Level Auth Guard with Onboarding Redirect

**What:** Two layers of protection: (1) Auth0's `withAuthenticationRequired` ensures login, (2) app-level check redirects to onboarding if no account exists.
**When to use:** This app has a flow where a user can be authenticated (via Auth0) but not yet have an Account record in the backend.
**Trade-offs:** Requires careful handling of the 404 response from GET /account to distinguish "no account yet" from actual errors.

**Example:**
```typescript
// App.tsx routing structure
<Routes>
  <Route element={<ProtectedRoute />}>
    <Route element={<AccountGuard />}>
      <Route path="/" element={<ProfilePage />} />
    </Route>
    <Route path="/onboarding" element={<OnboardingPage />} />
  </Route>
  <Route path="/callback" element={<CallbackPage />} />
</Routes>
```

```typescript
// AccountGuard.tsx
function AccountGuard() {
  const { data: account, isLoading, error } = useAccount();

  if (isLoading) return <LoadingSpinner />;
  if (error?.response?.status === 404) return <Navigate to="/onboarding" />;
  if (error) return <ErrorScreen />;

  return <Outlet context={{ account }} />;
}
```

## Data Flow

### Request Flow (Read)

```
User loads Profile Page
    |
    v
ProfilePage renders --> useAccount() hook fires
    |
    v
TanStack Query checks cache
    |-- Cache fresh? --> Return cached data --> Render cards
    |-- Cache stale? --> Background refetch + return stale
    |-- No cache?    --> Call getAccount() in api/account.ts
                              |
                              v
                         apiClient.get('/account/me')
                              |
                              v
                         Axios interceptor attaches Bearer token
                              |
                              v
                         NestJS Backend --> Returns Account JSON
                              |
                              v
                         TanStack Query caches result
                              |
                              v
                         ProfilePage re-renders with data
```

### Mutation Flow (Edit)

```
User clicks card row --> Opens EditNameModal
    |
    v
User edits name, clicks Save
    |
    v
EditNameModal calls updateAccount.mutate({ fullName: "..." })
    |
    v
useUpdateAccount() --> useMutation --> PATCH /account/me
    |
    v
On success: invalidateQueries(['account'])
    |
    v
TanStack Query refetches account data
    |
    v
ProfilePage re-renders with updated name
    |
    v
Modal closes
```

### Auth Flow

```
User visits app
    |
    v
Auth0Provider checks session
    |-- Has session? --> Load app
    |-- No session?  --> Redirect to Auth0 Universal Login
                              |
                              v
                         User authenticates
                              |
                              v
                         Redirect to /callback
                              |
                              v
                         Auth0 SDK processes tokens
                              |
                              v
                         AccountGuard checks GET /account/me
                              |-- 200? --> Show ProfilePage
                              |-- 404? --> Redirect to /onboarding
```

### Key Data Flows

1. **Account Read:** ProfilePage -> useAccount hook -> TanStack Query cache -> API client -> Backend. Data flows down, display is reactive to cache.
2. **Account Edit:** Modal form -> useMutation hook -> API client -> Backend -> cache invalidation -> auto-refetch -> ProfilePage updates.
3. **Photo Upload:** File input -> client-side crop (produces Blob) -> useMutation -> FormData PUT -> Backend (S3) -> cache invalidation -> avatar updates.
4. **Auth Token:** Auth0Provider -> getAccessTokenSilently() -> Axios interceptor -> every API request gets Bearer header automatically.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1 user (dev) | Current architecture is ideal. Single query key, simple cache. |
| 100-1k users | No changes needed. TanStack Query handles caching per-session. Add error boundaries for resilience. |
| Multi-feature expansion | Move to feature-based folder structure. Add Zustand only if cross-feature client state emerges (e.g., notification toasts, UI preferences). |

### Scaling Priorities

1. **First growth point:** Adding more bounded contexts (not just Account). When this happens, introduce feature folders and a shared API client. The current `api/` + `hooks/` pattern already supports this -- just add more files.
2. **Second growth point:** If the app grows beyond account management into a full dashboard, consider code splitting with `React.lazy()` per route and moving to React Router's lazy route loading.

## Anti-Patterns

### Anti-Pattern 1: Duplicating Server State in useState

**What people do:** Fetch account data, copy it into local `useState`, then try to keep both in sync.
**Why it's wrong:** Creates two sources of truth. Stale data bugs. Manual loading/error handling that TanStack Query already solves.
**Do this instead:** Use TanStack Query as the single source of truth for server data. Only use local state for form inputs within modals (transient UI state).

### Anti-Pattern 2: God Component Profile Page

**What people do:** Put all profile display logic, all modal logic, all form validation, all API calls in one massive ProfilePage component.
**Why it's wrong:** Unmaintainable, hard to test, impossible to modify one field without risking others.
**Do this instead:** ProfilePage renders a list of `ProfileCard` rows. Each row opens its own dedicated modal. Each modal uses its own mutation hook. ProfilePage is a thin orchestrator.

### Anti-Pattern 3: Calling Auth0 getAccessTokenSilently in Every Component

**What people do:** Import `useAuth0` in every component that makes API calls and manually attach the token.
**Why it's wrong:** Duplicated auth logic scattered across the app. Easy to forget. Tight coupling.
**Do this instead:** Set up the Axios interceptor once (in AuthProvider or App initialization). Components call API functions that are auth-unaware -- the interceptor handles it.

### Anti-Pattern 4: Not Handling the "No Account" State

**What people do:** Assume authenticated user always has an account record. App crashes on 404.
**Why it's wrong:** In this system, Auth0 authentication and Account creation are separate steps. A user can be logged in but not onboarded.
**Do this instead:** Use an AccountGuard component (see Pattern 3 above) that explicitly handles the 404 case and redirects to onboarding.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Auth0 | `@auth0/auth0-react` Auth0Provider wraps app root | Configure `audience` to match backend API identifier. Use `getAccessTokenSilently()` for tokens -- never `getIdTokenClaims()` for API auth. |
| Backend REST API | Axios instance with base URL from env var | 9 endpoints. Backend already handles RBAC via Auth0 JWT validation. Frontend just sends the token. |
| S3 (via backend) | Multipart form upload through backend proxy endpoint | Frontend never talks to S3 directly. Crop image client-side, send as FormData to backend's upload endpoint. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Pages <-> Modals | Props (open state, onClose callback) or context | Modals receive the current field value as props. Return updated value through mutation success (cache invalidation triggers re-render). |
| Pages <-> Hooks | Direct hook calls | Pages call hooks like `useAccount()`. Hooks encapsulate all TanStack Query config. |
| Hooks <-> API Layer | Function calls | Hooks call API functions (e.g., `getAccount()`). API functions call Axios instance. Clean separation. |
| Auth <-> API Layer | Interceptor pattern | Auth0 token getter is registered once with Axios. API layer is auth-unaware after setup. |

## Build Order (Dependency Chain)

This is the recommended implementation order based on component dependencies:

```
Phase 1: Foundation (no visual features yet)
  ├── Project scaffolding (Vite + React + TS)
  ├── API client (Axios instance + interceptor setup)
  ├── Auth0 integration (Provider, ProtectedRoute, callback)
  └── Types (Account interface matching backend DTOs)

Phase 2: Core Read Path
  ├── useAccount hook (TanStack Query)
  ├── AccountGuard (handles 404 -> onboarding redirect)
  ├── Layout Shell (header, responsive container, dark theme)
  └── ProfilePage (read-only card rows displaying account data)

Phase 3: Write Path
  ├── Onboarding page (create account form)
  ├── Edit modals (name, birthdate, phone) with mutations
  └── Form validation utilities

Phase 4: Photo & Polish
  ├── Photo cropper component (3:4 ratio)
  ├── Photo upload modal + mutation
  ├── Responsive refinements
  └── Error boundaries, loading states, edge cases
```

**Rationale:** Each phase builds on the previous. You cannot build the profile page without the API client and auth. You cannot build edit modals without the profile page to trigger them. Photo upload is the most complex feature and has no downstream dependencies, so it goes last.

## Sources

- [Auth0 React SDK Documentation](https://auth0.com/docs/libraries/auth0-react)
- [Auth0 React SPA Examples](https://github.com/auth0/auth0-react/blob/main/EXAMPLES.md)
- [TanStack Query Official Docs](https://tanstack.com/query/latest)
- [TanStack Query Layered Architecture Discussion](https://github.com/TanStack/query/discussions/8547)
- [Bulletproof React Project Structure](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md)
- [React Folder Structure in 5 Steps (Robin Wieruch)](https://www.robinwieruch.de/react-folder-structure/)
- [React State Management in 2025](https://dev.to/hijazi313/state-management-in-2025-when-to-use-context-redux-zustand-or-jotai-2d2k)
- [React Architecture Patterns 2025](https://www.geeksforgeeks.org/reactjs/react-architecture-pattern-and-best-practices/)

---
*Architecture research for: React SPA Account Management Frontend*
*Researched: 2026-03-11*
