---
phase: quick-2
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/layout/Header.tsx
autonomous: true
must_haves:
  truths:
    - "Header avatar, name, and email display account data from getMe, not Auth0 user object"
    - "Header still provides logout functionality via Auth0"
    - "Avatar shows colored initials fallback when no photoUrl"
  artifacts:
    - path: "src/components/layout/Header.tsx"
      provides: "Header using account data for personal info display"
      contains: "useAccount"
  key_links:
    - from: "src/components/layout/Header.tsx"
      to: "src/hooks/useAccount.ts"
      via: "useAccount hook import"
      pattern: "useAccount"
---

<objective>
Replace Auth0 user object usage in Header with account data from useAccount (getMe API).

Purpose: Personal information displayed in the app header (name, email, avatar) must come from the backend account data (which the user can edit), not from the Auth0 user object (which is static identity provider data).

Output: Header.tsx using useAccount() hook for display while keeping useAuth0() only for logout.
</objective>

<execution_context>
@C:/Users/felip/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/felip/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/components/layout/Header.tsx
@src/hooks/useAccount.ts
@src/types/account.ts
@src/utils/initials.ts

<interfaces>
From src/hooks/useAccount.ts:
```typescript
export function useAccount(): UseQueryResult<Account>
// queryKey: ['account', 'me'], calls getMe()
```

From src/types/account.ts:
```typescript
export interface Account {
  id: string;
  name: string;
  email: string;
  cpf: string;
  birthDate: string | null;
  phone: string | null;
  phoneVerified: boolean;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
```

From src/utils/initials.ts:
```typescript
export function getInitials(fullName: string): string;
export function getAvatarColor(name: string): string;
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace Auth0 user data with account data in Header</name>
  <files>src/components/layout/Header.tsx</files>
  <action>
Modify Header.tsx to use account data from useAccount() hook instead of Auth0 user object for display:

1. Add import for `useAccount` from `../../hooks/useAccount`
2. Add import for `getAvatarColor` from `../../utils/initials` (already imports getInitials)
3. Call `const { data: account } = useAccount();` inside the component
4. Keep `const { logout } = useAuth0();` -- remove `user` from destructuring since it will no longer be used
5. Replace all Auth0 user references with account data:
   - Avatar `src={user?.picture}` becomes `src={account?.photoUrl ?? undefined}`
   - Avatar `alt={user?.name || 'Usuario'}` becomes `alt={account?.name || 'Usuario'}`
   - Avatar child `{getInitials(user?.name || '')}` becomes `{getInitials(account?.name || '')}`
   - Avatar add `bgcolor` prop: `bgcolor: getAvatarColor(account?.name || '')` in sx (consistent with ProfileHero)
   - Menu name `{user?.name}` becomes `{account?.name}`
   - Menu email `{user?.email}` becomes `{account?.email}`

Do NOT add loading states or error handling to Header -- the AccountGuard already ensures account data is loaded before Header renders (Header is inside AppLayout which is inside AccountGuard). The account data will always be available in the query cache by the time Header renders.
  </action>
  <verify>
    <automated>cd C:/Users/felip/Desktop/accounting/frontend && npx vitest run --reporter=verbose 2>&1 | tail -20</automated>
  </verify>
  <done>Header.tsx no longer imports or uses Auth0 `user` object for display. All personal info (name, email, photo) comes from useAccount() hook. Auth0 is only used for `logout`. Avatar has consistent colored-initials fallback matching ProfileHero style.</done>
</task>

</tasks>

<verification>
- `grep -n "user\?" src/components/layout/Header.tsx` returns NO matches (no Auth0 user references remain)
- `grep -n "useAccount" src/components/layout/Header.tsx` returns a match (hook is used)
- `grep -n "account\?" src/components/layout/Header.tsx` returns matches for name, email, photoUrl
- All existing tests pass: `npx vitest run`
</verification>

<success_criteria>
- Header displays name, email, and avatar from backend account data (getMe API)
- Auth0 user object is NOT used for any display purpose in the entire app
- Auth0 is only used for authentication flow (login, logout, token)
- Avatar fallback shows colored initials consistent with ProfileHero
- All tests pass
</success_criteria>

<output>
After completion, create `.planning/quick/2-informacoes-pessoais-devem-usar-retorno-/2-SUMMARY.md`
</output>
