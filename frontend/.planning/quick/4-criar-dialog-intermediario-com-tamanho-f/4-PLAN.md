---
phase: quick-4
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/common/AppDialog.tsx
  - src/components/profile/EditNameModal.tsx
  - src/components/profile/EditBirthdayModal.tsx
  - src/components/profile/EditPhoneModal.tsx
  - src/__tests__/AppDialog.test.tsx
  - src/__tests__/EditNameModal.test.tsx
  - src/__tests__/EditBirthdayModal.test.tsx
autonomous: true
requirements: [QUICK-4]

must_haves:
  truths:
    - "All modals render at a consistent width regardless of content"
    - "Validation messages appearing/disappearing do not change dialog dimensions"
    - "All three edit modals use AppDialog instead of MUI Dialog directly"
  artifacts:
    - path: "src/components/common/AppDialog.tsx"
      provides: "Wrapper around MUI Dialog with fixed sizing"
      exports: ["AppDialog"]
    - path: "src/components/profile/EditNameModal.tsx"
      provides: "Name editing modal using AppDialog"
    - path: "src/components/profile/EditBirthdayModal.tsx"
      provides: "Birthday editing modal using AppDialog"
    - path: "src/components/profile/EditPhoneModal.tsx"
      provides: "Phone editing modal using AppDialog"
  key_links:
    - from: "src/components/profile/EditNameModal.tsx"
      to: "src/components/common/AppDialog.tsx"
      via: "import { AppDialog }"
      pattern: "import.*AppDialog.*from.*common/AppDialog"
    - from: "src/components/profile/EditBirthdayModal.tsx"
      to: "src/components/common/AppDialog.tsx"
      via: "import { AppDialog }"
      pattern: "import.*AppDialog.*from.*common/AppDialog"
    - from: "src/components/profile/EditPhoneModal.tsx"
      to: "src/components/common/AppDialog.tsx"
      via: "import { AppDialog }"
      pattern: "import.*AppDialog.*from.*common/AppDialog"
---

<objective>
Create an AppDialog wrapper component with fixed sizing and migrate all existing modals to use it.

Purpose: Ensure consistent dialog dimensions across the app. Prevent layout shifts when validation messages appear/disappear.
Output: AppDialog component in src/components/common/, all modals migrated.
</objective>

<execution_context>
@C:/Users/felip/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/felip/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/components/profile/EditNameModal.tsx
@src/components/profile/EditBirthdayModal.tsx
@src/components/profile/EditPhoneModal.tsx

<interfaces>
<!-- All three modals currently use the same MUI Dialog pattern: -->

From @mui/material (current imports in all modals):
```typescript
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';
```

Common Dialog usage pattern (identical in all three):
```tsx
<Dialog
  open
  disableEscapeKeyDown
  onClose={(_e, reason) => { if (reason === 'backdropClick') return; }}
>
  <DialogTitle>...</DialogTitle>
  <DialogContent>...</DialogContent>
  <DialogActions>...</DialogActions>
</Dialog>
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create AppDialog wrapper component</name>
  <files>src/components/common/AppDialog.tsx, src/__tests__/AppDialog.test.tsx</files>
  <action>
    Create directory src/components/common/ if it does not exist.

    Create src/components/common/AppDialog.tsx:
    - Import Dialog and DialogProps from @mui/material
    - Export AppDialog component that wraps MUI Dialog
    - Accept all DialogProps via spread (using Omit to exclude PaperProps if overriding, or merge PaperProps.sx)
    - Apply PaperProps.sx with:
      - minWidth: 360 (reasonable minimum for form inputs on mobile)
      - maxWidth: 480 (cap for larger screens)
      - width: '100%' (fill up to maxWidth)
    - Apply DialogContent sizing via slotProps or a sx override on the Paper:
      - minHeight: 120 on the Paper to prevent size jumping
    - Bake in the common behavioral props that ALL modals use:
      - disableEscapeKeyDown={true}
      - onClose guard: if reason === 'backdropClick', prevent close. Otherwise call the passed onClose.
      - This removes duplication from every modal consumer.
    - Allow consumers to pass additional PaperProps.sx that get merged (use spread, consumer sx wins for overrides)
    - Export the component as a named export

    Signature should be approximately:
    ```typescript
    interface AppDialogProps extends Omit<DialogProps, 'onClose'> {
      onClose: () => void;
    }
    export function AppDialog({ onClose, children, PaperProps, ...rest }: AppDialogProps) { ... }
    ```

    The onClose simplification: AppDialog handles the MUI onClose signature internally (filtering backdropClick), and exposes a simple () => void to consumers. This removes the repetitive (_e, reason) => { if (reason === 'backdropClick') return; } pattern from every modal.

    Create src/__tests__/AppDialog.test.tsx:
    - Test that AppDialog renders children
    - Test that minWidth and maxWidth are applied via PaperProps
    - Test that backdrop click does NOT call onClose
    - Test that the onClose callback is callable (for Cancel button usage by consumers)
  </action>
  <verify>
    <automated>npx vitest run src/__tests__/AppDialog.test.tsx</automated>
  </verify>
  <done>AppDialog component exists with fixed sizing, backdrop guard, and passing tests.</done>
</task>

<task type="auto">
  <name>Task 2: Migrate all modals to use AppDialog</name>
  <files>src/components/profile/EditNameModal.tsx, src/components/profile/EditBirthdayModal.tsx, src/components/profile/EditPhoneModal.tsx, src/__tests__/EditNameModal.test.tsx, src/__tests__/EditBirthdayModal.test.tsx</files>
  <action>
    For each of the three modal files (EditNameModal, EditBirthdayModal, EditPhoneModal):

    1. Replace `import { Dialog, ...rest } from '@mui/material'` with:
       - `import { AppDialog } from '../common/AppDialog'`
       - Keep importing DialogTitle, DialogContent, DialogActions, TextField, Button from @mui/material

    2. Replace the `<Dialog>` JSX with `<AppDialog>`:
       - Remove disableEscapeKeyDown prop (baked into AppDialog)
       - Remove the onClose={(_e, reason) => { if (reason === 'backdropClick') return; }} handler
       - Pass simple onClose={onClose} instead
       - Keep open prop as-is

    3. The closing tag changes from </Dialog> to </AppDialog>

    After migration, each modal's Dialog usage should look like:
    ```tsx
    <AppDialog open onClose={onClose}>
      <DialogTitle>...</DialogTitle>
      <DialogContent>...</DialogContent>
      <DialogActions>...</DialogActions>
    </AppDialog>
    ```

    Update existing tests (EditNameModal.test.tsx, EditBirthdayModal.test.tsx) if they reference Dialog directly or test backdrop behavior that is now in AppDialog.
  </action>
  <verify>
    <automated>npx vitest run src/__tests__/EditNameModal.test.tsx src/__tests__/EditBirthdayModal.test.tsx src/__tests__/AppDialog.test.tsx</automated>
  </verify>
  <done>All three modals import AppDialog instead of MUI Dialog. No direct Dialog import from @mui/material in any modal file. All existing tests pass.</done>
</task>

</tasks>

<verification>
- grep -r "from '@mui/material'" src/components/profile/Edit*.tsx should NOT include "Dialog" in the imported names (DialogTitle, DialogContent, DialogActions are fine)
- grep -r "AppDialog" src/components/profile/Edit*.tsx should match all three files
- npx vitest run -- all tests pass
</verification>

<success_criteria>
- AppDialog component exists at src/components/common/AppDialog.tsx with minWidth: 360, maxWidth: 480, and stable height
- All three edit modals (Name, Birthday, Phone) use AppDialog instead of MUI Dialog
- No modal has disableEscapeKeyDown or backdropClick guard inline (handled by AppDialog)
- All tests pass
</success_criteria>

<output>
After completion, create `.planning/quick/4-criar-dialog-intermediario-com-tamanho-f/4-SUMMARY.md`
</output>
