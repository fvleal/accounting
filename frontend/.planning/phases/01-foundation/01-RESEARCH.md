# Phase 1: Foundation - Research

**Researched:** 2026-03-11
**Domain:** Auth0 SPA authentication, MUI + Tailwind CSS dark theme, Axios API client, React Router
**Confidence:** HIGH

## Summary

Phase 1 establishes the application shell for a greenfield React + Vite SPA. The core deliverables are: Auth0 redirect-based login/logout with refresh token rotation, an Axios HTTP client with token injection via interceptors, a dark-only MUI theme integrated with Tailwind CSS v4 via CSS layers, and a responsive header + content layout. The project has no existing code -- everything must be scaffolded from scratch.

The critical integration challenge is MUI v7 + Tailwind CSS v4. MUI v7 introduced `enableCssLayer` on `StyledEngineProvider`, which wraps MUI styles in a `@layer mui` block. Combined with Tailwind v4's native layer support, this prevents specificity conflicts without `!important`. The user explicitly chose MUI as the primary framework (overriding the initial research recommendation of Headless UI), so all structural components (AppBar, Container, Avatar, Menu, etc.) come from MUI.

**Primary recommendation:** Scaffold with Vite, install MUI v7 + Tailwind v4, configure Auth0 with `useRefreshTokens: true` and `cacheLocation: 'localstorage'`, verify JWT token contents before writing any API integration code.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Header + content layout (no sidebar) -- matches Google Personal Info reference
- Header contains: app logo/name on the left, user avatar menu (dropdown with profile info + logout) on the right
- Content area centered with max-width (~600-800px), single column
- MUI handles all structural layout and components; Tailwind used only for light customizations and adjustments
- MUI breakpoints (xs/sm/md/lg/xl) as the responsive strategy, synced to Tailwind via theme config
- Redirect flow (not popup) -- most secure, no popup blocker issues
- Full-screen spinner on dark background while Auth0 SDK initializes / processes redirect
- After successful login, user lands on the profile page (onboarding guard added in Phase 2)
- Custom branded landing page with app name and "Login" button for unauthenticated users (not auto-redirect)
- Axios as HTTP client with interceptors for Auth0 token injection
- React Query (TanStack Query) for server state management
- Global Axios interceptor catches errors and shows toast notifications; 401 triggers re-auth; individual queries can override
- API base URL via VITE_API_URL env variable, defaults to localhost:3000 in development
- MUI createTheme as the single source of truth for design tokens (colors, typography, spacing)
- Key values synced to Tailwind config via CSS variables
- Neutral dark palette: dark grays (#121212, #1e1e1e) with white/light gray text
- Accent/primary color: MUI default blue (#1976d2)
- Dark-only for v1 (no toggle) -- theme built with CSS variables so light mode toggle is easy to add in v2

### Claude's Discretion
- Toast notification library choice (e.g., notistack, react-hot-toast, or MUI Snackbar)
- Exact spacing, typography scale, and component sizing
- Folder structure and file organization conventions
- Router setup (react-router-dom configuration)
- ESLint / Prettier / TypeScript config details

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can log in via Auth0 redirect flow and access protected pages | Auth0Provider config with `useRefreshTokens`, `cacheLocation`, `audience`; `withAuthenticationRequired` HOC for route protection; `onRedirectCallback` for post-login navigation |
| AUTH-02 | User can log out from any page and is redirected to login | `useAuth0().logout()` with `returnTo` pointing to origin; clear Auth0 session and local storage |
| LAYO-01 | Layout is responsive and usable on both mobile and desktop devices | MUI breakpoints (xs/sm/md/lg/xl), Container with maxWidth, AppBar with responsive menu |
| LAYO-02 | App uses dark mode as the default theme with MUI theming | MUI v7 createTheme with `colorSchemes: { dark: true }` and `cssVariables: true`; CssBaseline for global reset |
| LAYO-03 | UI uses MUI component library with Tailwind CSS for custom styling | MUI v7 CSS layers via `StyledEngineProvider enableCssLayer` + Tailwind v4 `@layer` ordering |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.x | UI framework | Project constraint. Current stable. |
| Vite | 7.x | Build tool & dev server | Project constraint. Fastest DX with HMR. |
| TypeScript | 5.7+ | Type safety | Non-negotiable for production React apps. |
| @mui/material | 7.x | UI component library | User decision. Primary UI framework for all structural components. |
| @emotion/react + @emotion/styled | 11.x | MUI styling engine | Required peer dependency for MUI v7. |
| tailwindcss + @tailwindcss/vite | 4.x | Utility CSS | User decision. Supplementary styling for fine-tuning. |
| react-router | 7.x | Client-side routing | Standard for React SPAs. Minimal routing needs (login, callback, home). |

### Auth & API
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @auth0/auth0-react | 2.x | Auth0 integration | Official React SDK. Provides Auth0Provider, useAuth0 hook, withAuthenticationRequired HOC. |
| axios | 1.x | HTTP client | User decision (overrides ky recommendation). Request/response interceptors for token injection and error handling. |
| @tanstack/react-query | 5.x | Server state management | User decision. Caching, background refetch, loading/error states. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| notistack | 3.x | Toast notifications | Recommended: built specifically for MUI, uses MUI Snackbar under the hood, supports stacking. Best integration with MUI theme. |
| @tanstack/react-query-devtools | 5.x | Query debugging | Development only. Inspect cache state, trigger refetches. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| notistack | sonner | Sonner is lighter and simpler, but does not inherit MUI theme. Since MUI is primary, notistack integrates more naturally. |
| notistack | MUI Snackbar (native) | Native Snackbar cannot stack multiple notifications without manual state management. Notistack solves this. |
| Axios | ky | ky is smaller, but user explicitly chose Axios for interceptor pattern familiarity. |

**Installation:**
```bash
# Scaffold
npm create vite@latest . -- --template react-ts

# MUI
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material

# Tailwind CSS v4
npm install tailwindcss @tailwindcss/vite

# Auth
npm install @auth0/auth0-react

# API & Server State
npm install axios @tanstack/react-query

# Routing
npm install react-router

# Toast
npm install notistack

# Dev tools
npm install -D @tanstack/react-query-devtools
```

## Architecture Patterns

### Recommended Project Structure
```
frontend/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── package.json
├── .env.local                  # VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID, VITE_AUTH0_AUDIENCE, VITE_API_URL
├── .env.example                # Template with placeholder values
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx                 # ReactDOM.createRoot, providers stack
    ├── App.tsx                  # Router setup (BrowserRouter + Routes)
    ├── index.css                # Tailwind imports + CSS layer order
    ├── theme.ts                 # MUI createTheme (dark-only, CSS variables)
    ├── api/
    │   └── client.ts            # Axios instance + auth interceptor + error interceptor
    ├── auth/
    │   ├── AuthProviderWithNavigate.tsx  # Auth0Provider wrapper that uses react-router navigate
    │   └── ProtectedRoute.tsx           # withAuthenticationRequired wrapper component
    ├── hooks/
    │   └── (empty for Phase 1 -- hooks added in Phase 2+)
    ├── components/
    │   ├── layout/
    │   │   ├── AppLayout.tsx    # Header + Outlet + responsive container
    │   │   └── Header.tsx       # AppBar with logo, avatar menu, logout
    │   └── ui/
    │       └── LoadingScreen.tsx # Full-screen spinner for auth loading
    ├── pages/
    │   ├── LoginPage.tsx        # Branded landing page with Login button
    │   └── HomePage.tsx         # Placeholder authenticated page (profile in Phase 3)
    └── types/
        └── account.ts           # Account interface (prepared for Phase 2)
```

### Pattern 1: Provider Stack in main.tsx
**What:** All providers (StyledEngine, Theme, Auth0, QueryClient, Router, Notistack) are composed at the root.
**When to use:** Always -- this is the app entry point.

```typescript
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { StyledEngineProvider, ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import { BrowserRouter } from 'react-router';
import { theme } from './theme';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StyledEngineProvider enableCssLayer>
      <ThemeProvider theme={theme} defaultMode="dark">
        <CssBaseline />
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <SnackbarProvider maxSnack={3} autoHideDuration={4000}>
              <App />
            </SnackbarProvider>
          </QueryClientProvider>
        </BrowserRouter>
      </ThemeProvider>
    </StyledEngineProvider>
  </React.StrictMode>
);
```

### Pattern 2: Auth0Provider with React Router Navigate
**What:** Auth0Provider wraps routes but needs access to `useNavigate`, so it must be a child of BrowserRouter.
**When to use:** Always -- Auth0Provider must be inside the router for `onRedirectCallback` to use `navigate()`.

```typescript
// src/auth/AuthProviderWithNavigate.tsx
import { Auth0Provider } from '@auth0/auth0-react';
import { useNavigate } from 'react-router';

export function AuthProviderWithNavigate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        scope: 'openid profile email',
      }}
      useRefreshTokens={true}
      cacheLocation="localstorage"
      onRedirectCallback={(appState) => {
        navigate(appState?.returnTo || '/', { replace: true });
      }}
    >
      {children}
    </Auth0Provider>
  );
}
```

### Pattern 3: MUI Dark Theme with CSS Variables
**What:** Single dark theme using MUI v7's `colorSchemes` and `cssVariables` for token export to Tailwind.
**When to use:** Always -- dark-only for v1.

```typescript
// src/theme.ts
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  cssVariables: true,
  colorSchemes: {
    dark: true,  // enables dark color scheme
  },
  palette: {
    mode: 'dark',
    primary: {
      main: '#1976d2',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});
```

### Pattern 4: Axios Instance with Token Interceptor
**What:** Centralized Axios instance that injects Auth0 tokens and handles errors globally.
**When to use:** For all API calls. Components never create Axios instances.

```typescript
// src/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

// Token getter set during Auth0 initialization
let getAccessToken: (() => Promise<string>) | null = null;

export function setTokenGetter(getter: () => Promise<string>) {
  getAccessToken = getter;
}

// Request interceptor: attach Bearer token
apiClient.interceptors.request.use(async (config) => {
  if (getAccessToken) {
    try {
      const token = await getAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // Token fetch failed -- request proceeds without auth header
      // Auth0 SDK will trigger re-login if needed
    }
  }
  return config;
});

// Response interceptor: global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid -- trigger re-auth
      // This will be handled by calling logout or redirecting to login
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### Pattern 5: CSS Layer Order for MUI + Tailwind v4
**What:** CSS `@layer` declaration ensures MUI and Tailwind styles cascade correctly.
**When to use:** Always -- this prevents specificity battles.

```css
/* src/index.css */
@layer theme, mui, components, utilities;

@import "tailwindcss";
```

The `StyledEngineProvider enableCssLayer` wraps all MUI styles in `@layer mui`. Tailwind v4 automatically uses `@layer utilities` for its utility classes. This means Tailwind utility classes can override MUI defaults when needed, without `!important`.

### Anti-Patterns to Avoid
- **Calling `useAuth0()` in API layer:** Do not import `useAuth0` in `api/client.ts`. It is a React hook and cannot be called outside components. Instead, pass the token getter function during initialization.
- **Duplicating Auth0Provider:** Never wrap individual routes in Auth0Provider. It goes at the app root, once.
- **Manual token storage:** Never store tokens in your own state/localStorage. The Auth0 SDK manages this with `cacheLocation: 'localstorage'`.
- **Mixing MUI's sx prop with Tailwind classes on the same property:** If a component uses `sx={{ backgroundColor: '...' }}`, do not also add `className="bg-..."`. Choose one system per CSS property to avoid confusion.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth token refresh | Manual token refresh logic with timers | Auth0 SDK `useRefreshTokens: true` | Token rotation, expiry detection, silent refresh -- all handled by the SDK |
| Toast notification stacking | Custom portal + animation + queue | notistack `SnackbarProvider` + `enqueueSnackbar()` | Handles stacking, auto-dismiss, MUI theme integration |
| Dark mode CSS variables | Manual CSS variable generation from theme | MUI `cssVariables: true` in createTheme | Automatically generates `--mui-palette-*` variables accessible to Tailwind |
| Route protection | Custom `if (!authenticated) redirect` logic | `withAuthenticationRequired` HOC from Auth0 SDK | Handles loading states, redirect preservation, and edge cases |
| Responsive breakpoints | Manual media queries or custom breakpoint system | MUI breakpoints + `useMediaQuery` hook | Consistent across MUI components and custom code |

**Key insight:** This phase is almost entirely plumbing and configuration. Every major concern (auth, theming, HTTP client, routing) has a well-supported library solution. The risk is in misconfiguration, not in missing features.

## Common Pitfalls

### Pitfall 1: Missing `audience` Yields Opaque Access Tokens
**What goes wrong:** Without the `audience` parameter in Auth0Provider, `getAccessTokenSilently()` returns an opaque token (not a JWT). The NestJS backend cannot validate it, returning 401 on every request.
**Why it happens:** Auth0 returns opaque tokens when no audience is specified. Developers see `isAuthenticated: true` and assume the token works.
**How to avoid:** Always set `audience` in Auth0Provider's `authorizationParams` to match the API Identifier in Auth0 Dashboard. Verify the token is a JWT (starts with `eyJ`) at jwt.io before writing API code.
**Warning signs:** Short random string as access token instead of long JWT; backend returns 401 despite frontend showing authenticated.

### Pitfall 2: Third-Party Cookie Blocking Breaks Silent Auth
**What goes wrong:** Safari, Brave, and Firefox block third-party cookies. Auth0's default iframe-based silent auth fails, causing users to lose sessions on page refresh.
**Why it happens:** The default Auth0 SPA SDK uses hidden iframes for silent authentication, which depend on third-party cookies.
**How to avoid:** Configure `useRefreshTokens: true` and `cacheLocation: 'localstorage'` in Auth0Provider. Enable Refresh Token Rotation in Auth0 Dashboard (API Settings > Refresh Token Rotation).
**Warning signs:** Login works in Chrome but fails in Safari/Brave; users report "random logouts."

### Pitfall 3: Login Loop in React Strict Mode
**What goes wrong:** After Auth0 redirects back with `code` and `state` query params, React strict mode double-renders, causing the SDK to try exchanging the auth code twice. Second attempt fails, creating an infinite login loop.
**Why it happens:** React 18+ strict mode renders components twice in development.
**How to avoid:** Use Auth0Provider's built-in callback handling (do not manually call `handleRedirectCallback`). Set `onRedirectCallback` to navigate and clean the URL. The SDK handles idempotency internally.
**Warning signs:** Rapid URL changes between app and Auth0 login page; console errors about "invalid state."

### Pitfall 4: RBAC Permissions Not in Access Token
**What goes wrong:** Backend enforces permissions (`create:account`, `read:own-account`, etc.) but they are not in the JWT. Backend returns 403 Forbidden.
**Why it happens:** Auth0 does not include permissions in access tokens by default. Must be enabled in Auth0 Dashboard.
**How to avoid:** In Auth0 Dashboard > APIs > Your API > Settings: Enable "RBAC" and "Add Permissions in the Access Token." Decode a fresh token at jwt.io to verify.
**Warning signs:** 403 errors despite user having roles assigned in Auth0.

### Pitfall 5: MUI + Tailwind Specificity Conflicts
**What goes wrong:** Tailwind utility classes fail to override MUI defaults, or MUI styles unexpectedly override Tailwind utilities.
**Why it happens:** Without CSS layers, both frameworks compete at the same specificity level. Source order determines the winner, which is unpredictable.
**How to avoid:** Use `StyledEngineProvider enableCssLayer` (MUI v7) + Tailwind v4 `@layer` declaration. This gives each framework its own cascade layer with predictable priority.
**Warning signs:** `className="mt-4"` has no effect on MUI components; or MUI button colors look wrong after adding Tailwind.

### Pitfall 6: Auth0Provider Outside Router
**What goes wrong:** `onRedirectCallback` needs `useNavigate()` from React Router, but Auth0Provider is rendered above BrowserRouter in the component tree.
**Why it happens:** Common mistake to put Auth0Provider at the very top of main.tsx, above the router.
**How to avoid:** Create an `AuthProviderWithNavigate` wrapper component that is a child of BrowserRouter. This wrapper calls `useNavigate()` and passes it to `onRedirectCallback`.
**Warning signs:** `useNavigate() may be used only in the context of a <Router>` error.

## Code Examples

### MUI + Tailwind v4 CSS Setup
```css
/* src/index.css */
@layer theme, mui, components, utilities;

@import "tailwindcss";
```

### Vite Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
});
```

### Protected Route Component
```typescript
// src/auth/ProtectedRoute.tsx
import { withAuthenticationRequired } from '@auth0/auth0-react';
import { ComponentType } from 'react';
import { LoadingScreen } from '../components/ui/LoadingScreen';

interface Props {
  component: ComponentType;
}

export function ProtectedRoute({ component }: Props) {
  const Component = withAuthenticationRequired(component, {
    onRedirecting: () => <LoadingScreen />,
  });
  return <Component />;
}
```

### Header with Avatar Menu
```typescript
// Conceptual -- MUI AppBar + IconButton + Avatar + Menu
// Uses: AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem
// Avatar shows user picture from Auth0 (useAuth0().user.picture)
// Menu contains: user name, user email, Divider, Logout MenuItem
```

### Token Getter Initialization
```typescript
// Inside AuthProviderWithNavigate or a useEffect in App:
import { useAuth0 } from '@auth0/auth0-react';
import { setTokenGetter } from '../api/client';

// In a component that has access to useAuth0:
const { getAccessTokenSilently } = useAuth0();
useEffect(() => {
  setTokenGetter(getAccessTokenSilently);
}, [getAccessTokenSilently]);
```

### Environment Variables
```bash
# .env.local
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=https://your-api-identifier
VITE_API_URL=http://localhost:3000
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| MUI v5 `styled()` with no layers | MUI v7 `StyledEngineProvider enableCssLayer` | MUI v7 (2025-2026) | Eliminates specificity conflicts with Tailwind v4 |
| Tailwind v3 `tailwind.config.js` | Tailwind v4 `@tailwindcss/vite` plugin, no config file | Tailwind v4 (2025) | Automatic content detection, smaller bundle, CSS-first config |
| Auth0 iframe silent auth | Refresh token rotation (`useRefreshTokens: true`) | Auth0 SDK 2.x (2023+) | Required for Safari/Brave/Firefox support |
| MUI `palette.mode: 'dark'` | MUI `colorSchemes: { dark: true }` + `cssVariables: true` | MUI v6+ | CSS variables generated automatically, SSR-safe |
| react-router-dom v6 `<Routes>` | react-router v7 (package renamed from react-router-dom) | React Router v7 (2025) | Import from `react-router` instead of `react-router-dom` |

## Discretion Recommendations

### Toast Library: notistack
**Recommendation:** Use notistack v3.
**Rationale:** Since MUI is the primary UI framework, notistack provides the tightest integration -- it renders MUI Snackbar components under the hood, automatically inherits the dark theme, and supports stacking multiple notifications. Sonner is excellent but would introduce a visual inconsistency (its toasts look different from MUI components). MUI's native Snackbar cannot stack without manual state management.

### Router Setup: react-router v7 with createBrowserRouter
**Recommendation:** Use `<BrowserRouter>` + `<Routes>` declarative pattern (not `createBrowserRouter` data router).
**Rationale:** This app has 3-4 routes and no loaders/actions needed. The declarative JSX pattern is simpler and works naturally with Auth0Provider wrapping. Data router features (loaders, actions, deferred data) are unnecessary for this use case.

### Folder Structure: Feature-light, layer-based
**Recommendation:** Use the structure documented in the Architecture Patterns section above.
**Rationale:** With only 3-4 routes and no complex features in Phase 1, a flat layer-based structure (`api/`, `auth/`, `components/`, `pages/`) is clearer than feature folders. Feature folders can be introduced in later phases if complexity grows.

### ESLint / Prettier / TypeScript
**Recommendation:** Use Vite's default tsconfig, add ESLint 9 flat config with `@typescript-eslint` and `eslint-plugin-react-hooks`, add Prettier with `prettier-plugin-tailwindcss` for class sorting.
**Rationale:** Standard community setup. Tailwind class sorting via Prettier prevents inconsistent ordering.

## Open Questions

1. **Auth0 Dashboard Configuration**
   - What we know: The backend uses Auth0 with RBAC and specific permissions (`create:account`, `read:own-account`, etc.)
   - What's unclear: Whether Refresh Token Rotation is already enabled in the Auth0 tenant, and whether "Add Permissions in the Access Token" is toggled on
   - Recommendation: Verify these settings in Auth0 Dashboard before starting implementation. This is a blocker -- if not enabled, tokens will be wrong.

2. **Auth0 Application Registration**
   - What we know: The backend has an Auth0 API configured
   - What's unclear: Whether an Auth0 "Single Page Application" type application has been created for the frontend (separate from any backend application)
   - Recommendation: Verify or create the SPA application in Auth0 Dashboard. The frontend needs its own Client ID with "Single Page Application" type and allowed callback/logout URLs configured.

3. **Notistack v3 Maintenance Status**
   - What we know: MUI docs had an issue raised about notistack's maintenance (GitHub issue #42615)
   - What's unclear: Current maintenance status as of 2026
   - Recommendation: Use notistack for now since MUI integration is the priority. If it proves problematic, MUI's native Snackbar with a small custom hook is a fallback.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x (Vite-native, no extra config) |
| Config file | `vitest.config.ts` or inline in `vite.config.ts` -- Wave 0 |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Auth0 redirect login flow works end-to-end | manual-only | N/A -- requires browser interaction with Auth0 | N/A |
| AUTH-02 | Logout clears session and redirects to login | manual-only | N/A -- requires browser interaction | N/A |
| LAYO-01 | Layout responsive on mobile and desktop | manual-only | N/A -- visual verification | N/A |
| LAYO-02 | Dark mode renders correctly | unit | `npx vitest run src/__tests__/theme.test.ts` | Wave 0 |
| LAYO-03 | MUI + Tailwind integration without conflicts | unit | `npx vitest run src/__tests__/theme.test.ts` | Wave 0 |

**Note:** AUTH-01 and AUTH-02 are inherently manual -- they involve Auth0 Universal Login redirect, browser cookie handling, and visual verification of JWT contents. Automated E2E tests (Cypress/Playwright) are a Phase 1 luxury, not a requirement. The success criteria explicitly mention manual verification (jwt.io, Safari/Brave testing).

### Sampling Rate
- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Manual auth flow verification + visual dark mode check + Vitest green

### Wave 0 Gaps
- [ ] `vitest` -- install as dev dependency: `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`
- [ ] `vite.config.ts` -- add `test: { environment: 'jsdom' }` to Vite config
- [ ] `src/__tests__/theme.test.ts` -- verify theme creates dark palette correctly
- [ ] `src/__tests__/api-client.test.ts` -- verify Axios interceptor attaches token header

## Sources

### Primary (HIGH confidence)
- [MUI Tailwind CSS v4 Integration](https://mui.com/material-ui/integrations/tailwindcss/tailwindcss-v4/) -- CSS layer setup
- [MUI CSS Layers Documentation](https://next.mui.com/material-ui/customization/css-layers/) -- enableCssLayer prop
- [MUI v7 Blog Post](https://mui.com/blog/material-ui-v7-is-here/) -- CSS layers as headline feature
- [MUI Dark Mode Documentation](https://mui.com/material-ui/customization/dark-mode/) -- colorSchemes and cssVariables config
- [MUI v7 Migration Guide](https://mui.com/material-ui/migration/upgrade-to-v7/) -- breaking changes from v6
- [Auth0 React SDK Examples](https://github.com/auth0/auth0-react/blob/main/EXAMPLES.md) -- Auth0Provider config, withAuthenticationRequired, getAccessTokenSilently
- [Auth0 React SDK API Reference](https://auth0.github.io/auth0-react/interfaces/Auth0ProviderOptions.html) -- Auth0ProviderOptions interface
- [@mui/material npm](https://www.npmjs.com/package/@mui/material) -- v7.3.9 confirmed as latest

### Secondary (MEDIUM confidence)
- [StyledEngineProvider enableCssLayer PR](https://github.com/mui/material-ui/pull/45428) -- implementation details for CSS layer support
- [MUI CSS Theme Variables Configuration](https://mui.com/material-ui/customization/css-theme-variables/configuration/) -- cssVariables: true setup
- [Auth0 Community: Login lost on refresh](https://community.auth0.com/t/react-with-auth0-spa-looses-login-after-refresh/35461) -- refresh token rotation necessity
- [Notistack maintenance concern](https://github.com/mui/material-ui/issues/42615) -- MUI docs issue about notistack maintenance
- [React Router v7 Auth Guide (LogRocket)](https://blog.logrocket.com/authentication-react-router-v7/) -- protected routes with createBrowserRouter

### Tertiary (LOW confidence)
- [MUI + Tailwind dark mode blog (ThemeWagon)](https://themewagon.com/blog/dark-mode-ui-in-tailwind-css-and-mui/) -- community guide, patterns verified against official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries verified on npm with current versions, MUI v7 + Tailwind v4 integration documented by MUI
- Architecture: HIGH -- patterns follow official Auth0 and MUI documentation, verified with multiple sources
- Pitfalls: HIGH -- Auth0 pitfalls extensively documented in community forums and GitHub issues; MUI + Tailwind layer conflicts documented in MUI migration guide

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable stack, no fast-moving dependencies)
