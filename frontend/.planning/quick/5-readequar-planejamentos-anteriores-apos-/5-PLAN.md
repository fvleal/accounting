---
phase: quick-5
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/__tests__/ProfilePage.test.tsx
  - src/__tests__/AppDialog.test.tsx
  - src/__tests__/api-client.test.ts
  - src/utils/initials.ts
autonomous: true
---

<objective>
Fix all test failures caused by manual user changes to Account type fields, ProfileHero, ProfileFieldRow, and AppDialog.

Purpose: 4 tests are failing because tests reference old behavior that the user already changed in production code.
Output: All 94 tests passing (currently 90 pass, 4 fail).
</objective>

<context>
@src/__tests__/ProfilePage.test.tsx
@src/__tests__/AppDialog.test.tsx
@src/__tests__/api-client.test.ts
@src/utils/initials.ts
@src/components/profile/ProfileHero.tsx
@src/components/profile/ProfileFieldRow.tsx
@src/components/common/AppDialog.tsx
@src/api/client.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix ProfilePage, AppDialog, and api-client test assertions</name>
  <files>
    src/__tests__/ProfilePage.test.tsx
    src/__tests__/AppDialog.test.tsx
    src/__tests__/api-client.test.ts
    src/utils/initials.ts
  </files>
  <action>
Fix 4 failing tests across 3 test files, plus one cosmetic rename:

**ProfilePage.test.tsx — lines 88-94 (PROF-01 first test):**
- Line 89-90: ProfileHero no longer renders name/email text (only avatar). Change `getAllByText('Felipe Vieira')` assertion from `expect(nameElements.length).toBeGreaterThanOrEqual(2)` to `expect(nameElements).toHaveLength(1)` (name now only appears in the Nome field row).
- Lines 92-94: Same for email — change `getAllByText('felipe@test.com')` from `expect(emailElements.length).toBeGreaterThanOrEqual(2)` to `expect(emailElements).toHaveLength(1)` (email only in field row).
- Update the comments above these assertions to reflect that name/email appear only in field rows, not in hero.

**ProfilePage.test.tsx — lines 107-119 (PROF-01 second test):**
- Line 107: Rename test from `'displays Nao informado for null fields'` to `'displays Inserir for null fields'`.
- Line 118: Change `screen.getAllByText('Nao informado')` to `screen.getAllByText('Inserir')`.

**AppDialog.test.tsx — lines 31-46:**
- The test "does NOT call onClose on backdrop click" is now wrong. The user simplified AppDialog to allow backdrop close. Rename the test to `'calls onClose on backdrop click'` and change the assertion from `expect(onClose).not.toHaveBeenCalled()` to `expect(onClose).toHaveBeenCalled()`.

**api-client.test.ts — line 6:**
- The test "has correct default baseURL" expects `'http://localhost:3000'` but `VITE_API_URL` is `/api` in env and fallback is `/api`. Change expected value to `'/api'`.

**src/utils/initials.ts — line 6:**
- Rename parameter `fullName` to `name` for consistency with the Account type rename. The function body references the parameter, so update both the parameter declaration (line 6) and usage (line 7).
  </action>
  <verify>
    <automated>cd C:/Users/felip/Desktop/accounting/frontend && npx vitest run --reporter=verbose 2>&1 | tail -10</automated>
  </verify>
  <done>All 94 tests pass (0 failures). No references to old field names or old UI text remain in test files.</done>
</task>

</tasks>

<verification>
Run full test suite: `npx vitest run` — expect 0 failures.
Grep for stale references: `grep -r "fullName\|dateOfBirth\|Nao informado\|PaperProps\|disableEscapeKeyDown" src/` should return no matches.
</verification>

<success_criteria>
- All vitest tests pass (94/94)
- No remaining references to `fullName` in source code
- No remaining references to `Nao informado` in test assertions
- AppDialog test reflects new backdrop-close behavior
- api-client test matches actual VITE_API_URL configuration
</success_criteria>
