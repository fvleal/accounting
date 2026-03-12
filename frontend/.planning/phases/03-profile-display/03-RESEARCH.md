# Phase 3: Profile Display - Research

**Researched:** 2026-03-11
**Domain:** React read-only profile UI with MUI components, skeleton loading, avatar fallback
**Confidence:** HIGH

## Summary

Phase 3 replaces the placeholder `HomePage` with a Google Personal Info-style read-only profile page. The codebase already provides all data-fetching infrastructure (`useAccount` hook, `Account` type, React Query cache), display utilities (`maskCpf`), and notification system (notistack). The work is purely presentational: building the hero section with avatar, two section cards with labeled rows, skeleton loading states, and formatting utilities for phone and date.

The existing codebase is well-structured with clear patterns (MUI Card for containers, Container maxWidth="sm" for centering, `sx` prop for MUI styling, Tailwind for spacing adjustments). The Header component already contains a `getInitials` helper that can be extracted and reused.

**Primary recommendation:** Build a ProfilePage component with a reusable ProfileFieldRow, extract getInitials to a shared utility, add phone/date formatting utilities alongside existing cpf utility, and provide skeleton variants that match the exact final layout structure.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Google Personal Info style: section cards with rows inside, separated by dividers
- 2 section cards: "Informacoes basicas" (nome, email, CPF) + "Informacoes adicionais" (nascimento, telefone)
- Hero section above cards with avatar + name + email centered
- Editable rows (name, birthday, phone) show a subtle chevron (>) icon on the right; immutable rows (email, CPF) do not
- Each row shows label on the left, value on the right
- Circular MUI Avatar, 80px, in the hero section above cards
- When no photo: show initials (first letter of first name + first letter of last name), colored background from name hash
- When photo exists: show the photo in the same circular avatar
- CPF: full formatted display (123.456.789-00)
- Birthday: DD/MM/YYYY format (Brazilian standard)
- Phone: (XX) XXXXX-XXXX format (Brazilian mobile with area code)
- Empty/null fields: show "Nao informado" in secondary/muted text color
- MUI Skeleton components mimicking exact final layout structure
- Hero area: circular skeleton for avatar + rectangular skeletons for name/email
- 2 cards with correct row counts (3 rows + 2 rows) -- no layout shift when data loads
- Uses `useAccount` hook from Phase 2

### Claude's Discretion
- Exact card padding, spacing, and typography sizes
- Skeleton animation style (wave vs pulse)
- Transition behavior from skeleton to real data
- ProfileFieldRow component design (reusable row component or inline)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PROF-01 | User sees their personal info displayed in read-only cards (name, email, CPF, birthday, phone, photo) | Hero section + 2 section cards with ProfileFieldRow; maskCpf exists, need formatPhone and formatDate utilities |
| PROF-02 | User sees skeleton loading placeholders while profile data is being fetched | MUI Skeleton components matching exact layout; useAccount isLoading flag drives conditional render |
| PROF-03 | User sees toast notifications for success and error feedback after actions | notistack already configured; useAccount error state triggers error toast on fetch failure |
| PROF-04 | User sees an initials-based avatar when no profile photo exists | MUI Avatar with children fallback; getInitials exists in Header, extract to shared utility; name-hash color palette |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @mui/material | ^7.3.9 | Card, Avatar, Skeleton, Typography, Divider, Box | Project's component library |
| @mui/icons-material | ^7.3.9 | ChevronRight icon for editable rows | Already installed |
| @tanstack/react-query | ^5.90.21 | useAccount hook data fetching | Already wired |
| notistack | ^3.0.2 | Toast notifications | Already configured |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tailwindcss | ^4.2.1 | Minor spacing/utility adjustments | When sx prop is verbose for simple spacing |

### No New Dependencies
This phase requires zero new npm packages. Everything needed is already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── pages/
│   └── ProfilePage.tsx          # Main profile page (replaces HomePage)
├── components/
│   └── profile/
│       ├── ProfileHero.tsx       # Avatar + name + email hero section
│       ├── ProfileSectionCard.tsx # Reusable card wrapper with title
│       ├── ProfileFieldRow.tsx   # Label/value row with optional chevron
│       └── ProfileSkeleton.tsx   # Full-page skeleton matching layout
├── utils/
│   ├── cpf.ts                   # Existing - maskCpf
│   ├── phone.ts                 # NEW - formatPhone
│   ├── date.ts                  # NEW - formatBirthday
│   └── initials.ts              # NEW - getInitials + getAvatarColor (extracted from Header)
└── hooks/
    └── useAccount.ts            # Existing - no changes
```

### Pattern 1: Conditional Skeleton Rendering
**What:** Render skeleton or real content based on `isLoading` from useAccount
**When to use:** ProfilePage top level
**Example:**
```typescript
export function ProfilePage() {
  const { data: account, isLoading, error } = useAccount();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (error) {
      enqueueSnackbar('Erro ao carregar perfil.', { variant: 'error' });
    }
  }, [error, enqueueSnackbar]);

  if (isLoading) return <ProfileSkeleton />;

  if (!account) return null; // AccountGuard ensures this won't happen

  return (
    <>
      <ProfileHero account={account} />
      <ProfileSectionCard title="Informacoes basicas">
        <ProfileFieldRow label="Nome" value={account.fullName} editable />
        <ProfileFieldRow label="Email" value={account.email} />
        <ProfileFieldRow label="CPF" value={maskCpf(account.cpf)} />
      </ProfileSectionCard>
      <ProfileSectionCard title="Informacoes adicionais">
        <ProfileFieldRow label="Nascimento" value={formatBirthday(account.dateOfBirth)} editable />
        <ProfileFieldRow label="Telefone" value={formatPhone(account.phone)} editable />
      </ProfileSectionCard>
    </>
  );
}
```

### Pattern 2: MUI Avatar with Initials Fallback
**What:** Avatar shows photo when available, initials when not
**When to use:** ProfileHero component
**Example:**
```typescript
// MUI Avatar automatically shows children when src fails or is null
<Avatar
  src={account.photoUrl ?? undefined}
  sx={{
    width: 80,
    height: 80,
    bgcolor: getAvatarColor(account.fullName),
    fontSize: '1.5rem',
  }}
>
  {getInitials(account.fullName)}
</Avatar>
```

### Pattern 3: Reusable ProfileFieldRow
**What:** Row component showing label left, value right, optional chevron
**When to use:** Inside every section card
**Example:**
```typescript
interface ProfileFieldRowProps {
  label: string;
  value: string | null;
  editable?: boolean;
}

export function ProfileFieldRow({ label, value, editable }: ProfileFieldRowProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5, px: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography variant="body2" color={value ? 'text.primary' : 'text.secondary'}>
          {value ?? 'Nao informado'}
        </Typography>
        {editable && <ChevronRight sx={{ fontSize: 20, color: 'text.secondary' }} />}
      </Box>
    </Box>
  );
}
```

### Pattern 4: MUI Skeleton Matching Layout
**What:** Skeleton placeholders with exact same dimensions as real content
**When to use:** ProfileSkeleton component
**Example:**
```typescript
export function ProfileSkeleton() {
  return (
    <>
      {/* Hero skeleton */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3, mt: 2 }}>
        <Skeleton variant="circular" width={80} height={80} />
        <Skeleton variant="text" width={160} sx={{ mt: 1 }} />
        <Skeleton variant="text" width={200} />
      </Box>
      {/* Card 1: 3 rows */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Skeleton variant="text" width={180} sx={{ mb: 1 }} />
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} variant="text" height={48} />
          ))}
        </CardContent>
      </Card>
      {/* Card 2: 2 rows */}
      <Card>
        <CardContent>
          <Skeleton variant="text" width={200} sx={{ mb: 1 }} />
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} variant="text" height={48} />
          ))}
        </CardContent>
      </Card>
    </>
  );
}
```

### Anti-Patterns to Avoid
- **Loading with blank page:** Never show empty container while loading -- always show skeleton
- **Layout shift:** Skeleton dimensions MUST match real content dimensions so no jump occurs on data load
- **Hardcoded initials logic in multiple places:** Header already has getInitials -- extract to shared utility, don't duplicate
- **Formatting in JSX:** Don't inline date/phone parsing in JSX -- use utility functions for testability

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Skeleton loading | Custom CSS shimmer | MUI Skeleton | Handles animation, accessibility, dark mode |
| Avatar with fallback | Custom img + error handler | MUI Avatar | Built-in children fallback when src is null/fails |
| Card sections with dividers | Custom div containers | MUI Card + Divider | Consistent dark theme paper background, elevation |
| Chevron icon | SVG or unicode arrow | @mui/icons-material ChevronRight | Consistent sizing, theme color support |

**Key insight:** MUI Avatar's design already handles the photo-or-initials pattern natively. When `src` is null/undefined, it renders `children` (the initials). No conditional logic needed in the Avatar itself.

## Common Pitfalls

### Pitfall 1: Avatar src with empty string
**What goes wrong:** Setting `src=""` instead of `src={undefined}` causes Avatar to attempt to load an empty URL, showing a broken image instead of initials.
**Why it happens:** photoUrl is `string | null` -- null works but empty string doesn't.
**How to avoid:** Use `src={account.photoUrl ?? undefined}` or `src={account.photoUrl || undefined}`.
**Warning signs:** Broken image icon in the avatar circle.

### Pitfall 2: Date parsing timezone issues
**What goes wrong:** `new Date('2000-01-15')` is parsed as UTC midnight, which in Brazilian timezone (UTC-3) displays as Jan 14.
**Why it happens:** Date-only ISO strings are interpreted as UTC by the Date constructor.
**How to avoid:** Parse the date string manually by splitting on `-` rather than using `new Date()`. Example: `const [y, m, d] = dateStr.split('-'); return \`${d}/${m}/${y}\`;`
**Warning signs:** Birthdays showing one day off.

### Pitfall 3: Phone format assumption
**What goes wrong:** Backend may store phone with or without country code, with or without formatting.
**Why it happens:** No confirmed format from backend yet.
**How to avoid:** formatPhone should strip to digits first, then format. Handle both 10-digit (landline) and 11-digit (mobile) Brazilian numbers.
**Warning signs:** Misaligned formatting or missing digits.

### Pitfall 4: Skeleton layout shift
**What goes wrong:** Skeleton card heights don't match real content, causing visible jump.
**Why it happens:** Different padding, different row counts, or missing section title skeleton.
**How to avoid:** Use the same Card/CardContent structure with same row counts (3 + 2). Match py/px values.
**Warning signs:** Content "jumping" on load.

### Pitfall 5: useEffect for error toast fires on mount
**What goes wrong:** If React Query has a cached error from a previous failed fetch, the error toast fires immediately on mount.
**Why it happens:** `error` is already truthy when component mounts.
**How to avoid:** Use `isError` alongside error reference tracking, or only show toast on error state transition. Consider checking `error` and `isFetching` together.
**Warning signs:** Error toast appearing when navigating to profile even though data loaded fine previously.

## Code Examples

### getInitials utility (extract from Header)
```typescript
// src/utils/initials.ts
export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  '#1976d2', '#388e3c', '#d32f2f', '#7b1fa2',
  '#c2185b', '#0097a7', '#f57c00', '#5d4037',
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
```

### formatPhone utility
```typescript
// src/utils/phone.ts
export function formatPhone(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  // Remove country code if present (55)
  const local = digits.length === 13 && digits.startsWith('55')
    ? digits.slice(2)
    : digits;
  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }
  return phone; // Return as-is if unexpected format
}
```

### formatBirthday utility
```typescript
// src/utils/date.ts
export function formatBirthday(dateStr: string | null): string | null {
  if (!dateStr) return null;
  // Parse manually to avoid timezone issues
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}
```

### Updating Header to use shared getInitials
```typescript
// In Header.tsx, replace local getInitials with:
import { getInitials } from '../../utils/initials';
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| MUI v5 Skeleton in @mui/lab | MUI v7 Skeleton in @mui/material core | MUI v5+ | Import directly from @mui/material |
| MUI v5 Avatar sx prop | MUI v7 same API | Stable | No changes needed |
| Separate loading component | Skeleton matching layout | Best practice | Eliminates layout shift |

**Project specifics:**
- MUI v7 is installed (^7.3.9) -- all components are from @mui/material directly
- React 19 is installed -- no compatibility concerns with MUI v7
- Tailwind v4 is installed -- utility-first, no config file needed

## Open Questions

1. **Phone storage format in backend**
   - What we know: Account type has `phone: string | null`, backend stores it somehow
   - What's unclear: Whether digits-only, with country code, or pre-formatted
   - Recommendation: formatPhone should normalize by stripping non-digits first, handle multiple formats defensively. STATE.md notes this needs verification before Phase 4 (editing).

2. **dateOfBirth storage format**
   - What we know: Account type has `dateOfBirth: string | null`
   - What's unclear: Whether ISO date string (2000-01-15), ISO datetime (2000-01-15T00:00:00Z), or other
   - Recommendation: formatBirthday should handle both by splitting on T first, then on -. Defensive parsing.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + @testing-library/react 16.x |
| Config file | vite.config.ts (test section) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROF-01 | Profile fields displayed in read-only cards | unit | `npx vitest run src/__tests__/ProfilePage.test.tsx -t "displays" --reporter=verbose` | No - Wave 0 |
| PROF-02 | Skeleton loading shown while fetching | unit | `npx vitest run src/__tests__/ProfilePage.test.tsx -t "skeleton" --reporter=verbose` | No - Wave 0 |
| PROF-03 | Toast on error | unit | `npx vitest run src/__tests__/ProfilePage.test.tsx -t "toast" --reporter=verbose` | No - Wave 0 |
| PROF-04 | Initials avatar when no photo | unit | `npx vitest run src/__tests__/ProfilePage.test.tsx -t "initials" --reporter=verbose` | No - Wave 0 |
| -- | Phone formatting | unit | `npx vitest run src/__tests__/phone-utils.test.ts --reporter=verbose` | No - Wave 0 |
| -- | Date formatting | unit | `npx vitest run src/__tests__/date-utils.test.ts --reporter=verbose` | No - Wave 0 |
| -- | getInitials + getAvatarColor | unit | `npx vitest run src/__tests__/initials-utils.test.ts --reporter=verbose` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/ProfilePage.test.tsx` -- covers PROF-01, PROF-02, PROF-03, PROF-04
- [ ] `src/__tests__/phone-utils.test.ts` -- covers phone formatting
- [ ] `src/__tests__/date-utils.test.ts` -- covers birthday formatting
- [ ] `src/__tests__/initials-utils.test.ts` -- covers getInitials + getAvatarColor

## Sources

### Primary (HIGH confidence)
- Project codebase: `src/hooks/useAccount.ts`, `src/types/account.ts`, `src/utils/cpf.ts`, `src/pages/HomePage.tsx`, `src/components/layout/Header.tsx`, `src/pages/OnboardingPage.tsx`
- MUI v7 components (Avatar, Skeleton, Card, Divider, Typography, Box) -- already used in project, API stable
- package.json -- verified all needed packages already installed

### Secondary (MEDIUM confidence)
- MUI Avatar behavior: children render when src is null/fails -- verified by existing Header.tsx usage pattern in this project
- Date timezone pitfall -- well-documented JavaScript behavior with ISO date strings

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all packages already installed and used in project
- Architecture: HIGH - follows established project patterns (Card, Container maxWidth="sm", hooks)
- Pitfalls: HIGH - based on known JS/React/MUI behaviors and project-specific patterns
- Formatting utilities: MEDIUM - phone/date backend formats not yet confirmed, defensive parsing recommended

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable -- no moving parts, all libraries already locked)
