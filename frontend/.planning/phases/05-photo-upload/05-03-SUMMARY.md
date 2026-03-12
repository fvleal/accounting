---
phase: 05-photo-upload
plan: 03
subsystem: ui
tags: [react-image-crop, crop, photo, modal, mui-dialog]

requires:
  - phase: 05-photo-upload
    provides: "CropPhotoModal with react-easy-crop, getCroppedImg utility, AppDialog component"
provides:
  - "Rewritten CropPhotoModal with react-image-crop (user-adjustable 3x4 rectangle, no zoom)"
  - "AppDialog blocks backdrop-click dismissal for all modals"
  - "getCroppedImg accepts PixelCrop from react-image-crop"
  - "Object URL lifecycle managed in ProfilePage instead of modal"
affects: []

tech-stack:
  added: [react-image-crop]
  patterns: [backdrop-click-guard, object-url-lifecycle-in-parent]

key-files:
  created: []
  modified:
    - src/components/profile/CropPhotoModal.tsx
    - src/components/common/AppDialog.tsx
    - src/utils/cropImage.ts
    - src/pages/ProfilePage.tsx
    - src/index.css
    - src/__tests__/CropPhotoModal.test.tsx
    - src/__tests__/cropImage.test.ts
    - src/__tests__/AppDialog.test.tsx

key-decisions:
  - "Replaced react-easy-crop with react-image-crop for user-adjustable crop rectangle without zoom"
  - "Moved object URL revocation from CropPhotoModal useEffect to ProfilePage closeCropModal callback"
  - "AppDialog universally blocks backdrop-click dismissal for all modals"

patterns-established:
  - "Object URL lifecycle: create in parent, revoke in parent (not in consuming modal)"
  - "AppDialog backdrop guard: all modals using AppDialog are protected from accidental dismissal"

requirements-completed: [PHOT-01, PHOT-02]

duration: 4min
completed: 2026-03-12
---

# Phase 05 Plan 03: Gap Closure Summary

**Replaced react-easy-crop with react-image-crop for user-adjustable 3x4 crop rectangle, fixed Strict Mode black background via object URL lifecycle, and hardened AppDialog against backdrop dismissal**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-12T18:00:12Z
- **Completed:** 2026-03-12T18:04:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- CropPhotoModal rewritten with react-image-crop: user-adjustable 3x4 rectangle, no zoom slider
- Stronger crop rectangle border (white) and darker overlay (65% opacity) via CSS overrides
- AppDialog universally blocks backdrop-click dismissal for all modals
- Object URL revocation moved from modal useEffect to ProfilePage, fixing Strict Mode black background

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix AppDialog backdrop-click and replace crop library + rewrite getCroppedImg** - `3681b5e` (feat)
2. **Task 2: Rewrite CropPhotoModal with react-image-crop and fix object URL lifecycle** - `7bc272f` (feat)

## Files Created/Modified
- `src/components/common/AppDialog.tsx` - Added backdrop-click guard to onClose handler
- `src/components/profile/CropPhotoModal.tsx` - Full rewrite using ReactCrop, removed zoom slider and black background Box
- `src/utils/cropImage.ts` - Changed import from Area (react-easy-crop) to PixelCrop (react-image-crop)
- `src/pages/ProfilePage.tsx` - Added closeCropModal callback with URL.revokeObjectURL
- `src/index.css` - Added CSS overrides for crop rectangle border and overlay opacity
- `src/__tests__/CropPhotoModal.test.tsx` - Updated mock from react-easy-crop to react-image-crop, removed zoom tests
- `src/__tests__/cropImage.test.ts` - Updated type import and test data for PixelCrop shape
- `src/__tests__/AppDialog.test.tsx` - Updated test to expect backdrop-click NOT calling onClose

## Decisions Made
- Replaced react-easy-crop with react-image-crop for user-adjustable crop rectangle without zoom controls
- Moved object URL revocation from CropPhotoModal useEffect to ProfilePage closeCropModal callback to fix Strict Mode double-mount revoking the URL before render
- AppDialog universally blocks backdrop-click dismissal -- all modals benefit, not just CropPhotoModal

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated AppDialog test to match new backdrop-click behavior**
- **Found during:** Task 2 (full test suite verification)
- **Issue:** Existing AppDialog test expected backdrop click to call onClose, but Task 1 changed AppDialog to block backdrop clicks
- **Fix:** Changed test assertion from `toHaveBeenCalled` to `not.toHaveBeenCalled`
- **Files modified:** src/__tests__/AppDialog.test.tsx
- **Verification:** All 102 tests pass
- **Committed in:** 7bc272f (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Test update necessary to match intended behavior change. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 4 UAT gaps from 05-UAT.md are now resolved
- Photo upload flow complete: file selection, cropping with react-image-crop, upload mutation
- No further phases planned

---
*Phase: 05-photo-upload*
*Completed: 2026-03-12*
