---
status: complete
phase: 04-rest-api-and-security
source: 04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md
started: 2026-03-11T16:20:00Z
updated: 2026-03-11T16:25:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Server boots from scratch without errors. A basic API call returns a valid HTTP response.
result: pass

### 2. JWT Guard blocks unauthenticated requests
expected: Any request without Authorization/auth header returns 403 Forbidden.
result: pass

### 3. @Public() routes bypass JWT guard
expected: If any route is marked @Public(), it responds without auth. If no public routes exist, skip this test.
result: pass

### 4. RolesGuard enforces permissions
expected: A user WITHOUT `read:accounts` permission calling GET /accounts gets 403. A user WITH `read:accounts` gets 200.
result: pass

### 5. POST /accounts creates account
expected: POST /accounts with valid name + cpf creates account, returns 201 with envelope { data, meta: { timestamp } }. Account persists in Postgres.
result: pass

### 6. POST /accounts idempotent on same auth0Sub
expected: Calling POST /accounts twice with same auth0Sub returns the same account (same id), does not create duplicate.
result: pass

### 7. POST /accounts rejects duplicate email/CPF
expected: Creating account with email/CPF already taken by different auth0Sub returns 409 with error code DUPLICATE_EMAIL or DUPLICATE_CPF.
result: pass

### 8. GET /accounts/:id returns account
expected: Returns 200 with account data wrapped in envelope. Returns 404 with ACCOUNT_NOT_FOUND for non-existent UUID. Returns 400 for invalid UUID.
result: pass

### 9. GET /accounts/me returns own account
expected: Returns 200 with the account linked to the caller's auth0Sub. Returns 404 if no account linked.
result: pass

### 10. PATCH /accounts/:id updates name and birthDate
expected: Sending { name } or { birthDate } or both returns 200 with updated data. Change persists in DB. Sending {} returns 400.
result: pass

### 11. GET /accounts returns paginated list (admin)
expected: Admin gets 200 with { data: [...], meta: { total, offset, limit, timestamp } }. Pagination params respected. Regular user gets 403.
result: pass

### 12. Request DTO validation
expected: Invalid input (empty name, bad CPF, bad date format, unknown fields) returns 422 with structured field errors { statusCode: 422, error: 'VALIDATION_ERROR', details: [...] }.
result: pass

### 13. Domain exception filter maps errors correctly
expected: ACCOUNT_NOT_FOUND → 404, DUPLICATE_EMAIL → 409, DUPLICATE_CPF → 409. Response has { statusCode, error, message, details }.
result: pass

### 14. Response envelope wraps responses
expected: Success responses wrapped in { data, meta }. List responses include { total, offset, limit } in meta. Error responses NOT wrapped in envelope.
result: pass

### 15. POST /accounts/:id/phone/send-code updates phone
expected: Sending valid phone (11 digits, DDD + 8-9 digits) returns 201 with updated phone in response. Persists in DB.
result: pass

### 16. POST /accounts/:id/phone/verify returns 501
expected: Returns 501 Not Implemented (deferred feature).
result: pass

### 17. POST /accounts/:id/photo uploads to S3/MinIO
expected: Multipart upload with image file returns 201. photoUrl in response points to MinIO. File actually exists in S3 bucket.
result: pass

## Summary

total: 17
passed: 17
issues: 0
pending: 0
skipped: 0

## Gaps

[none]
