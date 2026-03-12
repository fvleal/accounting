---
phase: quick
plan: 6
subsystem: account-domain
tags: [tests, reconstitution, validation, domain, mapper]
dependency_graph:
  requires: []
  provides: [reconstitution-validation-tests]
  affects: [account.entity.spec.ts, account.mapper.spec.ts]
tech_stack:
  added: []
  patterns: [TDD, reconstitution-validation, integration-tests]
key_files:
  created: []
  modified:
    - src/account/domain/entities/account.entity.spec.ts
    - src/account/infrastructure/mappers/account.mapper.spec.ts
decisions:
  - Used `validRow()` helper in mapper spec to reduce duplication across the 7 corruption test cases
metrics:
  duration: "7 minutes"
  completed_date: "2026-03-12"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 2
---

# Quick Task 6: Reconstitution Validation Tests Summary

**One-liner:** Added 13 new tests proving Account.reconstitute and AccountMapper.toDomain reject every invalid field (name, email, CPF, phone, birthDate, photoUrl).

## What Was Built

Extended test coverage ensuring corrupt or inconsistent database rows cannot be silently loaded into the domain model. Validation runs on every reconstitution path.

### Task 1: Account entity spec — 6 new tests

Added inside the existing `describe('reconstitute()')` block:

- `should throw on invalid name (empty)` — empty string triggers PersonName validation
- `should throw on invalid name (single word)` — single token triggers PersonName validation
- `should throw on invalid email` — bad format triggers Email validation
- `should throw on invalid phone` — short string triggers PhoneNumber validation
- `should throw on future birthDate` — future date triggers BirthDate validation
- `should throw on invalid photoUrl` — non-URL triggers `new URL()` validation

**Result:** 30 tests pass (24 pre-existing + 6 new)

### Task 2: AccountMapper spec — 7 new tests

Added a new `describe('rejects inconsistent DB data')` block inside `describe('toDomain')` with a `validRow()` helper:

- `should throw when DB row has empty name`
- `should throw when DB row has single-word name`
- `should throw when DB row has invalid email`
- `should throw when DB row has invalid CPF` — `'00000000000'` fails checksum
- `should throw when DB row has invalid phone` — `'123'` fails Brazilian phone regex
- `should throw when DB row has future birthDate` — `Date.now() + 365 days`
- `should throw when DB row has invalid photoUrl` — `'not-a-url'`

**Result:** 11 tests pass (4 pre-existing + 7 new)

## Verification

```
npx vitest run src/account/domain/entities/account.entity.spec.ts src/account/infrastructure/mappers/account.mapper.spec.ts

Test Files: 2 passed (2)
Tests:      41 passed (41)
```

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | a8954bc | test(quick-6): add reconstitute validation tests to Account entity spec |
| 2 | 52c97fb | test(quick-6): add AccountMapper.toDomain integration tests for corrupt DB rows |

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- `src/account/domain/entities/account.entity.spec.ts` — exists and has 30 passing tests
- `src/account/infrastructure/mappers/account.mapper.spec.ts` — exists and has 11 passing tests
- Commits a8954bc and 52c97fb verified in git log
