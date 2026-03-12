# Phase 3: Profile Display - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Read-only profile page where authenticated users with an Account record view all their personal information. Displays name, email, CPF, birthday, phone, and photo/avatar in a Google Personal Info-style layout with skeleton loading. No editing capabilities (that's Phase 4).

</domain>

<decisions>
## Implementation Decisions

### Card layout & grouping
- Google Personal Info style: section cards with rows inside, separated by dividers
- 2 section cards: "Informacoes basicas" (nome, email, CPF) + "Informacoes adicionais" (nascimento, telefone)
- Hero section above cards with avatar + name + email centered
- Editable rows (name, birthday, phone) show a subtle chevron (>) icon on the right; immutable rows (email, CPF) do not — prepares for Phase 4 without adding functionality
- Each row shows label on the left, value on the right

### Avatar & initials fallback
- Circular MUI Avatar, 80px, in the hero section above cards
- When no photo: show initials (first letter of first name + first letter of last name, e.g., "FV")
- Colored background from a small palette based on name hash
- When photo exists: show the photo in the same circular avatar

### Field formatting & masking
- CPF: full formatted display (123.456.789-00) — user's own profile, no privacy concern
- Birthday: DD/MM/YYYY format (Brazilian standard)
- Phone: (XX) XXXXX-XXXX format (Brazilian mobile with area code), mask on display even if stored raw
- Empty/null fields (birthday, phone): show row with "Nao informado" in secondary/muted text color — user knows the field exists

### Skeleton loading
- MUI Skeleton components mimicking the exact final layout structure
- Hero area: circular skeleton for avatar + rectangular skeletons for name/email text
- 2 cards with correct row counts (3 rows + 2 rows) — no layout shift when data loads
- Uses `useAccount` hook from Phase 2 (data is already cached if user came from onboarding)

### Claude's Discretion
- Exact card padding, spacing, and typography sizes
- Skeleton animation style (wave vs pulse)
- Transition behavior from skeleton to real data
- ProfileFieldRow component design (reusable row component or inline)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useAccount` hook (`src/hooks/useAccount.ts`): already fetches Account data via React Query with cache
- `Account` type (`src/types/account.ts`): has all fields — fullName, email, cpf, dateOfBirth, phone, photoUrl
- `LoadingScreen` component: used by AccountGuard, but profile page will use skeleton instead
- `maskCpf` utility (`src/utils/cpf.ts`): formats CPF for display
- notistack: already configured for toast notifications

### Established Patterns
- Container maxWidth="sm" for centered content (Phase 1)
- MUI Card for section containers (used in OnboardingPage)
- MUI + Tailwind: MUI for structure, Tailwind for spacing adjustments
- React Query cache: account data may already be cached from onboarding flow

### Integration Points
- `HomePage.tsx` is the current placeholder — will be replaced with ProfilePage
- App.tsx routing: `/` renders inside AccountGuard > AppLayout
- `useAccount()` returns `{ data, isLoading, error }` — profile page reads data directly

</code_context>

<specifics>
## Specific Ideas

- Visual reference: Google Personal Info page (myaccount.google.com/personal-info)
- Brazilian Portuguese labels: "Informacoes basicas", "Informacoes adicionais", "Nao informado"
- Chevron hint on editable rows is read-only visual — no onClick in this phase

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-profile-display*
*Context gathered: 2026-03-12*
