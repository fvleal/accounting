# Requirements: Account Frontend

**Defined:** 2026-03-11
**Core Value:** O usuario consegue manter suas informacoes pessoais atualizadas de forma simples e rapida

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: User can log in via Auth0 redirect flow and access protected pages
- [ ] **AUTH-02**: User can log out from any page and is redirected to login
- [ ] **AUTH-03**: User without an Account record is redirected to onboarding screen
- [ ] **AUTH-04**: User can create an Account by submitting full name and CPF on onboarding screen

### Profile Display

- [ ] **PROF-01**: User sees their personal info displayed in read-only cards (name, email, CPF, birthday, phone, photo)
- [ ] **PROF-02**: User sees skeleton loading placeholders while profile data is being fetched
- [ ] **PROF-03**: User sees toast notifications for success and error feedback after actions
- [ ] **PROF-04**: User sees an initials-based avatar when no profile photo exists

### Profile Editing

- [ ] **EDIT-01**: User can edit their full name via modal with validation
- [ ] **EDIT-02**: User can edit their date of birth via modal with date picker
- [ ] **EDIT-03**: User can edit their phone number via modal (with "not verified" badge displayed)
- [ ] **EDIT-04**: User sees updated values immediately after saving (optimistic updates with rollback on error)

### Photo

- [ ] **PHOT-01**: User can upload a profile photo with client-side 3x4 crop before submission
- [ ] **PHOT-02**: User sees a preview of the cropped photo before confirming upload

### Layout & Theme

- [ ] **LAYO-01**: Layout is responsive and usable on both mobile and desktop devices
- [ ] **LAYO-02**: App uses dark mode as the default theme with MUI theming
- [ ] **LAYO-03**: UI uses MUI component library with Tailwind CSS for custom styling

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Admin Panel

- **ADMN-01**: Admin users can view a list of all accounts
- **ADMN-02**: Admin users can search accounts by name, email, or CPF
- **ADMN-03**: Admin users can view detailed account information

### Enhancements

- **ENHN-01**: User can toggle between dark and light mode
- **ENHN-02**: User sees animated modal transitions (fade + slide)
- **ENHN-03**: User sees "last updated" timestamps per field
- **ENHN-04**: User sees verified/unverified badge on phone after backend v2 verification

## Out of Scope

| Feature | Reason |
|---------|--------|
| Inline editing (click-to-edit fields) | Modals are cleaner for validation, cancel/save, mobile UX |
| Email editing | Backend treats email as immutable (tied to Auth0 identity) |
| CPF editing | Backend treats CPF as immutable after creation |
| Password change UI | Auth0 manages passwords via hosted pages |
| Settings page | No settings to configure yet |
| i18n / multi-language | Target is Brazilian Portuguese only |
| Real-time sync (WebSockets) | Account data changes infrequently, refetch on focus is sufficient |
| Account deletion | Requires backend support and legal compliance |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | — | Pending |
| AUTH-02 | — | Pending |
| AUTH-03 | — | Pending |
| AUTH-04 | — | Pending |
| PROF-01 | — | Pending |
| PROF-02 | — | Pending |
| PROF-03 | — | Pending |
| PROF-04 | — | Pending |
| EDIT-01 | — | Pending |
| EDIT-02 | — | Pending |
| EDIT-03 | — | Pending |
| EDIT-04 | — | Pending |
| PHOT-01 | — | Pending |
| PHOT-02 | — | Pending |
| LAYO-01 | — | Pending |
| LAYO-02 | — | Pending |
| LAYO-03 | — | Pending |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 0
- Unmapped: 17 ⚠️

---
*Requirements defined: 2026-03-11*
*Last updated: 2026-03-11 after initial definition*
