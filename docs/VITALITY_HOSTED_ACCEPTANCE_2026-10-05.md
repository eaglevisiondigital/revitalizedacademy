# Hosted Vitality acceptance checkpoint — 2026-10-05

This is an incomplete hosted acceptance receipt, not a readiness declaration. Latest user authority explicitly approves the exact dedicated inbox and staging-only lifecycle. Existing local suites are retained without broad rerun because no application source changed.

## Unchanged release

- Source: `e51b04545c5eba5f33d7b3a3aafca3b2cca854a8`.
- Staging Netlify: site `071b252e-a922-4846-a784-8dca1edad377`, deploy `6ac38599ba35bc77a266d41c`.
- Staging Supabase: `bvooallokgfktssadsrv`.
- Migration `20261005110245_vitality_assessment_secure_resume` was already applied; no replay.
- Edge `vitality-resume` v1 remains unchanged; no redeployment.
- No production mutation. Current read-only release comparison is in `deployment-evidence/2026-10-05-vitality-hosted/release-receipt.json`.

## Exact approved recipient change

Added only `dave+rva-assessment@eaglevision.biz` to `RVA_SYNTHETIC_EMAIL_ALLOWLIST` through the authenticated staging dashboard. Saved 2026-10-05 11:17:59 UTC. Preserved `dave@theboss.biz`, `dave@eaglevision.biz`, `dave+rva-client-a@eaglevision.biz`, `dave+rva-client-b@eaglevision.biz`, `dave+rva-beta-staff@eaglevision.biz`; no domain wildcard. Final six-address SHA-256: `82e27fce504a8a5ca56c78283825cf3b6b036b881a8bc21b62b95d46aa2a498e`. No SMTP/provider, role, permission or feature-flag change.

## Actual hosted start and mail

Normal staging `/consult.html` Save & Continue used Synthetic / Vitality Acceptance, the dedicated alias and synthetic phone `0000000000`. No real health data or existing client identity was used.

| Evidence | Result |
|---|---|
| Actual Netlify lead | `6ac3877ce7069a3210625123`, captured 2026-10-05T11:18:20.145Z; all four required contact fields present |
| Contact | `d67d75c4-2c8f-4ecf-b394-cfc389230925` |
| Draft | `efaf06be-b305-4278-92db-be6a97fdb1b9` |
| Workflow | `fa3b1233-380c-4000-94e4-1dc4c465eef2` |
| Journey | `ec35cce1-95fe-433b-b9b5-468a3315eaa6` |
| Exact identity counts | One contact, one draft, one assessment workflow |
| Draft checkpoint | Unverified; section 0, percent 0, revision 0; pending mail digest, no session digest |
| Resend receipt | `01a10bc9-41fc-7627-8ae4-eae7c971d7f4`, Continue Your Vitality Assessment, 2026-10-05T11:18:21.603Z, provider status delivered |
| Actual external inbox arrival/open | Unverified; user asked to open the received message and click its Continue button in Chrome |
| Connected Gmail | Exact alias/subject search returned no matching messages; this does not establish absence in the receiving business inbox |
| Final Netlify assessment | Zero submissions at checkpoint; no final correlation record yet |
| Journey completion | Zero events, expected for an unverified unfinished draft |

No sent-message body or credential was retrieved to bypass receipt. Raw mail/session credentials and assessment answers are absent from evidence.

## Hosted authorization proof

Eighteen checks ran against the actual deployed staging RPC using two new `example.invalid` identities wholly inside a rolled-back subtransaction. No email was sent, no existing A/B/staff identity was used, no real client was touched, and zero fixture contacts/drafts remain. No DDL or migration was executed. The actual approved assessment remained unchanged.

- Email-only start response contains no identity, draft ID or answers.
- Valid Person A credential cannot read or save Person B; inverse direction also denied.
- Random, modified and email-only credentials denied.
- Consumed mail credential denied; fresh recovery keeps the same fixture draft and replaces the older session.
- Expired mail and session credentials denied.
- `anon` and `authenticated` cannot directly execute storage RPC or read private draft table.
- Both fixture revisions remain zero after wrong-person attempts.

The hosted SQL and pass receipt are retained in `rollback-security-proof.sql` / `.json`. This proves the deployed database boundary, not the still-pending actual external-email and browser recovery lifecycle.

## Browser and responsive limits

Actual desktop verification page displays the neutral check-email notice and no health questions. Captured console has zero warnings/errors. Requested viewport overrides 1440×1000, 768×1024 and 390×844 did not change the actual Chrome document size (1920×936; a fresh tab remained 1512×805). These attempts are not recorded as responsive passes. The override was reset. A native inspection attempt was interrupted by user browser activity; no unrelated page was modified. The original assessment and owner portal tabs remain available for continuation.

Earlier exact-built responsive checks remain passing release evidence, but do not replace current hosted Saved/restored/recovery/error/completion coverage.

## Remaining required acceptance

Actual inbox receipt and verification → synthetic radio/checkbox/select/textarea/range/conditional/symptom controls → Saving/Saved acknowledgment and server revision → Continue Later → fully leave → actual emailed resumption and server-backed restoration → further answers and fresh recovery → stale-session denial → normal full completion → reconcile exact Netlify `assessment_resume_id` with the draft → one Journey completion → completed lock → all required hosted responsive states and clean console.

Do not resend automatically or manually force completion. If final transport is ambiguous, preserve `submitting` / `delivery_uncertain` and inspect the correlation against captured Netlify data before any separately reviewed procedure.

No new feature package is started. Separate Client A/B/scoped staff/meal/workout beta acceptance remains incomplete.

VITALITY RESUME NOT READY

BETA NOT READY
