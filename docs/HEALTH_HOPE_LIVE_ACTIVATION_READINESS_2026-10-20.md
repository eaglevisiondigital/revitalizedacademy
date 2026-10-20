# Health & Hope Live — registration activation readiness

2026-10-20. Local engineering candidate on `codex/health-hope-live`, continuing approved guest commit `0966099`. No production SQL, deployment, configuration change, provider operation or real notification was performed. The [approved public website](https://revitalizedacademy.com/health-hope-live) remains published with registration held. This report supersedes older statements that the approved retention policy still needs implementation.

## Completed

Implemented the approved twelve-month event retention policy, authorized event export/deletion, provider cleanup review and signed email delivery feedback. The existing master-contact/Registered Guest architecture and deliberate progression are preserved. No client profile, enrollment, assessment, client access or automatic qualification is created. Existing active clients retain their CRM relationship when their event records expire or are deleted.

Only event-specific SQL, event Functions, staff event UI, tests and documentation changed in this package. The approved public design is unchanged. The current primary Roadmap continuity work is reconciled into this isolated branch; its application bytes are protected by the reconciliation receipt/test. The primary worktree is not modified.

## Retention and privacy behavior

- Identifiable participation expires twelve calendar months after each 30-minute session ends, calculated in `America/New_York`, including DST and leap-year boundaries. Read/worker paths stop exposing expired registrations immediately. A separate held minutely maintenance Function removes expired data, at most four sessions per invocation; backlog keeps collection held. Collection and job claims require a successful maintenance heartbeat within five minutes and approved provider-retention readiness.
- Removes expired registrations, request/idempotency mappings, jobs/provider IDs, attendance observations, event audit links, rate hashes and event-owned CRM tag/progression derivatives. Clears expired session joining/provider identifiers and free text. Retains anonymous session counts only. Counts update in the same transaction and repeated maintenance/deletion cannot double count.
- Master contacts, current relationship/lifecycle, unrelated contact tags/notes, client/financial/assessment records and independently governed privacy/consent records survive. A newer weekly registration is retained when an older session expires. Event-specific consent evidence expires with its event; this is not a global consent deletion or permission change.
- Authorized, active, onboarded Owner/Admin staff with existing CRM management and contact scope verify a requester's identity through an established channel. A fixed verification attestation opens an actor/contact/kind-bound 15-minute case. Export uses an explicit event-field allowlist and never includes private join URLs, health data or other CRM content. A browser download is generated directly; no server export payload is retained. Staff must transfer it through the approved private channel and remove their temporary download afterward.
- Deletion immediately holds event delivery. A three-minute drain covers already leased external operations, including repeated/reopened cases; staff then attest completion of required provider cleanup. Deletes linked attendance and unlinked observations with the exact same session/Zoom registrant identity. Ambiguous observations remain unassigned for authorized review; no email/name guessing attributes someone else's attendance. Request completion removes participant linkage; a one-day receipt allows safe retries. Operator audits retain only staff actor/action/count/time for at most twelve months.
- Session provider manifests omit joining credentials. All People management scope is required to obtain/attest session-wide cleanup. New registration, attendance or email provider acknowledgment invalidates prior cleanup attestation. Local expiry still erases identifiers if provider cleanup is overdue; it simultaneously holds registration/Zoom/email and clears provider readiness. It does not silently retain expired local data while waiting for a vendor.

**Provider limitation:** cleanup attestation is a staff workflow, not an implemented automatic vendor deletion API. Before activation, verify actual Zoom registration/report retention and Resend message-content/log retention, deletion handling and backups against the approved deadline. An actual procedure and evidence are required; clicking an attestation is not a substitute. No participant data was inspected or deleted in production.

## Database package and dependencies

Apply only after separate authorization, in this order, using exact reviewed SQL and checking the actual hosted ledger first:

| Candidate migration | Bytes | SHA256 |
| --- | ---: | --- |
| `20261020141529_health_hope_live.sql` | 37800 | `3c34381dbb2add5bde325e5a932edac977980404b3ae38d848f8a1077a1c79aa` |
| `20261020193400_health_hope_live_registered_guests.sql` | 37417 | `4bfafeb108713436c2aaf46283bdfb008a4089dd28bfd7bf3ad6750a9d530b24` |
| `20261020201535_health_hope_live_privacy_retention.sql` | 61073 | `40abdf1017f2ced902e0273bed55db35e42fa8d441ee55934eb1c4171f78909a` |

The first two candidates are unchanged. All three are absent from the production ledger; read-only catalog inspection confirms no event sessions/registrations tables. Never use a blanket `db push` from this partial history. The primary continuity SQL filename `20261020184635_roadmap_b6_session_continuity.sql` is already installed under hosted version `20261020201519`; do not replay it. Recheck actual names/hashes/dependencies at release time.

Local PG17 restores the historical shared schema and twenty branch migrations, not a complete current production clone. All 319 restored pre-existing application function definitions and shared RLS/policies/ACLs/owners/global roles are preserved. Four critical shared function hashes match read-only production metadata: `staff_can_access_contact`, `staff_has_permission`, `sync_referral_status_from_contact`, `touch_updated_at`. Current primary continuity code/SQL is retained independently; no health data is copied into test fixtures.

Three additional private RLS tables deny direct browser/service access: anonymous totals, ephemeral privacy cases and operator audit. Private views and internal core helpers are revoked from browser/service roles. Existing command RPCs remain the only entry points and recheck current authority. An event-only advisory lock precedes row locks, serializing maintenance/privacy/event writes without locking unrelated systems. Public API/schema mismatch fails closed through `hhl-guest-v1` plus `hhl-privacy-v1` contracts.

## Zoom setup — Justyn owns the account

Justyn or his authorized account admin must provide secure configuration access, confirm the intended licensed host and authorize a Server-to-Server OAuth app. No password or secret belongs in chat. Supply non-secret host/meeting identifiers through the release worksheet; install credentials directly in protected server configuration.

The adapter requires a fixed-time recurring meeting: type 8, weekly every Thursday, 18:30 `America/New_York`, duration 30 minutes, recurrence type 2 / repeat interval 1 / weekly days `5`. Individual occurrence registration is required (`registration_type=2`), automatic approval (`approval_type=0`), with Zoom registration notification and confirmation email settings both false. Each local session must be explicitly bound to an available occurrence with the same start and duration. Cancellations, exceptions and reschedules must be accepted before publishing availability. Meeting preparation/admin setup is manual; this adapter does not create or modify meetings.

Minimum runtime granular admin scopes for the three implemented endpoints are `meeting:read:meeting:admin`, `meeting:read:list_registrants:admin`, `meeting:write:registrant:admin`. The [official scope directory](https://developers.zoom.us/docs/integrations/oauth-scopes-granular/) maps these to meeting inspection, registrant lookup and registration. No reporting/meeting-creation/delete scope is requested for code that does not call it. Provider cleanup requires separately validated admin operations; automatic report backfill is not implemented.

Configure `RVA_HHL_ZOOM_ACCOUNT_ID`, `RVA_HHL_ZOOM_CLIENT_ID`, `RVA_HHL_ZOOM_CLIENT_SECRET`, `RVA_HHL_ZOOM_WEBHOOK_SECRET`, `RVA_HHL_ZOOM_MEETING_ID` securely. Subscribe to `meeting.participant_joined`, `meeting.updated`, `meeting.deleted` at `https://revitalizedacademy.com/api/health-hope-live/zoom-webhook`. Validate endpoint challenge, timestamp/HMAC, account/meeting/instance/registrant matching, repeat events and occurrence cancellation against the actual account. Missing participant identity is reviewed, never inferred. [Zoom S2S setup](https://developers.zoom.us/docs/internal-apps/s2s-oauth/).

Only private per-registrant joining URLs are delivered to that registrant. Authorized staff may retrieve appropriate manual recurring joining information through the existing scoped audited action. Host/start URLs never enter public responses or event exports. Actual joining acceptance remains blocked until credentials/meeting are validated.

## Email setup — reuse the established Academy identity

The owner approved `contact@revitalizedacademy.com` as monitored Reply-To and requested either that From or the existing Academy sender. Existing Academy code defaults to `ReVitalized Academy <noreply@auth.revitalizedacademy.com>` (a runtime override was not retrieved). This existing sender is the recommended immediate option, with `contact@revitalizedacademy.com` as Reply-To. The adapter explicitly requires the currently verified `auth.revitalizedacademy.com` From domain and an explicit Reply-To. No sender setting was changed.

Read-only Resend metadata confirms `auth.revitalizedacademy.com` verified and sending enabled, DKIM/SPF verified, open/click tracking disabled, region us-east-1. Root-domain DMARC is `p=quarantine`; actual delivery/alignment still needs an authorized test. `revitalizedacademy.com` is not a listed verified sending domain. Sending directly **From** `contact@revitalizedacademy.com` requires separate root-domain verification/DNS setup and a reviewed sender-validation update. Reply-To at the root does not require changing the established sender.

Use a dedicated sending-only/domain-scoped event key, configured as `RVA_HHL_RESEND_API_KEY`; do not rotate/reuse unrelated Vitality/Auth credentials. Set `RVA_HHL_EMAIL_FROM=ReVitalized Academy <noreply@auth.revitalizedacademy.com>` and `RVA_HHL_EMAIL_REPLY_TO=contact@revitalizedacademy.com`. Add a dedicated Resend webhook and protected `RVA_HHL_RESEND_WEBHOOK_SECRET`. Subscribe to delivered, bounced, complained, failed and suppressed email events at `https://revitalizedacademy.com/api/health-hope-live/email-webhook`.

The handler validates raw-body Standard Webhooks signatures/timestamp, event/job tags and message binding, reduces payloads before persistence and handles duplicates/out-of-order callbacks. Bounces/complaints/suppression block event mail without altering unrelated marketing consent. Confirmation, one-hour reminder, update and cancellation jobs are distinct; sends require valid private joining details and current event permission. No marketing dispatcher is activated. Provider acceptance is not proof of inbox delivery. [Resend webhook verification](https://resend.com/docs/webhooks/verify-webhooks-requests), [tags](https://resend.com/docs/dashboard/emails/tags), [restricted API keys](https://resend.com/docs/api-reference/api-keys/create-api-key).

## Validation

All synthetic; no hosted writes or provider requests:

| Check | Result |
| --- | --- |
| Feature/scope/API/signature tests | 41 passed |
| PostgreSQL17, RLS/auth, expiry/export/deletion | 65 passed |
| Concurrency | Eight parallel registrations deduplicate; parallel expiry/returning registration passes |
| Shared security/catalog preservation | 319 existing function definitions and existing table RLS/policies/ACLs/ownership/global roles unchanged |
| Local Supabase security advisors | 25 baseline findings retained; 11 expected private deny-direct INFO; zero new warnings/errors/unexpected findings |
| Client lifecycle and session regressions | 23 passed |
| Chromium/WebKit at 1440, 768, 390px | 360 checks; zero page errors/overflow; zero real external/provider requests |
| Production static build | 448 files; this is a local candidate, not a production deployment manifest |

[Receipts, exact migration hashes and reconciliation](health-hope-live-readiness-2026-10-20/) · [staff desktop](health-hope-live-readiness-2026-10-20/desktop-privacy.png) · [staff mobile](health-hope-live-readiness-2026-10-20/mobile-privacy.png). Tests cover malformed attestations, wrong actor/role/scope, deadline boundaries, returning guests, guest-to-client preservation, independent privacy records, in-flight drain, late delivery acknowledgment, provider cleanup invalidation and idempotent deletion. Existing public design screenshots remain in prior approved release evidence; no redesign or new public visual approval is needed.

## Release and rollback

No live registration activation is approved by this engineering request. Runtime and database registration/worker/Zoom/email controls remain held; retention adds independently held `RVA_HHL_RETENTION_ENABLED` plus database `retention_enabled`. Actual server env presence was not re-read through an interface that might disclose secrets. The new scheduled retention Function is not published. Secrets remain server-only, scoped to production Functions; do not alter co-resident settings or publication lock.

Before live collection: obtain secure account/configuration access and provider-retention evidence; review exact reconciled source and three migrations; authorize a bounded hosted installation with collection held; confirm hosted RLS/grants/default-off states and deployed minutely maintenance; authorize only nominated synthetic recipients and test Zoom occurrence registration, private link joining, confirmation/reminder/delivery feedback, repeats/cancellation/DST, staff privacy operations and cleanup. Verify current production manifest/ten existing Function archives and primary changes immediately before preparing any deployment; preserve every unrelated runtime artifact/config/schedule. Current website-only release is independent and does not need republishing merely to finish setup.

Rollback first holds collection/Zoom/email/normal worker and the public form, while **keeping retention maintenance operational** for any collected records. Keep privacy guards and exact forward schema; do not downgrade to lead-only/retention-free SQL or drop tables to undo a release. Use a reviewed forward fix, preserve existing systems and observe successful maintenance. Irreversible expiry/deletion is not restored as a rollback. If restoring a backup, keep HHL held and exclude erased/expired HHL identities; require reviewed erasure reconciliation before exposing event data. If that cannot be demonstrated, do not recover old identifiable event tables; preserve unrelated backup data and rebuild event collection only under separate authority. Provider copies and operator export downloads require their own cleanup procedure.

## Remaining blockers and smallest owner action

**Local engineering is complete; final production activation approval is not ready yet.** Outstanding: actual Zoom licensed host/app/meeting/scopes/webhooks and private-link acceptance; dedicated Resend secure configuration/webhook and authorized delivery test; proven provider retention/cleanup; separate authorization for exact hosted migrations, held deployment and synthetic acceptance, followed by a final bounded live activation decision. No new retention-duration or Registered Guest architecture decision is required.

Smallest next action: have Justyn arrange Zoom account-admin access/setup through the secure provider/configuration workflow, and nominate a monitored synthetic recipient for a separately authorized acceptance test. Email can reuse the established verified Academy From with the approved contact Reply-To; no new root-domain setup is necessary for that path. Do not send credentials in ChatGPT.

## RECOMMENDED THINKING LEVEL: HIGH

## WORK TASK NEEDED

Copy-ready provider acceptance assignment:

> For Health & Hope Live, use the reviewed isolated codex/health-hope-live candidate and this activation-readiness report. Justyn owns Zoom; establish the intended licensed host, S2S app authority and exact fixed weekly Thursday 18:30 America/New_York / 30-minute occurrence settings. Inspect only non-secret account/configuration metadata until separate setup authority is granted. Validate the three documented API scopes, disabled Zoom registration emails and required signed webhooks. Reuse the existing verified Academy From noreply@auth.revitalizedacademy.com with owner-approved Reply-To contact@revitalizedacademy.com; prepare a dedicated restricted Resend key/webhook through protected configuration. Confirm actual provider retention/deletion covers registrations, attendance reports, email content/logs and restored backups within the approved twelve months. Return masked evidence, exact missing configuration and a bounded synthetic acceptance plan with nominated recipients. Do not request secrets through chat, send email, register anyone, change DNS/credentials/settings, run production SQL, deploy or enable public collection under this read-only assignment. Obtain separate concrete authority for setup and hosted acceptance. Preserve the primary Roadmap workstream, permissions, private health, payments and current public website.

## CHAT HANDOFF

> Approved guest architecture preserved. Twelve-month event expiry, scoped verified export/deletion, anonymous counts, audit/provider cleanup controls and signed Resend delivery feedback are implemented/tested locally on codex/health-hope-live. Current primary continuity work is reconciled without editing its worktree. 65 PG17 + concurrency, 41 feature/scope, 23 shared regressions and 360 responsive checks pass. Event migrations remain unapplied and all collection/provider controls held. Justyn owns Zoom; established noreply@auth From plus contact@ root Reply-To is the quickest verified sender path. Next: secure Zoom/Resend setup, provider-retention evidence, separately authorized synthetic hosted acceptance, then exact final activation approval. No Roadmap health/scoring/permission change, production data deletion, email or deployment by this task.
