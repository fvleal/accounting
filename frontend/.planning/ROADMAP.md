# Roadmap: Account Frontend

## Overview

Five phases that follow the natural dependency chain of this SPA. Auth must be solid before any feature is built. The read path (onboarding + profile display) must exist before edit interactions are added. Photo upload is the most complex isolated feature and goes last. Each phase delivers a complete, independently verifiable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Project scaffold with Auth0, MUI + Tailwind dark theme, layout shell, and API client
- [ ] **Phase 2: Onboarding** - Account guard state machine and new-user account creation flow
- [ ] **Phase 3: Profile Display** - Read-only profile page with skeleton loading, avatar fallback, and toast system
- [ ] **Phase 4: Profile Editing** - Edit modals for name, date of birth, and phone with form validation and optimistic updates
- [ ] **Phase 5: Photo Upload** - Client-side 3x4 crop and S3-backed photo upload

## Phase Details

### Phase 1: Foundation
**Goal**: The app shell runs, Auth0 login/logout works end-to-end, the API client injects tokens, and the dark theme is applied globally with MUI + Tailwind
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, LAYO-01, LAYO-02, LAYO-03
**Success Criteria** (what must be TRUE):
  1. User can click login, authenticate via Auth0 redirect, and land on the app without a login loop in React strict mode
  2. User can click logout from the header and is redirected back to the login screen
  3. Decoding the access token at jwt.io confirms it is a JWT (not opaque) with correct `audience` and `permissions` claims
  4. Token persists across page refresh in Safari and Brave (refresh token rotation active)
  5. The app renders in dark mode on all screen sizes with MUI components styled via Tailwind
**Plans:** 3 plans (2 executed + 1 gap closure)
Plans:
- [x] 01-01-PLAN.md — Scaffold Vite project, MUI dark theme + Tailwind CSS layers, Vitest setup
- [x] 01-02-PLAN.md — Auth0 login/logout, API client, layout shell, pages, routing
- [ ] 01-03-PLAN.md — Gap closure: fix routing redirect, Auth0 error handling, dashboard config

### Phase 2: Onboarding
**Goal**: New users (authenticated in Auth0 but without a backend Account record) are caught and routed to account creation; existing users proceed to the profile page
**Depends on**: Phase 1
**Requirements**: AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):
  1. A brand-new Auth0 user who has never created an Account is automatically redirected to the onboarding screen after login
  2. User can submit full name and CPF on the onboarding form and is redirected to the profile page on success
  3. Submitting an invalid CPF shows an inline validation error without navigating away
  4. An existing user with an Account record is never shown the onboarding screen
**Plans**: TBD

### Phase 3: Profile Display
**Goal**: Authenticated users with an Account record can view all their personal information in a Google Personal Info-style read-only layout
**Depends on**: Phase 2
**Requirements**: PROF-01, PROF-02, PROF-03, PROF-04
**Success Criteria** (what must be TRUE):
  1. User sees all profile fields (name, email, CPF, birthday, phone, photo) displayed in read-only cards after login
  2. User sees skeleton placeholder cards while profile data is loading, with no blank-page flash
  3. User without a profile photo sees an avatar displaying their initials instead of a broken image
  4. User sees a toast notification confirming success or describing the error after any profile action
**Plans**: TBD

### Phase 4: Profile Editing
**Goal**: Users can edit their mutable profile fields (name, date of birth, phone) via modals with validation, and see updated values immediately
**Depends on**: Phase 3
**Requirements**: EDIT-01, EDIT-02, EDIT-03, EDIT-04
**Success Criteria** (what must be TRUE):
  1. User can click a name card, edit full name in a modal with validation, save, and see the updated name on the profile page without a full reload
  2. User can click the birthday card, pick a date from a date picker modal, save, and see the updated birthday immediately
  3. User can click the phone card, edit their phone number in a modal, and sees a "not verified" badge next to the phone field on the profile page
  4. If a save fails (network error, validation rejection), the profile page rolls back to the previous value and a toast describes the error
**Plans**: TBD

### Phase 5: Photo Upload
**Goal**: Users can upload a profile photo by selecting a file, cropping it client-side to 3x4 ratio, previewing the result, and confirming the upload
**Depends on**: Phase 4
**Requirements**: PHOT-01, PHOT-02
**Success Criteria** (what must be TRUE):
  1. User can select an image file, see a draggable/zoomable 3x4 crop interface, and adjust the crop before confirming
  2. User sees a preview of the exact cropped result before the upload is sent to the server
  3. After confirming, the profile page shows the new photo without requiring a manual refresh
  4. Selecting a new photo for crop never causes a canvas security error (crop operates on local File/Blob only)
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/3 | Gap closure pending | - |
| 2. Onboarding | 0/TBD | Not started | - |
| 3. Profile Display | 0/TBD | Not started | - |
| 4. Profile Editing | 0/TBD | Not started | - |
| 5. Photo Upload | 0/TBD | Not started | - |
