# Feature Research

**Domain:** Account/Profile Management Frontend (SPA)
**Researched:** 2026-03-11
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Auth0 login/logout | Users must authenticate to see their data. Every account page has this. | LOW | Auth0 React SDK handles the heavy lifting. Redirect-based flow is standard. |
| Display personal info in read-only cards | Google, Apple, Microsoft all show info in scannable card/list format. Users expect to see their data at a glance. | LOW | Cards with label + value + edit affordance. This IS the page. |
| Edit name via modal | Basic profile field. Google does exactly this: click row, modal opens, edit, save. | LOW | Single text field modal with validation (min length, no special chars). |
| Edit date of birth via modal | Standard personal info field present on Google, Apple, Microsoft account pages. | LOW | Date picker component. Backend accepts ISO date string. |
| Edit phone via modal | Contact info is core to any account page. | LOW | Phone input with formatting. Show "not verified" badge since verification is out of scope for v1. |
| Profile photo display | Users expect to see their avatar. Faceless accounts feel incomplete and impersonal. | LOW | Display from S3 URL. Fallback to initials avatar when no photo exists. |
| Profile photo upload with crop | Upload-then-crop is the standard flow (Instagram, Slack, Google). Users expect to adjust framing before saving. | MEDIUM | 3x4 aspect ratio crop is non-standard (most use square/circle). Need a good cropping library. Client-side crop before upload to S3 presigned URL. |
| Responsive layout (mobile + desktop) | Non-negotiable in 2026. Over 50% of web traffic is mobile. | MEDIUM | Mobile-first design. Cards stack vertically on mobile, wider layout on desktop. |
| Loading states | Users need feedback that data is being fetched. Blank screens feel broken. | LOW | Skeleton screens for initial load. Spinner/disabled state for save operations. |
| Error handling and feedback | Users need to know when saves succeed or fail. Silent failures destroy trust. | LOW | Toast/snackbar notifications for success. Inline error messages for validation. Modal-level error display for API failures. |
| Onboarding / account creation flow | PROJECT.md specifies this: users without an Account record must create one (name + CPF). Without it, new users hit a dead end. | MEDIUM | Redirect to onboarding form when API returns 404 for the user's account. Guard the profile page behind account existence. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Dark mode as default with polished aesthetic | Most account pages (Google, Microsoft) are plain white backgrounds. A well-executed dark mode stands out and signals a modern, developer-aware product. | MEDIUM | Use CSS custom properties for theming. Dark mode is the primary design, not an afterthought. Consider a light mode toggle for accessibility later (v2). |
| Optimistic UI updates | When a user saves their name, show the new value immediately instead of waiting for the API round-trip. Makes the app feel instant. Google does this well. | LOW | Update local state on submit, revert on error. Simple pattern with React state or query cache. |
| Skeleton loading screens | Instead of spinners, show content-shaped placeholders during load. Reduces perceived wait time by up to 40% (Nielsen Norman Group research). | LOW | Skeleton components matching card layout. Small effort, outsized UX impact. |
| Initials-based fallback avatar | When no photo is uploaded, generate a colored circle with the user's initials instead of a generic silhouette. LinkedIn, Slack, and Google all do this. Feels personal even without a photo. | LOW | Generate from full name, pick background color deterministically from name hash. |
| Smooth modal transitions | Animated modal open/close (fade + slide) instead of abrupt show/hide. Makes the edit experience feel polished. | LOW | CSS transitions or Framer Motion. Small detail, big perception difference. |
| Field-level "last updated" timestamps | Show when each field was last changed. Builds trust and helps users remember what they have updated. Uncommon on most account pages. | LOW | Backend already stores `updatedAt`. Display relative time ("2 days ago") next to fields. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Inline editing (click-to-edit fields directly) | Seems faster than modals, fewer clicks | Harder to handle validation, cancellation, and multi-field consistency. Messy on mobile where tap targets conflict with text selection. Google deliberately chose modals over inline. | Use modals. They provide clear context, cancel/save actions, and validation space. |
| Email editing | Users sometimes want to change their email | Backend treats email as immutable (tied to Auth0 identity). Building UI for it creates confusion when it silently fails or requires complex identity migration. | Display email as read-only with a clear "managed by Auth0" note. |
| CPF editing | Users might have entered it wrong | Backend treats CPF as immutable after creation. Allowing edits in the UI creates false expectations. | Display as read-only. If wrong, direct user to support. |
| Settings page with toggles (notifications, privacy, etc.) | Every "real" app has a settings page | This is an account info viewer, not a full application. Adding settings implies features that do not exist yet. Scope creep that delays launch. | Launch with profile info only. Add settings when there are actual settings to configure. |
| Admin panel in the same SPA | Convenient to have admin and user views together | Mixes authorization concerns, increases bundle size, and complicates routing. Admin needs are different from user self-service. | Build admin as a separate app (v2, per PROJECT.md). |
| Multi-language support (i18n) | Seems professional | Premature internationalization adds complexity to every string in the app. This project targets Brazilian Portuguese users. | Hardcode pt-BR strings. Add i18n framework only when expanding to other markets. |
| Real-time data sync (WebSockets) | Data might change from another session | Account data changes infrequently and always by the user themselves. WebSocket infrastructure is overkill. | Refetch on window focus (React Query `refetchOnWindowFocus`). Simple and sufficient. |
| Password change / security settings | Account pages often have these | Auth0 manages passwords and security. Building custom password UI duplicates Auth0's hosted pages and introduces security risks. | Link to Auth0's hosted password reset flow. Do not build custom password forms. |

## Feature Dependencies

```
[Auth0 Login/Logout]
    |
    +--requires--> [Onboarding Flow]
    |                   |
    |                   +--requires--> [Profile Display Page]
    |                                       |
    |                                       +--enables--> [Edit Name Modal]
    |                                       +--enables--> [Edit Birthday Modal]
    |                                       +--enables--> [Edit Phone Modal]
    |                                       +--enables--> [Photo Upload + Crop]
    |
    +--enables--> [Skeleton Loading] (needs auth token to fetch data)

[Profile Display Page]
    +--enhanced-by--> [Dark Mode Theme]
    +--enhanced-by--> [Optimistic Updates]
    +--enhanced-by--> [Initials Avatar Fallback]
    +--enhanced-by--> [Skeleton Loading]

[Photo Upload + Crop]
    +--enhanced-by--> [Initials Avatar Fallback] (shown when no photo)

[Responsive Layout] --applies-to--> [All UI Components]
```

### Dependency Notes

- **Onboarding requires Auth0 Login:** User must be authenticated before we can check if they have an Account record and route to onboarding if not.
- **Profile Display requires Onboarding:** The profile page assumes an Account exists. Onboarding must create it first for new users.
- **Edit Modals require Profile Display:** Modals are triggered from the profile page cards. No profile page = no edit entry points.
- **Photo Upload requires Auth + Profile:** Needs the auth token for the presigned URL endpoint and the account ID.
- **Skeleton Loading requires Auth:** Cannot fetch data without the access token, so skeleton appears between auth completion and data arrival.

## MVP Definition

### Launch With (v1)

Minimum viable product -- what is needed to ship a usable account management page.

- [ ] Auth0 login/logout with redirect flow -- gate to everything
- [ ] Onboarding screen (full name + CPF) for users without an Account -- unblocks new users
- [ ] Profile display page with read-only cards (name, email, CPF, birthday, phone, photo) -- the core product
- [ ] Edit name modal with validation -- most commonly edited field
- [ ] Edit birthday modal with date picker -- standard profile field
- [ ] Edit phone modal with unverified badge -- contact info management
- [ ] Photo upload with 3x4 crop -- visual identity, high user engagement
- [ ] Dark mode theme -- project requirement, core aesthetic
- [ ] Responsive layout -- non-negotiable for mobile users
- [ ] Loading states (skeleton screens) -- prevents blank page flash
- [ ] Error handling with toast notifications -- users must know what happened
- [ ] Initials avatar fallback -- polished feel without requiring photo

### Add After Validation (v1.x)

Features to add once core is working and users are actively using the app.

- [ ] Optimistic UI updates for edit operations -- when perceived speed matters
- [ ] Field-level "last updated" display -- when users ask "when did I change this?"
- [ ] Animated modal transitions -- when polish pass happens
- [ ] Light mode toggle -- when accessibility feedback requires it
- [ ] Phone verification badge (green "verified") -- when backend v2 ships verification

### Future Consideration (v2+)

Features to defer until the broader system matures.

- [ ] Admin panel (separate SPA) -- per PROJECT.md, planned for v2
- [ ] i18n / multi-language -- only when expanding beyond Brazil
- [ ] Settings page (notifications, privacy) -- only when there are settings to configure
- [ ] Account deletion flow -- requires backend support and legal compliance
- [ ] Activity log / login history -- security feature, needs backend events

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Auth0 login/logout | HIGH | LOW | P1 |
| Onboarding flow | HIGH | MEDIUM | P1 |
| Profile display page | HIGH | LOW | P1 |
| Edit name modal | HIGH | LOW | P1 |
| Edit birthday modal | MEDIUM | LOW | P1 |
| Edit phone modal | MEDIUM | LOW | P1 |
| Photo upload + crop | HIGH | MEDIUM | P1 |
| Dark mode theme | MEDIUM | MEDIUM | P1 |
| Responsive layout | HIGH | MEDIUM | P1 |
| Skeleton loading | MEDIUM | LOW | P1 |
| Error handling / toasts | HIGH | LOW | P1 |
| Initials avatar fallback | MEDIUM | LOW | P1 |
| Optimistic UI updates | MEDIUM | LOW | P2 |
| Modal animations | LOW | LOW | P2 |
| Field timestamps | LOW | LOW | P2 |
| Light mode toggle | LOW | MEDIUM | P3 |
| Phone verification badge | MEDIUM | LOW | P3 (backend dependent) |
| Account deletion | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Google Personal Info | Apple Account | Microsoft Account | Our Approach |
|---------|---------------------|---------------|-------------------|--------------|
| Layout | Card list, click opens inline expand or modal | Sectioned page with navigation | Dashboard with section links | Card list with modal edit (Google pattern) |
| Photo upload | Circular crop, immediate preview | Circular crop | Circular crop | 3x4 crop (project requirement) |
| Field editing | Modal/inline expand per field | Navigate to sub-page | Navigate to sub-page | Modal per field (cleanest for SPA) |
| Read-only fields | Grayed out, no edit affordance | Shown without edit button | Shown without edit button | Shown with lock icon or "managed by" note |
| Loading | Skeleton screens | Progressive load | Skeleton screens | Skeleton screens |
| Dark mode | Not default (system preference) | Not default | Not default | Default (differentiator) |
| Onboarding | Part of Google account creation | Part of Apple account creation | Part of Microsoft account creation | Separate in-app flow (backend creates Account on demand) |
| Error feedback | Inline errors in modals | Inline errors | Toast + inline | Toast for success, inline for validation |

## Sources

- [Baymard Institute: Accounts & Self-Service UX 2025](https://baymard.com/blog/current-state-accounts-selfservice)
- [Designing profile, account, and setting pages for better UX (Medium)](https://medium.com/design-bootcamp/designing-profile-account-and-setting-pages-for-better-ux-345ef4ca1490)
- [10 User Profile UX Best Practices (CLIMB)](https://climbtheladder.com/10-user-profile-ux-best-practices/)
- [Login & Signup UX Guide 2025 (Authgear)](https://www.authgear.com/post/login-signup-ux-guide)
- [Inline Edit Design Pattern (Andrew Coyle)](https://coyleandrew.medium.com/the-inline-edit-design-pattern-e6d46c933804)
- [Modal UX Best Practices (LogRocket)](https://blog.logrocket.com/ux-design/modal-ux-design-patterns-examples-best-practices/)
- [Skeleton Screens (Nielsen Norman Group)](https://www.nngroup.com/articles/skeleton-screens/)
- [Optimistic UI Patterns (Simon Hearne)](https://simonhearne.com/2021/optimistic-ui-patterns/)
- [Google Account M3 Redesign (9to5Google)](https://9to5google.com/2025/11/28/google-account-web-redesign/)
- [Apple Account Management Guide (Intego)](https://www.intego.com/mac-security-blog/how-to-manage-and-use-your-apple-account-id-the-complete-guide/)
- [react-avatar-editor (GitHub)](https://github.com/mosch/react-avatar-editor)

---
*Feature research for: Account/Profile Management Frontend*
*Researched: 2026-03-11*
