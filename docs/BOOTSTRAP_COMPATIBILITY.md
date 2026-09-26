# Member bootstrap compatibility

**VERIFIED:** Build 192 and this branch request `my_app_bootstrap_v2`. No v27 UI integration is included. The live database has views through v27; object existence is not a released feature claim.

## Current consumption

`member/member110.js` consumes these v2 fields directly:

`access`, `activity_timeline`, `agreements`, `ambassador`, `assignment_summary`, `billing`, `coach`, `coaching_hub`, `coaching_requests`, `coaching_sessions`, `companion_summary`, `course_progress`, `daily_actions`, `family_hub`, `family_requests`, `home`, `invoices`, `journey_status`, `member_profile`, `membership_overview`, `message_threads`, `notification_preferences`, `payment_history`, `progress_snapshot`, `recent_notifications`, `referral_activity`, `upcoming_appointment`, `weekly_summary`.

Courses/resources, membership dashboard/entitlements, household/journey, goals/habits, assignments, recent progress, metric/check-in catalogs, meals/fitness/grocery, health connections/permissions/snapshot, challenges/community, ReFuel, documents, coaching entitlements and companion categories/requests also use separate reads. `loadDashboard` makes 29 concurrent initial reads and treats any initial error as a load failure. Later bootstrap availability does not remove that duplication automatically.

**IMPLEMENTED additive compatibility:** `my_agreements` and `my_staff_agreements` now expose `content_hash` and `rendered_content_hash` at the end of the existing column list. The existing agreement JSON contract can carry them without changing the v2 endpoint. Signing sends the displayed hash and rejects missing/stale versions. Database additions must precede the new callers at a future coordinated release.

## Later additive backend fields

Health connections/permissions/wearable snapshot/dashboard cards; progress photos; wellness/family scores; achievements/goals/insights/consistency; daily-plan history/coaching momentum; AI context/usage/sources/feedback/personalization; next actions and family calendar; devices/notification preferences/runtime/routes; sync cursor/status; mobile health sync; privacy requests/exports; enrollment readiness; signature center.

**APPROVED constraints:** adult health is private by default, minor access requires relationship and permission checks, and Justyn/Elle must approve score methodology. Fields bearing score names are not approval of their existing algorithms or permission to surface them. Wearable registries and AI metadata are not working native integrations or autonomous advice.

## Proposed staged integration

1. Capture typed contracts for current v2 fields and null/empty states. Test existing member, inactive member, unrelated member, household adult, guardian/minor and scoped coach identities in staging. Use verified JWT claims and RLS; never service keys in the browser.
2. Measure representative v2 and candidate view query plans, payload sizes and p50/p95 latency on synthetic realistic data. Nested views and JSON aggregates may duplicate work and include sensitive fields; do not fetch a later omnibus payload simply because it exists.
3. Add one approved feature dataset at a time behind an independently reversible UI flag. Preserve the old endpoint and loading fallbacks. Remove duplicate reads only after equivalent data, authorization and error handling are demonstrated.
4. Start with a bounded, nonsensitive candidate after primary Chat prioritization. Gate family/private-health/AI/score fields on explicit policy and consent tests. Do not introduce an invented score formula.
5. Work validates authenticated desktop/mobile flows in an approved staging origin, including slow/failed responses and expired sessions. Promote only after release approval, observability and rollback review.

**UNKNOWN:** production-shaped performance, comprehensive cross-household/minor policy acceptance, original assessment source documents and the approved staging/Netlify environment. These remain release/integration prerequisites; this package does not claim them complete.
