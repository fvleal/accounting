---
phase: 03-application-layer
plan: 03
subsystem: application
tags: [cqrs, queries, use-cases, tdd, nestjs, di-injection, pagination]

# Dependency graph
requires:
  - phase: 03-application-layer
    plan: 01
    provides: auth0Sub on Account, UseCase<I,O> base, DomainException base, account exceptions, CQRS folder structure
  - phase: 03-application-layer
    plan: 02
    provides: 5 command use cases (CreateAccount, UpdateName, UpdatePhone, UpdateBirthDate, UploadAccountPhoto)
provides:
  - GetAccountByIdQuery use case
  - GetMeQuery dedicated use case using findByAuth0Sub
  - FindAccountByFieldQuery supporting email and CPF lookups
  - ListAccountsQuery with paginated results
  - AccountApplicationModule wiring all 9 use cases with DI
affects: [Phase 4 controller layer, API endpoint implementation]

# Tech tracking
tech-stack:
  added: []
  patterns: [Query use case with co-located Input/Output, toOutput mapping per query, AccountApplicationModule single-module wiring]

key-files:
  created:
    - src/account/application/queries/get-account-by-id.query.ts
    - src/account/application/queries/get-account-by-id.query.spec.ts
    - src/account/application/queries/get-me.query.ts
    - src/account/application/queries/get-me.query.spec.ts
    - src/account/application/queries/find-account-by-field.query.ts
    - src/account/application/queries/find-account-by-field.query.spec.ts
    - src/account/application/queries/list-accounts.query.ts
    - src/account/application/queries/list-accounts.query.spec.ts
    - src/account/application/account-application.module.ts
  modified: []

key-decisions:
  - "Each query has its own toOutput() -- intentional duplication matching command pattern from Plan 02"
  - "GetMeQuery is dedicated use case (not reusing FindAccountByFieldQuery) per CONTEXT.md decision"
  - "Single AccountApplicationModule registers all 9 use cases per RESEARCH.md recommendation"

patterns-established:
  - "Query use case pattern: @Injectable, @Inject port token, execute() calls repository read method -> throws if not found -> returns Output"
  - "FindAccountByFieldQuery uses switch/case on field discriminator for extensible field lookups"
  - "ListAccountsQuery maps PaginatedResult<Account> to PaginatedResult<AccountSummary>"

requirements-completed: [UCAS-03, UCAS-04, UCAS-05, UCAS-06]

# Metrics
duration: 3min
completed: 2026-03-11
---

# Phase 3 Plan 3: Query Use Cases and Application Module Summary

**4 CQRS query use cases via TDD (GetAccountById, GetMe, FindAccountByField, ListAccounts) and AccountApplicationModule wiring all 9 use cases**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-11T13:50:20Z
- **Completed:** 2026-03-11T13:53:09Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Built GetAccountByIdQuery and GetMeQuery (dedicated use case using findByAuth0Sub) with error handling
- Built FindAccountByFieldQuery supporting email and CPF field lookups with switch/case pattern
- Built ListAccountsQuery returning paginated results mapped to AccountSummary output
- Created AccountApplicationModule importing AccountInfrastructureModule and exporting all 9 use cases (5 commands + 4 queries)
- All 23 application tests green (14 command + 9 query)

## Task Commits

Each task was committed atomically:

1. **Task 1: GetAccountByIdQuery, GetMeQuery, FindAccountByFieldQuery, and ListAccountsQuery (TDD)** - `8f35e5a` (feat)
2. **Task 2: AccountApplicationModule wiring all use cases** - `609c2ba` (feat)

## Files Created/Modified
- `src/account/application/queries/get-account-by-id.query.ts` - GetAccountByIdQuery: findById -> throw if null -> toOutput
- `src/account/application/queries/get-account-by-id.query.spec.ts` - 2 tests: found and not found
- `src/account/application/queries/get-me.query.ts` - GetMeQuery: findByAuth0Sub -> throw if null -> toOutput
- `src/account/application/queries/get-me.query.spec.ts` - 2 tests: found and not found
- `src/account/application/queries/find-account-by-field.query.ts` - FindAccountByFieldQuery: switch on email/cpf field
- `src/account/application/queries/find-account-by-field.query.spec.ts` - 3 tests: email, CPF, not found
- `src/account/application/queries/list-accounts.query.ts` - ListAccountsQuery: findAll -> map to AccountSummary
- `src/account/application/queries/list-accounts.query.spec.ts` - 2 tests: with data and empty
- `src/account/application/account-application.module.ts` - NestJS module registering all 9 use cases

## Decisions Made
- Each query has its own toOutput() method -- matching intentional duplication pattern from Plan 02 commands
- GetMeQuery is a dedicated use case (not reusing FindAccountByFieldQuery) per locked CONTEXT.md decision
- Single AccountApplicationModule registers all 9 use cases -- simpler than per-use-case modules

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed CPF assertion in query tests**
- **Found during:** Task 1 (query tests GREEN phase)
- **Issue:** Tests used formatted CPF ('529.982.247-25') for assertions but Account.cpf getter returns normalized digits-only value ('52998224725')
- **Fix:** Used formatted CPF for Account.create() input and NORMALIZED_CPF constant for output assertions
- **Files modified:** All 4 query spec files
- **Verification:** All 9 tests pass
- **Committed in:** 8f35e5a (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor test assertion fix. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 9 use cases (5 commands + 4 queries) ready for controller injection via AccountApplicationModule
- Phase 4 controllers can import AccountApplicationModule and inject use cases directly
- Complete application layer: commands handle writes, queries handle reads, module wires DI

## Self-Check: PASSED

All 9 files verified on disk. Both task commits (8f35e5a, 609c2ba) verified in git log.

---
*Phase: 03-application-layer*
*Completed: 2026-03-11*
