# Production staff session refresh persistence repair

Date: 2026-10-11

Branch: `codex/session-refresh-persistence-production`

Release state: local candidate only; no push or deployment

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

## Release boundary

Expected production asset: `portal/portal.js?v=192`.

After explicit approval, push the exact candidate and deploy only to production Netlify site `ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06`. Do not apply migrations or deploy Edge Functions. Then perform separate signed-in Owner refresh, hard-refresh, second-tab, token-refresh, logout, and revocation acceptance.
