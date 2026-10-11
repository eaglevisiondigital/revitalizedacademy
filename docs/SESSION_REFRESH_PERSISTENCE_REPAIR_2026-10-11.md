# Beta staff and member session refresh persistence repair

Date: 2026-10-11

Branch: `codex/session-refresh-persistence-beta`

Release state: local candidate only; no push or deployment

## Incident and root cause

The beta staff and member clients already enabled Supabase `persistSession` and automatic refresh. Their startup logic nevertheless used an independent short retry/timer and could conclude that the browser was signed out before Supabase emitted the storage-backed `INITIAL_SESSION` event. On member token refresh, the prior implementation also cleared the entire authorized workspace before server reauthorization completed, producing a false logout/blank-state experience.

## Repair

- Show neutral **Restoring your session…** staff and member states until restoration resolves.
- Reconcile the initial storage read with `INITIAL_SESSION`, followed by one bounded final read for older browser scheduling.
- Coalesce duplicate bootstrap events by user and access-token identity.
- Preserve an authorized visible member/staff workspace during token refresh while rechecking server-authoritative access.
- Fail closed and clear private DOM if staff/member access is revoked or a refresh fails authorization.
- Preserve fresh-document teardown on staff account changes and generation/sequence guards on member changes.
- Keep the explicit staff setup callback immediate rather than waiting behind the normal session probe.

No database, migration, RLS, Edge Function, secret, feature flag, or Supabase project configuration changed.

## Security properties

- Staff and member authorization is rechecked against the existing RPCs; Auth restoration alone never grants app access.
- Logout propagates across tabs, clears private UI, and remains logged out after refresh.
- Account changes invalidate old async work and cannot retain prior private DOM.
- Inactive/revoked access fails closed.
- Beta uses only project `bvooallokgfktssadsrv` and `https://beta.revitalizedacademy.com`; no production endpoint or storage key is introduced.

## Validation

- Beta build: 321 files.
- JavaScript syntax: 83 files.
- Full maintained frontend/runtime suite: 581 passed, 0 failed, 27 expected skips (608 total).
- Focused staff/member session runtime/state isolation: 16 passed.
- Focused member Health/Nutrition/setup/session regressions: 91 passed.
- RepDB regression with the ignored pinned local fixture restored: 16 passed.
- Exact-built Chrome: 24 checks passed.
- Exact-built WebKit: 24 checks passed, including 390×844 staff/member overflow.
- Covered beta Owner, scoped Coach, member, normal refresh, hard bootstrap, second tab, delayed initial restoration, duplicate events, token refresh, revocation, logout persistence, account transition, and setup-link recovery.
- `git diff --check`: passed.

The exact-built browser fixtures are isolated and use no credentials or hosted data. A hosted reproduction could not be performed because the available production and beta tabs were signed out. Hosted acceptance therefore remains a release gate and is not claimed here.

## Release boundary

Expected beta assets: `portal/portal.js?v=192` and `member/member110.js?v=216`; member CSS remains `member110.css?v=204`.

After explicit approval, push the exact candidate and deploy only to beta Netlify site `071b252e-a922-4846-a784-8dca1edad377`. Do not apply migrations or deploy Edge Functions. Then perform separate signed-in beta Owner, scoped Coach, and member refresh/hard-refresh/second-tab/logout/revocation acceptance.
