---
phase: 05-photo-upload
verified: 2026-03-12T18:15:00Z
status: passed
score: 11/11 must-haves verified
re_verification: true
previous_verification:
  status: passed
  score: 9/9
  note: >
    Previous report was written after Plan 02 but before Plan 03 executed.
    It described the react-easy-crop implementation that was subsequently replaced.
    This report reflects the final post-Plan-03 codebase state.
gaps_closed:
  - "Crop interface now uses react-image-crop (user-adjustable rectangle) instead of react-easy-crop"
  - "Zoom slider removed per user decision"
  - "Object URL revocation moved from CropPhotoModal useEffect to ProfilePage (Strict Mode fix)"
  - "AppDialog blocks backdrop-click dismissal universally"
gaps_remaining: []
regressions: []
---

# Phase 5: Photo Upload Verification Report

**Phase Goal:** Users can upload a profile photo by selecting a file, cropping it client-side to 3x4 ratio, previewing the result, and confirming the upload
**Verified:** 2026-03-12T18:15:00Z
**Status:** passed
**Re-verification:** Yes — this replaces the stale post-Plan-02 report; the codebase was significantly changed by Plan 03 (gap closure)

---

## Context: Three-Plan Execution

Phase 05 executed across three plans:

- **Plan 01** — Foundation: `cropImage.ts` utility and `useUploadPhoto` hook with tests
- **Plan 02** — UI: `CropPhotoModal`, `ProfileHero` camera badge, `ProfilePage` wiring
- **Plan 03** — Gap closure: replaced `react-easy-crop` with `react-image-crop`, removed zoom slider, fixed Strict Mode object URL black-background bug, hardened `AppDialog` against backdrop-click dismissal

The previous VERIFICATION.md described the Plan-02 implementation. This report verifies the Plan-03 final state.

---

## Goal Achievement

### Observable Truths

All truths sourced from Plan 01, 02, and 03 `must_haves` frontmatter, updated to reflect the final implementation.

| #  | Truth                                                                                                 | Status     | Evidence                                                                                                                                       |
|----|-------------------------------------------------------------------------------------------------------|------------|------------------------------------------------------------------------------------------------------------------------------------------------|
| 1  | getCroppedImg produces a JPEG Blob from an image URL and a PixelCrop area                            | VERIFIED   | `src/utils/cropImage.ts` L1: imports `PixelCrop` from `react-image-crop`. L12-55: canvas impl, white fill, `toBlob('image/jpeg', 0.9)`. 3 tests pass. |
| 2  | useUploadPhoto mutation calls uploadPhoto API and updates React Query cache on success                | VERIFIED   | `src/hooks/useUploadPhoto.ts` L9: `mutationFn: (file: File) => uploadPhoto(file)`, L10-12: `onSuccess` sets `['account','me']` in cache. 2 tests pass. |
| 3  | User can click the avatar to open file picker                                                        | VERIFIED   | `ProfileHero.tsx` L17-22: `handleAvatarClick` resets value then calls `fileInputRef.current.click()`. Avatar wrapped in clickable `Box`. |
| 4  | Invalid file type or size is rejected with toast before crop modal opens                             | VERIFIED   | `ProfileHero.tsx` L28-33: type check against `['image/jpeg','image/png']` calls `enqueueSnackbar` and returns. L35-40: size > 5MB same pattern. |
| 5  | User sees a user-adjustable 3x4 crop interface (react-image-crop) inside a modal                    | VERIFIED   | `CropPhotoModal.tsx` L59-71: `<ReactCrop crop={crop} onChange onComplete aspect={3/4}>` wrapping an `<img>` tag. Uses `react-image-crop` (not react-easy-crop). |
| 6  | No zoom slider — crop rectangle uses strong white border with darker overlay                         | VERIFIED   | `CropPhotoModal.tsx`: no Slider component. `src/index.css` L2-7: `.ReactCrop__crop-selection { border: 2px solid white !important }` and `.ReactCrop__overlay { background-color: rgba(0,0,0,0.65) !important }`. |
| 7  | User clicks Salvar to upload the cropped image                                                       | VERIFIED   | `CropPhotoModal.tsx` L37-53: `handleSave` calls `getCroppedImg(imageUrl, completedCrop)`, wraps blob in `File`, calls `mutation.mutate(file, ...)`. Button wired to `handleSave`. |
| 8  | After upload success, avatar updates and modal closes with success toast                             | VERIFIED   | `CropPhotoModal.tsx` L44-47: `onSuccess` calls `enqueueSnackbar('Foto atualizada!', {variant:'success'})`, `onClose()`, `onUploaded()`. Cache update in `useUploadPhoto` forces avatar re-render. |
| 9  | After upload error, modal stays open with error toast                                                | VERIFIED   | `CropPhotoModal.tsx` L48-50: `onError` calls `enqueueSnackbar('Erro ao enviar foto.', {variant:'error'})` only — no `onClose()`. `AppDialog` also blocks backdrop-click. |
| 10 | Object URL is revoked in ProfilePage (not inside modal) — fixes Strict Mode black background         | VERIFIED   | `ProfilePage.tsx` L25-30: `closeCropModal = useCallback(() => setCropImageUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; }))`. No `useEffect` revocation inside `CropPhotoModal`. |
| 11 | AppDialog blocks backdrop-click dismissal for all modals                                             | VERIFIED   | `AppDialog.tsx` L16-19: `onClose={(_event, reason) => { if (reason === 'backdropClick') return; onClose(); }}`. |

**Score:** 11/11 truths verified

---

### Required Artifacts

| Artifact                                    | Status     | Details                                                                                                          |
|---------------------------------------------|------------|------------------------------------------------------------------------------------------------------------------|
| `src/utils/cropImage.ts`                    | VERIFIED   | 55 lines. Imports `PixelCrop` from `react-image-crop`. Exports `getCroppedImg`. White fill, JPEG output.        |
| `src/hooks/useUploadPhoto.ts`               | VERIFIED   | 14 lines. Exports `useUploadPhoto`. Follows `useUpdateAccount` pattern exactly.                                 |
| `src/__tests__/cropImage.test.ts`           | VERIFIED   | 93 lines. Imports `PixelCrop` from `react-image-crop`. 3 tests: Blob type, canvas dimensions, white-fill order.|
| `src/__tests__/useUploadPhoto.test.ts`      | VERIFIED   | 88 lines. 2 tests: API call verification, cache update verification.                                            |
| `src/components/profile/CropPhotoModal.tsx` | VERIFIED   | 85 lines. Uses `ReactCrop` from `react-image-crop`. Aspect 3/4. No zoom slider. Correct save/error callbacks.  |
| `src/components/profile/ProfileHero.tsx`    | VERIFIED   | 98 lines. Camera badge, hidden file input, type/size validation, `onFileSelect` prop.                           |
| `src/pages/ProfilePage.tsx`                 | VERIFIED   | 106 lines. `closeCropModal` with URL revocation, `CropPhotoModal` conditional render with all props.            |
| `src/__tests__/CropPhotoModal.test.tsx`     | VERIFIED   | 85 lines. Mocks `react-image-crop`. 3 tests: renders correctly, 3:4 aspect ratio, cancel callback.             |
| `src/components/common/AppDialog.tsx`       | VERIFIED   | 37 lines. Backdrop-click guard at L16-19.                                                                       |
| `src/index.css`                             | VERIFIED   | 8 lines. CSS overrides for ReactCrop rectangle border and overlay opacity.                                      |

---

### Key Link Verification

| From                                         | To                              | Via                                 | Status  | Evidence                                                                                     |
|----------------------------------------------|---------------------------------|-------------------------------------|---------|----------------------------------------------------------------------------------------------|
| `src/hooks/useUploadPhoto.ts`                | `src/api/accounts.ts`           | `import uploadPhoto`                | WIRED   | L2: `import { uploadPhoto } from '../api/accounts';`                                         |
| `src/hooks/useUploadPhoto.ts`                | react-query cache               | `setQueryData` on success           | WIRED   | L11: `queryClient.setQueryData(['account', 'me'], account);`                                 |
| `src/components/profile/ProfileHero.tsx`     | hidden file input               | `useRef + click()`                  | WIRED   | L14: `useRef<HTMLInputElement>(null)`, L20: `fileInputRef.current.click()`                   |
| `src/components/profile/ProfileHero.tsx`     | file validation                 | onChange checks type and size       | WIRED   | L28: `['image/jpeg','image/png'].includes(file.type)`, L35: `file.size > 5 * 1024 * 1024`   |
| `src/components/profile/CropPhotoModal.tsx`  | `src/utils/cropImage.ts`        | `import getCroppedImg`              | WIRED   | L13: `import { getCroppedImg } from '../../utils/cropImage';`                                |
| `src/components/profile/CropPhotoModal.tsx`  | `src/hooks/useUploadPhoto.ts`   | `import useUploadPhoto`             | WIRED   | L14: `import { useUploadPhoto } from '../../hooks/useUploadPhoto';`                          |
| `src/pages/ProfilePage.tsx`                  | `CropPhotoModal`                | renders with `cropImageUrl` state   | WIRED   | L11: import; L23: `useState<string|null>(null)`; L96-103: conditional render                 |
| `src/pages/ProfilePage.tsx`                  | `URL.revokeObjectURL`           | `closeCropModal` callback           | WIRED   | L25-30: `useCallback` with `URL.revokeObjectURL(prev)` before `return null`                  |
| `src/components/common/AppDialog.tsx`        | MUI Dialog                      | backdrop-click reason guard         | WIRED   | L16-19: `if (reason === 'backdropClick') return;`                                            |

---

### Requirements Coverage

Requirements declared in Plan 01 (`requirements: [PHOT-01]`) and Plan 02 + 03 (`requirements: [PHOT-01, PHOT-02]`).

| Requirement | Source Plans    | Description                                                              | Status    | Evidence                                                                                                                      |
|-------------|----------------|--------------------------------------------------------------------------|-----------|-------------------------------------------------------------------------------------------------------------------------------|
| PHOT-01     | 01, 02, 03     | User can upload a profile photo with client-side 3x4 crop before submission | SATISFIED | Full flow: file picker → type/size validation → object URL → CropPhotoModal with ReactCrop 3/4 aspect → getCroppedImg (PixelCrop) → useUploadPhoto → cache update |
| PHOT-02     | 02, 03         | User sees a preview of the cropped photo before confirming upload         | SATISFIED | `<ReactCrop aspect={3/4}><img src={imageUrl} /></ReactCrop>` renders a live crop preview inside the modal. User sees and adjusts the exact crop region before clicking Salvar. |

Both PHOT-01 and PHOT-02 are mapped to Phase 5 in REQUIREMENTS.md (`| PHOT-01 | Phase 5 | Complete |`, `| PHOT-02 | Phase 5 | Complete |`). No orphaned requirements.

---

### Library Correctness

| Check                                           | Status  | Evidence                                                  |
|-------------------------------------------------|---------|-----------------------------------------------------------|
| `react-image-crop` in `package.json`            | PASS    | `"react-image-crop": "^11.0.10"`                          |
| `react-easy-crop` NOT in `package.json`         | PASS    | Not present in dependencies                               |
| No `react-easy-crop` imports in `src/`          | PASS    | grep across entire `src/` directory returns no results    |

---

### Anti-Patterns Found

No anti-patterns detected across all phase-5 files in their final post-Plan-03 state:

| File | Pattern | Result |
|------|---------|--------|
| `src/utils/cropImage.ts` | TODO/FIXME/stub/console.log | None |
| `src/hooks/useUploadPhoto.ts` | TODO/FIXME/stub/console.log | None |
| `src/components/profile/CropPhotoModal.tsx` | Empty handlers, return null on open, TODO | None |
| `src/components/profile/ProfileHero.tsx` | TODO/FIXME/stub | None |
| `src/pages/ProfilePage.tsx` | TODO/FIXME/stub | None |
| `src/components/common/AppDialog.tsx` | TODO/FIXME/stub | None |
| `src/index.css` | Placeholder comments | None |

Additional quality observations:
- `CropPhotoModal` correctly returns `null` when `open === false` (L35) — this is intentional to reset crop state on reopen, not a stub.
- `handleSave` guards with `if (!completedCrop) return` — correct early exit, not a stub.
- `ProfilePage.closeCropModal` uses functional `setState` form for safe URL revocation — correct pattern.

---

### Commit Verification

Plan 03 commits verified in git history:

| Commit    | Message                                                                                         | Files                                                                         |
|-----------|-------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------|
| `3681b5e` | feat(05-03): replace react-easy-crop with react-image-crop and fix AppDialog backdrop           | AppDialog.tsx, cropImage.ts, cropImage.test.ts, package.json, package-lock.json |
| `7bc272f` | feat(05-03): rewrite CropPhotoModal with react-image-crop and fix object URL lifecycle          | CropPhotoModal.tsx, CropPhotoModal.test.tsx, AppDialog.test.tsx, index.css, ProfilePage.tsx |

---

### Test Results

All 102 tests pass across 16 test files (verified by running `npx vitest run --reporter=verbose`):

| Test File                        | Tests | Result |
|----------------------------------|-------|--------|
| `cropImage.test.ts`              | 3     | PASS   |
| `useUploadPhoto.test.ts`         | 2     | PASS   |
| `CropPhotoModal.test.tsx`        | 3     | PASS   |
| All pre-existing test files (13) | 94    | PASS   |

**Total: 102/102 tests pass**

---

### Human Verification Required

The following behaviors are correct in code but require a browser to confirm end-to-end user experience:

#### 1. User-Adjustable Crop Rectangle

**Test:** Navigate to the Profile page, click the avatar, select any JPEG or PNG image.
**Expected:** The `CropPhotoModal` opens with the image displayed normally (no black background). A draggable 3:4 crop rectangle appears over the image. Drag to reposition the rectangle. The crop region updates in real-time.
**Why human:** react-image-crop renders via DOM transforms; jsdom cannot exercise interactive drag behavior or confirm the absence of the black background Strict Mode regression.

#### 2. Avatar Updates After Successful Upload

**Test:** Complete a full upload cycle with a real backend. After clicking Salvar:
**Expected:** "Foto atualizada!" toast appears, modal closes, profile avatar immediately shows the new photo without page refresh.
**Why human:** Requires a live backend returning an updated `photoUrl`. React Query cache update is verified in tests, but the avatar re-render from a real URL requires visual confirmation.

#### 3. Backdrop Click Does Not Dismiss Modals

**Test:** Open any edit modal (name, birthday, phone, crop). Click outside the modal (on the backdrop).
**Expected:** Modal remains open. Only pressing Escape (where allowed) or clicking the cancel/close button dismisses it.
**Why human:** `AppDialog` backdrop-click guard is verified in code and in the updated `AppDialog.test.tsx`, but the interactive UX confirmation requires a real browser.

#### 4. Object URL Revocation (No Memory Leak)

**Test:** Open file picker, select a file, open CropPhotoModal, then close it via Cancelar. Repeat 5+ times.
**Expected:** Browser DevTools Memory tab shows no growing Blob URL accumulation.
**Why human:** `URL.revokeObjectURL` call is present and wired in `closeCropModal`, but actual cleanup effectiveness requires browser memory inspection. The Strict Mode fix (revoke in parent, not in modal) cannot be exercised in jsdom.

---

## Summary

Phase 5 goal is fully achieved in its final post-Plan-03 form. All 11 observable truths are verified in the actual codebase. Every artifact is substantive and wired. Both requirement IDs (PHOT-01, PHOT-02) are satisfied by real implementation. The library swap (`react-easy-crop` → `react-image-crop`) was completed cleanly with no residual imports. The zoom slider was correctly removed. Object URL lifecycle is managed in `ProfilePage`. `AppDialog` universally blocks backdrop-click. 102 tests pass with zero regressions. The previous VERIFICATION.md described a stale state — this report reflects the actual final implementation.

---

_Verified: 2026-03-12T18:15:00Z_
_Verifier: Claude (gsd-verifier)_
