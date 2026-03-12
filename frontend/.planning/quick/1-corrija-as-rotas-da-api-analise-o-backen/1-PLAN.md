---
phase: quick
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/api/accounts.ts
  - src/hooks/useUpdateAccount.ts
  - src/hooks/useSendPhoneCode.ts
  - src/components/profile/EditNameModal.tsx
  - src/components/profile/EditBirthdayModal.tsx
  - src/components/profile/EditPhoneModal.tsx
  - src/pages/ProfilePage.tsx
  - src/__tests__/ProfilePage.test.tsx
  - src/__tests__/EditNameModal.test.tsx
  - src/__tests__/EditBirthdayModal.test.tsx
autonomous: true
requirements: []

must_haves:
  truths:
    - "Frontend API calls match backend /accounts/me routes (PATCH, phone, photo)"
    - "Phone field is displayed on profile page with edit button"
    - "Clicking phone edit opens modal, submitting calls POST /accounts/me/phone/send-code"
    - "After sendCode success, phone is saved with unverified status and modal closes"
  artifacts:
    - path: "src/api/accounts.ts"
      provides: "Corrected API routes using /me instead of /:id"
    - path: "src/hooks/useSendPhoneCode.ts"
      provides: "React Query mutation hook for phone send-code"
    - path: "src/components/profile/EditPhoneModal.tsx"
      provides: "Phone editing modal with Brazilian phone validation"
    - path: "src/pages/ProfilePage.tsx"
      provides: "Phone field row and EditPhoneModal wiring"
  key_links:
    - from: "src/hooks/useUpdateAccount.ts"
      to: "src/api/accounts.ts"
      via: "updateAccount() no longer takes id param"
      pattern: "updateAccount\\(data\\)"
    - from: "src/components/profile/EditPhoneModal.tsx"
      to: "src/hooks/useSendPhoneCode.ts"
      via: "mutation hook call"
      pattern: "useSendPhoneCode"
---

<objective>
Fix frontend API routes to match backend /accounts/me endpoints and implement phone field with sendCode flow.

Purpose: The backend removed all /:id admin routes and uses /accounts/me for the authenticated user. The frontend still calls /:id routes which will 404. Additionally, the phone field was deferred but is now needed with sendCode (sets phone as unverified).

Output: Corrected API layer, phone editing modal, updated profile page.
</objective>

<execution_context>
@C:/Users/felip/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/felip/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/api/accounts.ts
@src/api/client.ts
@src/hooks/useUpdateAccount.ts
@src/types/account.ts
@src/pages/ProfilePage.tsx
@src/components/profile/EditNameModal.tsx
@src/components/profile/EditBirthdayModal.tsx
@src/utils/phone.ts

<interfaces>
<!-- Backend controller routes (from account.controller.ts): -->
POST   /accounts              — CreateAccountDto { name, cpf }
GET    /accounts/me           — returns AccountResponseDto
PATCH  /accounts/me           — UpdateAccountDto { name?, birthDate? }
POST   /accounts/me/phone/send-code — SendPhoneCodeDto { phone } (regex: /^[1-9]{2}[2-9]\d{7,8}$/)
POST   /accounts/me/phone/verify    — 501 Not Implemented
POST   /accounts/me/photo           — multipart file upload

<!-- AccountResponseDto shape: -->
{ id, name, email, cpf, birthDate, phone, phoneVerified, photoUrl, createdAt, updatedAt }

<!-- IMPORTANT: No /:id routes exist on backend. All user-facing routes use /me. -->
<!-- The frontend currently uses /:id for updateAccount, sendPhoneCode, verifyPhone, uploadPhoto — all wrong. -->
<!-- Also remove getAccountById, getAccountByCpf, listAccounts — these admin routes no longer exist. -->
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix API routes and hooks to use /me endpoints</name>
  <files>src/api/accounts.ts, src/hooks/useUpdateAccount.ts, src/hooks/useSendPhoneCode.ts, src/components/profile/EditNameModal.tsx, src/components/profile/EditBirthdayModal.tsx, src/__tests__/EditNameModal.test.tsx, src/__tests__/EditBirthdayModal.test.tsx</files>
  <action>
1. **src/api/accounts.ts** — Rewrite to match backend routes:
   - `getMe()` — keep as-is (already correct: GET /accounts/me)
   - `createAccount(data)` — keep as-is (already correct: POST /accounts)
   - `updateAccount(data)` — REMOVE id param, change to PATCH /accounts/me. Signature: `updateAccount(data: { name?: string; birthDate?: string }): Promise<Account>`
   - `sendPhoneCode(phone)` — REMOVE id param, change to POST /accounts/me/phone/send-code. Signature: `sendPhoneCode(phone: string): Promise<Account>`
   - `verifyPhone(code)` — REMOVE id param, change to POST /accounts/me/phone/verify (still 501 but fix route)
   - `uploadPhoto(file)` — REMOVE id param, change to POST /accounts/me/photo
   - DELETE `getAccountById`, `getAccountByCpf`, `listAccounts` — these admin routes no longer exist on backend
   - Remove unused imports (ApiListResponse)

2. **src/hooks/useUpdateAccount.ts** — Update mutationFn signature:
   - Change input type from `{ id: string; data: { name?: string; birthDate?: string } }` to just `{ name?: string; birthDate?: string }`
   - Call `updateAccount(input)` instead of `updateAccount(input.id, input.data)`

3. **src/hooks/useSendPhoneCode.ts** — Create new hook:
   ```typescript
   import { useMutation, useQueryClient } from '@tanstack/react-query';
   import { sendPhoneCode } from '../api/accounts';
   import type { Account } from '../types/account';

   export function useSendPhoneCode() {
     const queryClient = useQueryClient();
     return useMutation({
       mutationFn: (phone: string) => sendPhoneCode(phone),
       onSuccess: (account: Account) => {
         queryClient.setQueryData(['account', 'me'], account);
       },
     });
   }
   ```

4. **src/components/profile/EditNameModal.tsx** — Update mutation call:
   - Change `mutation.mutate({ id: account.id, data: { name: values.name.trim() } }, ...)` to `mutation.mutate({ name: values.name.trim() }, ...)`

5. **src/components/profile/EditBirthdayModal.tsx** — Update mutation call:
   - Change `mutation.mutate({ id: account.id, data: { birthDate: values.birthDate } }, ...)` to `mutation.mutate({ birthDate: values.birthDate }, ...)`

6. **src/__tests__/EditNameModal.test.tsx** — Update any test mocks that pass `{ id, data }` to pass just the data object.

7. **src/__tests__/EditBirthdayModal.test.tsx** — Same: update any test mocks that pass `{ id, data }` to pass just the data object.
  </action>
  <verify>
    <automated>cd C:/Users/felip/Desktop/accounting/frontend && npx vitest run --reporter=verbose 2>&1 | tail -40</automated>
  </verify>
  <done>All API functions use /accounts/me routes. No /:id routes remain. useUpdateAccount no longer requires id. Existing tests pass.</done>
</task>

<task type="auto">
  <name>Task 2: Add phone field to ProfilePage with EditPhoneModal</name>
  <files>src/components/profile/EditPhoneModal.tsx, src/pages/ProfilePage.tsx, src/__tests__/ProfilePage.test.tsx</files>
  <action>
1. **src/components/profile/EditPhoneModal.tsx** — Create phone editing modal following the same pattern as EditNameModal/EditBirthdayModal:
   - Props: `{ open: boolean; onClose: () => void; account: Account }`
   - Use `react-hook-form` with a single `phone` field (type="tel")
   - Validation rule: regex `/^[1-9]{2}[2-9]\d{7,8}$/` with message "Telefone invalido. Use DDD + 8 ou 9 digitos (ex: 11987654321)"
   - Use `useSendPhoneCode()` hook from Task 1
   - On submit: call `mutation.mutate(values.phone, { onSuccess: close + toast "Codigo enviado! Telefone salvo como nao verificado.", onError: show backend error message })`
   - Same Dialog pattern: disableEscapeKeyDown, backdropClick guard, Cancelar + Salvar buttons
   - Default value: `account.phone ?? ''`
   - TextField label: "Telefone" with placeholder "11987654321"

2. **src/pages/ProfilePage.tsx** — Add phone field and modal:
   - Import `EditPhoneModal`, `formatPhone` from utils/phone
   - Expand editModal union type: `'name' | 'birthday' | 'phone' | null`
   - Add phone row inside "Informacoes adicionais" section, after Nascimento:
     ```tsx
     <ProfileFieldRow
       label="Telefone"
       value={account.phone ? formatPhone(account.phone) : undefined}
       editable
       onClick={() => setEditModal('phone')}
     />
     ```
   - Add EditPhoneModal alongside other modals:
     ```tsx
     <EditPhoneModal
       open={editModal === 'phone'}
       onClose={() => setEditModal(null)}
       account={account}
     />
     ```

3. **src/__tests__/ProfilePage.test.tsx** — Update tests:
   - Add mock for EditPhoneModal (same pattern as EditNameModal mock):
     ```typescript
     vi.mock('../components/profile/EditPhoneModal', () => ({
       EditPhoneModal: ({ open }: { open: boolean }) =>
         open ? <div data-testid="edit-phone-modal" /> : null,
     }));
     ```
   - Import `formatPhone` is NOT needed in test (mock handles it)
   - Update PROF-01 test: phone IS now displayed. Expect `screen.getByText('(11) 98765-4321')` and `screen.getByText('Telefone')` to be in document. Remove the `queryByText...not.toBeInTheDocument()` assertions for phone.
   - Update "Nao informado" test: add phone null to the data `{ ...fullAccount, birthDate: null, phone: null }` and expect 2 "Nao informado" (birthday + phone).
   - Update chevrons test: expect 3 chevrons now (Nome, Nascimento, Telefone).
   - Add test: "clicking phone row opens EditPhoneModal" — same pattern as name/birthday modal tests.
  </action>
  <verify>
    <automated>cd C:/Users/felip/Desktop/accounting/frontend && npx vitest run --reporter=verbose 2>&1 | tail -40</automated>
  </verify>
  <done>Phone field visible on profile page with formatted display. Clicking phone row opens EditPhoneModal. Submitting modal calls sendCode endpoint. All tests pass including new phone-related tests.</done>
</task>

</tasks>

<verification>
1. `npx vitest run` — all tests pass
2. `npx tsc --noEmit` — no TypeScript errors
3. No references to `/accounts/${id}` remain in src/api/accounts.ts (all use /me)
4. Phone field visible on ProfilePage with edit capability
</verification>

<success_criteria>
- All frontend API routes match backend /accounts/me endpoints
- No /:id admin routes remain in frontend API layer
- Phone field displayed on profile with formatPhone formatting
- EditPhoneModal validates Brazilian phone format and calls sendPhoneCode
- sendPhoneCode updates query cache on success
- All existing and new tests pass
</success_criteria>

<output>
After completion, create `.planning/quick/1-corrija-as-rotas-da-api-analise-o-backen/1-SUMMARY.md`
</output>
