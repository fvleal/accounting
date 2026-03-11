# Pitfalls Research

**Domain:** React SPA account management with Auth0, image crop/upload, modal-based editing
**Researched:** 2026-03-11
**Confidence:** HIGH (Auth0 pitfalls well-documented in community forums and GitHub issues)

## Critical Pitfalls

### Pitfall 1: Third-Party Cookie Blocking Breaks Silent Authentication

**What goes wrong:**
Auth0's default silent authentication uses a hidden iframe that depends on third-party cookies to access the Auth0 session. Safari, Brave, and Firefox block third-party cookies by default. Chrome is phasing them out. Users on these browsers silently lose their session on page refresh -- they appear logged out with no error message.

**Why it happens:**
The Auth0 SPA SDK defaults to in-memory token storage with iframe-based silent auth as fallback. Developers test in Chrome where it still works, ship, and then get bug reports from Safari users who can never stay logged in.

**How to avoid:**
Configure `useRefreshTokens: true` and `cacheLocation: 'localstorage'` in the Auth0Provider. Enable Refresh Token Rotation in the Auth0 dashboard (API Settings > Refresh Token Rotation). This removes the dependency on third-party cookies entirely. The SDK will use `grant_type=refresh_token` instead of iframe-based silent auth.

```tsx
<Auth0Provider
  useRefreshTokens={true}
  cacheLocation="localstorage"
  // ... other config
>
```

**Warning signs:**
- Login works in Chrome but not Safari/Brave
- Users report "random logouts" or "have to login every time I refresh"
- `getAccessTokenSilently` throws `login_required` errors intermittently

**Phase to address:**
Phase 1 (Auth setup). This must be correct from the start -- retrofitting changes how tokens are stored and can log out all active users.

---

### Pitfall 2: Missing or Wrong `audience` Yields Opaque Access Tokens

**What goes wrong:**
Without the `audience` parameter in Auth0Provider, `getAccessTokenSilently()` returns an opaque token (not a JWT). This opaque token cannot be validated by the NestJS backend, which expects a JWT with specific claims. Every API call returns 401 Unauthorized despite the user being "logged in."

**Why it happens:**
Auth0 returns an opaque access token when no audience is specified (it assumes you only need an ID token for user info). Developers see `isAuthenticated: true` and assume the token works. The confusion between ID tokens and access tokens is the single most common Auth0 SPA mistake documented in community forums.

**How to avoid:**
Always set `audience` to match the API Identifier configured in Auth0 Dashboard. This is the same value the NestJS backend uses for JWT validation.

```tsx
<Auth0Provider
  audience="https://your-api-identifier"
  scope="openid profile email"
  // ...
>
```

Verify the token is a JWT (three dot-separated base64 segments) in dev tools before writing any API integration code.

**Warning signs:**
- Access token is a short random string instead of a long JWT (ey...)
- Backend returns 401 on every request despite frontend showing authenticated
- `jwt.io` cannot decode the access token

**Phase to address:**
Phase 1 (Auth setup). The very first API call will fail without this.

---

### Pitfall 3: Auth0 Redirect Callback Mishandling Causes Login Loops

**What goes wrong:**
After Auth0 redirects back to the app with `code` and `state` query parameters, the app must process them exactly once. If the callback URL is refreshed, or if React strict mode causes a double render, the SDK tries to exchange the same authorization code twice. The second attempt fails, and the app either shows an error or redirects back to Auth0, creating an infinite login loop.

**Why it happens:**
React 18+ strict mode in development renders components twice. If the Auth0 callback processing is not idempotent or is triggered by a useEffect without proper guards, the code exchange happens twice. Additionally, if the user bookmarks or refreshes the callback URL (`/?code=...&state=...`), the stale code triggers an error.

**How to avoid:**
1. Use `@auth0/auth0-react`'s built-in `Auth0Provider` which handles callback processing internally -- do not manually call `handleRedirectCallback`.
2. After successful callback processing, strip `code` and `state` from the URL using `window.history.replaceState`.
3. Set `onRedirectCallback` in Auth0Provider to navigate to the intended route and clean up the URL.

```tsx
<Auth0Provider
  onRedirectCallback={(appState) => {
    navigate(appState?.returnTo || '/profile');
  }}
>
```

**Warning signs:**
- Rapid URL changes between your app and Auth0 login page
- Console errors about "invalid state" or "invalid authorization code"
- Login works sometimes but not on page refresh

**Phase to address:**
Phase 1 (Auth setup). Must be tested thoroughly before building anything on top.

---

### Pitfall 4: Onboarding Race Condition -- Auth Completes Before Account Exists

**What goes wrong:**
A new user authenticates via Auth0 (user record exists in Auth0), but their Account record in the NestJS backend does not yet exist. The frontend redirects to the profile page, calls GET /account, receives 404, and either crashes or shows a broken state. Worse: if the frontend tries to auto-create the account on 404, concurrent requests can create duplicate accounts.

**Why it happens:**
Auth0 authentication and backend account creation are two separate operations. The Auth0 redirect completes and `isAuthenticated` becomes `true` before the app has determined whether the user has an Account. Developers build the happy path (existing user with account) first and bolt on onboarding later, leading to fragile conditional routing.

**How to avoid:**
Design the post-auth flow as a state machine from the start:
1. Auth0 callback completes -> `isAuthenticated: true`
2. Fetch account from backend (GET /account)
3. If 404 -> route to onboarding screen (create account: full name + CPF)
4. If 200 -> route to profile screen
5. Wrap this in a single `AccountProvider` context that all routes depend on

The account check must be a blocking gate -- no route renders until account status is known. Use a loading state during the check.

**Warning signs:**
- Profile page briefly flashes empty data before redirecting to onboarding
- 404 errors in network tab after login for new users
- Duplicate account creation attempts in backend logs

**Phase to address:**
Phase 1-2 (Auth + Onboarding). The routing architecture must accommodate this from the very beginning.

---

### Pitfall 5: Tainted Canvas When Cropping Images Loaded from S3

**What goes wrong:**
When a user wants to re-crop their existing profile photo (already stored in S3), the app loads the image into a canvas for cropping. If the S3 URL is cross-origin and the image element lacks `crossOrigin="anonymous"`, the canvas becomes "tainted." Calling `canvas.toBlob()` or `canvas.toDataURL()` throws a SecurityError, and the crop silently fails or crashes.

**Why it happens:**
This only manifests when editing an existing photo (not on first upload from the user's device), so developers miss it during initial testing. The S3 bucket may serve images without proper CORS headers, or the `crossOrigin` attribute is missing on the `<img>` element. Safari is particularly strict about attribute ordering -- `crossOrigin` must be set before `src`.

**How to avoid:**
1. Configure S3 bucket CORS to allow the frontend origin with `Access-Control-Allow-Origin`
2. Always set `crossOrigin="anonymous"` on image elements before setting `src`
3. For the crop flow: only crop images from the user's local file input (File/Blob), not from S3 URLs. After upload, display the S3 image as a preview only (no re-crop from S3).

**Warning signs:**
- "SecurityError: The operation is insecure" in console
- Crop works on first upload but fails when editing existing photo
- Works in Chrome but fails in Safari

**Phase to address:**
Phase 3 (Photo upload). Design the crop flow to always use local files, not remote URLs.

---

### Pitfall 6: S3 Upload via Backend with Wrong Content-Type or FormData Serialization

**What goes wrong:**
The backend expects the photo upload in a specific format (likely multipart/form-data based on the NestJS endpoint). Developers either: (a) send the cropped blob with the wrong Content-Type header, (b) wrap the blob in FormData incorrectly causing double-encoding, or (c) send base64 instead of binary, tripling the payload size and possibly exceeding request limits.

**Why it happens:**
After cropping, `canvas.toBlob()` produces a Blob. Converting this Blob to the correct upload format is error-prone. `FormData.append()` behavior differs based on whether you pass a Blob or a File. If the backend uses a file upload interceptor (like Multer in NestJS), it expects a specific field name and content type.

**How to avoid:**
1. Convert the cropped canvas to a Blob (not base64): `canvas.toBlob(callback, 'image/jpeg', 0.85)`
2. Create a File from the Blob: `new File([blob], 'profile.jpg', { type: 'image/jpeg' })`
3. Append to FormData with the exact field name the backend expects: `formData.append('file', file)`
4. Let the browser set the Content-Type header automatically (do NOT manually set `Content-Type: multipart/form-data` -- the browser must add the boundary parameter)
5. Test with the actual backend endpoint early, not just mocked responses

**Warning signs:**
- 400 or 422 errors on upload with "file not found" or "invalid file type" messages
- Upload succeeds but image is corrupted or zero bytes on S3
- Upload payload is 3x larger than expected (base64 encoding)

**Phase to address:**
Phase 3 (Photo upload). Integrate with the real backend endpoint immediately -- do not mock this.

---

### Pitfall 7: RBAC Permissions Not in Access Token

**What goes wrong:**
The backend enforces RBAC with permissions like `create:account`, `read:own-account`, `update:own-account`. The frontend requests an access token but permissions are not included in the JWT claims. The backend rejects requests with 403 Forbidden even though the user has the correct roles assigned.

**Why it happens:**
Auth0 does not include permissions in the access token by default. You must explicitly enable "Add Permissions in the Access Token" in the Auth0 API settings. Additionally, roles assigned to users do not automatically appear in ID tokens -- you need a custom Auth0 Action (post-login) to add them if the frontend needs role information for conditional UI rendering.

**How to avoid:**
1. In Auth0 Dashboard > APIs > [Your API] > Settings: Enable "RBAC" and "Add Permissions in the Access Token"
2. Verify by decoding a fresh access token at jwt.io -- permissions should appear as a `permissions` array claim
3. If the frontend needs role info for UI gating (e.g., showing admin features), create a post-login Action that adds roles to the token namespace
4. Do NOT rely on ID token claims for authorization -- use access token permissions

**Warning signs:**
- Backend returns 403 despite user having roles in Auth0 dashboard
- Decoded access token has no `permissions` claim
- Frontend shows features the user cannot actually use (UI not gated by real permissions)

**Phase to address:**
Phase 1 (Auth setup). Validate token contents before building any API integration.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Storing access token in React state instead of using SDK cache | Simple, no SDK complexity | Tokens not shared across tabs, stale after refresh, manual refresh logic needed | Never -- use the Auth0 SDK's built-in token management |
| Inline API calls in components instead of an API client layer | Faster to build first feature | Every component needs auth headers, error handling duplicated, impossible to add interceptors | Never -- create an API client with auth interceptor from Phase 1 |
| Using `any` types for API responses | Skip writing interfaces | No autocomplete, runtime errors from typos, impossible to refactor safely | Only in throwaway prototypes |
| Skipping loading/error states in modals | Faster UI development | User submits form, nothing happens, no feedback on errors | Never -- add from the start, it takes minutes |
| Hard-coding API base URL | Works in dev | Breaks in staging/production, no environment switching | Only if `.env` file is set up within the same session |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Auth0 | Calling `getAccessTokenSilently()` in every component that needs API access | Create a single API client (e.g., Axios instance with interceptor) that calls `getAccessTokenSilently()` once per request, handles 401 retry, and is shared across all API calls |
| Auth0 | Using `cacheMode: 'off'` to "fix" stale tokens | Use default caching. Only disable cache after role/permission changes on the backend (rare). Disabling cache causes a network request to Auth0 on every API call |
| NestJS Backend | Setting `Content-Type: multipart/form-data` manually on upload requests | Let the browser set it automatically via FormData -- manual setting omits the boundary parameter |
| NestJS Backend | Not handling 409 Conflict on account creation (duplicate CPF) | Display a specific error message; do not retry or show generic "something went wrong" |
| S3 (via backend) | Assuming upload always succeeds | Handle timeout, network errors, and file-too-large (backend may reject files over a size limit). Show progress indicator for uploads |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Calling `getAccessTokenSilently()` without caching in a render loop | Multiple simultaneous requests to Auth0 on every render, rate limiting | Use a centralized API client; SDK caches by default but calling it in render path causes unnecessary checks | Immediately in development -- visible as duplicate network requests |
| Loading full-resolution profile photo without resizing | Slow page load, large bandwidth usage, especially on mobile | Request a thumbnail URL from backend or use CSS `object-fit` with a reasonably sized image. Backend should store/serve optimized versions | When photos are >2MB (common with phone cameras) |
| Re-rendering entire profile page when a single field changes in modal | Janky UI, modal animation stutters | Keep modal state local to the modal component. Update parent only on successful save via callback or query invalidation | Noticeable with 5+ profile fields |
| Not debouncing/throttling crop area changes | Canvas redraws on every pixel of drag, CPU spikes on mobile | Debounce the `onCropComplete` callback (200-300ms). Only generate the final blob on "Save," not on every crop change | Immediately on low-end mobile devices |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Storing tokens in localStorage without Refresh Token Rotation | Stolen refresh token grants indefinite access | Enable Refresh Token Rotation + Automatic Reuse Detection in Auth0 dashboard. Each refresh token is single-use |
| Trusting frontend permission checks as authorization | Users can bypass UI restrictions via dev tools or direct API calls | Frontend permission checks are UX only. All authorization must be enforced on the backend (already done in NestJS). Never hide the "only security layer" in React |
| Not validating file type/size before upload on the client | Users can upload executables, huge files, or exploit the backend upload endpoint | Validate file type (image/jpeg, image/png) and size (<5MB) on the frontend before sending. Backend should also validate (defense in depth) |
| Exposing Auth0 domain and client ID in source code | Low risk since these are public by design in SPAs, but can enable phishing | These are intentionally public for SPAs. Ensure the Auth0 Application Type is set to "Single Page Application" (not "Regular Web App"), which prevents client secret usage |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No loading state between Auth0 redirect and profile render | User sees a blank screen or flash of login page for 1-3 seconds after redirect | Show a branded loading spinner/skeleton while `isLoading` is true from `useAuth0()`. This is the first thing users see |
| Modal closes on backdrop click during form submission | User accidentally loses their edit mid-save, data might still submit without feedback | Disable backdrop-close while submission is in progress. Use `isSubmitting` state to prevent premature dismissal |
| No optimistic update after profile edit | User saves name, modal closes, old name still shows until page refresh or refetch completes | Optimistically update the local profile state on save, revert on error. TanStack Query's `onMutate`/`onError` or React 19's `useOptimistic` handle this cleanly |
| CPF and email shown as editable but reject on save | User tries to edit, types new value, submits, gets an error -- frustrating | Clearly mark immutable fields as read-only with a visual indicator (lock icon, muted text, no click handler). Never show an edit affordance for fields that cannot be edited |
| Phone badge "nao verificado" with no path to verify | User sees a problem they cannot fix, creates anxiety and support requests | Either hide the badge until verification is available (v2), or show it with a tooltip explaining "Verification coming soon." Do not show a problem without a solution |

## "Looks Done But Isn't" Checklist

- [ ] **Auth flow:** Often missing token refresh on expiry -- verify the app handles a 401 response by silently refreshing the token and retrying the request (not by redirecting to login)
- [ ] **Auth flow:** Often missing the `isLoading` guard -- verify that protected routes show a loading state while Auth0 SDK initializes (not a flash of the login page)
- [ ] **Onboarding:** Often missing the "back" flow -- verify what happens if user is on onboarding page but already has an account (e.g., navigated directly via URL)
- [ ] **Profile edit modals:** Often missing error display -- verify that backend validation errors (400, 409, 422) are shown to the user with specific messages, not just a generic toast
- [ ] **Photo upload:** Often missing progress indicator -- verify that large photos (5MB+) show upload progress, not just a spinner
- [ ] **Photo upload:** Often missing crop preview -- verify user sees the cropped result before confirming upload
- [ ] **Responsive layout:** Often missing modal behavior on mobile -- verify modals are full-screen sheets on small viewports, not clipped desktop-style dialogs
- [ ] **Dark mode:** Often missing form input contrast -- verify inputs, placeholders, borders, and focus rings are visible on dark backgrounds
- [ ] **Logout:** Often missing token cleanup -- verify that after logout, navigating back does not show cached profile data

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Wrong audience / opaque tokens | LOW | Change audience in Auth0Provider config, clear localStorage, re-test. No backend changes needed |
| Login loop from callback mishandling | LOW | Fix onRedirectCallback, clear browser cookies/storage, re-test the full flow |
| Third-party cookie blocking | MEDIUM | Enable refresh tokens, update Auth0Provider config, but all existing sessions are invalidated -- users must re-login |
| Tainted canvas on S3 images | MEDIUM | Add CORS to S3 bucket config, add crossOrigin to image elements, re-test. May require backend changes if S3 config is managed there |
| Missing RBAC in tokens | LOW | Toggle settings in Auth0 dashboard, users get correct tokens on next login. No code changes |
| Onboarding race condition | HIGH | Requires rearchitecting the post-auth routing flow. If not caught early, account creation logic may be scattered across multiple components |
| FormData upload serialization | LOW | Fix the API client code, re-test upload. Backend does not need changes |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Third-party cookie blocking | Phase 1: Auth Setup | Test login flow in Safari and Brave, verify token persists across page refresh |
| Missing audience / opaque tokens | Phase 1: Auth Setup | Decode access token at jwt.io, verify it is a JWT with correct audience claim |
| RBAC permissions not in token | Phase 1: Auth Setup | Decode access token, verify `permissions` array is present |
| Login loop | Phase 1: Auth Setup | Test: complete login, refresh callback URL, verify no loop. Test in React strict mode |
| Onboarding race condition | Phase 2: Onboarding | Test: create new Auth0 user, login, verify onboarding screen appears without 404 flash |
| Tainted canvas | Phase 3: Photo Upload | Test: upload photo, then try to re-crop the uploaded photo from S3. Should not throw SecurityError |
| FormData serialization | Phase 3: Photo Upload | Test: crop and upload a photo, verify it appears correctly on the profile page. Check file size in network tab |
| Modal UX issues | Phase 2-3: Profile + Editing | Test: submit edit, click backdrop during save, verify no data loss. Test on mobile viewport |
| Dark mode contrast | Phase 1: Layout Setup | Visual audit of all form inputs on dark background. Check WCAG contrast ratios |

## Sources

- [Auth0 SPA SDK Documentation](https://auth0.com/docs/libraries/auth0-single-page-app-sdk) -- silent auth, refresh token rotation, third-party cookies
- [Auth0 React SDK Documentation](https://auth0.com/docs/libraries/auth0-react) -- Auth0Provider configuration
- [Auth0 Refresh Token Rotation](https://auth0.com/blog/securing-single-page-applications-with-refresh-token-rotation/) -- security model for SPAs
- [Auth0 Community: React SPA login lost on refresh](https://community.auth0.com/t/react-with-auth0-spa-looses-login-after-refresh/35461)
- [Auth0 Community: Silent auth fails on reload](https://community.auth0.com/t/react-spa-page-refresh-triggers-failed-silent-auth-on-reload/32659)
- [Auth0 Community: RBAC permissions in access token](https://community.auth0.com/t/best-practice-for-role-based-or-permission-based-authorization-in-a-react-spa/194364)
- [Auth0 Community: Infinite login loop](https://github.com/auth0/auth0-react/issues/298)
- [Auth0 Community: getAccessTokenSilently caching issues](https://community.auth0.com/t/getaccesstokensilently-with-ignorecache-still-giving-me-old-token/120663)
- [MDN: CORS-enabled images and tainted canvas](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image)
- [react-easy-crop GitHub](https://github.com/ValentinH/react-easy-crop) -- crop library and blob conversion patterns
- [DeepWiki: Auth0 React Token Management](https://deepwiki.com/auth0/auth0-react/4.2-token-management)

---
*Pitfalls research for: React SPA account management with Auth0, image crop/upload, modal-based editing*
*Researched: 2026-03-11*
