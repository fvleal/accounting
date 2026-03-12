---
phase: quick-4
plan: 01
subsystem: ui-components
tags: [dialog, consistency, refactor]
dependency_graph:
  requires: []
  provides: [AppDialog-component]
  affects: [EditNameModal, EditBirthdayModal, EditPhoneModal]
tech_stack:
  added: []
  patterns: [wrapper-component, prop-simplification]
key_files:
  created:
    - src/components/common/AppDialog.tsx
    - src/__tests__/AppDialog.test.tsx
  modified:
    - src/components/profile/EditNameModal.tsx
    - src/components/profile/EditBirthdayModal.tsx
    - src/components/profile/EditPhoneModal.tsx
decisions:
  - AppDialog wraps MUI Dialog with fixed sizing (360-480px width, 120px min-height)
  - Simplified onClose signature from MUI's (_event, reason) to plain () => void
metrics:
  duration: 3min
  completed: "2026-03-12T15:55:39Z"
---

# Quick Task 4: Create AppDialog Wrapper Summary

AppDialog wrapper component with fixed sizing (360-480px) and baked-in backdrop/escape guards, all three edit modals migrated.

## What Was Done

### Task 1: Create AppDialog wrapper component
- Created `src/components/common/AppDialog.tsx` wrapping MUI Dialog
- Fixed sizing: minWidth 360, maxWidth 480, width 100%, minHeight 120
- Baked in `disableEscapeKeyDown` and backdropClick guard
- Simplified consumer API: `onClose: () => void` instead of MUI's event+reason signature
- Consumer PaperProps.sx merges with defaults (consumer wins on conflicts)
- Created 5 tests covering rendering, sizing, backdrop guard, consumer callback, and sx merging
- **Commit:** 0dc72fc

### Task 2: Migrate all modals to use AppDialog
- Replaced MUI Dialog import with AppDialog in EditNameModal, EditBirthdayModal, EditPhoneModal
- Removed duplicated `disableEscapeKeyDown` and `onClose={(_e, reason) => ...}` from each modal
- Net result: -27 lines removed, +9 lines added across 3 files
- All 24 tests pass (5 AppDialog + 10 EditNameModal + 9 EditBirthdayModal)
- **Commit:** c5518f0

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- No direct `Dialog` import from `@mui/material` in any Edit*Modal file
- All three Edit*Modal files import `AppDialog` from `../common/AppDialog`
- All 24 relevant tests pass
- 2 pre-existing test failures (api-client baseURL, ProfilePage display) unrelated to changes

## Commits

| Task | Commit  | Description |
|------|---------|-------------|
| 1    | 0dc72fc | feat(quick-4): create AppDialog wrapper with fixed sizing and backdrop guard |
| 2    | c5518f0 | refactor(quick-4): migrate all modals from MUI Dialog to AppDialog |
