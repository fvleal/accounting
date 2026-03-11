# Phase 1: Foundation - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Project scaffold with Auth0 login/logout, MUI + Tailwind dark theme, responsive layout shell, and API client with token injection. The app shell runs end-to-end: unauthenticated users see a login page, authenticated users land on the profile page (empty for now).

</domain>

<decisions>
## Implementation Decisions

### Layout shell
- Header + content layout (no sidebar) — matches Google Personal Info reference
- Header contains: app logo/name on the left, user avatar menu (dropdown with profile info + logout) on the right
- Content area centered with max-width (~600-800px), single column
- MUI handles all structural layout and components; Tailwind used only for light customizations and adjustments
- MUI breakpoints (xs/sm/md/lg/xl) as the responsive strategy, synced to Tailwind via theme config

### Auth0 flow
- Redirect flow (not popup) — most secure, no popup blocker issues
- Full-screen spinner on dark background while Auth0 SDK initializes / processes redirect
- After successful login, user lands on the profile page (onboarding guard added in Phase 2)
- Custom branded landing page with app name and "Login" button for unauthenticated users (not auto-redirect)

### API client
- Axios as HTTP client with interceptors for Auth0 token injection
- React Query (TanStack Query) for server state management — caching, refetch on focus, optimistic updates
- Global Axios interceptor catches errors and shows toast notifications; 401 triggers re-auth; individual queries can override
- API base URL via VITE_API_URL env variable, defaults to localhost:3000 in development

### Dark theme
- MUI createTheme as the single source of truth for design tokens (colors, typography, spacing)
- Key values synced to Tailwind config via CSS variables
- Neutral dark palette: dark grays (#121212, #1e1e1e) with white/light gray text
- Accent/primary color: MUI default blue (#1976d2)
- Dark-only for v1 (no toggle) — theme built with CSS variables so light mode toggle is easy to add in v2 (ENHN-01)

### Claude's Discretion
- Toast notification library choice (e.g., notistack, react-hot-toast, or MUI Snackbar)
- Exact spacing, typography scale, and component sizing
- Folder structure and file organization conventions
- Router setup (react-router-dom configuration)
- ESLint / Prettier / TypeScript config details

</decisions>

<specifics>
## Specific Ideas

- Reference visual: Google Personal Info (https://myaccount.google.com/personal-info) — clean read-only cards, click to edit via modal
- "Vamos deixar tudo para o MUI, questoes mais leves de alteracoes focamos no Tailwind" — MUI is the primary UI framework, Tailwind is supplementary for fine-tuning

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None yet — Phase 1 establishes the foundational patterns for all subsequent phases

### Integration Points
- Backend REST API at localhost:3000 (NestJS, 9 endpoints)
- Auth0 tenant shared with backend (JWT with audience + permissions claims)
- S3 for photo storage (consumed in Phase 5)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-11*
