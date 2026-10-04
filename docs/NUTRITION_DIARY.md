# Nutrition Diary + Daily Targets v1

Implemented under the 2026-10-04 staging-only authorization. Preserves Nutrition Engine, Recipe Builder, bootstrap v2 and existing Nutrition entitlement visibility.

## Runtime and data contract

`member/member-nutrition.js` uses `window.RA_MEMBER_CLIENT`. It waits for a successful paid dashboard load and existing Nutrition entitlement, then loads lazily when Nutrition opens. Access reset clears private rendered data and invalidates outstanding responses. An in-page readiness flag handles deferred-script initialization after dashboard completion; it is a rendering hint, never database authorization.

Date controls use the member's local calendar day. Seven meal groups, published Food/Recipe selection, positive serving quantity, optional note and own-item removal are supported. Six core cards use actual catalog keys `energy_kcal`, `protein_g`, `carbohydrate_g`, `fat_g`, `fiber_g`, `water_g`; water retains catalog unit `g`. The expandable full profile shows every numeric daily total. Missing values are “Not logged”; genuine zero remains zero. Targets display configured minimum/target/maximum/unit/source; percentages require a real consumed value and positive target. No composite score or invented intake appears.

Seven-day summaries end on the local day explicitly supplied to the RPC; missing days show “No entries”. Empty published sources disable logging and explain the limitation. Read failures clear stale data and offer Retry. UI write locks prevent concurrent submissions. An ambiguous network write failure requires refresh before retry; server-side write idempotency is not claimed in v1.

## Database and authorization

Source `20261004043000_nutrition_diary_daily_targets.sql` was reviewed before its first staging application. Actual hosted ledger: `20261004044342`, name `nutrition_diary_daily_targets`, project `bvooallokgfktssadsrv`. Stored SQL MD5 `36c05958cffc0c4d3f75e816079949a6` matches the source. No earlier migration replayed.

All security-definer functions have an empty search path and qualified application objects. Six public RPCs grant authenticated execution and deny anonymous execution. The arbitrary-contact totals helper denies authenticated/anonymous execution.

| RPC | Authorization and result |
|---|---|
| `get_my_nutrition_sources()` | Full paid self access; active food or published recipe AND published methodology |
| `get_my_nutrition_day(date)` | Own items, full numeric totals and effective targets |
| `get_my_nutrition_trends(integer,date)` | Own actual logged dates only, 1–90 days; end-date argument optional |
| `log_my_nutrition_item(date,text,text,uuid,numeric,text)` | Server-derived self contact/membership; validates source publication, meal, finite positive quantity |
| `delete_my_nutrition_item(uuid)` | Own contact only; unrelated ID returns false |
| `admin_get_client_nutrition_day(uuid,date)` | Active staff with `health.private.view` AND contact scope; `plan.override` alone is insufficient |

Self access requires active claimed client access, active membership, active enrollment activation and actual payment/agreement gates for that enrollment. Additional restrictive RLS on diary/target tables closes direct lifecycle bypasses while retaining the existing staff permission/scope and target-write policies. Target writes still require `plan.override` plus scope; staff diary writes still require the existing health-progress permission plus scope. No grants/defaults/overrides were changed.

Logging snapshots every numeric source JSON key times quantity, rounded to six decimals, plus the label and serving metadata. Null, strings (including numeric strings), blanks, arrays and objects are not coerced to zero. A non-object root profile is unknown. Later source edits do not alter historical nutrient totals or labels. Recipe nutrition already represents one serving and is not divided by recipe serving count again. Daily totals preserve all numeric keys, tested with all 101 catalog nutrients.

Target precedence is coach, program, member, system, with latest update breaking ties within a source rank. This does not enable member target writes or invent program targets.

## Verification

- `tests/backend/nutrition-diary.test.cjs`: 28 passed in native PostgreSQL 17.11 disposable fixtures. Covers self/cross-member operations, pending/invited/onboarding/suspended/inactive/unclaimed/invalid-active lifecycle, direct-table RLS, private staff scope, plan-only denial, all 101 nutrients, quantity, zero/non-numeric cases, snapshot stability, deletion, target precedence, local-date trends and publication gates.
- `tests/member-nutrition.cjs`: 18 passed. Covers shared-client/lazy initialization, deferred-script race, summaries, meal grouping, safe text, targets, empty sources, servings, date controls, write payloads, duplicate-submit lock, read failure/retry and stale/private response rejection.
- Full frontend: 270 total = 243 pass, zero fail, 27 historical skips. JavaScript syntax: 71 pass. Full backend: 125 total = 116 pass, nine pre-existing agreement onboarding-origin fixture failures. These nine remain separate from Diary acceptance. Edge: 25 pass; 19 entry points typechecked with frozen dependencies.
- Nutrition Engine 6, Content Builder 9, Recipe Builder 7 and Recipe integrity 4 pass; these 26 are included in frontend totals.
- Full exact-built member shell with disposable transport: populated/empty diaries at 1440×1000, 768×1024, 390×844; no page/card overflow or inaccessible controls; clean console; Nutrition/Workouts switching and bottom profile control work.

## Acceptance limits and next package

The existing paid staging member has Nutrition hidden under its existing entitlement configuration. Hosted Diary acceptance cannot be claimed from that session. Food/recipe inventory remains empty, The Living Diet remains draft, and nothing was published to obtain coverage. Hosted acceptance also depends on a working approved staff session; roles/permissions must not be changed to manufacture one. All write-path tests used disposable local identities, not hosted content.

The secure admin read RPC is complete. Defer coach drawer Nutrition Review integration to a separate narrow UI package to avoid changing the existing portal in this release. Next, implement that read-only panel and perform normal hosted acceptance when approved source/entitlement/session prerequisites are supplied.

Allowlisted assets: `member110.js?v=208`, `member110.css?v=201`, `member-nutrition.js?v=1`; 308-file build. Final deployment ID, exact live hashes and after-release acceptance are recorded in the workspace release report separately. No production release is authorized.
