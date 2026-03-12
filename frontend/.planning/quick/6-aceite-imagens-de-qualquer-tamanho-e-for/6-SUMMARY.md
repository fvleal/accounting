---
phase: quick
plan: 6
subsystem: profile-photo
tags: [image-upload, compression, validation]
dependency_graph:
  requires: []
  provides: [any-image-format-upload, iterative-jpeg-compression]
  affects: [profile-photo-upload]
tech_stack:
  added: []
  patterns: [iterative-quality-reduction, canvas-toBlob-promise-wrapper]
key_files:
  created: []
  modified:
    - src/components/profile/ProfileHero.tsx
    - src/utils/cropImage.ts
    - src/__tests__/cropImage.test.ts
decisions:
  - "Remove all client-side file validation since cropping already converts to JPEG"
  - "Iterative quality reduction from 0.9 to 0.1 in 0.1 steps with 5MB ceiling"
metrics:
  duration: 3min
  completed: 2026-03-12
---

# Quick Task 6: Accept Any Image Format with Compression Summary

Remove upfront file type/size validation and add iterative JPEG compression to guarantee output under 5MB.

## One-liner

Accept any browser-renderable image format and iteratively reduce JPEG quality (0.9 to 0.1) to keep cropped output under 5MB.

## Tasks Completed

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Remove file type/size validation from ProfileHero | 13daf6b | src/components/profile/ProfileHero.tsx |
| 2 | Add iterative JPEG compression to getCroppedImg (TDD) | 5370b3b, 9928abe | src/utils/cropImage.ts, src/__tests__/cropImage.test.ts |

## Changes Made

### Task 1: Remove file type/size validation from ProfileHero
- Changed file input `accept` from `"image/jpeg,image/png"` to `"image/*"`
- Removed format check (`["image/jpeg", "image/png"].includes(file.type)`) and its snackbar
- Removed size check (`file.size > 5 * 1024 * 1024`) and its snackbar
- Removed unused `notistack` import and `useSnackbar` hook

### Task 2: Add iterative JPEG compression (TDD)
- **RED:** Added 3 new tests for compression behavior (under 5MB direct return, iterative quality reduction, error on uncompressible image)
- **GREEN:** Extracted `canvasToJpegBlob` helper, replaced single toBlob call with quality reduction loop (0.9 down to 0.1), throws `"Image too large to compress under 5MB"` at minimum quality
- Added `MAX_FILE_SIZE` constant (5MB)

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- All 105 tests pass (102 existing + 3 new compression tests)
- ProfileHero.tsx has no file type or size validation
- ProfileHero.tsx file input has `accept="image/*"`
- cropImage.ts has iterative quality reduction loop

## Self-Check: PASSED
