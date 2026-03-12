---
phase: quick-3
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/utils/validation.ts
  - src/components/profile/EditNameModal.tsx
  - src/components/profile/EditBirthdayModal.tsx
  - src/__tests__/EditNameModal.test.tsx
  - src/__tests__/EditBirthdayModal.test.tsx
autonomous: true
requirements: ["Add frontend validation matching backend DTOs"]

must_haves:
  truths:
    - "Name field rejects input shorter than 2 chars or longer than 200 chars"
    - "Birthday field requires a value and validates YYYY-MM-DD format"
    - "Phone modal already conforms to backend (no changes needed)"
    - "All validation messages are in Portuguese"
  artifacts:
    - path: "src/utils/validation.ts"
      provides: "Shared validation rules for name and birthDate"
      exports: ["nameRules", "birthDateRules"]
    - path: "src/components/profile/EditBirthdayModal.tsx"
      provides: "Birthday modal with validation rules wired"
    - path: "src/components/profile/EditNameModal.tsx"
      provides: "Name modal already uses nameRules (updated with maxLength)"
  key_links:
    - from: "src/components/profile/EditNameModal.tsx"
      to: "src/utils/validation.ts"
      via: "import nameRules"
      pattern: "nameRules"
    - from: "src/components/profile/EditBirthdayModal.tsx"
      to: "src/utils/validation.ts"
      via: "import birthDateRules"
      pattern: "birthDateRules"
---

<objective>
Add frontend validation to update modals that matches backend DTO constraints exactly.

Purpose: Prevent invalid data from reaching the API, giving users immediate feedback instead of server-side 400 errors.
Output: Updated validation rules and modal components with conformant validation, plus updated tests.
</objective>

<execution_context>
@C:/Users/felip/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/felip/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/PROJECT.md

Backend DTO reference (do NOT modify these files, read-only):
- C:/Users/felip/Desktop/accounting/backend/src/account/interface/dtos/update-account.dto.ts
- C:/Users/felip/Desktop/accounting/backend/src/account/interface/dtos/send-phone-code.dto.ts

<interfaces>
<!-- Backend UpdateAccountDto validation rules -->
UpdateAccountDto:
  name: @IsString @IsOptional @Length(2, 200)
  birthDate: @IsString @IsOptional @Matches(/^\d{4}-\d{2}-\d{2}$/)

SendPhoneCodeDto:
  phone: @IsString @IsNotEmpty @Matches(/^[1-9]{2}[2-9]\d{7,8}$/)

<!-- Current frontend validation (src/utils/validation.ts) -->
```typescript
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

<!-- EditPhoneModal already has correct validation matching SendPhoneCodeDto - NO changes needed -->
</interfaces>

Gap analysis:
1. nameRules: MISSING maxLength(200) constraint from backend @Length(2, 200). The minLength(2) is implicitly covered by "each word >= 2 chars" but should be explicit.
2. EditBirthdayModal: Has ZERO validation rules. Backend requires YYYY-MM-DD format via @Matches. While the HTML date input provides this format, we need: (a) required rule so empty submission is blocked, (b) format pattern validation as safety net.
3. EditPhoneModal: Already conforms to backend. No changes needed.
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Update validation rules and add birthDate rules</name>
  <files>src/utils/validation.ts, src/__tests__/EditNameModal.test.tsx, src/__tests__/EditBirthdayModal.test.tsx</files>
  <behavior>
    - nameRules rejects names longer than 200 characters with message "Nome deve ter no maximo 200 caracteres"
    - nameRules still rejects single-word names ("Fulano")
    - nameRules still rejects words shorter than 2 chars ("F Vieira")
    - birthDateRules rejects empty value with message "Data de nascimento e obrigatoria"
    - birthDateRules rejects non-YYYY-MM-DD format with message "Data deve estar no formato AAAA-MM-DD"
    - birthDateRules accepts valid date like "1995-06-20"
  </behavior>
  <action>
    1. Update `src/utils/validation.ts`:
       - Add `maxLength: { value: 200, message: 'Nome deve ter no maximo 200 caracteres' }` to nameRules
       - Add `minLength: { value: 2, message: 'Nome deve ter pelo menos 2 caracteres' }` to nameRules (explicit, matching backend @Length(2, 200))
       - Export new `birthDateRules` object with:
         - `required: 'Data de nascimento e obrigatoria'`
         - `pattern: { value: /^\d{4}-\d{2}-\d{2}$/, message: 'Data deve estar no formato AAAA-MM-DD' }`

    2. Update `src/__tests__/EditNameModal.test.tsx`:
       - Add test: name longer than 200 chars shows maxLength error on blur
       - Existing tests must still pass (single-word rejection, valid submission, etc.)

    3. Update `src/__tests__/EditBirthdayModal.test.tsx`:
       - Add test: submitting empty birthday shows required error
       - Add test: valid date submits successfully (existing test covers this)
  </action>
  <verify>
    <automated>npx vitest run src/__tests__/EditNameModal.test.tsx src/__tests__/EditBirthdayModal.test.tsx --reporter=verbose</automated>
  </verify>
  <done>nameRules includes minLength(2) + maxLength(200) matching backend @Length(2,200). birthDateRules exported with required + YYYY-MM-DD pattern. Tests pass for both.</done>
</task>

<task type="auto">
  <name>Task 2: Wire birthDate validation into EditBirthdayModal</name>
  <files>src/components/profile/EditBirthdayModal.tsx</files>
  <action>
    1. Import `birthDateRules` from `../../utils/validation`
    2. Add `rules={birthDateRules}` to the Controller for `birthDate`
    3. Add `error={!!fieldState.error}` and `helperText={fieldState.error?.message}` to the TextField render (currently missing -- the render callback only destructures `field`, must also destructure `fieldState`)
    4. Change the render callback from `render={({ field }) => (` to `render={({ field, fieldState }) => (`

    The HTML date input already produces YYYY-MM-DD format, so the pattern validation is a safety net. The required rule is the main addition preventing empty submissions.
  </action>
  <verify>
    <automated>npx vitest run src/__tests__/EditBirthdayModal.test.tsx --reporter=verbose</automated>
  </verify>
  <done>EditBirthdayModal validates birthDate as required with YYYY-MM-DD format, shows error messages in helperText, and all existing tests pass.</done>
</task>

</tasks>

<verification>
Run full test suite to ensure no regressions:
```bash
npx vitest run --reporter=verbose
```

Manual spot check: Open each modal, try submitting empty/invalid values, confirm error messages appear in Portuguese.
</verification>

<success_criteria>
- nameRules enforces minLength(2), maxLength(200) matching backend @Length(2, 200)
- birthDateRules enforces required + YYYY-MM-DD pattern matching backend @Matches
- EditBirthdayModal wired with birthDateRules, shows validation errors
- EditPhoneModal unchanged (already conforms)
- All existing tests pass, new validation tests added
- Full vitest suite green
</success_criteria>

<output>
After completion, create `.planning/quick/3-adiciona-validacao-em-conformidade-com-o/3-SUMMARY.md`
</output>
