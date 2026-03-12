---
phase: quick
plan: 6
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/profile/ProfileHero.tsx
  - src/utils/cropImage.ts
  - src/__tests__/cropImage.test.ts
autonomous: true
requirements: []
must_haves:
  truths:
    - "User can select any image format the browser can render (HEIC, WebP, GIF, BMP, etc.)"
    - "Large files (e.g. 20MB RAW photo) are accepted without upfront rejection"
    - "After cropping, output is always JPEG under 5MB regardless of input size/format"
  artifacts:
    - path: "src/components/profile/ProfileHero.tsx"
      provides: "File input accepting image/* with no size/type validation"
    - path: "src/utils/cropImage.ts"
      provides: "getCroppedImg with iterative JPEG quality reduction to stay under 5MB"
    - path: "src/__tests__/cropImage.test.ts"
      provides: "Tests for compression loop behavior"
  key_links:
    - from: "src/components/profile/ProfileHero.tsx"
      to: "src/utils/cropImage.ts"
      via: "CropPhotoModal calls getCroppedImg after user crops"
      pattern: "getCroppedImg"
---

<objective>
Remove upfront file type and size validation from ProfileHero so any browser-renderable image is accepted, and add iterative JPEG compression in getCroppedImg to guarantee the cropped output is always under 5MB.

Purpose: Users with HEIC, WebP, large photos, etc. are currently blocked by the format/size gate. Since cropping already converts to JPEG, the gate is unnecessary -- we just need to ensure the output fits under 5MB.
Output: Updated ProfileHero.tsx, cropImage.ts, cropImage.test.ts
</objective>

<execution_context>
@C:/Users/felip/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/felip/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/components/profile/ProfileHero.tsx
@src/utils/cropImage.ts
@src/__tests__/cropImage.test.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove file type/size validation from ProfileHero</name>
  <files>src/components/profile/ProfileHero.tsx</files>
  <action>
    1. Change the `accept` attribute on the file input from `"image/jpeg,image/png"` to `"image/*"` so the browser file picker shows all image types.
    2. Remove the file type check block (lines 34-39 that check `["image/jpeg", "image/png"].includes(file.type)` and show the "Formato nao suportado" snackbar).
    3. Remove the file size check block (lines 41-46 that check `file.size > 5 * 1024 * 1024` and show the "Arquivo muito grande" snackbar).
    4. The `useSnackbar` import and `enqueueSnackbar` destructuring can be removed since they are no longer used in this component.
    5. The `notistack` import can be removed.
    6. Keep the rest of handleFileSelect intact: null check on file, createObjectURL, calling onFileSelect.
  </action>
  <verify>
    <automated>npx vitest run --reporter=verbose 2>&1 | tail -30</automated>
  </verify>
  <done>ProfileHero accepts any image format and any file size. No snackbar validation on file selection. The file input accept attribute is "image/*".</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Add iterative JPEG compression to getCroppedImg</name>
  <files>src/utils/cropImage.ts, src/__tests__/cropImage.test.ts</files>
  <behavior>
    - Test: when canvas.toBlob produces a blob under 5MB at quality 0.9, it returns that blob directly (no re-compression)
    - Test: when canvas.toBlob produces a blob over 5MB at quality 0.9, it retries with decreasing quality (0.8, 0.7, ...) until under 5MB
    - Test: when blob cannot be compressed under 5MB even at minimum quality (0.1), it throws an error
  </behavior>
  <action>
    Update getCroppedImg in src/utils/cropImage.ts:

    1. Extract the toBlob call into a helper function `canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob>` that wraps the toBlob promise logic.
    2. Replace the single toBlob call at the end with an iterative compression loop:
       - Start at quality 0.9
       - Call canvasToJpegBlob, check if blob.size <= 5 * 1024 * 1024
       - If yes, return the blob
       - If no, reduce quality by 0.1 and retry
       - Minimum quality is 0.1 -- if still over 5MB at 0.1, throw an Error with message "Image too large to compress under 5MB"
    3. Keep the MAX_SIZE as a const: `const MAX_FILE_SIZE = 5 * 1024 * 1024;`

    Update tests in src/__tests__/cropImage.test.ts:

    1. Update the existing toBlob mock to create blobs with controllable sizes (use `new Blob([new ArrayBuffer(size)])` to create blobs of specific byte sizes).
    2. Add test: "returns blob directly when under 5MB at default quality" -- mock toBlob to return a 1MB blob. Verify toBlob called once with quality 0.9.
    3. Add test: "reduces quality iteratively when blob exceeds 5MB" -- mock toBlob to return 6MB on first call, 6MB on second call, then 3MB on third call. Verify toBlob called 3 times with qualities 0.9, 0.8, 0.7.
    4. Add test: "throws when compression cannot fit under 5MB" -- mock toBlob to always return 6MB. Expect getCroppedImg to reject with "Image too large to compress under 5MB".
    5. Adjust existing tests if the toBlob mock interface changed.
  </action>
  <verify>
    <automated>npx vitest run src/__tests__/cropImage.test.ts --reporter=verbose 2>&1 | tail -40</automated>
  </verify>
  <done>getCroppedImg iteratively reduces JPEG quality to ensure output is under 5MB. All tests pass including new compression behavior tests.</done>
</task>

</tasks>

<verification>
- `npx vitest run --reporter=verbose` -- all tests pass
- ProfileHero.tsx has no file type or size validation
- ProfileHero.tsx file input has `accept="image/*"`
- cropImage.ts has iterative quality reduction loop
</verification>

<success_criteria>
Any image format the browser can render is accepted for cropping. After cropping, output JPEG is guaranteed under 5MB via iterative quality reduction. All existing and new tests pass.
</success_criteria>

<output>
After completion, create `.planning/quick/6-aceite-imagens-de-qualquer-tamanho-e-for/6-SUMMARY.md`
</output>
