# ReVitalized Academy — current build state

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
