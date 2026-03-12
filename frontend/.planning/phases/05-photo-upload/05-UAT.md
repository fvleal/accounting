---
status: diagnosed
phase: 05-photo-upload
source: [05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md]
started: 2026-03-12T19:00:00Z
updated: 2026-03-12T19:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Camera Badge on Avatar
expected: Profile page shows the avatar with a small circular camera icon badge at the bottom-right corner.
result: issue
reported: "passa, mas eu quero que fique centralizado em baixo com tons escuros, em vez de azul"
severity: cosmetic

### 2. Click Avatar Opens File Picker
expected: Clicking the avatar (or camera badge) opens the browser's native file picker dialog. No intermediate modal appears — file picker opens directly.
result: pass

### 3. Invalid File Type Rejected
expected: Selecting a non-JPEG/PNG file (e.g., a .gif or .pdf) shows an error toast notification and does NOT open the crop modal.
result: issue
reported: "passa, mostra o erro, mas está fechando o dialog"
severity: major

### 4. Oversized File Rejected
expected: Selecting a JPEG/PNG file larger than 5MB shows an error toast notification and does NOT open the crop modal.
result: issue
reported: "passa e esta fechando o crop modal"
severity: major

### 5. Crop Modal — No Black Background
expected: After selecting a valid JPEG/PNG under 5MB, the crop modal opens showing the image clearly — no black background or missing image. The image loads correctly even with React Strict Mode enabled.
result: issue
reported: "abre a imagem corretamente, mas que quero que ja fique fixo mostrando o retangulo 3x4 em vez de ter que clicar criando o retangulo. Ele já se apresenta visível e eu posso redimensioná-lo"
severity: major

### 6. Crop Interface — User-Adjustable Rectangle
expected: The crop modal uses a user-adjustable 3x4 rectangle that you can drag and resize over the image. There is NO zoom slider. The crop area has a strong white border and the area outside the rectangle has a darker semi-transparent overlay.
result: pass

### 7. Cancel Crop
expected: Clicking "Cancelar" closes the crop modal without uploading anything. The avatar remains unchanged.
result: pass

### 8. Save Cropped Photo
expected: Clicking "Salvar" shows a loading state on the button, uploads the cropped image. On success: "Foto atualizada!" toast appears, modal closes, and the avatar updates to show the new photo without requiring a page refresh.
result: pass

### 9. Modal Stays Open on Upload Error
expected: If the upload fails (e.g., network error or server error), the modal stays open with an error toast. The crop state is preserved so you can retry by clicking "Salvar" again. Clicking the backdrop (area outside the modal) does NOT dismiss it.
result: pass

## Summary

total: 9
passed: 5
issues: 4
pending: 0
skipped: 0

## Gaps

- truth: "Camera badge positioned centered at bottom of avatar with dark tones"
  status: failed
  reason: "User reported: passa, mas eu quero que fique centralizado em baixo com tons escuros, em vez de azul"
  severity: cosmetic
  test: 1
  root_cause: "Badge uses anchorOrigin bottom-right with bgcolor primary.main (blue #1976d2). User wants bottom-center with dark gray tones."
  artifacts:
    - path: "src/components/profile/ProfileHero.tsx"
      issue: "Line 59: anchorOrigin bottom-right instead of bottom-center. Line 66: bgcolor primary.main (blue) instead of dark gray."
  missing:
    - "Change anchorOrigin to { vertical: 'bottom', horizontal: 'center' } (line 59)"
    - "Change bgcolor from 'primary.main' to dark gray like 'grey.800' or '#424242' (line 66)"
  debug_session: ""

- truth: "Crop modal opens with 3x4 rectangle already visible and resizable, no need to click to create it"
  status: failed
  reason: "User reported: abre a imagem corretamente, mas que quero que ja fique fixo mostrando o retangulo 3x4 em vez de ter que clicar criando o retangulo. Ele já se apresenta visível e eu posso redimensioná-lo"
  severity: major
  test: 5
  root_cause: "CropPhotoModal initializes crop state as undefined (line 29: useState<Crop>()). react-image-crop requires an initial Crop object to show the rectangle on load. Without it, user must click+drag to create one."
  artifacts:
    - path: "src/components/profile/CropPhotoModal.tsx"
      issue: "Line 29: const [crop, setCrop] = useState<Crop>() — undefined initial crop means no rectangle visible on open"
  missing:
    - "Use react-image-crop's centerCrop + makeAspectCrop utilities to compute a centered 3:4 crop on image load (onLoad callback on img element)"
    - "Set both crop and completedCrop in the onLoad handler so Salvar works immediately"
  debug_session: ""

- truth: "Selecting oversized file shows error toast and does NOT close crop modal"
  status: failed
  reason: "User reported: passa e esta fechando o crop modal"
  severity: major
  test: 4
  root_cause: "ProfileHero validation logic correctly returns early without calling onFileSelect. But the crop modal is already open from a previous valid selection. The file input onChange fires, the error toast shows, but the native file dialog closing may trigger a blur/focus event that interacts with the AppDialog backdrop-click guard. Likely the file picker dialog overlay triggers a backdropClick event on the MUI Dialog when it closes."
  artifacts:
    - path: "src/components/profile/ProfileHero.tsx"
      issue: "File input onChange validation is correct, but user can trigger file picker while crop modal is open by clicking avatar area"
    - path: "src/components/common/AppDialog.tsx"
      issue: "Backdrop-click guard blocks clicks but native file dialog closing may trigger unexpected close events"
  missing:
    - "Investigate if file picker closing triggers MUI Dialog close. May need to prevent file input from being clickable while crop modal is open, or guard the close handler more carefully"
  debug_session: ""

- truth: "Selecting invalid file type shows error toast and does NOT close crop modal"
  status: failed
  reason: "User reported: passa, mostra o erro, mas está fechando o dialog"
  severity: major
  test: 3
  root_cause: "Same root cause as test 4 — file picker dialog closing while crop modal is open may trigger an unintended close event on the crop modal"
  artifacts:
    - path: "src/components/profile/ProfileHero.tsx"
      issue: "Same as test 4"
    - path: "src/components/common/AppDialog.tsx"
      issue: "Same as test 4"
  missing:
    - "Same fix as test 4 — prevent file selection interaction while crop modal is open"
  debug_session: ""
