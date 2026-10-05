# Beta member benefit and session repair

Date: 2026-10-05  
Environment: dedicated staging only  
Status: deployed and accepted on staging — BETA READY

## Scope

This package repairs only the two defects found during Client A member-dashboard acceptance:

1. membership activation deactivated the explicitly approved membership-only `nutrition_plans` and `fitness_plans` rows because they lacked program templates;
2. an early empty session read left the member app at sign-in because the app did not consume Supabase Auth's later `INITIAL_SESSION` recovery event.

No program entitlement template, role, permission, feature flag, payment/agreement rule, mail/provider configuration, Edge Function or production system changes in this package.

## Entitlement repair

Migration `20261005220854_membership_entitlement_origin_reconciliation.sql` adds a required constrained origin to the existing entitlement table:

- `program_template` is the default for historical and template-managed rows;
- `membership_override` identifies one deliberately authorized membership-level benefit.

`private.reconcile_membership_entitlements` keeps its prior template upsert/deactivation behavior. It preserves the current status of an override while the membership is active or pending and deactivates every entitlement when the membership is outside those lifecycle states. It does not copy overrides or infer them from labels/metadata.

Client A's two existing rows must be marked as overrides and reactivated only after the migration is applied, guarded by their exact membership, entitlement keys, inactive state, approved metadata and active Client A association. No other row may be changed.

## Session repair

The member shell keeps one Supabase client with `persistSession`, automatic refresh and URL-session detection. It now:

- accepts `INITIAL_SESSION`, `SIGNED_IN` and `TOKEN_REFRESHED` sessions supplied by the SDK;
- schedules database/bootstrap work outside the auth callback;
- retries one early empty initial read after 350 ms;
- deduplicates concurrent loads for the same user/access token;
- forces a clean reload after token refresh;
- clears private DOM and invalidates request generations on logout, invalid session or identity transition.

No second session store or auth system was added.

## Verification before release

- Full frontend: 482 passed, 0 failed, 27 established skips.
- PostgreSQL 17 full backend: 240/240.
- JavaScript syntax: 78/78.
- Exact-built member session runtime: 6/6.
- Staging build: 314 files.
- Entitlement cases: approved nutrition/fitness persistence, revoked and unbacked-template inactivity, unchanged template reconciliation, cross-membership isolation, and member write denial all pass.
- Session cases: delayed persisted restore, two tabs, one-tab refresh isolation, explicit logout/private clearing, stale-response rejection, invalid-session fail-closed and account-transition isolation all pass.

## Release and hosted gate

Applied the reviewed migration once as staging ledger `20261005221655`. A guarded update changed exactly Client A's two approved inactive rows to active `membership_override` rows. Re-running reconciliation left their status and timestamps intact. An authenticated Client A view of `my_app_access` returns `nutrition_enabled=true`, `fitness_enabled=true` and entitlement count 2. Supabase advisors reported the established project-wide findings; no new finding identifies this column/function change or permission broadening.

Source `abf2af690bc85387df4b4932b628bcf858a21875` was published only to staging as Netlify deploy `6ac42226bb66bc2171b9946e`. Live member JS v211, CSS v202 and runtime config match the exact build hashes. Production stayed on `6ac3eee5383ccf92be4d7a58`, and its member HTML, member JS and runtime config fingerprints were identical before and after staging publication.

## Hosted Client A acceptance

The user signed in normally as Client A through the staging member page after the repair was ready.

- Dashboard: loaded the correct Disposable Beta Client A / Holistic Foundations identity.
- Nutrition: visible and usable; loaded the real empty diary, six nutrient summary cards, seven-day actual-entry series and neutral no-target/no-published-source states. No diary write was attempted.
- Workouts: visible and usable; loaded the real neutral unassigned-plan state. No workout write was attempted.
- Refresh: the persisted session restored after the SDK's asynchronous startup without credential entry.
- Second tab: restored the same Client A session.
- One-tab refresh: both tabs remained authenticated.
- Logout: propagated to both tabs; both returned to sign-in and the Client A name/private dashboard disappeared from both DOMs.
- Re-login: normal Client A sign-in succeeded; Dashboard, Nutrition and Workouts were present.
- Console: no warnings or errors in either tab during refresh, two-tab or logout checks, and none after re-login.

Post-acceptance database verification still shows active membership/access and exactly the two approved active `membership_override` benefits with the unchanged repair timestamp. No hosted nutrition, workout, health, payment, agreement, role, permission, flag, provider or unrelated data was changed. Production stayed on deploy `6ac3eee5383ccf92be4d7a58`; its three checked public fingerprints remained unchanged.

**BETA READY.**
