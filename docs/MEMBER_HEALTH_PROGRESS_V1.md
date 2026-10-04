# Member Health & Progress Dashboard v1

2026-10-04. Authorized staging-only integration, starting from accepted Nutrition Targets + Trends SHA `b726fdbd062f1e419a70380119c5ae75fe8854b6` / Netlify deploy `6ac1f3c8acb1d80ac224b360`. This package does not alter the accepted staff Nutrition implementation, database, RLS, migrations, providers, grants, or production.

## Implementation and release boundary

The existing `/member/` Health & Progress workspace is extended by `member-health-progress.js` and its scoped CSS. It owns the existing premium measurement overview and adds compact goals, habits, nutrition, coaching and source summaries below the existing Momentum section. Full Goals/Habits, Log Progress, Weekly Check-In, Health Connections, and their established actions remain in place. Navigation uses the existing member shell. No second dashboard or parallel backend system is introduced.

Member core JS is version 209; core CSS stays 201; the new Health JS/CSS are version 1. The build allowlist includes both new files; the local fixture and tests are excluded. The existing Nutrition module stays 1; staff Nutrition Review 103 / Wellness JS 118 / Wellness CSS 120 are preserved.

Implementation and local verification are recorded here. The definitive staging SHA, deploy ID, live asset hashes, final test totals and before/after hosted evidence are recorded in the workspace release receipt `STAGING_MEMBER_HEALTH_PROGRESS_2026-10-04.md` and `deployment-evidence/2026-10-04-member-health/`. A successful build alone is not deployment evidence. Production remains outside scope.

## Contract inventory and reuse

| Area | Existing contract | Scope and use |
| --- | --- | --- |
| Core compatibility | `member_paid_access_allowed`, `my_app_bootstrap_v2`, `my_member_dashboard`, `my_member_entitlements` | Paid preflight, unchanged three core reads, active own-contact identity and current program access. No bootstrap replacement. |
| Metric configuration | `get_my_health_metric_configuration` | Effective program/client configuration, visibility, display order, source preference and manual setting. Explicit all-hidden configuration stays empty. |
| Current measured data | `my_health_metric_latest` | Own active contact; explicit safe column selection. No raw metadata, connection IDs or credentials selected by the new module. |
| Manual history | `my_recent_progress` | Own contact; real numeric readings within 7/30 days; existing view caps its most recent records at 100. This is available history, not a guarantee of complete history under high logging volume. |
| Device/manual history | `get_my_health_metric_trend(contact,key,days)` over `my_health_metric_timeline` | Existing own-contact filtering, security-invoker underlying views/RLS; only enabled under existing Health Trends flag and biometric access. No new device provider. |
| Goals | `my_goals`, optionally `my_goal_progress` | Active titles/targets/due dates; deterministic backend completion only when the existing Progress flag is enabled. Three compact rows with count and existing View All navigation. |
| Habits | `my_habits` | Active habits, existing current-day and seven-reporting-day values. Database reporting days follow existing `CURRENT_DATE`; no invented streaks or local-midnight promises. |
| Momentum | Bootstrap `progress_snapshot` / existing `my_progress_snapshot` renderer | Preserved existing counts, achievements and lower progress modules. |
| Nutrition | `get_my_nutrition_day(date)`, `get_my_nutrition_trends(7,end_date)` | Entitlement-gated snapshot; accepted effective coach/program targets; Calories, Protein, Carbohydrates, Fat, Fiber, Water; actual logged-day averages. No duplicate diary, direct table read, or write. |
| Coaching/calendar | `my_coaching_hub` (existing `my_member_upcoming_appointment`, `my_coaching_sessions`, `my_client_assignments`) | Program/coach, real next appointment, completed-session date, current action items. Existing view caps 8 assignments / 6 recent sessions; summary reflects returned current items, not unlimited history. |
| Sources | `my_health_connection_center` | Provider display name, mode, status, last successful sync only. Registry rows with no connection do not count as connected. |
| Feature flags | `app_runtime_config` | Existing `feature_member_health_trends_vnext` and `feature_member_progress_vnext`; both observed false on staging and unchanged. No new flag or activation. |

Relevant sources: baseline `supabase/baselines/2026-09-26/schema.sql`; configurable metric migrations `20261002051000`, `20261002054500`; family consent/staff guards `20261002070000`, `20261002071500`, and accepted repairs `20261002133000`, `20261002144500`; existing lifecycle privacy migration `20260928064500`; accepted Nutrition Diary `20261004043000` and Targets/Trends `20261004062000`. Hosted ledger dates can differ from repository filenames; none were replayed.

## Measurements and presentation rules

All effective Available/Highlighted catalog metrics render in configured order, including order 0; Hidden metrics do not. Weight is the feature chart when configured, otherwise the first highlighted/available configured metric. There is no fixed card cap.

The standard configured catalog includes Weight, Steps, Resting Heart Rate, Sleep Duration, Active Minutes, Active Energy, Water/Hydration, Energy, Mood and Body Fat. The existing optional HRV, respiratory rate, oxygen saturation, VO₂ max, systolic/diastolic pressure, glucose, waist, lean mass, protein, fiber, stress, brain fog, digestion, cravings and pain metrics are supported only if explicitly configured; this package enables none. Unknown metric keys outside the effective contract and nonnumeric observations are not invented into the UI.

Only finite JSON numbers form measured values. Null, undefined, blanks, strings and booleans remain unknown; genuine zero remains zero. Fewer than two valid values produce a neutral sparse-data state. Charts place actual readings at their real timestamps, do not fill missing days, and do not join incompatible units. Allowed source preferences are honored; a permitted device trend can provide its actual latest reading when the latest view's reading came from an excluded manual source. Labels use local time; SQL calendar dates are parsed as calendar dates rather than UTC midnight. No medical classifications, proprietary score, synthetic health values or fixed decorative trend graphics are introduced.

Nutrition uses only numeric nutrient totals and effective targets. Unknown totals say Not logged; zero stays 0. Each average uses the count of days actually containing that numeric nutrient. Nutrition failures stay in that section. The full Nutrition module and accepted target precedence are unchanged.

Source presentation says connection registered and displays a successful-sync timestamp only if it exists. Apple Health/Health Connect registration does not establish native runtime synchronization; the UI states that limitation. No token, provider error payload or Storage path is surfaced by the new summary.

## Flags and safe degradation

The new composition belongs to the already-approved base Health workspace. A new feature flag would duplicate the current access/configuration model. Existing vNext flags retain authority over device history and calculated goal progress; disabled means those reads are not made. Current configured measurements and accessible manual history still work. Existing lower feature modules retain their own flags.

Each section loads independently after core bootstrap. A goal, habit, nutrition, coaching, provider or metric read failure leaves the rest usable and displays a generic section state. The underlying optional batch now tolerates rejected transports as well as returned Supabase errors. The new module has no writes or private-data console logging.

## Context ownership and privacy

The dashboard generation is invalidated before paid preflight, before any critical read can complete. Required results are checked against that generation before rendering. Logout clears immediately before the sign-out request; account transitions, token refresh revalidation, failed bootstrap and detected access loss erase private health/progress DOM, caches, forms, pending write keys and open dialogs. Family and weekly check-in reads now honor the same generation.

The new module owns an unexported context containing user/contact/generation; each metric range and nutrition date also owns a request sequence. All success/error callbacks check ownership. An obsolete authorization error cannot clear a newer account. Overview refresh rechecks paid access and denies closed on failure. A readiness handshake permits late script attachment without exporting private snapshots. The old startup Home timer was replaced by deterministic initial navigation so it cannot override a quick sidebar selection.

This is not a new server push revocation channel: external access changes are observed through existing auth events, reload/access preflight and authorization responses. The server remains authoritative on every read. No RLS/grant, household, guardian or entitlement boundary was widened. Contact-bearing queries explicitly filter the active contact and defensively filter results; self-only views do not become guardian views. Existing Family Hub guardian/minor permissions remain separately enforced.

## Maintained verification and reproduction

- `tests/member-health-progress.cjs`: 52 runtime/source cases over exact application scripts, including real contract shapes, numeric edges, ranges, mixed units, goals/habits, nutrition/entitlements, coaching/sources, optional failures, late attachment, core bootstrap/logout/account races and access revocation.
- `tests/backend/member-health-progress.test.cjs`: 16 native PostgreSQL checks for own-contact current/history/goals/habits/progress, inactive denial, zero and range behavior, same-household other-adult exclusion, guardian/minor control and unchanged staff-consent boundaries. Fixtures run only in disposable loopback databases and roll back.
- Existing frontend, Nutrition Targets/Trends, diary, health/progress, goals/habits, coaching, privacy, backend and frozen Edge suites remain required. The nine known agreement-onboarding-origin backend fixture failures are tracked separately.
- `scripts/dev/member-health-fixture.cjs` serves the exact `dist/` assets locally with synthetic transport responses. It binds 127.0.0.1 only and never contacts hosted Supabase. Run after the normal staging build, then open `http://127.0.0.1:8876/member/`.
- Browser validation covers Normal, Empty, Partial and Long labels at 1440×1000, 768×1024, 390×844, plus quick links, 30-day chart, nutrition/coaching navigation and immediate logout erasure. Reused long Goals/Habits rows now wrap without widening the page. Evidence is in the release receipt.

## Hosted acceptance limits

Read-only staging inventory found 26 active catalog metrics, 51 applied migrations, and zero health observations/progress entries/goals/habits/nutrition diary entries. An opened member page showed sign-in, so fresh authenticated hosted member acceptance is not claimed. Staff access was previously pending and is not manufactured for this member package. Populated states, trends and failure/race scenarios were validated in explicitly local synthetic fixtures. No records, credentials, roles, permissions, flags, provider connections, payments, messages, SMTP or Edge Functions were changed to obtain coverage.

Next step after this single package: primary Chat review and normal read-only acceptance using an existing approved member session when available. Further scope or health scoring requires separate approval.
