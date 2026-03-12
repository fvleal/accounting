---
status: complete
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

- truth: "Camera badge positioned at bottom-right of avatar with appropriate styling"
  status: failed
  reason: "User reported: passa, mas eu quero que fique centralizado em baixo com tons escuros, em vez de azul"
  severity: cosmetic
  test: 1
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Crop modal opens with 3x4 rectangle already visible and resizable, no need to click to create it"
  status: failed
  reason: "User reported: abre a imagem corretamente, mas que quero que ja fique fixo mostrando o retangulo 3x4 em vez de ter que clicar criando o retangulo. Ele já se apresenta visível e eu posso redimensioná-lo"
  severity: major
  test: 5
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Selecting oversized file shows error toast and does NOT open crop modal"
  status: failed
  reason: "User reported: passa e esta fechando o crop modal"
  severity: major
  test: 4
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Selecting invalid file type shows error toast and does NOT open crop modal"
  status: failed
  reason: "User reported: passa, mostra o erro, mas está fechando o dialog"
  severity: major
  test: 3
  artifacts: []
  missing: []
  debug_session: ""
