# Phase 4: Profile Editing - Research

**Researched:** 2026-03-12
**Domain:** React form modals, React Query mutations, MUI Dialog
**Confidence:** HIGH

## Summary

Phase 4 adds edit modals for name and birthday fields on the profile page. The project already has all required libraries installed (react-hook-form, MUI, @tanstack/react-query, notistack) and established patterns for mutations (useCreateAccount), form validation (OnboardingPage nameRules), and toast notifications. Phone editing (EDIT-03) is deferred to v2 -- the phone field will be hidden from the profile page entirely.

The implementation is a well-trodden pattern: click row opens Dialog, Dialog contains a react-hook-form form, submit triggers useMutation, success updates React Query cache and shows toast, error shows toast and keeps modal open. No new libraries are needed.

**Primary recommendation:** Follow the existing useCreateAccount + OnboardingPage patterns exactly. Extract shared name validation rules. Use MUI Dialog with controlled open state managed by ProfilePage.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- MUI Dialog (centered overlay with backdrop) for all edit modals
- Separate modal component per field: EditNameModal, EditBirthdayModal
- MUI LoadingButton pattern for Save button (spinner + disabled while request in flight), Cancel also disabled during save
- Modal only closable via Cancel button -- no backdrop click or Escape key dismiss
- Clicking a ProfileFieldRow with `editable` prop opens the corresponding modal
- Name validation: same rules as onboarding -- minimum 2 words, each 2+ characters. Validation on blur
- Birthday: native HTML date input (type="date"). No min/max date constraints
- Wait for server response before closing modal (not optimistic)
- On success: close modal, update React Query cache with returned Account data, show success toast
- On error: modal stays open, error toast via notistack describes the failure
- Phone field hidden from profile page entirely (remove from ProfilePage render)
- No EditPhoneModal in this phase
- Brazilian Portuguese labels: "Editar nome", "Editar data de nascimento", "Salvar", "Cancelar"
- Success toasts: "Nome atualizado!", "Data de nascimento atualizada!"

### Claude's Discretion
- Exact modal sizing and padding
- Form library choice (react-hook-form, formik, or controlled state)
- Phone mask input library selection (for v2)
- Validation error message wording
- Date input styling in dark mode

### Deferred Ideas (OUT OF SCOPE)
- Phone editing (EDIT-03) -- deferred to v2, depends on backend phone verification flow
- Phone "not verified" badge -- deferred with EDIT-03
- Phone field visibility on profile page -- hidden until v2
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EDIT-01 | User can edit full name via modal with validation | EditNameModal component using react-hook-form with shared nameRules, useUpdateAccount mutation, Dialog pattern |
| EDIT-02 | User can edit date of birth via modal with date picker | EditBirthdayModal with native date input (type="date"), useUpdateAccount mutation, same Dialog pattern |
| EDIT-03 | User can edit phone via modal (with badge) | DEFERRED to v2. Phone field hidden from profile page. No implementation needed |
| EDIT-04 | User sees updated values immediately after saving (rollback on error) | React Query cache update via queryClient.setQueryData on mutation success; error toast on failure, modal stays open for retry |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-hook-form | ^7.71.2 | Form state + validation in modals | Already used in OnboardingPage, project standard |
| @tanstack/react-query | ^5.90.21 | Server state, mutations, cache updates | Already used for useAccount, useCreateAccount |
| @mui/material | ^7.3.9 | Dialog, TextField, Button components | Project standard UI library |
| notistack | ^3.0.2 | Toast notifications for success/error | Already configured and used |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @mui/icons-material | ^7.3.9 | Icons (ChevronRight already used) | Already in ProfileFieldRow |

### No New Dependencies Needed
This phase requires zero new npm installs. Everything is already in the project.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   └── profile/
│       ├── EditNameModal.tsx        # NEW - name edit dialog
│       ├── EditBirthdayModal.tsx     # NEW - birthday edit dialog
│       ├── ProfileFieldRow.tsx      # MODIFY - add onClick prop
│       ├── ProfileHero.tsx          # EXISTING
│       ├── ProfileSectionCard.tsx   # EXISTING
│       └── ProfileSkeleton.tsx      # EXISTING
├── hooks/
│   ├── useAccount.ts               # EXISTING
│   ├── useCreateAccount.ts         # EXISTING (reference pattern)
│   └── useUpdateAccount.ts         # NEW - PATCH mutation hook
├── utils/
│   └── validation.ts               # NEW - shared nameRules extracted from OnboardingPage
└── pages/
    └── ProfilePage.tsx              # MODIFY - modal state, remove phone row
```

### Pattern 1: useUpdateAccount Mutation Hook
**What:** Mirrors useCreateAccount pattern exactly. Calls `updateAccount` API, updates React Query cache on success.
**When to use:** Both EditNameModal and EditBirthdayModal share this single hook.
**Example:**
```typescript
// Based on existing useCreateAccount pattern
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateAccount } from '../api/accounts';
import type { Account } from '../types/account';

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; birthDate?: string } }) =>
      updateAccount(id, data),
    onSuccess: (account: Account) => {
      queryClient.setQueryData(['account', 'me'], account);
    },
  });
}
```

### Pattern 2: Edit Modal Component
**What:** MUI Dialog with react-hook-form, LoadingButton for save, controlled open/close.
**When to use:** Each editable field gets its own modal component.
**Key behaviors:**
- `open` and `onClose` props from parent (ProfilePage)
- `account` prop provides current value as defaultValue
- `disableEscapeKeyDown` on Dialog to prevent accidental close
- `onClose` handler on Dialog backdrop set to no-op (or use `slotProps.backdrop.onClick` to prevent)
- Cancel and Save buttons in DialogActions
- Both buttons disabled while `mutation.isPending`
- On success: call `onClose()`, show success toast
- On error: show error toast, modal stays open

### Pattern 3: ProfilePage Modal State
**What:** ProfilePage manages which modal is open via state.
**Example:**
```typescript
const [editModal, setEditModal] = useState<'name' | 'birthday' | null>(null);
```
ProfileFieldRow receives `onClick` prop; clicking opens the corresponding modal.

### Pattern 4: Shared Name Validation
**What:** Extract `nameRules` from OnboardingPage into `src/utils/validation.ts` so both OnboardingPage and EditNameModal use the same rules.
**Current location:** OnboardingPage lines 22-31 (hardcoded in component).

### Anti-Patterns to Avoid
- **Optimistic updates:** User decision is explicit -- wait for server response. Do NOT close modal before server confirms.
- **Single generic EditModal:** User decided separate modal per field. Don't try to make one generic modal.
- **Backdrop/Escape close:** User explicitly wants modal only closable via Cancel button. Must set `disableEscapeKeyDown` and prevent backdrop click.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form state management | useState for each field + manual validation | react-hook-form Controller | Already used in project, handles blur validation, error state |
| Cache invalidation | Manual refetch after mutation | queryClient.setQueryData with returned Account | Pattern established by useCreateAccount, instant UI update |
| Toast notifications | Custom notification system | notistack enqueueSnackbar | Already configured, consistent UX |
| Loading button state | Manual disabled + spinner logic | MUI Button `loading` prop | MUI v7 built-in, used in OnboardingPage |

## Common Pitfalls

### Pitfall 1: Dialog Backdrop Click Closing Modal
**What goes wrong:** MUI Dialog closes on backdrop click by default.
**Why it happens:** Default `onClose` fires for backdrop clicks.
**How to avoid:** Set `onClose` to only respond to "cancel" actions, not backdrop. Use `disableEscapeKeyDown` prop. Handle close only through explicit Cancel button click.
**Warning signs:** Modal closes when user clicks outside it.

### Pitfall 2: Form Default Values Not Resetting
**What goes wrong:** Opening modal shows stale data from previous edit session.
**Why it happens:** react-hook-form `defaultValues` only applies on mount. If modal stays mounted but hidden, old values persist.
**How to avoid:** Either use `useEffect` + `reset()` when `open` changes to true, OR conditionally render the modal (only mount when open). Conditional rendering is simpler.
**Warning signs:** Second time opening modal shows previously typed (unsaved) text.

### Pitfall 3: Date Format Mismatch
**What goes wrong:** Birthday saved in wrong format, server rejects or stores incorrectly.
**Why it happens:** HTML date input returns YYYY-MM-DD, which matches the API `birthDate` format. But if additional formatting is applied, it could break.
**How to avoid:** Pass the native date input value directly to the API as-is (YYYY-MM-DD string). The `account.birthDate` is already in YYYY-MM-DD format from the server.
**Warning signs:** Birthday displays correctly before save but incorrectly after.

### Pitfall 4: MUI v7 Dialog onClose Signature
**What goes wrong:** Dialog `onClose` callback receives `(event, reason)` where reason can be 'backdropClick' or 'escapeKeyDown'.
**How to avoid:** Check `reason` parameter and only close when reason is not 'backdropClick'. Also set `disableEscapeKeyDown={true}`.
```typescript
onClose={(_event, reason) => {
  if (reason === 'backdropClick') return;
  // handle close
}}
```

### Pitfall 5: ProfilePage Test Updates
**What goes wrong:** Existing tests expect phone row with 3 chevrons -- these will break when phone row is removed.
**How to avoid:** Update existing ProfilePage tests to reflect phone row removal (2 chevrons instead of 3, no phone text assertions).

## Code Examples

### EditNameModal Structure
```typescript
// src/components/profile/EditNameModal.tsx
interface EditNameModalProps {
  open: boolean;
  onClose: () => void;
  account: Account;
}

export function EditNameModal({ open, onClose, account }: EditNameModalProps) {
  // react-hook-form with nameRules from shared validation
  // useUpdateAccount mutation
  // Dialog with DialogTitle, DialogContent (TextField), DialogActions (Cancel + Save)
  // onSuccess: onClose() + enqueueSnackbar('Nome atualizado!', { variant: 'success' })
  // onError: enqueueSnackbar(errorMessage, { variant: 'error' })
}
```

### ProfileFieldRow onClick Addition
```typescript
// Add onClick prop to ProfileFieldRow
interface ProfileFieldRowProps {
  label: string;
  value: string | null;
  editable?: boolean;
  onClick?: () => void;  // NEW
}

// Box gets: onClick, sx cursor: editable ? 'pointer' : 'default'
```

### Shared Validation Extraction
```typescript
// src/utils/validation.ts
export const nameRules = {
  required: 'Nome completo e obrigatorio',
  validate: (value: string) => {
    const words = value.trim().split(/\s+/);
    if (words.length < 2) return 'Informe nome e sobrenome';
    if (words.some((w) => w.length < 2))
      return 'Cada parte do nome deve ter pelo menos 2 caracteres';
    return true;
  },
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| MUI LoadingButton (separate import) | MUI v7 Button `loading` prop | MUI v7 | No need for @mui/lab LoadingButton, use standard Button |
| react-hook-form v6 register | v7+ Controller pattern | RHF v7 | Already using Controller in OnboardingPage |

**Already current in project:**
- MUI v7 with native loading button support
- react-hook-form v7 with Controller pattern
- React Query v5 with useMutation

## Open Questions

1. **Date input dark mode styling**
   - What we know: Native HTML date inputs have browser-dependent styling in dark mode. Chromium-based browsers handle it reasonably well.
   - What's unclear: Whether the native date picker looks acceptable in the project's dark theme without custom CSS.
   - Recommendation: Start with native `type="date"` (user's locked decision). If it looks bad in dark mode, add minimal CSS overrides. This is Claude's discretion area.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + @testing-library/react 16.x |
| Config file | vite.config.ts (test section) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EDIT-01 | Name edit modal opens, validates, saves, updates profile | integration | `npx vitest run src/__tests__/EditNameModal.test.tsx -x` | No -- Wave 0 |
| EDIT-02 | Birthday edit modal opens, saves date, updates profile | integration | `npx vitest run src/__tests__/EditBirthdayModal.test.tsx -x` | No -- Wave 0 |
| EDIT-03 | Phone editing (DEFERRED) | N/A | N/A | N/A |
| EDIT-04 | Error handling: toast on failure, modal stays open | integration | Covered in EDIT-01 and EDIT-02 test files (error scenarios) | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/EditNameModal.test.tsx` -- covers EDIT-01, EDIT-04 (name error scenarios)
- [ ] `src/__tests__/EditBirthdayModal.test.tsx` -- covers EDIT-02, EDIT-04 (birthday error scenarios)
- [ ] Update `src/__tests__/ProfilePage.test.tsx` -- remove phone row expectations, add modal open tests
- [ ] `src/utils/validation.ts` + `src/__tests__/validation.test.ts` -- shared name rules unit tests

## Sources

### Primary (HIGH confidence)
- Project codebase: OnboardingPage.tsx, useCreateAccount.ts, ProfilePage.tsx, ProfileFieldRow.tsx, accounts.ts API
- CONTEXT.md locked decisions for all UX behavior
- MUI v7 Dialog API (project already uses MUI v7 successfully)

### Secondary (MEDIUM confidence)
- react-hook-form Controller + reset() behavior based on established v7 patterns in project

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and used in project
- Architecture: HIGH - follows exact patterns established in Phase 2 (OnboardingPage) and Phase 3 (ProfilePage)
- Pitfalls: HIGH - based on direct codebase analysis and known MUI Dialog behavior

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable -- no moving parts, all deps locked)
