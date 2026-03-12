---
phase: quick-7
plan: 1
subsystem: layout
tags: [header, logo, env-config]
dependency_graph:
  requires: []
  provides: [header-logo]
  affects: [Header.tsx]
tech_stack:
  added: []
  patterns: [conditional-render-from-env-var]
key_files:
  created: []
  modified:
    - src/components/layout/Header.tsx
    - .env.example
decisions:
  - Logo rendered as MUI Box component="img" for consistent styling
  - Logo placed before title text in Toolbar
  - Variable read at module level (not inside component) since env vars are static
metrics:
  duration: "<1min"
  completed: "2026-03-12"
---

# Quick Task 7: Add Logo to Header from Environment Variable

Configurable header logo via VITE_LOGO_URL environment variable, rendered left of "Minha Conta" title.

## What Was Done

### Task 1: Add logo to Header and env var placeholder

- Read `import.meta.env.VITE_LOGO_URL` into module-level const `logoUrl`
- Conditionally render `<Box component="img">` before the title Typography when `logoUrl` is truthy
- Logo height fixed at 32px with 1.5 spacing units margin-right
- Added `VITE_LOGO_URL=` placeholder to `.env.example`
- **Commit:** `91607bc`

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- TypeScript compiles clean (`npx tsc --noEmit` passes with no errors)
- When VITE_LOGO_URL is set, an img element renders in the header before the title
- When VITE_LOGO_URL is unset/empty, no img element is rendered (conditional short-circuit)

## Self-Check: PASSED

- [x] `src/components/layout/Header.tsx` modified with logo rendering
- [x] `.env.example` updated with VITE_LOGO_URL placeholder
- [x] Commit `91607bc` exists
