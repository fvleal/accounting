# Quick Task 2: Summary

## Objective
Replace Auth0 user data with account data (getMe) in Header component.

## Changes Made

### Task 1: Switch Header from Auth0 user to account data
- **File:** `src/components/layout/Header.tsx`
- Replaced `useAuth0().user` with `useAccount()` for name, email, and photo display
- Kept `useAuth0()` only for `logout` function
- Avatar now uses `account?.photoUrl`, `account?.name` with initials fallback
- Menu displays `account?.name` and `account?.email`

## Commits
- `f41487c` — docs(quick-2): plan to replace Auth0 user with account data in Header
- `d987c8f` — feat(quick-2): use account data instead of Auth0 user in Header
