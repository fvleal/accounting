---
phase: quick
plan: 8
subsystem: profile-photo
tags: [heic, image-conversion, crop-dialog, ux]
dependency_graph:
  requires: [heic2any]
  provides: [heic-to-jpeg-conversion, img-error-handling]
  affects: [ProfileHero, CropPhotoModal]
tech_stack:
  added: [heic2any]
  patterns: [dynamic-import, client-side-conversion]
key_files:
  created: []
  modified:
    - src/components/profile/ProfileHero.tsx
    - src/components/profile/CropPhotoModal.tsx
decisions:
  - "Dynamic import of heic2any to avoid bundling for non-HEIC users"
  - "Extension-based fallback detection when browser reports empty MIME for HEIC"
  - "CircularProgress overlay on avatar during conversion for clear loading state"
metrics:
  duration: 2min
  completed: "2026-03-13T00:59:00Z"
---

# Quick Task 8: HEIC Image Conversion for Crop Dialog Summary

Client-side HEIC/HEIF to JPEG conversion via heic2any with loading overlay and error handling in crop dialog.

## What Was Done

### Task 1: Install heic2any and add HEIC conversion in ProfileHero
**Commit:** `de75d0c`
**Files:** `src/components/profile/ProfileHero.tsx`, `package.json`, `package-lock.json`

- Installed `heic2any` npm package
- Added `isHeic()` helper that checks MIME type (`image/heic`, `image/heif`) with extension fallback for browsers that report empty MIME
- Made `handleFileSelect` async; HEIC files are converted to JPEG (quality 0.9) via dynamically imported heic2any before creating blob URL
- Added `converting` state with CircularProgress overlay on avatar during conversion
- Added error snackbar via notistack if conversion fails
- Blocked avatar click while conversion is in progress (`isCropOpen || converting`)

### Task 2: Add img onError handler in CropPhotoModal
**Commit:** `b1132ce`
**Files:** `src/components/profile/CropPhotoModal.tsx`

- Added `onImageError` handler that shows error snackbar and auto-closes dialog
- Added `onError={onImageError}` to the img element inside ReactCrop

## Deviations from Plan

None - plan executed exactly as written.

## Pre-existing Test Failures

4 test files have pre-existing failures unrelated to this change (Portuguese accent mismatches in validation tests, account query cache assertions). These were not introduced by this task.

## Verification

- TypeScript compilation: PASS (no errors)
- Tests: Pre-existing failures only, no new failures introduced

## Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install heic2any and add HEIC conversion in ProfileHero | `de75d0c` | ProfileHero.tsx, package.json, package-lock.json |
| 2 | Add img onError handler in CropPhotoModal | `b1132ce` | CropPhotoModal.tsx |
