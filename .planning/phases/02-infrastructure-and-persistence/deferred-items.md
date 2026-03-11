# Deferred Items - Phase 02

## Pre-existing Issues (Out of Scope)

### 1. TypeScript strict mode errors in Phase 1 value objects
- **Discovered during:** 02-01 Task 2 verification (`npx nest build`)
- **Issue:** 5 TS2344 errors in value object classes -- interface props don't satisfy `Record<string, unknown>` constraint
- **Affected files:** birth-date, cpf, email, person-name, phone-number value objects
- **Impact:** `npx nest build` fails, but Vitest (SWC-based) runs all 81 tests successfully
- **Note:** These errors exist on the commit prior to any Phase 2 changes -- confirmed by stashing changes and rebuilding
