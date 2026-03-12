---
phase: 5
slug: photo-upload
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + @testing-library/react 16.x |
| **Config file** | `vite.config.ts` (test block) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | PHOT-01 | unit | `npx vitest run src/__tests__/cropImage.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | PHOT-01 | unit | `npx vitest run src/__tests__/useUploadPhoto.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 1 | PHOT-01, PHOT-02 | unit | `npx vitest run src/__tests__/CropPhotoModal.test.tsx -t "rejects"` | ❌ W0 | ⬜ pending |
| 05-01-04 | 01 | 1 | PHOT-02 | unit | `npx vitest run src/__tests__/CropPhotoModal.test.tsx -t "renders"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/CropPhotoModal.test.tsx` — stubs for PHOT-01 (validation) and PHOT-02 (crop render)
- [ ] `src/__tests__/cropImage.test.ts` — stubs for getCroppedImg utility
- [ ] `src/__tests__/useUploadPhoto.test.ts` — stubs for mutation hook
- Note: Canvas and Blob APIs need mocking in jsdom (`HTMLCanvasElement.prototype.toBlob`, `URL.createObjectURL`)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drag/zoom crop interaction feels smooth | PHOT-02 | Touch/mouse interaction quality is subjective | 1. Select image 2. Drag to pan 3. Pinch/slider to zoom 4. Verify responsive feel |
| Camera badge visible on avatar | PHOT-01 | Visual appearance check | 1. Navigate to profile 2. Verify camera icon badge at bottom-right of avatar |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
