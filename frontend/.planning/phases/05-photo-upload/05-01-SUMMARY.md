---
phase: 05-photo-upload
plan: 01
subsystem: ui
tags: [react-easy-crop, canvas, image-crop, react-query, mutation]

# Dependency graph
requires:
  - phase: 04-profile-editing
    provides: "Profile page with editable fields, useUpdateAccount pattern"
provides:
  - "getCroppedImg canvas utility for JPEG crop output"
  - "useUploadPhoto React Query mutation hook"
affects: [05-02-PLAN]

# Tech tracking
tech-stack:
  added: [react-easy-crop]
  patterns: [canvas-based image cropping, TDD with canvas mocking]

key-files:
  created:
    - src/utils/cropImage.ts
    - src/hooks/useUploadPhoto.ts
    - src/__tests__/cropImage.test.ts
    - src/__tests__/useUploadPhoto.test.ts
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "White background fill on canvas before drawImage for transparent PNG support"
  - "window.Image mock class override instead of vi.spyOn for jsdom compatibility"

patterns-established:
  - "Canvas mock pattern: spy on HTMLCanvasElement.prototype methods, override window.Image class"

requirements-completed: [PHOT-01]

# Metrics
duration: 3min
completed: 2026-03-12
---

# Phase 5 Plan 1: Photo Upload Utilities Summary

**Canvas-based getCroppedImg utility producing JPEG Blobs and useUploadPhoto React Query mutation hook with cache invalidation**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-12T17:26:20Z
- **Completed:** 2026-03-12T17:29:13Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- getCroppedImg utility that takes image URL + crop Area and produces JPEG Blob via canvas
- useUploadPhoto mutation hook following established useUpdateAccount pattern with cache update
- 5 passing tests (3 for crop utility, 2 for upload hook) with TDD approach
- react-easy-crop dependency installed for Plan 02 crop modal UI

## Task Commits

Each task was committed atomically:

1. **Task 1: Install react-easy-crop and create getCroppedImg utility with tests** - `7beceac` (feat)
2. **Task 2: Create useUploadPhoto mutation hook with tests** - `3f68255` (feat)

_TDD approach: RED (tests fail on missing module) then GREEN (implement to pass)_

## Files Created/Modified
- `src/utils/cropImage.ts` - Canvas-based crop utility, exports getCroppedImg
- `src/hooks/useUploadPhoto.ts` - Upload mutation hook with React Query cache update
- `src/__tests__/cropImage.test.ts` - 3 tests: Blob type, canvas dimensions, white background fill order
- `src/__tests__/useUploadPhoto.test.ts` - 2 tests: API call verification, cache update verification
- `package.json` - Added react-easy-crop dependency
- `package-lock.json` - Lock file updated

## Decisions Made
- White background fill (`#FFFFFF`) on canvas before drawImage to handle transparent PNGs converting to JPEG
- Used `window.Image` class override instead of `vi.spyOn(globalThis, 'Image')` because jsdom's Image constructor does not support spyOn properly

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- jsdom's `Image` constructor cannot be mocked via `vi.spyOn(globalThis, 'Image')` - resolved by assigning a mock class to `window.Image` directly in beforeEach

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- getCroppedImg and useUploadPhoto are ready for consumption by Plan 02 (CropModal + ProfileHero integration)
- react-easy-crop installed and available for the crop UI component

---
*Phase: 05-photo-upload*
*Completed: 2026-03-12*
