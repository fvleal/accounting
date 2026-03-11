---
phase: 06-gap-closure-and-hardening
plan: 01
subsystem: api, auth
tags: [nestjs, rbac, roles-guard, e2e, dead-code-removal]

# Dependency graph
requires:
  - phase: 04-rest-api-and-security
    provides: RolesGuard, controller, domain-exception filter
provides:
  - "@Roles('update:own-account') on all mutation endpoints"
  - "Correct 200 status on send-code endpoint"
  - "DuplicateAuth0SubError dead code removed"
  - "E2E test for photo upload 403"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - src/account/interface/controllers/account.controller.ts
    - src/account/interface/filters/domain-exception.filter.ts
    - src/account/domain/exceptions/index.ts
    - test/accounts.e2e-spec.ts

key-decisions:
  - "No new decisions - followed plan as specified"

patterns-established: []

requirements-completed: [AUTH-04]

# Metrics
duration: 3min
completed: 2026-03-11
---

# Phase 6 Plan 1: Gap Closure Summary

**Full RBAC on mutation endpoints, dead code removal, status code fix, and photo 403 E2E coverage**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-11T19:10:00Z
- **Completed:** 2026-03-11T19:13:12Z
- **Tasks:** 2
- **Files modified:** 6 (4 modified, 2 deleted)

## Accomplishments
- Added @Roles('update:own-account') to PATCH /:id, POST /:id/phone/send-code, POST /:id/photo
- Fixed POST /:id/phone/send-code to return 200 instead of 201
- Fully removed DuplicateAuth0SubError (class, spec, index export, filter mapping)
- Added E2E test proving POST /accounts/:id/photo returns 403 without permission
- Verified REQUIREMENTS.md correctly tracks INFR-05, UCAS-08, UCAS-09 as deferred

## Task Commits

Each task was committed atomically:

1. **Task 1: Add @Roles to mutation endpoints, fix status code, remove dead code** - `881b718` (feat)
2. **Task 2: Add E2E test for photo upload 403 and verify REQUIREMENTS.md** - `4f44485` (test)

## Files Created/Modified
- `src/account/interface/controllers/account.controller.ts` - Added @Roles and @HttpCode decorators
- `src/account/interface/filters/domain-exception.filter.ts` - Removed DUPLICATE_AUTH0_SUB mapping
- `src/account/domain/exceptions/index.ts` - Removed DuplicateAuth0SubError export
- `src/account/domain/exceptions/duplicate-auth0-sub.error.ts` - Deleted (dead code)
- `src/account/domain/exceptions/duplicate-auth0-sub.error.spec.ts` - Deleted (dead code spec)
- `test/accounts.e2e-spec.ts` - Added photo 403 test, updated send-code to expect 200

## Decisions Made
None - followed plan as specified.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated E2E send-code test to expect 200**
- **Found during:** Task 2 (E2E test updates)
- **Issue:** Existing E2E test expected 201 for send-code, but Task 1 changed it to @HttpCode(200)
- **Fix:** Updated `.expect(201)` to `.expect(200)` in the send-code E2E test
- **Files modified:** test/accounts.e2e-spec.ts
- **Verification:** All 76 E2E tests pass
- **Committed in:** 4f44485 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Necessary correction to keep E2E tests aligned with the status code change in Task 1. No scope creep.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- AUTH-04 requirement fully satisfied
- All 123 unit tests and 76 E2E tests pass
- Codebase ready for v1.0 milestone sign-off

---
*Phase: 06-gap-closure-and-hardening*
*Completed: 2026-03-11*
