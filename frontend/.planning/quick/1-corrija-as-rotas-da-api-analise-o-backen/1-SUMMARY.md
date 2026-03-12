---
phase: quick
plan: 1
subsystem: api-layer, profile-editing
tags: [api-routes, phone, modal, react-query]
dependency_graph:
  requires: []
  provides: ["/me API routes", "useSendPhoneCode hook", "EditPhoneModal", "phone field on ProfilePage"]
  affects: [src/api/accounts.ts, src/hooks/useUpdateAccount.ts, src/pages/ProfilePage.tsx]
tech_stack:
  added: []
  patterns: ["useMutation with cache update on success", "conditional render guard for modal freshness"]
key_files:
  created:
    - src/hooks/useSendPhoneCode.ts
    - src/components/profile/EditPhoneModal.tsx
  modified:
    - src/api/accounts.ts
    - src/hooks/useUpdateAccount.ts
    - src/components/profile/EditNameModal.tsx
    - src/components/profile/EditBirthdayModal.tsx
    - src/pages/ProfilePage.tsx
    - src/__tests__/ProfilePage.test.tsx
    - src/__tests__/EditNameModal.test.tsx
    - src/__tests__/EditBirthdayModal.test.tsx
decisions:
  - "Removed admin routes (getAccountById, getAccountByCpf, listAccounts) from frontend API layer"
  - "Phone validation regex matches backend: /^[1-9]{2}[2-9]\\d{7,8}$/"
metrics:
  duration: 5min
  completed: "2026-03-12"
  tasks: 2
  files: 10
---

# Quick Task 1: Fix API Routes and Add Phone Field Summary

Migrated all frontend API calls from /:id admin routes to /accounts/me endpoints and implemented phone editing with sendCode flow.

## One-liner

All API functions use /accounts/me, admin routes removed, phone field with EditPhoneModal and Brazilian phone validation added to ProfilePage.

## Task Results

| Task | Name | Commit | Status |
|------|------|--------|--------|
| 1 | Fix API routes and hooks to use /me endpoints | 52c3c46 | Done |
| 2 | Add phone field to ProfilePage with EditPhoneModal | d635e93 | Done |

## What Changed

### Task 1: API Route Migration
- Rewrote `src/api/accounts.ts`: removed `getAccountById`, `getAccountByCpf`, `listAccounts`; changed `updateAccount`, `sendPhoneCode`, `verifyPhone`, `uploadPhoto` to use `/accounts/me` routes without id parameter
- Updated `useUpdateAccount` hook: input type simplified from `{ id, data }` to just `{ name?, birthDate? }`
- Created `useSendPhoneCode` hook with React Query mutation and cache invalidation
- Updated `EditNameModal` and `EditBirthdayModal` mutation calls to pass data directly
- Updated test assertions to match new payload shape

### Task 2: Phone Field and Modal
- Created `EditPhoneModal` following existing modal patterns (Dialog, disableEscapeKeyDown, backdropClick guard)
- Phone validation: regex `/^[1-9]{2}[2-9]\d{7,8}$/` matching backend `SendPhoneCodeDto`
- Added phone row to ProfilePage "Informacoes adicionais" section with `formatPhone` display
- Expanded modal state union type to include `'phone'`
- Updated all ProfilePage tests: phone display, null handling (2 "Nao informado"), 3 chevrons, phone modal wiring

## Verification

- All 86 tests pass (1 pre-existing failure in api-client.test.ts unrelated to changes)
- TypeScript compiles with no errors
- No `/${id}` route references remain in src/api/accounts.ts

## Deviations from Plan

None - plan executed exactly as written.

## Notes

- The pre-existing `api-client.test.ts` failure (expects baseURL `http://localhost:3000` but gets `/api`) is unrelated to this task and was not touched.
- `ApiListResponse` type kept in types/account.ts even though no function uses it currently -- removing types is low risk but out of scope.
