---
phase: quick-3
plan: 1
subsystem: profile-editing
tags: [validation, dto-conformance, react-hook-form]
dependency_graph:
  requires: [backend-update-account-dto]
  provides: [frontend-validation-matching-backend]
  affects: [EditNameModal, EditBirthdayModal]
tech_stack:
  added: []
  patterns: [react-hook-form-rules-object, shared-validation-module]
key_files:
  created: []
  modified:
    - src/utils/validation.ts
    - src/components/profile/EditBirthdayModal.tsx
    - src/__tests__/EditNameModal.test.tsx
    - src/__tests__/EditBirthdayModal.test.tsx
decisions:
  - "Wired birthDateRules into modal during Task 1 GREEN phase (Rule 3 - needed for tests to pass)"
  - "Used pre-filled long name in test instead of typing 237 chars (avoids userEvent timeout)"
metrics:
  duration: 3min
  completed: 2026-03-12
---

# Quick Task 3: Add Frontend Validation Matching Backend DTOs

**One-liner:** nameRules gains minLength/maxLength matching @Length(2,200); new birthDateRules with required + YYYY-MM-DD pattern wired into EditBirthdayModal

## What Was Done

### Task 1: Update validation rules and add birthDate rules (TDD)
- Added `minLength: { value: 2, message: '...' }` and `maxLength: { value: 200, message: '...' }` to `nameRules`
- Created new `birthDateRules` export with `required` and `pattern` (YYYY-MM-DD regex)
- Added test for name exceeding 200 chars showing maxLength error
- Added test for empty birthday submission showing required error
- **Commit:** db7f021

### Task 2: Wire birthDate validation into EditBirthdayModal
- Imported `birthDateRules` from validation module
- Applied `rules={birthDateRules}` to Controller
- Destructured `fieldState` in render callback for error display
- Added `error` and `helperText` props to TextField
- **Commit:** c6975ff

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Wired birthDateRules into modal during Task 1**
- **Found during:** Task 1 GREEN phase
- **Issue:** Birthday test required the modal to use birthDateRules, but wiring was planned for Task 2
- **Fix:** Applied modal wiring as part of making tests pass (both tasks committed separately)
- **Files modified:** src/components/profile/EditBirthdayModal.tsx
- **Commit:** c6975ff

**2. [Rule 1 - Bug] Optimized long-name test to avoid timeout**
- **Found during:** Task 1 RED phase
- **Issue:** Typing 237 chars via userEvent.type caused 5s test timeout
- **Fix:** Used pre-filled account with long name + click+tab to trigger blur validation
- **Files modified:** src/__tests__/EditNameModal.test.tsx
- **Commit:** db7f021

## Pre-existing Issues (Out of Scope)

- ProfilePage.test.tsx has 2 failing tests related to display formatting (not caused by this task)

## Verification

- All 19 tests in EditNameModal.test.tsx and EditBirthdayModal.test.tsx pass
- Full test suite: 86 passed, 3 failed (all 3 pre-existing ProfilePage failures)
