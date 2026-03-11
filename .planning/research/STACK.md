# Stack Research

**Domain:** React SPA - Account Management Frontend
**Researched:** 2026-03-11
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | 19.2.x | UI framework | Stable release, project constraint. React 19 brings improved Suspense, use() hook, and better concurrent rendering. |
| Vite | 7.3.x | Build tool & dev server | Project constraint. Fastest DX with HMR, native ESM. Vite 7 is current stable; no reason to pin to Vite 6. |
| TypeScript | 5.7.x | Type safety | Non-negotiable for any production React app. Catches bugs at compile time, improves IDE experience, self-documents the API contract with the NestJS backend. |
| Tailwind CSS | 4.2.x | Styling & dark mode | v4 has first-party Vite plugin (`@tailwindcss/vite`), no config file needed, automatic content detection. Dark mode via `dark:` variant is trivial. 57% smaller bundle than v3. |
| React Router | 7.13.x | Client-side routing | Standard for React SPAs. v7 is stable, non-breaking upgrade from v6. This app needs minimal routing (login callback, onboarding, profile) so the lightweight SPA mode is ideal. |

### Auth & API

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @auth0/auth0-react | 2.15.x | Auth0 integration | Official Auth0 SDK for React SPAs. Provides `Auth0Provider`, `useAuth0()` hook, `withAuthenticationRequired` HOC. Handles token refresh, login/logout, and RBAC token claims. Project constraint. |
| @tanstack/react-query | 5.90.x | Server state management | De facto standard for REST API consumption in React. Handles caching, background refetch, loading/error states, and optimistic updates. Eliminates boilerplate around fetch-loading-error patterns. |
| ky | 1.14.x | HTTP client | Lightweight (no dependencies) fetch wrapper with retries, hooks for auth token injection, JSON parsing, and better error handling than raw fetch. 35kb smaller than Axios. Perfect match with React Query. |

### Forms & Validation

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| react-hook-form | 7.71.x | Form state management | Smallest bundle, fewest re-renders (uncontrolled components), zero dependencies. This app has simple modal forms (name, phone, date) -- RHF handles them with minimal boilerplate. |
| zod | 4.3.x | Schema validation | TypeScript-first validation. Zod 4 is 6.5x faster than v3. Schemas double as TypeScript types (`z.infer<typeof schema>`), keeping frontend validation aligned with the NestJS backend DTOs. |
| @hookform/resolvers | 5.2.x | RHF + Zod bridge | Connects Zod schemas to react-hook-form via `zodResolver`. Supports Zod v4. |

### UI Components

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @headlessui/react | 2.x | Modal/Dialog primitives | Unstyled, accessible Dialog component with focus trap, scroll lock, and portal rendering. Designed for Tailwind CSS -- zero style conflicts. This app's primary interaction pattern is modal-based editing. |
| react-easy-crop | 5.5.x | Image cropping (3x4) | Supports fixed aspect ratio via `aspect={3/4}` prop. Mobile-friendly with touch/drag/zoom. Clean API, small bundle. Returns `croppedAreaPixels` for canvas-based export before S3 upload. |
| lucide-react | 0.577.x | Icons | Tree-shakeable SVG icons. Only imported icons ship in the bundle. Consistent, modern design language. 1500+ icons cover all UI needs (edit, camera, phone, user, etc.). |
| sonner | 2.0.x | Toast notifications | Opinionated, zero-config toast library. Call `toast.success("Saved")` from anywhere -- no hooks or providers needed beyond a single `<Toaster />`. Used by Vercel, Cursor, shadcn/ui. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| @tailwindcss/vite | Tailwind Vite plugin | Replaces PostCSS setup. Add to `vite.config.ts` plugins array. No `tailwind.config.js` needed in v4. |
| @vitejs/plugin-react | React Vite plugin | Fast Refresh, JSX transform. Use `react()` in Vite plugins. |
| ESLint 9.x + @eslint/js | Linting | Flat config format. Use `@typescript-eslint/parser` + `eslint-plugin-react-hooks`. |
| Prettier | Code formatting | With `prettier-plugin-tailwindcss` for class sorting. |

## Installation

```bash
# Core
npm install react react-dom react-router

# Styling
npm install tailwindcss @tailwindcss/vite

# Auth
npm install @auth0/auth0-react

# Data fetching
npm install @tanstack/react-query ky

# Forms & validation
npm install react-hook-form @hookform/resolvers zod

# UI components
npm install @headlessui/react react-easy-crop lucide-react sonner

# Dev dependencies
npm install -D typescript @types/react @types/react-dom vite @vitejs/plugin-react
npm install -D eslint @eslint/js @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react-hooks
npm install -D prettier prettier-plugin-tailwindcss
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Tailwind CSS 4 | CSS Modules | If you need runtime CSS-in-JS features like dynamic theme objects. Not this project -- Tailwind's `dark:` classes cover the dark mode requirement natively. |
| ky | Axios | If you need request/response interceptors for complex auth flows (multiple auth providers, request signing). Overkill here -- ky's `beforeRequest` hook handles Auth0 token injection fine. |
| ky | Native fetch | If you want zero dependencies and are okay writing retry logic, error parsing, and timeout handling manually. Not worth the effort for this project. |
| react-hook-form | Formik | If you have deeply nested, highly dynamic form structures. This app has 3-4 simple modal forms -- RHF is lighter and faster. |
| zod | yup | If the team already knows yup. Zod 4 is faster, has better TypeScript inference, and is the community standard in 2025+. |
| @headlessui/react | Radix UI | If you need 28+ component primitives (tooltips, popovers, accordions, etc.). This app only needs Dialog/Modal -- Headless UI is simpler and Tailwind-native. |
| react-easy-crop | react-advanced-cropper | If you need custom cropper shapes (circular, polygon). 3x4 fixed-ratio is a basic use case -- react-easy-crop handles it with one prop. |
| sonner | react-hot-toast | If you want more control over toast positioning/animation. Sonner has better defaults and requires less setup. |
| React Router 7 | TanStack Router | If you want file-based routing and typesafe route params. Overkill for 3-4 routes. React Router is the established standard. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| MUI / Ant Design / Chakra UI | Massive bundle, opinionated styling conflicts with custom dark theme, fights Tailwind. This app mimics Google Personal Info -- you need design control, not a component library's design system. | Tailwind CSS + Headless UI |
| Redux / Zustand | No complex client state to manage. All data is server state (user profile from API). React Query handles server state; React's useState/useContext handle the tiny amount of UI state (modal open/close). | @tanstack/react-query + useState |
| Formik | Larger bundle, more re-renders (controlled components), declining community momentum vs react-hook-form. | react-hook-form |
| styled-components / Emotion | Runtime CSS-in-JS adds bundle weight and React 19 compatibility concerns. Tailwind handles everything needed here at build time. | Tailwind CSS |
| Create React App (CRA) | Officially deprecated. No longer maintained. | Vite |
| Moment.js | Massive bundle (232kb), mutable API. | Native `Intl.DateTimeFormat` or `date-fns` (only if needed) |
| react-datepicker | Heavy dependency for a single date-of-birth field. | Native `<input type="date">` styled with Tailwind, or a lightweight Headless UI Popover with a simple calendar if needed |

## Stack Patterns

**Dark mode (Tailwind v4):**
- Set `@variant dark (&.dark)` in CSS (class-based strategy)
- Toggle `.dark` class on `<html>` element
- Store preference in `localStorage`, default to dark per project requirement
- All components use `dark:bg-*`, `dark:text-*` variants

**Auth token injection with ky:**
- Create a ky instance with `beforeRequest` hook that calls `getAccessTokenSilently()`
- Pass this instance to React Query's `queryFn` functions
- Keeps auth logic in one place, not scattered across fetch calls

**Modal editing pattern:**
- Headless UI `<Dialog>` component manages open/close, focus trap, backdrop
- Each editable field gets its own modal with a react-hook-form + zod schema
- On submit: `useMutation` from React Query, then `invalidateQueries` to refresh profile

**Image crop + upload flow:**
- react-easy-crop with `aspect={3/4}` returns `croppedAreaPixels`
- Use canvas API to extract cropped blob
- Upload blob via ky to the backend's S3 upload endpoint
- Invalidate profile query to show new photo

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| React 19.2.x | @auth0/auth0-react 2.15.x | Auth0 SDK supports React 19 |
| React 19.2.x | @headlessui/react 2.x | Headless UI v2 supports React 18+ |
| Tailwind CSS 4.2.x | @tailwindcss/vite (same version) | Must use matching versions; install together |
| Vite 7.3.x | @vitejs/plugin-react 4.x | Plugin tracks Vite major versions |
| zod 4.3.x | @hookform/resolvers 5.2.x | Resolvers v5 supports Zod v4 via `zod/v4` import path |
| react-hook-form 7.71.x | @hookform/resolvers 5.2.x | Resolvers v5 is designed for RHF v7 |

## Sources

- [React Versions](https://react.dev/versions) -- React 19.2.x confirmed as current stable
- [Vite Releases](https://vite.dev/releases) -- Vite 7.3.x confirmed, v6 still gets security patches
- [Tailwind CSS v4.0 announcement](https://tailwindcss.com/blog/tailwindcss-v4) -- v4 architecture, Vite plugin, no config file
- [tailwindcss npm](https://www.npmjs.com/package/tailwindcss) -- v4.2.1 confirmed
- [@auth0/auth0-react npm](https://www.npmjs.com/package/@auth0/auth0-react) -- v2.15.0 confirmed
- [@tanstack/react-query npm](https://www.npmjs.com/package/@tanstack/react-query) -- v5.90.x confirmed
- [ky npm](https://www.npmjs.com/package/ky) -- v1.14.3 confirmed
- [react-hook-form npm](https://www.npmjs.com/package/react-hook-form) -- v7.71.2 confirmed
- [@hookform/resolvers npm](https://www.npmjs.com/package/@hookform/resolvers) -- v5.2.2 confirmed, Zod v4 support noted
- [zod npm](https://www.npmjs.com/package/zod) -- v4.3.6 confirmed, 6.5x faster than v3
- [react-easy-crop npm](https://www.npmjs.com/package/react-easy-crop) -- v5.5.6 confirmed, `aspect` prop for fixed ratio
- [Headless UI Dialog](https://headlessui.com/react/dialog) -- Dialog component with focus trap, scroll lock
- [lucide-react npm](https://www.npmjs.com/package/lucide-react) -- v0.577.0, tree-shakeable
- [sonner npm](https://www.npmjs.com/package/sonner) -- v2.0.7, zero-config toast
- [React Router npm](https://www.npmjs.com/package/react-router) -- v7.13.x confirmed
- [Axios vs Fetch vs Ky comparison (LogRocket)](https://blog.logrocket.com/axios-vs-fetch-2025/) -- Bundle size and feature comparison
- [React Hook Form vs Formik (LogRocket)](https://blog.logrocket.com/react-hook-form-vs-formik-comparison/) -- Performance and re-render comparison
- [Headless UI vs Radix comparison](https://www.subframe.com/tips/headless-ui-vs-radix) -- Feature and use-case comparison

---
*Stack research for: Account Management Frontend (React + Vite SPA)*
*Researched: 2026-03-11*
