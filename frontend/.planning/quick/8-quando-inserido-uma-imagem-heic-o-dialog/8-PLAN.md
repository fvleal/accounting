---
phase: quick
plan: 8
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/profile/ProfileHero.tsx
  - src/components/profile/CropPhotoModal.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "User can select a HEIC image and see it rendered in the crop dialog"
    - "User sees a loading indicator while HEIC conversion is in progress"
    - "User sees an error snackbar if the image cannot be loaded or converted"
    - "Non-HEIC images continue to work as before with no conversion delay"
  artifacts:
    - path: "src/components/profile/ProfileHero.tsx"
      provides: "HEIC detection and conversion via heic2any before creating blob URL"
    - path: "src/components/profile/CropPhotoModal.tsx"
      provides: "onError handler on img tag for unsupported format fallback"
  key_links:
    - from: "src/components/profile/ProfileHero.tsx"
      to: "heic2any"
      via: "dynamic import for HEIC/HEIF file types"
      pattern: "heic2any"
    - from: "src/components/profile/ProfileHero.tsx"
      to: "src/components/profile/CropPhotoModal.tsx"
      via: "onFileSelect passes converted blob URL"
      pattern: "onFileSelect"
---

<objective>
Convert HEIC/HEIF images to JPEG on the client side before displaying them in the crop dialog, so users who select HEIC photos (common on iPhones) see the image rendered correctly instead of a blank dialog.

Purpose: Browsers cannot natively render HEIC images. The crop dialog's img tag silently fails, showing nothing. This fix converts HEIC to browser-renderable JPEG before passing to the dialog.
Output: Updated ProfileHero.tsx with HEIC conversion, updated CropPhotoModal.tsx with error handling.
</objective>

<execution_context>
@C:/Users/felip/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/felip/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/components/profile/ProfileHero.tsx
@src/components/profile/CropPhotoModal.tsx
@src/pages/ProfilePage.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install heic2any and add HEIC conversion in ProfileHero</name>
  <files>src/components/profile/ProfileHero.tsx</files>
  <action>
    1. Install heic2any: `npm install heic2any` and add type stub if needed (the library ships its own types; if not, add `declare module 'heic2any';` in src/vite-env.d.ts).

    2. In ProfileHero.tsx, update `handleFileSelect` to detect HEIC/HEIF files and convert them before creating the blob URL:

       a. Add state: `const [converting, setConverting] = useState(false);`
       b. Import `useSnackbar` from `notistack` for error feedback.
       c. Detect HEIC by checking `file.type === 'image/heic' || file.type === 'image/heif'` OR if file.type is empty (some browsers don't set MIME for HEIC), check `file.name` ending in `.heic` or `.heif` (case-insensitive).
       d. If HEIC detected:
          - Set `setConverting(true)`
          - Dynamically import heic2any: `const heic2any = (await import('heic2any')).default;`
          - Convert: `const jpegBlob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });`
          - heic2any can return Blob or Blob[] -- handle both: `const result = Array.isArray(jpegBlob) ? jpegBlob[0] : jpegBlob;`
          - Create blob URL from the converted result instead of the original file.
          - Set `setConverting(false)` in finally block.
          - Wrap in try/catch. On error: `enqueueSnackbar('Erro ao processar imagem.', { variant: 'error' })`, set converting false, return early.
       e. If NOT HEIC: keep current behavior (createObjectURL directly from file).
       f. While `converting` is true, show a visual indicator. Add a CircularProgress from MUI overlaid on the avatar (same position as camera icon, but larger). Disable the avatar click while converting.

    3. The `handleAvatarClick` guard should also check `converting`: `if (isCropOpen || converting) return;`
  </action>
  <verify>
    <automated>cd C:/Users/felip/Desktop/accounting/frontend && npx tsc --noEmit 2>&1 | tail -20</automated>
  </verify>
  <done>ProfileHero detects HEIC/HEIF files, converts them to JPEG via heic2any before passing blob URL to onFileSelect. Shows loading spinner during conversion. Shows error snackbar on failure. Non-HEIC files work as before.</done>
</task>

<task type="auto">
  <name>Task 2: Add img onError handler in CropPhotoModal</name>
  <files>src/components/profile/CropPhotoModal.tsx</files>
  <action>
    1. Add an `onError` handler to the `<img>` tag inside ReactCrop. When the image fails to load (e.g., an unsupported format that slipped through):
       - Call `enqueueSnackbar('Formato de imagem nao suportado.', { variant: 'error' })`
       - Call `onClose()` to dismiss the dialog automatically.

    2. The handler: `const onImageError = () => { enqueueSnackbar('Formato de imagem nao suportado.', { variant: 'error' }); onClose(); };`

    3. Add `onError={onImageError}` to the img element alongside the existing `onLoad={onImageLoad}`.
  </action>
  <verify>
    <automated>cd C:/Users/felip/Desktop/accounting/frontend && npx tsc --noEmit 2>&1 | tail -20 && npx vitest run --reporter=verbose 2>&1 | tail -30</automated>
  </verify>
  <done>CropPhotoModal has onError handler on img tag. If image fails to render, user sees error snackbar and dialog closes. TypeScript compiles without errors. All existing tests pass.</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` -- no type errors
- `npx vitest run` -- all existing tests pass
- Manual test: select a .heic file, see spinner, then crop dialog renders the converted JPEG
- Manual test: non-HEIC images (jpg, png, webp) work as before without delay
</verification>

<success_criteria>
HEIC/HEIF images are automatically converted to JPEG before display in the crop dialog. Users see a loading indicator during conversion. If conversion or rendering fails, an error message is shown. Non-HEIC formats continue working with zero overhead (no conversion attempted).
</success_criteria>

<output>
After completion, create `.planning/quick/8-quando-inserido-uma-imagem-heic-o-dialog/8-SUMMARY.md`
</output>
