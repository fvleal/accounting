---
phase: 01-foundation
plan: 01
subsystem: ui
tags: [vite, react, typescript, mui, tailwind, vitest, dark-theme, css-layers]

# Dependency graph
requires: []
provides:
  - "Vite + React + TypeScript project scaffold"
  - "MUI v7 dark theme with CSS variables"
  - "Tailwind CSS v4 with CSS layer ordering for MUI coexistence"
  - "Provider stack (StyledEngine, Theme, CssBaseline, BrowserRouter, QueryClient, Snackbar)"
  - "Vitest with jsdom environment and theme tests"
  - "Environment variable templates for Auth0 and API"
affects: [01-02, 02-onboarding, 03-profile-display]

# Tech tracking
tech-stack:
  added: [vite, react, typescript, "@mui/material", "@emotion/react", "@emotion/styled", "@mui/icons-material", tailwindcss, "@tailwindcss/vite", "@auth0/auth0-react", axios, "@tanstack/react-query", react-router, notistack, vitest, "@testing-library/react", "@testing-library/jest-dom", jsdom]
  patterns: [css-layer-ordering, styled-engine-css-layer, mui-dark-theme-css-variables, provider-stack-composition]

key-files:
  created: [vite.config.ts, src/theme.ts, src/index.css, src/main.tsx, src/App.tsx, "src/__tests__/theme.test.ts", ".env.example", tsconfig.json, tsconfig.app.json, tsconfig.node.json]
  modified: []

key-decisions:
  - "CSS layer order: theme, mui, components, utilities — ensures Tailwind utilities override MUI defaults"
  - "StyledEngineProvider enableCssLayer wraps MUI in @layer mui for clean specificity"
  - "React Query staleTime 5min with retry 1 as default query options"
  - "Notistack for toast notifications (maxSnack 3, autoHide 4s)"

patterns-established:
  - "CSS layers: @layer theme, mui, components, utilities — all future CSS must respect this order"
  - "Provider stack order: StyledEngineProvider > ThemeProvider > CssBaseline > BrowserRouter > QueryClientProvider > SnackbarProvider"
  - "Theme as single source of truth for design tokens via src/theme.ts"
  - "Vitest with jsdom for unit testing"

requirements-completed: [LAYO-02, LAYO-03]

# Metrics
duration: 4min
completed: 2026-03-11
---

# Phase 1 Plan 01: Scaffold & Theme Summary

**Vite React-TS scaffold with MUI v7 dark theme (#121212/#1e1e1e), Tailwind CSS v4 via CSS layer ordering, and Vitest with 5 passing theme tests**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-11T22:59:22Z
- **Completed:** 2026-03-11T23:03:41Z
- **Tasks:** 3
- **Files modified:** 15

## Accomplishments
- Vite + React + TypeScript project scaffolded with all Phase 1 dependencies (MUI, Tailwind, Auth0, React Query, React Router, notistack)
- MUI v7 dark theme configured with CSS variables and correct color palette
- CSS layer ordering (theme, mui, components, utilities) prevents MUI/Tailwind specificity conflicts
- Full provider stack assembled in main.tsx with StyledEngineProvider enableCssLayer
- Vitest configured with jsdom environment; 5 theme unit tests passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Vite project and install all dependencies** - `2d442ac` (feat)
2. **Task 2: Configure MUI dark theme, CSS layers, and provider stack** - `666d2b9` (feat)
3. **Task 3: Create Vitest theme and integration tests** - `c234f60` (test)

## Files Created/Modified
- `vite.config.ts` - Vite config with React, Tailwind plugin, and Vitest settings
- `src/theme.ts` - MUI dark theme with CSS variables, dark colorScheme, custom palette
- `src/index.css` - CSS layer declarations and Tailwind import
- `src/main.tsx` - Provider stack with StyledEngineProvider, ThemeProvider, BrowserRouter, QueryClient, SnackbarProvider
- `src/App.tsx` - Minimal placeholder with MUI Typography + Tailwind classes
- `src/__tests__/theme.test.ts` - 5 unit tests for theme palette and configuration
- `.env.example` - Auth0 and API URL placeholder environment variables
- `package.json` - All Phase 1 dependencies
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` - TypeScript configuration
- `index.html` - Vite entry HTML
- `.gitignore` - Frontend-specific ignores

## Decisions Made
- CSS layer order `theme, mui, components, utilities` ensures Tailwind utilities can override MUI defaults without `!important`
- StyledEngineProvider with `enableCssLayer` wraps all MUI styles in `@layer mui`
- React Query defaults: 5-minute staleTime, 1 retry — balances freshness with reduced API calls
- Notistack chosen for toast notifications (plan specified, matches MUI ecosystem)
- Changed cssVariables test to check colorSchemes.dark instead — MUI consumes cssVariables config internally without exposing it on the theme object

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed cssVariables test assertion**
- **Found during:** Task 3 (Theme tests)
- **Issue:** `theme.cssVariables` is undefined — MUI consumes the config option during createTheme but does not expose it as a property on the resulting theme object
- **Fix:** Changed test to verify `theme.colorSchemes.dark` is defined, which is the observable effect of cssVariables + colorSchemes configuration
- **Files modified:** `src/__tests__/theme.test.ts`
- **Verification:** All 5 tests pass
- **Committed in:** `c234f60` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor test assertion fix. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required for this plan. Auth0 configuration will be needed in Plan 02.

## Next Phase Readiness
- Project scaffold complete, dev server builds successfully
- Theme and CSS layer infrastructure ready for all future MUI + Tailwind components
- Provider stack ready for Auth0Provider addition in Plan 02
- Vitest configured and working for future test files

## Self-Check: PASSED

- All 9 key files verified present on disk
- All 3 task commits verified in git log (2d442ac, 666d2b9, c234f60)
- Build succeeds, all 5 tests pass

---
*Phase: 01-foundation*
*Completed: 2026-03-11*
