# Coach Nutrition Review — current target/trend repair and release history

## Current JS103 target/trend repair

The current repair extends the original read-only review with approved, secure nutrient target set/clear controls. Private reads are limited to `admin_get_client_nutrition_day`, `admin_get_client_nutrition_targets` and `admin_get_client_nutrition_trends`; mutations are limited to `admin_set_client_nutrient_target` and `admin_clear_client_nutrient_target`. No direct table reads or writes exist. Private-health permission and contact scope remain required by the database; editing also requires scoped `plan.override`.

Normal open/reload and date/range changes load all three reads together. Only a complete current snapshot renders. Every response and mutation completion must still own the same generation/contact/date/range/open/permission context. Transition, denial and transport failure clear day items, targets, source labels, trend cards/rows and status. All configured targets render; zero remains numeric and unknown remains blank. SQL date-only labels avoid the unrelated timestamp formatter.

Maintained Coach Review tests22/22 and new runtime tests102/102 pass against both source and exact-built output. Existing target source tests4/4 pass. The102 runtime cases cover the held candidate reproductions, read success/error/exception races, same-context cycles, save/clear late completions, 101 configured targets, explicit null overrides and calendar labels across timezones. Browser fixture uses the real built module and permission script through normal UI flow, without diagnostic function exports. All requested widths pass. Hosted staff access remains pending; no hosted mutation or permission change was made. See [full repair evidence](NUTRITION_TARGETS_TRENDS_VALIDATION.md).

Assets: Review JS103, Wellness CSS120, Wellness JS118. The final deployment receipt is workspace `STAGING_NUTRITION_TARGETS_REPAIR_2026-10-04.md`.

## Historical JS101 release / JS102 held validation

This document describes the released JS101 package. The later JS102 Nutrition Targets + Trends candidate is **not deployed** and does not yet meet the same private-data clearing/request ownership guarantees. Its approved scoped writes also supersede the original read-only module contract. See [current validation](NUTRITION_TARGETS_TRENDS_VALIDATION.md) before continuing development.

The 2026-10-04 user authorization approves the frontend repairs and staging-only release. No backend/RLS, migration, permission grant or provider change is part of this package.

## Behavior and access

Nutrition Review now lives in its own `client-nutrition-review-section`, outside the Wellness management section. The current staff permission helper must allow `health.private.view` before the section can appear or make a request. Existing Wellness management, meal-plan and fitness-plan controls retain their original gates. No staff capability is granted by this UI change.

Private reads use only the unchanged `admin_get_client_nutrition_day(contact_id,date)` RPC. Contact scope remains authoritative on the server alongside private-health permission. An out-of-scope request returns an empty panel and its denial; no direct private-table reads or write paths exist in the module.

Each request captures its generation, contact and selected date. Success and error paths render only while all three still match, the panel remains open and private-health access remains available. Contact changes, contact/panel closure and permission refresh invalidate pending work and immediately clear rendered private totals/items/status. A denied request cannot revive a prior client's data. Transport exceptions are handled as an empty error state.

Today and date shifts use local calendar components, preserving and completing the approved Chat date helper. Summary and item values require finite JavaScript numbers: numeric zero remains visible; null, missing, blank, numeric strings, booleans and nonnumeric values remain unknown/omitted. All labels and notes remain text-only. Review text/grid containment wraps long brands, item/recipe names, source labels and notes without truncation. The date picker has an accessible label; panel toggle exposes expanded state.

## Preserved upstream work

All five original Coach Review commits remain ancestors, as do Chat patches `1c708479a41950017417acffd5787a629438d774` and `8c2e6dc75b146471222d86d434397e66ed48abd2`. The additional preparatory commit `6ae02b17e77b1781b6b810a92bd1adb5f9cd3068` was inspected and preserved. Its request counter is now connected to every asynchronous read. The initial null fix is tightened to avoid blank/numeric-string/boolean coercion. Prior Nutrition Diary, Engine and Recipe Builder work is retained.

Release assets: `portal-nutrition-review.js?v=101`, `portal-wellness.css?v=119`, unchanged `portal-wellness.js?v=118`. The new module remains in the public allowlist; build contains309 files.

## Verification and release limits

- Expanded maintained review suite:22 passing cases against source and exact-built assets. Original reproduced cases were captured before repair; the10-case supplemental exact-built suite now passes10/10 instead of5/10.
- Native PostgreSQL17 fixtures preserve private scoped-read success, out-of-scope denial and override-only denial; a new test explicitly denies Wellness-management-only private reads. Backend implementation and RPC signatures are unchanged. No hosted synthetic writes.
- Exact-built drawer fixture includes the real permission script. Normal, empty, denied and intentionally long text pass at1440×1000,768×1024,390×844. No page/drawer/card horizontal overflow or controls outside the panel; console clean. Independent private-health-only review opens with Wellness management hidden.
- Timezone tests cover America/Chicago before UTC/local midnight, Pacific/Kiritimati ahead of UTC and the Central-time daylight-saving boundary. Old success/error replies, client changes, closes and permission loss cannot alter the current review.
- Full maintained regression: frontend265 pass/0 fail/27 historical skips; native PostgreSQL17 backend117 pass/nine known agreement onboarding-origin fixture failures; Edge25 pass/19 typechecked entry points;72 JavaScript syntax checks pass. The22 review tests are included in frontend totals. One new timezone test initially closed its JSDOM before queued promises completed; its teardown was corrected, and both focused and full suites passed afterward. Exact live hashes are recorded separately in the workspace `STAGING_COACH_NUTRITION_REPAIR_2026-10-04.md` receipt. The nine backend fixture failures remain separate from scoped acceptance.
- Hosted staff acceptance requires a normally authorized staff session. “Staff access is pending” remains a limitation, not a reason to assign roles or permissions. No hosted nutrition data may be changed for this release check.

Production is excluded. After successful scoped validation, release only to existing staging site `071b252e-a922-4846-a784-8dca1edad377` and compare exact public hashes. No migrations required or replayed.
