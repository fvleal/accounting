---
phase: 04-rest-api-and-security
plan: 02
subsystem: api
tags: [class-validator, class-transformer, dto, exception-filter, interceptor, nestjs]

requires:
  - phase: 03-application-layer
    provides: Use case Input/Output types and DomainException base class
provides:
  - Request DTOs with class-validator decorators for all account endpoints
  - AccountResponseDto with static fromOutput() mapper
  - DomainExceptionFilter mapping domain errors to HTTP status codes
  - ResponseEnvelopeInterceptor wrapping responses in { data, meta }
affects: [04-03-controller]

tech-stack:
  added: []
  patterns: [request-dto-validation, response-dto-mapper, global-exception-filter, response-envelope-interceptor]

key-files:
  created:
    - src/account/interface/dtos/create-account.dto.ts
    - src/account/interface/dtos/update-account.dto.ts
    - src/account/interface/dtos/send-phone-code.dto.ts
    - src/account/interface/dtos/verify-phone.dto.ts
    - src/account/interface/dtos/list-accounts-query.dto.ts
    - src/account/interface/dtos/account-response.dto.ts
    - src/account/interface/filters/domain-exception.filter.ts
    - src/account/interface/interceptors/response-envelope.interceptor.ts
  modified: []

key-decisions:
  - "Phone DTO regex matches PhoneNumber VO pattern exactly (DDD + 8-9 digits)"
  - "AccountResponseDto.phoneVerified hardcoded to false (verification not yet implemented)"
  - "DomainExceptionFilter catches all exceptions (@Catch()) for unified error handling"
  - "List response detection in interceptor uses duck-typing (data array + total number)"

patterns-established:
  - "Request DTO pattern: class-validator decorators with clear error messages"
  - "Response DTO pattern: static fromOutput() factory mapping use case Output to API contract"
  - "Exception filter pattern: code-to-status map for domain exceptions, 422 for validation, 500 generic for unknown"
  - "Envelope pattern: { data, meta: { timestamp } } for single, { data, meta: { total, offset, limit, timestamp } } for lists"

requirements-completed: [REST-07, REST-08, REST-09]

duration: 3min
completed: 2026-03-11
---

# Phase 4 Plan 02: DTOs, Exception Filter, and Response Envelope Summary

**Request/response DTOs with class-validator, DomainExceptionFilter mapping 4 domain codes to HTTP status, and ResponseEnvelopeInterceptor wrapping all responses in { data, meta }**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-11T15:21:55Z
- **Completed:** 2026-03-11T15:25:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- 6 request/response DTOs with class-validator decorators covering all account endpoints
- AccountResponseDto with static fromOutput() mapping use case Output to stable 10-field API contract
- DomainExceptionFilter handling DomainException (404/409), HttpException (422 validation), and unknown errors (500)
- ResponseEnvelopeInterceptor automatically wrapping single and list responses

## Task Commits

Each task was committed atomically:

1. **Task 1: Create request DTOs and AccountResponseDto** - `528821f` (feat)
2. **Task 2: Create DomainExceptionFilter and ResponseEnvelopeInterceptor** - `29a60c5` (feat)

## Files Created/Modified
- `src/account/interface/dtos/create-account.dto.ts` - Request DTO for POST /accounts (name, cpf)
- `src/account/interface/dtos/update-account.dto.ts` - Request DTO for PATCH /accounts/:id (name, birthDate)
- `src/account/interface/dtos/send-phone-code.dto.ts` - Request DTO for POST /accounts/:id/phone/send-code
- `src/account/interface/dtos/verify-phone.dto.ts` - Request DTO for POST /accounts/:id/phone/verify
- `src/account/interface/dtos/list-accounts-query.dto.ts` - Query DTO for GET /accounts (limit, offset, cpf)
- `src/account/interface/dtos/account-response.dto.ts` - Response DTO with static fromOutput() mapper
- `src/account/interface/filters/domain-exception.filter.ts` - Global exception filter with code-to-status mapping
- `src/account/interface/interceptors/response-envelope.interceptor.ts` - Global response envelope interceptor

## Decisions Made
- Phone DTO regex matches PhoneNumber VO pattern exactly to ensure DTO validation aligns with domain validation
- AccountResponseDto.phoneVerified hardcoded to false since phone verification is deferred
- DomainExceptionFilter uses @Catch() (no argument) to catch all exceptions for unified error handling
- List response detection in interceptor uses duck-typing (checks for data array + total number) rather than explicit markers

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All DTOs, exception filter, and response interceptor ready for Plan 03 (controller implementation)
- Controller will use DTOs for request validation and AccountResponseDto.fromOutput() for response mapping
- Global filter and interceptor will be registered in main.ts as part of Plan 03

---
*Phase: 04-rest-api-and-security*
*Completed: 2026-03-11*
