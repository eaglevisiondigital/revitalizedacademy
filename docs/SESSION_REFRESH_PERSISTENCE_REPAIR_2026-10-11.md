# Production staff session refresh persistence repair

Date: 2026-10-11

Branch: `codex/session-refresh-persistence-production`

Release state: refresh/logout foundation deployed; post-logout console repair locally verified and pending exact-SHA approval

## Incident and root cause

The production staff portal created Supabase Auth with `persistSession`, `autoRefreshToken`, and URL-session detection enabled, but startup made one `getSession()` read and treated an empty result as a final signed-out state. It did not coordinate that read with Supabase's authoritative `INITIAL_SESSION` event. A refresh could therefore display sign-in before browser storage restoration completed. Auth storage itself was not disabled or cleared.

## Repair

- Show a neutral **Restoring your session…** state until session restoration resolves.
- Subscribe before bootstrap and reconcile the initial storage read with `INITIAL_SESSION`, followed by one bounded final read for older browser scheduling.
- Coalesce duplicate bootstrap events by user and access-token identity.
- Reauthorize staff access after token refresh while preserving an already-authorized visible workspace.
- Invalidate stale async staff/dashboard work with a session epoch.
- Preserve the existing fresh-document boundary for account changes and access revocation.
- Preserve explicit logout, shared-tab sign-out propagation, staff role/scope checks, and production project/origin configuration.

No database, migration, RLS, Edge Function, secret, or Supabase project configuration changed.

## Security properties

- A different Auth user destroys the old portal document before the new account resolves.
- Revoked or inactive staff fail closed and rendered private DOM is removed.
- Explicit logout clears shared browser auth state and remains logged out after refresh.
- Stale dashboard responses cannot paint after session invalidation.
- Production uses only project `voalfpxiyznnqfcqcymd` and `https://revitalizedacademy.com`; beta is not referenced by the release artifact.

## Validation

- Production build: 389 files.
- JavaScript syntax: 116 source/test JavaScript and CommonJS files.
- Maintained production frontend/runtime set: 113 passed, 0 failed.
- Focused staff session runtime: 7 passed.
- Exact-built Chrome: 12 checks passed.
- Exact-built WebKit: 12 checks passed, including 390×844 overflow.
- Covered normal refresh, hard bootstrap, second tab, delayed initial restoration, duplicate event coalescing, token refresh, revocation, logout persistence, account transition, Owner and scoped-Coach resolution.
- `git diff --check`: passed.

The exact-built browser fixtures are isolated and use no credentials or hosted data. Hosted acceptance was subsequently completed with an authenticated production Owner session as recorded below.

## Hosted acceptance follow-up

The approved initial source `0d0c9f7218ebf26402efbefc67ef73eed171b55d` was pushed and deployed to production as Netlify deploy `6acb8788e3ef05eba4fa685c`; its live `portal.js?v=192` hash matched the exact built artifact. Signed-in Owner normal refresh, hard refresh, and second-tab restoration passed without falling back to the login screen.

Logout then exposed an existing lifecycle cleanup defect outside the initial bootstrap repair: `portal-client-lifecycle.js` received `SIGNED_OUT` after the portal core had already removed the private shell, and its reset handler dereferenced the removed lifecycle modal. Auth was cleared, but the visible tab remained on **Signing out…**. The replacement candidate makes lifecycle status/close/reset cleanup null-safe, adds a regression that removes the private portal shell before `SIGNED_OUT`, and bumps the lifecycle asset to `portal-client-lifecycle.js?v=102`.

Replacement validation:

- Production build: 389 files.
- JavaScript syntax: passed.
- Maintained production unit/runtime set: 132 passed, 0 failed.
- Focused lifecycle + staff-session tests: 23 passed, 0 failed.
- Exact-built lifecycle/responsive Chrome: 37 checks passed at 1440×1000, 768×1024, and 390×844.
- Exact-built staff-session Chrome + WebKit: 23 checks passed.
- Historical Build76–82 immutable-baseline tests remain separate from the maintained current-baseline suite; their known stale snapshot failures were not caused by this repair.

The approved replacement source `d4c34653bde9d1a7dce62a31f97e305f95c0a666` was pushed and deployed only to production as Netlify deploy `6acbe82d68f1fde80c369183`. The exact-built and live `portal-client-lifecycle.js?v=102` SHA-256 is `21bf611da1fdbe80ae81997dfa510215c7e8d600d141022dc580aaa8ffbfa5f0`.

Authenticated production Owner acceptance passed:

- normal refresh restored the same Owner dashboard;
- hard refresh restored the same Owner dashboard;
- a second tab restored the same Owner session;
- logout completed without the prior **Signing out…** dead end;
- logout propagated to the second tab;
- refresh after logout remained on the sign-in screen;
- the Owner name, Operations Dashboard, and private People navigation were absent after logout;
- no `portal-client-lifecycle.js?v=102` warning or error was captured.

That acceptance also exposed the final release blocker: Executive Pulse, Community, ReFuel, staff-permission, and staff-onboarding continued issuing startup or in-flight requests after session invalidation. Their late authorization failures produced console errors after the private portal shell had been removed.

## Post-logout console repair

The production-only follow-up candidate:

- adds `captureStaffSession()`, `isStaffSessionCurrent()`, and `createAuthenticatedTaskGuard()` to the portal core;
- binds every affected async load or mutation to the current staff user and session epoch;
- invalidates pending work on `ra:staff-access-reset` before the private shell is removed;
- clears startup, close, and reload timers during teardown;
- disconnects the permissions `MutationObserver` during teardown;
- prevents signed-out and inactive-session bootstrap queries;
- ignores stale results without logging or rendering; and
- permits a fresh valid account to initialize from clean module state.

Published cache candidates are `portal.js?v=193`, `portal-permissions.js?v=133`, `portal-staff-onboarding.js?v=145`, and `portal-executive.js`, `portal-community.js`, and `portal-refuel.js` at `v=167`.

Local verification:

- production build: 389 files;
- JavaScript syntax: 117/117;
- focused module, session, and lifecycle unit/runtime tests: 28/28;
- exact-built Chromium/WebKit session and module matrix: 39/39;
- zero warning/error console events in Chromium and WebKit;
- `git diff --check`: passed.

The tests cover valid initialization, logout teardown, stale async completion after logout, refresh while logged out, inactive/revoked access, account transition, clean new-account initialization, private-DOM removal, and timer/observer cancellation.

## Release boundary

Live production remains on Netlify deploy `6acbe82d68f1fde80c369183` with `portal/portal.js?v=192` and `portal/portal-client-lifecycle.js?v=102`. The post-logout console candidate is local and unpushed. After exact-SHA approval, deploy only the matching production build to Netlify site `ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06`. Do not apply migrations, deploy Edge Functions, or modify beta.
