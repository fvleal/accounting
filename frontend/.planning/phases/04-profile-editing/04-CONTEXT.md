# Phase 4: Profile Editing - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can edit their mutable profile fields (name, date of birth) via modals with form validation, and see updated values immediately after saving. Phone editing is deferred to v2 — the phone field is hidden from the profile page entirely in this phase.

**Scope change:** EDIT-03 (phone editing + badge) deferred to v2. EDIT-01, EDIT-02, EDIT-04 remain active.

</domain>

<decisions>
## Implementation Decisions

### Modal design & behavior
- MUI Dialog (centered overlay with backdrop) for all edit modals
- Layout: DialogTitle (e.g. "Editar nome") + single input field + DialogActions (Cancel + Save)
- Separate modal component per field: EditNameModal, EditBirthdayModal
- MUI LoadingButton pattern for Save button (spinner + disabled while request in flight), Cancel also disabled during save
- Modal only closable via Cancel button — no backdrop click or Escape key dismiss (prevents accidental close while editing)
- Clicking a ProfileFieldRow with `editable` prop opens the corresponding modal

### Field validation rules
- Name: same rules as onboarding — minimum 2 words, each 2+ characters. Validation on blur
- Birthday: native HTML date input (type="date"). No min/max date constraints — accept any valid date
- Phone: removed from this phase (deferred to v2)

### Update flow & error handling
- Wait for server response before closing modal (not optimistic — modal stays open with loading spinner)
- On success: close modal, update React Query cache with returned Account data, show success toast (e.g. "Nome atualizado!")
- On error: modal stays open, error toast via notistack describes the failure. User can retry or cancel
- React Query cache invalidation ensures profile page reflects new values without full reload

### Phone field scope change
- Phone field hidden from profile page entirely (remove from ProfilePage render)
- No EditPhoneModal in this phase
- EDIT-03 deferred to v2 along with phone verification flow

### Claude's Discretion
- Exact modal sizing and padding
- Form library choice (react-hook-form, formik, or controlled state)
- Phone mask input library selection (for v2 when phone editing is added)
- Validation error message wording
- Date input styling in dark mode

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ProfileFieldRow` component (`src/components/profile/ProfileFieldRow.tsx`): already has `editable` prop with chevron icon — needs onClick handler added
- `ProfilePage` (`src/pages/ProfilePage.tsx`): renders ProfileFieldRow with `editable` on name, birthday — will open modals
- `useAccount` hook (`src/hooks/useAccount.ts`): fetches account data via React Query — cache update on mutation success
- `updateAccount` API (`src/api/accounts.ts`): `PATCH /accounts/:id` with `{ name?, birthDate? }` — already implemented
- `useCreateAccount` hook pattern: reference for creating `useUpdateAccount` mutation hook
- notistack: already configured for toast notifications (enqueueSnackbar)
- MUI LoadingButton: used in OnboardingPage — same pattern for Save buttons
- Name validation logic from OnboardingPage: reusable for EditNameModal

### Established Patterns
- Route guards as layout route wrappers (ProtectedRoute > AccountGuard > AppLayout)
- React Query for server state: `useQuery` for reads, `useMutation` for writes
- MUI + Tailwind: MUI for structure, Tailwind for fine-tuning
- Container maxWidth="sm" for centered content
- Mutation onSuccess/onError callbacks at call site for component-specific side effects

### Integration Points
- `ProfileFieldRow` onClick → opens corresponding modal (new prop needed)
- `updateAccount(account.id, { name?, birthDate? })` → PATCH endpoint
- React Query cache key: update account data after successful mutation
- ProfilePage state: manages which modal is open (name | birthday | null)

</code_context>

<specifics>
## Specific Ideas

- Visual reference remains Google Personal Info — click a field row, modal opens for editing
- Brazilian Portuguese labels: "Editar nome", "Editar data de nascimento", "Salvar", "Cancelar"
- Success toast messages: "Nome atualizado!", "Data de nascimento atualizada!"
- OnboardingPage name validation is the reference implementation — extract/share validation logic

</specifics>

<deferred>
## Deferred Ideas

- Phone editing (EDIT-03) — deferred to v2, depends on backend phone verification flow
- Phone "not verified" badge — deferred with EDIT-03
- Phone field visibility on profile page — hidden until v2 phone editing is ready

</deferred>

---

*Phase: 04-profile-editing*
*Context gathered: 2026-03-12*
