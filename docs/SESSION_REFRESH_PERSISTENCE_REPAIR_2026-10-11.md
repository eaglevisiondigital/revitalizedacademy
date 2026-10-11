# Production staff session refresh persistence repair

Date: 2026-10-11

Branch: `codex/session-refresh-persistence-production`

Release state: initial candidate deployed; replacement logout repair candidate pending approval

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

The exact-built browser fixtures are isolated and use no credentials or hosted data. A hosted reproduction could not be performed because the available production and beta tabs were signed out. Hosted acceptance therefore remains a release gate and is not claimed here.

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

## Release boundary

Expected production assets: `portal/portal.js?v=192` and `portal/portal-client-lifecycle.js?v=102`.

After explicit approval, push the exact candidate and deploy only to production Netlify site `ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06`. Do not apply migrations or deploy Edge Functions. Then perform separate signed-in Owner refresh, hard-refresh, second-tab, token-refresh, logout, and revocation acceptance.
