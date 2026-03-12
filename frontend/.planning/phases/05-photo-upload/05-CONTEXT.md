# Phase 5: Photo Upload - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can upload a profile photo by clicking the avatar, selecting a file, cropping it client-side to 3x4 ratio with drag/zoom controls, and confirming the upload. The cropped image is sent to the backend via `POST /accounts/me/photo` (FormData, max 5MB). After upload, the profile page reflects the new photo immediately.

</domain>

<decisions>
## Implementation Decisions

### Crop interaction
- Fixed 3x4 rectangular frame in center, user drags and zooms the image behind it (passport-photo style)
- Zoom slider below the crop area on desktop, plus pinch-to-zoom on mobile
- Rectangular crop shape (not circular overlay) — what you see is what you get
- Semi-transparent dark overlay outside the crop area for context

### Upload trigger
- Click the 80px avatar in ProfileHero to initiate upload
- Small circular camera icon badge at bottom-right of avatar as hint
- Click avatar opens native file picker directly (no intermediate modal)
- No "remove photo" option — clicking always replaces. Remove is out of scope

### Preview & confirm flow
- Crop modal IS the preview — no separate preview step
- User clicks "Salvar" directly from the crop view to upload
- LoadingButton in modal during upload (same pattern as EditNameModal/EditBirthdayModal)
- On success: "Foto atualizada!" toast, modal closes, avatar updates from React Query cache
- On error: modal stays open with error toast, crop state preserved for retry

### File constraints
- Accepted types: JPEG and PNG only (`image/jpeg, image/png`)
- Max file size: 5MB (matches backend `MaxFileSizeValidator`)
- Size validation happens before crop — reject immediately after file selection, don't open crop modal
- Output format: always JPEG (canvas.toBlob with quality 0.9), transparent PNGs get white background
- Validation errors shown as toast notifications via notistack

### Claude's Discretion
- Crop library choice (react-easy-crop or similar)
- Exact crop modal layout and spacing within AppDialog
- Zoom slider styling and range
- Camera badge icon size and positioning
- Canvas resolution for the cropped output

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AppDialog` (`src/components/common/AppDialog.tsx`): wrapper with fixed sizing (min 360, max 480) — crop modal should use this
- `ProfileHero` (`src/components/profile/ProfileHero.tsx`): 80px Avatar, needs camera badge overlay and onClick handler
- `uploadPhoto` API (`src/api/accounts.ts`): `POST /accounts/me/photo` with FormData already implemented
- `useAccount` hook: React Query cache — mutation onSuccess updates account data
- `useUpdateAccount` pattern: reference for creating `useUploadPhoto` mutation hook
- notistack: toast notifications already configured
- MUI LoadingButton: used in all other modals

### Established Patterns
- Mutation hooks in `src/hooks/` with onSuccess/onError at call site
- AppDialog for all modals with consistent sizing
- React Query cache update on mutation success
- Error toast via notistack on mutation failure

### Integration Points
- `ProfileHero` avatar → add camera badge + onClick → hidden file input
- File input onChange → validate size/type → open crop modal
- Crop modal "Salvar" → canvas.toBlob → uploadPhoto(file) mutation
- Mutation onSuccess → invalidate/update account query cache → avatar refreshes

</code_context>

<specifics>
## Specific Ideas

- Backend accepts `file` field name in FormData (FileInterceptor('file'))
- Backend max size: 5 * 1024 * 1024 bytes (5MB via MaxFileSizeValidator)
- Crop output as JPEG 0.9 quality keeps file size manageable
- Camera badge similar to WhatsApp/Google profile photo indicator
- Brazilian Portuguese labels: "Salvar", "Cancelar", "Foto atualizada!", "Arquivo muito grande (max 5MB)", "Formato nao suportado"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-photo-upload*
*Context gathered: 2026-03-12*
