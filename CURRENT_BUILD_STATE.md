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
