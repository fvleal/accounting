---
phase: quick-7
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/layout/Header.tsx
  - .env.example
autonomous: true
requirements: [QUICK-7]
must_haves:
  truths:
    - "Logo image appears in the header when VITE_LOGO_URL is set"
    - "No logo or broken element shown when VITE_LOGO_URL is not set"
  artifacts:
    - path: "src/components/layout/Header.tsx"
      provides: "Logo rendering from env var"
      contains: "VITE_LOGO_URL"
    - path: ".env.example"
      provides: "VITE_LOGO_URL placeholder"
      contains: "VITE_LOGO_URL"
  key_links:
    - from: "src/components/layout/Header.tsx"
      to: "import.meta.env.VITE_LOGO_URL"
      via: "Vite env variable"
      pattern: "import\\.meta\\.env\\.VITE_LOGO_URL"
---

<objective>
Add a logo image to the Header component, sourced from the VITE_LOGO_URL environment variable.

Purpose: Allow configurable branding in the app header without code changes.
Output: Header displays logo when env var is set; gracefully hidden when not set.
</objective>

<execution_context>
@C:/Users/felip/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/felip/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/components/layout/Header.tsx
@.env.example
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add logo to Header and env var placeholder</name>
  <files>src/components/layout/Header.tsx, .env.example</files>
  <action>
1. In Header.tsx, read `import.meta.env.VITE_LOGO_URL` into a const `logoUrl`.

2. In the Toolbar, BEFORE the "Minha Conta" Typography, conditionally render a logo when `logoUrl` is truthy:
   ```tsx
   {logoUrl && (
     <Box
       component="img"
       src={logoUrl}
       alt="Logo"
       sx={{ height: 32, mr: 1.5 }}
     />
   )}
   ```
   This places the logo to the left of the title text. The Typography with flexGrow:1 already handles spacing to the right.

3. In `.env.example`, add a new line:
   ```
   VITE_LOGO_URL=
   ```
   Leave value empty as placeholder.

No other files need changes. Do NOT add the variable to `.env.local` — that is the user's responsibility.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>Header renders logo img when VITE_LOGO_URL is set; renders nothing extra when unset. TypeScript compiles clean. .env.example documents the variable.</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with no errors
- Visual check: set VITE_LOGO_URL to any image URL in .env.local, run dev server, logo appears left of "Minha Conta"
- Visual check: unset VITE_LOGO_URL, no img element rendered in header
</verification>

<success_criteria>
- Logo image visible in header when VITE_LOGO_URL is configured
- No visual artifacts or broken img when VITE_LOGO_URL is absent
- .env.example updated with VITE_LOGO_URL placeholder
</success_criteria>

<output>
After completion, create `.planning/quick/7-adicione-uma-logo-no-header-que-vem-de-u/7-SUMMARY.md`
</output>
