# Protected portal loader repair — local candidate, not released

Based on the exact published PR51/B6 source `a0e4692c5954ec21c1de7517ed706cf71b86a15c`, deploy `6ad591a42c055bca5df5c2d4`. Reuses only the seven reviewed loader changes from separate unreleased PR39 (`cf590b5`), with current-task/permission/session-refresh safeguards. No wholesale merge, old main build, hosted mutation or source substitution.

## Root causes

All31 signed-out baseline requests are reproduced in the full exact-built portal using a synthetic SDK/locally intercepted HTTP.30 produce genuine401/42501 resource errors; the existing `program_challenge_access` template read is empty200. This matches the canonical30-error inventory. Programs starts23 requests through immediate `load()`, `loadProgramAccess()` and `loadContent()`. Directory immediately chains source filters → saved views → directory. Family immediately loads its queue. Staff Access500ms, Inbox700ms and Companion850ms timers run before a staff workspace exists. Work Desk listens to `ra:contact-closed`, dispatched during signed-out reset, and has an additional650ms fallback. Server authorization correctly denies these; backend grants must not be relaxed.

| Baseline loader initiator | REST table/view |
|---|---|
| `portal-programs.js?v=179:71:37)` | `program_catalog` |
| `portal-programs.js?v=179:442:14)` | `program_catalog` |
| `portal-programs.js?v=179:443:14)` | `program_entitlement_templates` |
| `portal-programs.js?v=179:444:14)` | `learning_courses` |
| `portal-programs.js?v=179:445:14)` | `program_course_access` |
| `portal-programs.js?v=179:446:14)` | `resource_library` |
| `portal-programs.js?v=179:447:14)` | `program_resource_access` |
| `portal-programs.js?v=179:448:14)` | `wellness_challenges` |
| `portal-programs.js?v=179:449:14)` | `program_challenge_access` |
| `portal-programs.js?v=179:1000:41` | `nutrition_methodologies` |
| `portal-programs.js?v=179:1000:41` | `fitness_methodologies` |
| `portal-programs.js?v=179:1000:41` | `learning_courses` |
| `portal-programs.js?v=179:1000:41` | `wellness_challenges` |
| `portal-programs.js?v=179:1000:41` | `meal_plan_templates` |
| `portal-programs.js?v=179:1000:41` | `recipes` |
| `portal-programs.js?v=179:1000:41` | `food_catalog` |
| `portal-programs.js?v=179:1000:41` | `fitness_programs` |
| `portal-programs.js?v=179:1000:41` | `workout_templates` |
| `portal-programs.js?v=179:1000:41` | `exercise_catalog` |
| `portal-programs.js?v=179:1000:41` | `resource_library` |
| `portal-programs.js?v=179:1003:14)` | `nutrition_methodologies` |
| `portal-programs.js?v=179:1004:14)` | `fitness_methodologies` |
| `portal-programs.js?v=179:1005:14)` | `nutrition_nutrient_catalog` |
| `portal-people-directory.js?v=144:163:31)` | `admin_people_directory` |
| `portal-family-requests.js?v=166:121:37)` | `admin_family_requests` |
| `portal-work-desk.js?v=160:173:8)` | `admin_work_queue` |
| `portal-people-directory.js?v=144:447:37)` | `people_saved_views` |
| `portal-people-directory.js?v=144:98:18)` | `admin_people_directory` |
| `portal-staff-access.js?v=181:51:37)` | `my_staff_permissions_view` |
| `portal-member-messaging.js?v=166:150:8)` | `admin_staff_inbox` |
| `portal-companion.js?v=122:128:37)` | `admin_companion_review_queue` |

## Narrow runtime change

Exactly seven loader scripts and their existing HTML cache-reference versions change; no new runtime asset or session architecture. The unchanged production `createAuthenticatedTaskGuard()` captures the verified session/account epoch and gives each read path latest-request-wins identity. Each repaired startup loader and its dependent read continuation checks authority before querying and again before caching/rendering. Removed private DOM is not touched by stale completions. Reset cancels tasks, clears caches/modals and debounce/startup timers. Passive lifecycle listeners remain registered but inert while signed out, permitting a genuine new valid session to initialize. This is logical cancellation; already-sent HTTP is not falsely claimed to have been recalled.

Directory, Family and Work Desk await `crm.view`; Inbox awaits `messaging.manage`; Companion awaits `companion.manage`. Permission events initialize a newly authorized feature even if its earlier dashboard event preceded permission resolution. These are the existing permission keys/visibility contracts, not new grants. Program/content/template published reads remain available to authenticated staff as permitted by existing RLS; authoring still requires existing learning.manage checks. Staff Access may read its own permission view while authenticated, but checks staff.view before staff/invitation/workload reads. No RLS error is accepted as successful loading and no console handler/error filter is changed.

The Work Desk in-flight lock is tied to its captured task, so a same-user token/session epoch refresh can start a fresh request without waiting indefinitely on a stale prior epoch. Same-account out-of-order responses, logout, account switches and revoked sessions remain fail-closed.

## Preservation / tests

No portal.js, Permissions/onboarding/NDA code, CSS/layout, member workspace, scoring or source adapter, questionnaire, migration, Netlify Function/config/schedule, payment, beta or provider artifact change. Tests are fictional/local, all network is intercepted; no client answers, actual session tokens or credentials are used. Existing nine archive pins remain release prerequisites, never recompiled. The installed held SQL ledger20261019191954 is not replayed.

The native browser matrix covers anonymous startup/refresh, authenticated Owner and assigned Coach, second-tab restoration/logout, refresh after logout, expired/revoked access, stale async completion and new-account initialization, pending NDA signing, denied feature permission and an intentional unauthorized HTTP probe whose console error MUST remain observable. Additional current core session and assessment/recovery/content tests protect existing behavior. Native Chromium/WebKit runs use1440/768/390 with no positive-path warnings/errors or overflow. Exact results and artifact hashes are recorded outside the source tree after testing. This local matrix is not a claim of genuine hosted Owner/Coach acceptance.

## Roadmap compatibility / release sequence

The seven affected modules are byte-identical between live source and exact Roadmap c618dd30cd4979e3f7916fcc7cbc9d4612ae4cf9. Test the same eight-file patch over that candidate, modifying only the seven loader bytes and seven HTML cache references; all B4–B6/processing assets and configuration stay intact. The approved original branch and existing unpublished deployment remain unchanged.

A static-only repair of current production would replace8/439 public paths and preserve431 plus all nine exact archives. **Do not subsequently publish the old Roadmap candidate unchanged:** that would replace these seven guards with their old eager versions. The smallest overall release is a separately reviewed combined Roadmap+guard source/artifact, retaining all original nine archives and the already-reviewed additive processing archive, all controls false, installed SQL untouched and lockON. No ordinary rebuild, Function rebundle or main merge is part of either option.

Any hosted creation/publication, push, settings change or activation requires separate exact-source/deploy authorization. Before publication reverify current live baseline/lock, all static and Function digest/config/schedule pins, five false controls and cohort preservation. Perform canonical anonymous and genuine authorized-session acceptance after release. On failure follow the reviewed narrow NEW forward-revert artifact process; retain installed SQL and audit evidence. Processing, scoring, grants, review, approval, PDF/export and delivery remain separately held.

## Final local acceptance

276 unique Node/JSDOM tests pass (45 loader guards,77 maintained session/logout/content/assessment/recovery,147 Roadmap/identity/pricing/payment contracts,7 existing processing contracts; combined branch52 guard+processing tests). Native Chromium/WebKit1440/768/390 pass for BOTH live-baseline repair and exact Roadmap+repair:12 configurations/372 recorded checks. Signed-out requests and positive-path console warnings/errors are0; the intentional unauthorized401 remains visible. Storage-based two-tab logout/account switching, same-user token refresh, revoked/expired access, Coach Assigned scope and NDA completion all pass in fictional sessions. Existing content browser checks:USDA66,RepDB46,durable content36,all zero errors. See [validation](evidence/protected-loader-repair/validation.json).

Fresh read-only hosted preservation confirms original locked live deploy, still-unpublished original Roadmap candidate,9 exact original archives/additive reviewed archive, configuration/schedule and beta unchanged. Installed SQL ledger20261019191954 and all5 false flags/new histories0 remain unchanged. Four source pins remain current, B6 purpose/grant/feedback/draft0. No real-source request or hosted write. Canonical hosted acceptance of the repaired source remains pending its separate release authorization.
