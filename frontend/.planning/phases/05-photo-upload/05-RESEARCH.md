# Phase 5: Photo Upload - Research

**Researched:** 2026-03-12
**Domain:** Client-side image cropping, file upload via FormData
**Confidence:** HIGH

## Summary

Phase 5 adds profile photo upload with a client-side 3x4 crop interface. The existing codebase already has the `uploadPhoto` API function (`POST /accounts/me/photo` with FormData), the `AppDialog` modal wrapper, the `ProfileHero` avatar component, React Query mutation patterns, and notistack toasts. The main new dependency is a crop library.

`react-easy-crop` is the standard library for this use case -- 125k+ weekly npm downloads, 1.7k GitHub stars, supports drag/zoom/pinch interactions, rectangular crop shapes, and custom aspect ratios. The crop output (pixel coordinates) feeds into a canvas-based `getCroppedImg` utility that produces a JPEG Blob for upload.

**Primary recommendation:** Use `react-easy-crop` with a hand-written `getCroppedImg` canvas utility (~30 lines). Follow the existing modal/mutation patterns exactly.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Fixed 3x4 rectangular frame in center, user drags and zooms the image behind it (passport-photo style)
- Zoom slider below the crop area on desktop, plus pinch-to-zoom on mobile
- Rectangular crop shape (not circular overlay) -- what you see is what you get
- Semi-transparent dark overlay outside the crop area for context
- Click the 80px avatar in ProfileHero to initiate upload
- Small circular camera icon badge at bottom-right of avatar as hint
- Click avatar opens native file picker directly (no intermediate modal)
- No "remove photo" option -- clicking always replaces. Remove is out of scope
- Crop modal IS the preview -- no separate preview step
- User clicks "Salvar" directly from the crop view to upload
- LoadingButton in modal during upload (same pattern as EditNameModal/EditBirthdayModal)
- On success: "Foto atualizada!" toast, modal closes, avatar updates from React Query cache
- On error: modal stays open with error toast, crop state preserved for retry
- Accepted types: JPEG and PNG only (`image/jpeg, image/png`)
- Max file size: 5MB (matches backend `MaxFileSizeValidator`)
- Size validation happens before crop -- reject immediately after file selection, don't open crop modal
- Output format: always JPEG (canvas.toBlob with quality 0.9), transparent PNGs get white background
- Validation errors shown as toast notifications via notistack

### Claude's Discretion
- Crop library choice (react-easy-crop or similar)
- Exact crop modal layout and spacing within AppDialog
- Zoom slider styling and range
- Camera badge icon size and positioning
- Canvas resolution for the cropped output

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PHOT-01 | User can upload a profile photo with client-side 3x4 crop before submission | react-easy-crop provides drag/zoom crop with `aspect={3/4}`, getCroppedImg utility produces JPEG Blob, existing `uploadPhoto` API sends FormData |
| PHOT-02 | User sees a preview of the cropped photo before confirming upload | Crop modal IS the preview per user decision -- the live crop view shows exactly what will be uploaded; no separate preview step needed |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-easy-crop | ^5.x (latest) | Drag/zoom crop UI component | 125k+ weekly downloads, mobile-friendly, supports rect crop + custom aspect ratios, lightweight |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @mui/material | ^7.3.9 | Dialog, Slider, Button, Avatar, Badge | Modal chrome, zoom slider, camera badge |
| @mui/icons-material | ^7.3.9 | CameraAlt icon | Camera badge on avatar |
| @tanstack/react-query | ^5.90.21 | Mutation + cache update | useUploadPhoto hook |
| notistack | ^3.0.2 | Toast notifications | Success/error feedback |
| axios | ^1.13.6 | HTTP client | Already used by uploadPhoto API |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-easy-crop | react-image-crop | react-image-crop requires user to draw the crop box; react-easy-crop has fixed-frame drag model which matches the "passport photo" UX decision |
| react-easy-crop | manual canvas crop | Massive effort for drag/zoom/pinch/touch -- no reason to hand-roll |

**Installation:**
```bash
npm install react-easy-crop
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/profile/
│   ├── ProfileHero.tsx          # Modified: add camera badge + onClick + hidden file input
│   └── CropPhotoModal.tsx       # NEW: crop UI with react-easy-crop inside AppDialog
├── hooks/
│   └── useUploadPhoto.ts        # NEW: mutation hook following useUpdateAccount pattern
└── utils/
    └── cropImage.ts             # NEW: getCroppedImg canvas utility
```

### Pattern 1: Hidden File Input Triggered by Avatar Click
**What:** A hidden `<input type="file">` triggered programmatically when the avatar is clicked. File selection triggers validation, then opens crop modal.
**When to use:** When the trigger element is not a traditional form control (in this case, the Avatar).
**Example:**
```typescript
// In ProfileHero.tsx
const fileInputRef = useRef<HTMLInputElement>(null);

const handleAvatarClick = () => {
  fileInputRef.current?.click();
};

const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validate type
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    enqueueSnackbar('Formato nao suportado. Use JPEG ou PNG.', { variant: 'error' });
    return;
  }
  // Validate size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    enqueueSnackbar('Arquivo muito grande (max 5MB).', { variant: 'error' });
    return;
  }

  // Create object URL for cropper
  const imageUrl = URL.createObjectURL(file);
  onOpenCrop(imageUrl);
};

// Reset input value so re-selecting the same file triggers onChange
<input
  ref={fileInputRef}
  type="file"
  accept="image/jpeg,image/png"
  hidden
  onChange={handleFileSelect}
/>
```

### Pattern 2: react-easy-crop Cropper Configuration
**What:** Fixed 3x4 crop frame with drag/zoom.
**When to use:** The crop modal.
**Example:**
```typescript
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';

// State
const [crop, setCrop] = useState({ x: 0, y: 0 });
const [zoom, setZoom] = useState(1);
const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

<Cropper
  image={imageUrl}
  crop={crop}
  zoom={zoom}
  aspect={3 / 4}
  cropShape="rect"
  showGrid={true}
  onCropChange={setCrop}
  onZoomChange={setZoom}
  onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
/>
```

### Pattern 3: getCroppedImg Canvas Utility
**What:** Takes image URL + pixel crop area, returns a JPEG Blob via canvas.
**When to use:** Called when user clicks "Salvar" to produce the upload-ready file.
**Example:**
```typescript
// src/utils/cropImage.ts
import type { Area } from 'react-easy-crop';

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
    // No crossOrigin needed -- operating on local blob URL
  });
}

export async function getCroppedImg(
  imageSrc: string,
  cropArea: Area,
): Promise<Blob> {
  const img = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Output at crop pixel dimensions (matches source resolution)
  canvas.width = cropArea.width;
  canvas.height = cropArea.height;

  // White background for transparent PNGs
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(
    img,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    cropArea.width,
    cropArea.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      },
      'image/jpeg',
      0.9,
    );
  });
}
```

### Pattern 4: useUploadPhoto Mutation Hook
**What:** Follows exact same pattern as useUpdateAccount.
**Example:**
```typescript
// src/hooks/useUploadPhoto.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadPhoto } from '../api/accounts';
import type { Account } from '../types/account';

export function useUploadPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadPhoto(file),
    onSuccess: (account: Account) => {
      queryClient.setQueryData(['account', 'me'], account);
    },
  });
}
```

### Anti-Patterns to Avoid
- **Setting `crossOrigin` on images loaded from blob URLs:** Blob URLs are same-origin by definition. Adding `crossOrigin="anonymous"` on a blob URL can cause loading failures in some browsers.
- **Not resetting file input value:** If user selects the same file twice, `onChange` won't fire unless `input.value = ''` is set after each selection.
- **Using URL.createObjectURL without revoking:** Memory leak. Revoke the object URL when the crop modal closes or component unmounts.
- **Passing the original File directly to the cropper:** react-easy-crop expects a URL string, not a File object. Must use `URL.createObjectURL(file)`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag/zoom/pinch crop interaction | Custom canvas touch handlers | react-easy-crop | Touch normalization, momentum, pinch-to-zoom on mobile are extremely complex |
| Crop overlay rendering | Custom canvas overlapping | react-easy-crop built-in overlay | Handles dark overlay, grid lines, responsive sizing |

**Key insight:** The only custom code needed is the ~30-line `getCroppedImg` canvas utility. Everything else uses existing libraries.

## Common Pitfalls

### Pitfall 1: Canvas Security Error (Tainted Canvas)
**What goes wrong:** `canvas.toBlob()` throws SecurityError when the image was loaded with cross-origin restrictions.
**Why it happens:** Setting `crossOrigin="anonymous"` on an `<img>` that loads a blob URL, or loading an image from a different origin without CORS headers.
**How to avoid:** Use `URL.createObjectURL(file)` for local files -- these are always same-origin. Never set `crossOrigin` on blob URLs. This is explicitly called out in the success criteria.
**Warning signs:** "SecurityError: The operation is insecure" in browser console.

### Pitfall 2: File Input Not Firing onChange for Same File
**What goes wrong:** User selects a file, cancels crop, clicks avatar again, selects the same file -- nothing happens.
**Why it happens:** Browser `<input type="file">` only fires `onChange` when the value changes.
**How to avoid:** Reset `input.value = ''` in the onChange handler after reading the file, or on every avatar click before triggering `.click()`.
**Warning signs:** Second selection of same file does nothing.

### Pitfall 3: Object URL Memory Leak
**What goes wrong:** Each `URL.createObjectURL()` allocates browser memory that persists until revoked or page unload.
**Why it happens:** Forgetting to call `URL.revokeObjectURL()` when done.
**How to avoid:** Revoke in the crop modal's close/cleanup handler or in a `useEffect` cleanup.
**Warning signs:** Memory usage grows with each file selection in DevTools.

### Pitfall 4: Cropper Container Needs Explicit Height
**What goes wrong:** Crop area renders with zero height or collapses.
**Why it happens:** react-easy-crop's `Cropper` uses `position: absolute` and needs a parent with explicit dimensions.
**How to avoid:** Wrap `Cropper` in a `<Box>` with `position: relative` and a fixed height (e.g., 350px or 400px).
**Warning signs:** Cropper invisible or tiny.

### Pitfall 5: MUI Slider vs Zoom Range
**What goes wrong:** Zoom feels too sensitive or too sluggish.
**Why it happens:** Default zoom range 1-3 with default MUI Slider step (0.01) can feel different than expected.
**How to avoid:** Use `min={1}`, `max={3}`, `step={0.01}` on MUI Slider; match with react-easy-crop's `minZoom`/`maxZoom`.
**Warning signs:** Jerky zoom behavior.

## Code Examples

### CropPhotoModal Structure (Recommended Layout)
```typescript
// src/components/profile/CropPhotoModal.tsx
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Slider,
  Box,
} from '@mui/material';
import { AppDialog } from '../common/AppDialog';

interface CropPhotoModalProps {
  open: boolean;
  imageUrl: string;
  onClose: () => void;
  onConfirm: (croppedAreaPixels: Area) => void;
  isUploading: boolean;
}

// Cropper needs a container with position: relative and explicit height
// DialogContent holds: crop area (fixed height) + zoom slider below
// DialogActions: Cancelar + Salvar (LoadingButton pattern)
```

### Camera Badge on Avatar (ProfileHero)
```typescript
import { Badge, Avatar, Box } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';

<Box
  onClick={handleAvatarClick}
  sx={{ cursor: 'pointer', position: 'relative' }}
>
  <Badge
    overlap="circular"
    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    badgeContent={
      <Box
        sx={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          bgcolor: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CameraAltIcon sx={{ fontSize: 14, color: 'white' }} />
      </Box>
    }
  >
    <Avatar ... />
  </Badge>
</Box>
```

### Blob to File Conversion for Upload
```typescript
// The uploadPhoto API expects a File, but getCroppedImg returns a Blob
// Convert Blob to File:
const blob = await getCroppedImg(imageUrl, croppedAreaPixels);
const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
// Then: mutation.mutate(file);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-easy-crop v4 (default export) | react-easy-crop v5 (default export maintained) | 2024 | No breaking changes for basic usage |
| Custom file upload with XMLHttpRequest | FormData with axios | Stable | Already implemented in codebase |

**Deprecated/outdated:**
- None relevant -- react-easy-crop API has been stable.

## Open Questions

1. **Canvas output resolution**
   - What we know: By default, getCroppedImg uses the crop pixel dimensions from the source image. A 4000x6000 photo cropped to 3x4 at full zoom would produce a very large output.
   - What's unclear: Whether to cap output dimensions (e.g., max 600x800) to keep file size under 5MB after JPEG encoding.
   - Recommendation: Start without capping. JPEG 0.9 quality compresses well. If uploads frequently exceed 5MB, add a max dimension cap in getCroppedImg (scale canvas down proportionally). The backend's 5MB limit provides a natural safety net -- if the cropped JPEG exceeds 5MB, the upload will fail with an error toast and user can zoom in more.

2. **Object URL lifecycle management**
   - What we know: createObjectURL must be revoked to free memory.
   - Recommendation: Revoke in CropPhotoModal's cleanup (when modal closes or imageUrl prop changes). ProfileHero should not manage the URL lifecycle -- pass it down and let the modal own it.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + @testing-library/react 16.x |
| Config file | `vite.config.ts` (test block) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PHOT-01 | File validation rejects wrong type/size before crop opens | unit | `npx vitest run src/__tests__/CropPhotoModal.test.tsx -t "rejects"` | No - Wave 0 |
| PHOT-01 | getCroppedImg produces a JPEG Blob from canvas | unit | `npx vitest run src/__tests__/cropImage.test.ts` | No - Wave 0 |
| PHOT-01 | useUploadPhoto mutation calls uploadPhoto API and updates cache | unit | `npx vitest run src/__tests__/useUploadPhoto.test.ts` | No - Wave 0 |
| PHOT-02 | CropPhotoModal renders Cropper with correct aspect ratio | unit | `npx vitest run src/__tests__/CropPhotoModal.test.tsx -t "renders"` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/CropPhotoModal.test.tsx` -- covers PHOT-01 (validation) and PHOT-02 (crop render)
- [ ] `src/__tests__/cropImage.test.ts` -- covers getCroppedImg utility
- [ ] `src/__tests__/useUploadPhoto.test.ts` -- covers mutation hook
- Note: Canvas and Blob APIs need mocking in jsdom. `HTMLCanvasElement.prototype.toBlob` must be mocked. `URL.createObjectURL` must be mocked.

## Sources

### Primary (HIGH confidence)
- [react-easy-crop GitHub](https://github.com/ValentinH/react-easy-crop) - Props API, crop shape, aspect ratio, Area type
- [react-easy-crop npm](https://www.npmjs.com/package/react-easy-crop) - 125k+ weekly downloads, active maintenance
- Existing codebase (`src/api/accounts.ts`, `src/hooks/useUpdateAccount.ts`, `src/components/common/AppDialog.tsx`) - Established patterns

### Secondary (MEDIUM confidence)
- [DEV.to: Cropping & Uploading Profile Pictures in React with TypeScript](https://dev.to/sukanta47/cropping-uploading-profile-pictures-in-react-with-typescript-and-react-easy-crop-5dl9) - getCroppedImg implementation pattern
- [OpenReplay: Image Manipulation with react-easy-crop](https://blog.openreplay.com/image-manipulation-with-react-easy-crop/) - Canvas toBlob pattern

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - react-easy-crop is the dominant library for this use case, well-documented, stable API
- Architecture: HIGH - follows exact patterns already established in the codebase (mutation hooks, AppDialog modals, React Query cache updates)
- Pitfalls: HIGH - canvas tainted origin, file input reset, object URL leaks are well-documented browser behaviors

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable domain, libraries are mature)
