# ReVitalized Academy — current build state

## Member Health & Progress Dashboard v1 — 2026-10-04

Implemented on `codex/staging`, preserving accepted Nutrition Targets + Trends baseline `b726fdbd062f1e419a70380119c5ae75fe8854b6`. [Contract inventory, behavior, flags, privacy and acceptance boundaries](docs/MEMBER_HEALTH_PROGRESS_V1.md). Existing premium Health overview now combines configured real measurements/7–30-day trends with compact goals, habits, nutrition, coaching and source summaries. Core session/request ownership and private-DOM clearing are hardened. No backend contract, hosted migration, grant or feature activation was introduced.

Member core JS 209 / CSS 201; Health JS 1 / CSS 1; build 311 files. The new maintained suites contain 52 frontend/runtime and 16 native database cases. All native scoped cases pass; the nine known unrelated agreement fixtures remain separate. Browser normal/empty/partial/long-label cases pass at 1440×1000, 768×1024, 390×844. Existing staging member page shows sign-in and optional hosted data is empty, so authenticated/populated hosted acceptance is not claimed.

**Release evidence:** the workspace `STAGING_MEMBER_HEALTH_PROGRESS_2026-10-04.md` and `deployment-evidence/2026-10-04-member-health/` record the final tested SHA, complete suite totals, staging deploy ID, live hash verification and unchanged production evidence. Consult that receipt for current deployment; this implementation record alone is not a deployment assertion. Existing staging site only: `071b252e-a922-4846-a784-8dca1edad377`; production remains outside scope. The accepted Nutrition release and historical records below are preserved. No unrelated next build has begun.


## Latest package — Nutrition Targets + Trends frontend repair, 2026-10-04

The authorized D1–D5 repair extends candidate `8c030118239528cd2ddbfccbfe32edc31c5dc245` and preserves its six upstream commits. Day, effective targets and selected 7/30-day report now load together through normal Review open/reload/date/range controls. All private DOM clears on context changes or failure. Generation/contact/date/range/open/permission ownership applies to reads and target mutation completions. SQL dates render locally without timestamp conversion. All configured targets remain accessible, including null-valued overrides; numeric zero stays distinct from unknown.

**Verified before release:** build 309 files; syntax 72/72; full frontend 398 total: 371 passed, zero failed, 27 historical skips. New normal-flow runtime suite 102/102; Coach Review 22/22; target source 4/4; Nutrition Engine 6/6; Content Builder 9/9; Member Nutrition 18/18. Native PostgreSQL 17: 163 total, 154 passed, the same nine unrelated agreement onboarding-origin fixtures failed; all 37 accepted target/trend and 29 existing nutrition database tests pass. Frozen Edge 25/25 and 19 entrypoints typechecked. Exact-built browser checks cover 101 targets/202 actions, read-only/editable, empty and long text at 1440×1000, 768×1024 and 390×844 without overflow or console warnings/errors.

Release assets: Review JS103 / Wellness CSS120 / Wellness JS118. This source package is authorized only for existing staging site `071b252e-a922-4846-a784-8dca1edad377`. The final deployed SHA, deploy ID and exact public hashes are recorded separately in workspace `STAGING_NUTRITION_TARGETS_REPAIR_2026-10-04.md`; source completion alone is not deployment evidence. Hosted authenticated acceptance remains blocked by **Account Active / Staff access is pending**. No access was manufactured.

Migration ledger `20261004055612` and accepted SQL are unchanged; no replay. The prior uncommitted 37-test database suite is preserved byte-for-byte and incorporated with its validation documents. The Living Diet remains draft; no hosted target/diary/client or permission writes are authorized. [Repair details and historical failed-candidate evidence](docs/NUTRITION_TARGETS_TRENDS_VALIDATION.md).

Next: obtain a normally approved working staff session through the established access process for read-only hosted acceptance. Do not change roles or grants merely to complete this test. No additional Nutrition Targets + Trends code repair is indicated by the maintained checks.


## Historical held validation — Nutrition Targets + Trends/Reports v1, 2026-10-04

Candidate `codex/staging` SHA `8c030118239528cd2ddbfccbfe32edc31c5dc245` contains all six requested commits. **Deployment held:** targets/trends are not loaded on open/date changes, private target/trend DOM is not cleared on client transitions, stale trend responses can replace current/closed views, date labels shift a day in Central time, and configured targets are silently capped at24. See [complete validation and reproduction contract](docs/NUTRITION_TARGETS_TRENDS_VALIDATION.md).

New maintained database tests37/37 pass. Full backend154pass +nine known agreement-origin fixture failures; frontend267pass/2stale Coach Review assertions/27historical skips; build309/syntax72; Edge25pass/19typechecks. Supplemental exact-built UI4pass/10fail; separate instrumented component diagnostics2pass/1cap failure. Nine responsive checks pass, with target rendering explicitly diagnostic because the normal loader is unreachable. Hosted staff remains pending.

Migration already applied to staging at ledger `20261004055612`, source/stored SQL MD5 `40f46ce425e50f9fca8131e12a6cdce4`; no replay. Methodology targets, client targets and diary rows all remain zero; The Living Diet stays draft. Scoped reads/writes, coach precedence, clear fallback and logged-day averages pass in isolated PostgreSQL17. Staging remains deploy `6ac1e6fd3020fcfb080bf7b7` with Review JS101/CSS119/Wellness JS118. Production deploy and20public fingerprints unchanged. Local changes are validation tests/docs only; no new commit/push or application/backend implementation changes. Next: narrow frontend repair before staging release.

## Current package — Coach Nutrition Review repair, 2026-10-04

The approved repair preserves the original five commits and the Chat date/null patches. [Coach Review contract and validation](docs/COACH_NUTRITION_REVIEW.md) supersedes the earlier coach-UI deferral below. Nutrition Review is now an independent private-health read section; existing Wellness management gates are unchanged. Client/date request ownership, immediate private DOM clearing, local-calendar controls, strict numeric display and full long-text wrapping are implemented.

Review source/exact-built tests22/22 and the original supplemental suite10/10 pass. The12 responsive normal/empty/denied/long-text checks pass at all three requested sizes with a clean console. Native tests also cover Wellness-management-only denial without changing the backend. Assets: Review JS101, Wellness CSS119 and unchanged Wellness JS118;309-file build. No migration or hosted nutrition write is included. Final release SHA/deploy ID/full regression totals and hosted staff limitation are recorded in the workspace `STAGING_COACH_NUTRITION_REPAIR_2026-10-04.md`, separately from source completion. Production remains outside scope.

Final local regression totals: frontend265 pass/0 fail/27 historical skips; native PostgreSQL17 backend117 pass/nine known agreement-origin fixture failures; Edge25 pass and19 entry points typechecked;72 JavaScript syntax checks pass.

## Current package — 2026-10-04 UTC

Nutrition Diary + Daily Targets v1 is implemented and validated on `codex/staging`, preserving the four approved commits through `15a247cba5f9fa3dca25490b2474cea0b3215b29` and the prior Recipe Builder release. See [package contract and verification](docs/NUTRITION_DIARY.md).

- **Applied database:** reviewed `20261004043000_nutrition_diary_daily_targets.sql` applied once to staging `bvooallokgfktssadsrv`; actual ledger version `20261004044342`. Stored SQL MD5 equals the reviewed file: `36c05958cffc0c4d3f75e816079949a6`. No earlier migration replayed.
- **Implemented:** shared-client Nutrition module, date navigation, seven meal groups, full numeric nutrient snapshots/totals, target hierarchy, published-only sources and seven-day actual intake. Existing Nutrition entitlement visibility preserved. Member JS 208, CSS 201, Nutrition module 1; 308-file build.
- **Tested:** 71 JS syntax checks; frontend 243 passed / 27 existing skips / zero failures; native PostgreSQL 17 backend 116 passed / nine known agreement onboarding-origin fixture failures; Edge 25 passed / 19 entry points typechecked. Diary: 28 database + 18 UI passed. Nutrition Engine / Content Builder / Recipe Builder + integrity: 26 passed (included in frontend totals).
- **Responsive fixture:** exact-built full member shell, empty and populated diaries at 1440×1000, 768×1024 and 390×844; no horizontal overflow or console warnings/errors. Navigation and bottom controls work.
- **Acceptance limits:** existing paid member's Nutrition entitlement is unavailable; no access was manufactured. Source inventory is empty and The Living Diet remains draft. Staff read RPC is complete; coach Nutrition Review drawer UI is deferred to a narrow follow-up.
- **Release boundary:** existing Netlify staging site `071b252e-a922-4846-a784-8dca1edad377` only. The workspace `STAGING_NUTRITION_DIARY_2026-10-04.md` records the deployment receipt, exact live hashes and final hosted acceptance separately. Source/test completion is not deployment evidence. Production is outside this authorization.

The dated sections below are historical snapshots; their original unknown-environment and “not deployed” statements do not supersede current staging release receipts. Next narrow package: read-only coach Nutrition Review UI, then hosted member acceptance once approved source publication and existing entitlement/session prerequisites are available without widening permissions.

## Historical build record

Updated 2026-09-27 UTC. **Staging preparation IMPLEMENTED and locally tested on `codex/staging`, based on lifecycle `feef92e1c0809cbd035edf35ebc70050d958b46b`; NOT DEPLOYED.**

## Repository and baseline

- Implementation: `eaglevisiondigital/revitalizedacademy`.
- Current branch extends verified `codex/backend-security-gate` commit `018c7441e318b6bde72d8001b796c7d587de7b61` and preserves that source recovery/security work.
- Observed production/source baseline remains Build 192, main `df8aba33cd8bac16e54aded92a4c99439f74f1d5`, Supabase `voalfpxiyznnqfcqcymd`; no fresh Netlify control-plane provenance has been supplied.
- Primary Chat approves policy/architecture. Work validates external environments. Codex implements and tests.

## Approved and implemented lifecycle

| Area | Implemented code | Verification / release limit |
|---|---|---|
| Onboarding | Additive `onboarding` state on existing client_access; existing membership foundation provisions before both gates complete | Real local database + synthetic browser tests; invitation claim required before exposing enrollment; hosted Auth verification/redirects require staging |
| Paid access | Shared actual-payment AND required-agreement gate; restrictive RLS over paid domains/Storage and checked Edge paths | Direct SQL bypass tests and active-owner/member positive cases pass; full production-data acceptance remains required |
| Independent adults | Primary/secondary roles each bind one distinct auth user; secure recipient-bound expiring invitation; immutable content hash | Wrong recipient, unverified email, known minor, expiry, revocation, stale hash, replay and overwrite cases pass |
| Payment reversal | Net recorded payment shortfall restricts active membership; repayment or authorized waiver reevaluates both gates | Partial refunds, reversals, voiding, concurrent refunds, retained history and non-resurrection of inactive accounts pass |
| Restricted surfaces | Existing billing/payment link, agreement signing/history, account email, relevant notices and support | New `/member/onboarding/`; v2 paid dashboard retained behind preflight |
| Notifications/audit | Existing outbox, member notifications, contact activity and manual override audit reused | No actual email/SMS or provider transaction was executed |
| Migration | `20260927020040_client_access_lifecycle.sql` follows `20260926212638_authorization_and_enrollment_gate.sql` | Both applied only to disposable local databases; neither applied remotely |

The three previous lifecycle product questions are resolved by the user's approved assignment. See [state machine, signer flow, RLS and release notes](docs/CLIENT_ACCESS_LIFECYCLE.md).

## Tests and advisors

**166 active automated tests pass:** 65 frontend, 85 PostgreSQL, 16 Edge. The original 106 cases remain, with the now-disallowed same-account/two-name expectation changed to denial. All 15 Edge entry points typecheck; 61 JavaScript files pass syntax checking. No configured compilation/lint command exists. Synthetic desktop/mobile layout was inspected. [Detailed evidence](docs/engineering/LIFECYCLE_TEST_RESULTS.md).

Local Supabase Security Advisor: zero findings. Local Performance Advisor: 8 pre-existing warnings (5 multiple-policy, 3 duplicate-index). Four existing identity-initplan warnings were corrected. Live read-only advisors still report leaked-password protection disabled and the original index/policy/connection findings. No hosted setting or index was changed.

## Preserved and unresolved

Public website, approved imagery/branding, initial assessment lead capture, adult/child questions, Netlify mirror behavior, 50-seat priority flow, six-month Foundations, export permission boundary and current bootstrap v2 are preserved. AI generation/native wearables/push are not newly connected or proven.

Still unknown: exact Netlify site/deploy mapping; approved hosted staging/Auth origins; original assessment approval files and scoring authority; live provider delivery and approved `client_onboarding` origin configuration; production-shaped performance. Source recovery remains a structure snapshot, not a full managed-platform/business-data backup. The earlier baseline reports are historical evidence, not current release certification.

## Next coherent package

Review this branch, reconcile genuine historical migrations and schema drift, and validate the complete database → Edge → frontend package in an explicitly approved non-production environment. Inventory legacy active accounts, historical same-account double signatures and incomplete ledger/waiver records before release; do not silently grandfather them or run a mass backfill. Confirm Auth redirects/verification/recovery, legal template seeds, notification delivery, and Netlify artifact exclusions. Obtain explicit production release authorization only after staging acceptance. No merge/deployment is authorized here.


## Isolated staging release package

Shared browser/build and Edge configuration replaces embedded production URLs/keys in every active caller. Explicit staging project/origin guards, runtime host checks, Netlify site/branch/context checks, synthetic payment boundary and recipient/notification isolation are implemented. Netlify tracked configuration now builds and publishes a 306-file dist allowlist, excluding backend/SQL/private/docs/test material; existing live hosting has not changed.

A fresh-project initializer restores the recovered baseline → security migration → lifecycle migration → private buckets/config/legal seeds, transactionally, with component hashes and no fabricated historical ledger. Actual original MK7/MK.1 PDFs and existing published merge-template bytes/hashes recovered into ignored local private storage. Five program definitions, three journeys/26 steps and permission configuration recovered without clients/prices/provider URLs. New staging-only constraints fix onboarding to its explicit origin and prohibit payment endpoints.

Local verification now totals **208 active cases** (90 frontend, 85 existing DB, 8 staged provisioning, 25 Edge); all prior 166 remain. All 15 Edge functions typecheck, 69 JS files pass syntax, local seeded advisors report 0 security findings / 8 existing performance warnings. See docs/engineering/STAGING_TEST_RESULTS.md and the final handoff for pushed-commit CI evidence.

**Unresolved:** no hosted staging project/site/Auth/SMTP configured; exact Netlify production provenance still unknown. Fresh hosted baseline compatibility and full business/entitlement/content/provider setup remain unverified. Seven outreach assets already missing. Read-only live program_agreement_requirements is empty; staging's Foundations→MK7 relation is a synthetic test fixture only. Primary Chat must confirm actual production mapping/legacy review before a production release.

**Next:** create the separate staging resources and follow docs/STAGING_RELEASE_RUNBOOK.md; Work executes docs/STAGING_ACCEPTANCE.md with synthetic accounts. No production release or merge is authorized. Earlier next-package paragraphs above describe the lifecycle handoff and are superseded by this staging preparation status.


## Home / Today vNext and dashboard resilience

**IMPLEMENTED on `codex/staging`, feature disabled by default; NOT DEPLOYED.**

- Home / Today vNext preserves `my_app_bootstrap_v2` and adds a reversible runtime flag: `feature_member_home_vnext`.
- Staging provisioning seeds the flag `false`. Production has no required activation change from this work.
- When enabled, the existing Needs Your Attention card incorporates `my_next_best_actions` rather than adding a duplicate priority module.
- A compact Up Next card uses `my_up_next`.
- Weekly Momentum can use `my_weekly_progress_story` with the existing v2 weekly summary as fallback.
- The additive vNext reads are explicitly nonfatal.
- Initial member-dashboard failures are now classified: only bootstrap, member dashboard identity/access, and entitlements are fatal. Optional feature modules log/degrade to their existing empty states.
- Weekly check-in supporting reads also fail locally rather than denying the whole dashboard.
- Health Score/Family Score formulas, AI generation, native wearable code, push-provider activation and assessment scoring remain excluded.
- See `docs/HOME_VNEXT.md`.

Current implementation commits:
- `9b058c9c25fecd614e815ad9f255e703d85a4e5b` Home / Today vNext
- `9a413efd63bc8480578dc55ff759531c577ef0d2` optional-module dashboard resilience

Hosted staging acceptance remains the release gate.


## 2026-09-27 — member experience vNext build wave

**IMPLEMENTED on `codex/staging`, NOT DEPLOYED, production unchanged.**

Current member app still preserves `my_app_bootstrap_v2` as the core contract/fallback.

### Loading / resilience

- paid-access preflight remains first
- critical first-screen database wave is reduced to three reads:
  - `my_app_bootstrap_v2`
  - `my_member_dashboard`
  - `my_member_entitlements`
- journey and feature enrichments load after first paint
- lower-priority modules load through sequence-guarded deferred reads
- optional feature failures degrade locally rather than denying the entire dashboard
- signout reloads the member page to clear rendered private state between users

### Home / Today vNext

Default-off runtime flag:
`feature_member_home_vnext`

Adds:
- backend-driven priorities via `my_next_best_actions`
- compact Up Next via `my_up_next`
- richer weekly progress story via `my_weekly_progress_story`

The existing v2 Today and attention behavior remains the fallback.

### Progress vNext

Default-off runtime flag:
`feature_member_progress_vnext`

Adds:
- deterministic goal progress
- achievements
- descriptive 30-day progress insights

No Health Score, medical interpretation, or invented completion is introduced.

### Progress Photos vNext Phase 1

Default-off runtime flag:
`feature_member_progress_photos_vnext`

Viewing only:
- member-scoped photo sets/photos
- private `progress-photos` bucket
- 5-minute signed URLs
- no `getPublicUrl`
- no raw Storage path rendered to the member
- no upload/delete flow yet

Upload remains intentionally deferred until Storage + database writes have an atomic or compensating workflow.

### Coaching Hub vNext

Default-off runtime flag:
`feature_member_coaching_vnext`

Enriches the existing Coaching Hub with deterministic `my_coaching_momentum` context:
- 7-day plan completion
- planned/full days
- last check-in/progress timestamps
- active/overdue goals
- momentum state

No duplicate coaching dashboard and no medical/AI interpretation.

### Family Hub vNext

Default-off runtime flag:
`feature_member_family_vnext`

Adds the 14-day non-health family schedule from `my_family_calendar_summary`.

Explicitly excludes:
- family/member health scores
- `my_family_progress_dashboard`
- `my_family_dashboard_summary_v2`
- `my_family_wellness_summary`
- raw adult health data

### Privacy Center vNext

Default-off runtime flag:
`feature_member_privacy_center`

Inside My Account:
- connected provider visibility
- provider disconnect
- data-export request
- health-data removal request
- account-deletion request
- correction/other privacy request
- request history/status

No direct destructive browser action and no private export Storage path exposure.

Current backend privacy request access is active-member scoped. Restricted/former-member privacy access remains a future explicit lifecycle decision.

### My Calendar vNext

Default-off runtime flag:
`feature_member_calendar_vnext`

Adds a unified next-30-day member calendar using `my_calendar_feed_60d`.

Member-facing fields are limited to:
- type
- title
- status
- date/time
- safe location URL

Embedded backend metadata is not surfaced.

### Notification Settings vNext

Upgrades the existing settings form in place:
- quiet hours
- quiet-hour start/end
- member IANA time zone
- save via `update_my_notification_preferences` RPC

Existing in-app/email/SMS controls remain.

Push preference UI remains intentionally hidden until the push update contract and hosted delivery are proven.

### Ask ReVitalized member feedback

Connects the existing feedback backend to answered/resolved responses:
- Helpful
- Needs Review
- backend-approved reason
- optional comment

Uses `my_companion_feedback` and `submit_my_companion_feedback`.

Negative feedback continues into the existing quality/human-review workflow. Generation/safety behavior is unchanged.

### Health Trends vNext

Default-off runtime flag:
`feature_member_health_trends_vnext`

Biometrics-gated descriptive trend visualization:
- up to four recent numeric metrics
- latest value/unit
- 30-day sparkline
- absolute change
- latest timestamp

Uses `my_health_dashboard_cards_30d` and `get_my_health_metric_trend`.

No Health Score, Family Health Score, diagnosis, treatment language, or good/bad interpretation.

### Current release posture

All work above remains staging-branch implementation only.

Do not enable any default-off vNext flag in production before isolated hosted staging acceptance.

The production lifecycle/security migrations remain unapplied and production remains Build 192.


## Member document upload hardening

**IMPLEMENTED on `codex/staging`, NOT DEPLOYED.**

The existing secure document vault UI now writes through `member-document-upload` instead of performing browser-side database-first + Storage upload.

The Edge function:
- validates environment/origin
- authenticates the caller
- requires full paid member access
- resolves the member contact/membership server-side
- limits member categories to general/progress
- validates 25 MB maximum
- validates supported MIME/file signatures
- uses contact-scoped private Storage paths
- uses client-generated UUID idempotency
- cleans up both Storage and the database row on partial failure

Because the member frontend now depends on this Edge function, it is part of required staging deployment sequencing before member acceptance.


## Lifecycle-safe member support

**IMPLEMENTED on `codex/staging`, NOT DEPLOYED.**

A new required Edge function `member-support` reuses the existing private messaging tables and `support` conversation type.

Support is available to authenticated client-access states:
- ready
- invited
- onboarding
- active
- payment_suspended

It is not enabled by default for manually suspended or inactive accounts.

This endpoint intentionally does not call `member_paid_access_allowed()`; support remains available without reopening paid member features.

The Enrollment & Signature Center now contains a private Support Center for eligible restricted/active users, and the active member Messages area has a Contact Support action. Both use the same contact-scoped support conversation.

Support conversation creation is deterministic/idempotent and support-message sends use idempotent request UUIDs.


## Message attachment upload hardening

**IMPLEMENTED on `codex/staging`, NOT DEPLOYED.**

Private message attachments now write through required Edge function `member-message-attachment-upload`.

The handler:
- validates environment/origin and caller authentication
- verifies the caller owns the target message
- verifies active conversation participation
- enforces the existing 10 MB private-bucket limit
- validates the existing MIME allowlist and file signatures
- uses conversation/message scoped private Storage paths
- uses client-generated UUID attachment IDs for idempotency
- removes a newly uploaded object if the attachment database row fails

The browser no longer writes message attachments directly to Storage/database and retries one transient failure with the same attachment UUID.


## Restricted Privacy Center lifecycle access

**IMPLEMENTED on `codex/staging`, NOT DEPLOYED.**

Forward migration:
`20260928064500_privacy_lifecycle_access.sql`

The Privacy Center database/view/RPC access boundary now includes:
- ready
- invited
- onboarding
- active
- payment_suspended

This does not alter `member_paid_access_allowed()` and does not relax paid-domain RLS.

Enrollment & Signature Center now exposes a restricted Privacy & Data section for eligible authenticated accounts:
- data-export request
- health-data removal request
- account-deletion request
- correction/other privacy request
- request history
- read-only connected-provider context
- ready export download through a 5-minute signed URL

Provider disconnect remains excluded from the restricted surface pending separate hardening of the health-connection/consent write path.

Lifecycle regression coverage verifies onboarding and payment-suspended privacy access while paid features stay denied, and verifies manually inactive accounts cannot open the Privacy Center or submit new privacy requests.


## Health provider disconnect hardening

**IMPLEMENTED on `codex/staging`, NOT DEPLOYED.**

Forward migration:
`20260928071500_health_provider_disconnect_hardening.sql`

The existing full-member provider disconnect RPC is now a narrowly scoped `SECURITY DEFINER` function that:
- requires authenticated full member access
- resolves only the caller's own active contact
- clears credential reference and granted scopes only for the selected own provider
- revokes only the caller's metric consents for that provider
- leaves stored historical health observations intact
- denies payment-suspended and unrelated identities

Backend regression coverage verifies active own-provider disconnect, consent revocation, payment-suspended denial, and cross-user denial.

This hardening does not certify or activate native HealthKit, Health Connect, Fitbit, Garmin, Oura, Withings or other provider connectivity.


## Idempotent member message sending

**IMPLEMENTED on `codex/staging`, NOT DEPLOYED.**

The active member messaging composer now uses client-generated UUID message IDs.

Retry behavior:
- the same pending message UUID is reused after a transient/lost response
- a duplicate UUID is accepted only if sender, conversation and body match exactly
- body edits generate a new message UUID
- an optional attachment preserves its own stable UUID across retries
- pending message/attachment identities clear only after full success or modal close
- the Send button is disabled during the active send

This complements the existing `member-message-attachment-upload` hardening so both the text message and optional attachment are retry-safe without duplicate records/files.


## Progress and weekly check-in retry safety

**IMPLEMENTED on `codex/staging`, NOT DEPLOYED.**

Manual progress entry now:
- generates an explicit UUID row ID
- preserves that ID and recorded timestamp across retry of the same metric/value/note payload
- verifies any duplicate UUID belongs to the same member data before treating it as replay success
- rejects retry identity conflicts visibly
- clears pending retry state after success or fresh dashboard load

Weekly check-in keeps the existing database unique index on contact/template/period as its duplicate guard. A duplicate-week retry is now treated as success only when the existing submitted response set matches the current response set after deterministic key normalization. Different answers remain a visible already-submitted conflict.

Both forms disable submit while the write is active.


## Idempotent goal and habit creation

**IMPLEMENTED on `codex/staging`, NOT DEPLOYED.**

Forward migration:
`20260928084500_goal_habit_idempotency.sql`

New RPCs:
- `create_my_goal_idempotent`
- `create_my_habit_idempotent`

Both:
- require full paid member access
- accept a client-generated request UUID used as the row primary key
- return the existing row on exact replay
- reject UUID reuse with changed payload
- preserve the existing validation/contact/membership behavior

The member Goal and Habit forms now retain request UUIDs through failed retries, generate a new UUID when the payload changes, disable submit while active, and clear retry state on success/modal close.

The original legacy goal/habit RPCs remain present for compatibility.
