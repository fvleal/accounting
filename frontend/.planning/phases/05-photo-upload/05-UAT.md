---
status: diagnosed
phase: 05-photo-upload
source: [05-01-SUMMARY.md, 05-02-SUMMARY.md]
started: 2026-03-12T18:00:00Z
updated: 2026-03-12T18:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Camera Badge on Avatar
expected: Profile page shows the avatar with a small circular camera icon badge at the bottom-right corner.
result: pass

### 2. Click Avatar Opens File Picker
expected: Clicking the avatar opens the browser's native file picker dialog. No intermediate modal appears — file picker opens directly.
result: issue
reported: "abre mas fica todo fundo preto"
severity: major

### 3. Invalid File Type Rejected
expected: Selecting a non-JPEG/PNG file (e.g., a .gif or .pdf) shows an error toast notification and does NOT open the crop modal.
result: pass

### 4. Oversized File Rejected
expected: Selecting a JPEG/PNG file larger than 5MB shows an error toast notification and does NOT open the crop modal.
result: pass

### 5. Crop Interface Opens
expected: After selecting a valid JPEG/PNG under 5MB, a crop modal opens showing the image with a fixed 3x4 rectangular crop frame in the center. The image can be dragged and zoomed behind the frame. Semi-transparent dark overlay appears outside the crop area.
result: issue
reported: "quero que seja com react image crop nao com uma barrinha de amplia"
severity: major

### 6. Zoom Slider Works
expected: A zoom slider appears below the crop area. Dragging it adjusts the zoom level of the image behind the crop frame smoothly.
result: issue
reported: "quero que seja uma retangulo mais forte mostrando a imagem com o fundo mais escuro. o retangulo 3x4 define a imagem a ser cortada, nao precisa de zoom"
severity: major

### 7. Cancel Crop
expected: Clicking "Cancelar" closes the crop modal without uploading anything. The avatar remains unchanged.
result: pass

### 8. Save Cropped Photo
expected: Clicking "Salvar" shows a loading state on the button, uploads the cropped image. On success: "Foto atualizada!" toast appears, modal closes, and the avatar updates to show the new photo without requiring a page refresh.
result: issue
reported: "da certo, mas quando falha esta fechando o modal"
severity: major

## Summary

total: 8
passed: 4
issues: 4
pending: 0
skipped: 0

## Gaps

- truth: "File picker opens and crop modal displays correctly without visual glitches"
  status: failed
  reason: "User reported: abre mas fica todo fundo preto"
  severity: major
  test: 2
  root_cause: "React 18 Strict Mode double-mount revokes the object URL in useEffect cleanup before Cropper re-mounts, leaving bgcolor:'black' container visible with no image"
  artifacts:
    - path: "src/components/profile/CropPhotoModal.tsx"
      issue: "useEffect cleanup calls URL.revokeObjectURL(imageUrl) which fires on Strict Mode unmount/remount cycle, invalidating the URL"
  missing:
    - "Move object URL revocation to ProfilePage (the URL creator), delete useEffect cleanup from CropPhotoModal"
  debug_session: ""

- truth: "Crop interface uses react-image-crop with user-adjustable rectangle, not fixed frame with zoom slider"
  status: failed
  reason: "User reported: quero que seja com react image crop nao com uma barrinha de amplia"
  severity: major
  test: 5
  root_cause: "Used react-easy-crop (fixed frame, drag image behind it) instead of react-image-crop (user draws/adjusts crop rectangle on image)"
  artifacts:
    - path: "src/components/profile/CropPhotoModal.tsx"
      issue: "Uses react-easy-crop Cropper component instead of react-image-crop ReactCrop"
    - path: "package.json"
      issue: "Has react-easy-crop dependency, needs react-image-crop instead"
  missing:
    - "Replace react-easy-crop with react-image-crop, rewrite CropPhotoModal to use ReactCrop with user-adjustable 3x4 rectangle"
    - "Remove zoom slider, remove react-easy-crop dependency"
    - "Update getCroppedImg utility to work with react-image-crop's PercentCrop/PixelCrop output format"
  debug_session: ""

- truth: "Crop area shows strong rectangle with darker overlay, no zoom slider needed"
  status: failed
  reason: "User reported: quero que seja uma retangulo mais forte mostrando a imagem com o fundo mais escuro. o retangulo 3x4 define a imagem a ser cortada, nao precisa de zoom"
  severity: major
  test: 6
  root_cause: "react-easy-crop uses subtle overlay; user wants strong rectangle border with darker background outside crop area, and no zoom slider"
  artifacts:
    - path: "src/components/profile/CropPhotoModal.tsx"
      issue: "Has MUI Slider for zoom control which user doesn't want; overlay styling is from react-easy-crop defaults"
  missing:
    - "Remove zoom slider entirely"
    - "Use react-image-crop's built-in darker overlay or custom CSS for stronger crop rectangle border and darker background"
  debug_session: ""

- truth: "On upload error, modal stays open with error toast and crop state preserved for retry"
  status: failed
  reason: "User reported: da certo, mas quando falha esta fechando o modal"
  severity: major
  test: 8
  root_cause: "AppDialog does not block backdrop-click dismissal; MUI v5 removed disableBackdropClick prop, so clicking outside modal during/after error closes it via onClose -> setCropImageUrl(null) -> unmount"
  artifacts:
    - path: "src/components/common/AppDialog.tsx"
      issue: "onClose unconditionally forwarded to MUI Dialog without checking reason argument; backdrop click triggers dismissal"
    - path: "src/pages/ProfilePage.tsx"
      issue: "onClose={() => setCropImageUrl(null)} destroys modal state on any close event"
  missing:
    - "In AppDialog or CropPhotoModal, guard onClose to ignore backdropClick reason: onClose={(_, reason) => { if (reason === 'backdropClick') return; onClose(); }}"
  debug_session: ""
