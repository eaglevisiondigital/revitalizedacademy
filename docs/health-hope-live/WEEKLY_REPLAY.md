# Health & Hope Live — weekly replay (local release proposal)

This is a local implementation. No hosted migration, upload, publication, session save, consent change or email was performed. October 29's event and the unresolved November 5 draft publication are separate and unchanged.

## Guest behavior

Registration, required event consent, optional marketing consent, Registered Guest classification, Zoom joining details, reminders and attendance remain on their existing paths. The confirmation and success page can additionally show **Watch Last Week's Replay** with the original recording date. The live invitation appears separately; replay is never a joining URL.

Match the upcoming session's original Thursday date to exactly seven calendar dates earlier. Require a published, completed original session and its latest active approved recording. Never search backward for an older recording. Calendar-date matching works across Eastern DST changes. No approved recording means ordinary registration and confirmation proceed without it.

Optional “Who invited you?” stores guest-supplied text privately (160 characters maximum). It is not an identity assertion, account lookup or permission to disclose an inviter's contacts. Public confirmation and email use only generic contact-your-inviter wording. Do not put health or contact details in this field.

## Staff approval

Existing authenticated Owner/Admin CRM management permission is required. In Health & Hope Live → Event Operations → Previous-week replay → Load replay approvals, select the ORIGINAL completed session, enter its approved YouTube URL, explicitly verify sharing/playability, add a reason and save. Each correction or withdrawal appends a new version; it never overwrites approval history. Saving queues no extra messages.

Only allowlisted HTTPS YouTube video links are canonicalized. Authenticated preflight precedes the server's bounded, no-redirect YouTube oEmbed check. A short-lived server-only proof binds actor, original session, URL and expected revision; direct browser RPCs cannot mint it. Staff must personally verify that the recording is approved and playable, not a draft/future premiere. oEmbed is not proof of rights, speaker consent, eventual playback, or continued future availability. YouTube availability may change externally: withdraw a removed/private video promptly. No recording URL was provided or invented during implementation.

## Separately approved availability emails

A new optional, initially unchecked replay-updates permission is independent of required event notices and optional marketing. Existing registrations default to false; do not infer permission or backfill them. A guest who opted in when registering can receive a later approved replay-availability message for that upcoming event. Stopping event notices also stops replay notices. Use the existing verified withdrawal workflow; no consent can be revived through duplicate registration.

Additional messages remain held behind BOTH `RVA_HHL_REPLAY_FOLLOWUP_ENABLED` (missing means false) and `private.hhl_settings.replay_followups_enabled` (false on installation), alongside all existing notification/retention gates. Separate Owner approval is required for activation and the exact session's send batch. Staff must enter its approval reference and explicitly confirm the batch. This release proposal does not approve either activation or a batch. Guests lacking explicit optional replay permission, with withdrawn event consent, privacy holds, delivery blocks or already-sent replay confirmations are excluded.

An isolated outbox has one notice per registration/original session, irrespective of replay corrections. Queue/claim serialize with privacy operations; workers recheck consent, current source/version, upcoming revision/cutoff, retention and delivery eligibility. Original jobs retain priority. Provider retries use one stable key, five attempts maximum and a 23-hour bound. Withdrawal, changed session/replay or expiry stops sending, without issuing another Zoom registration. No indefinite automatic retries.

Normal confirmation jobs freeze their replay/no-replay decision before first send. A later recording cannot change an uncertain retry's body. Withdrawn/replaced replay snapshots or pre-release uncertain jobs require reconciliation; do not resend modified mail under the old key. Legacy workers omit the new capability marker and retain the original job response/presentation. Release/rollback must drain leases and reconcile uncertain sends first.

## Delivery, clicks and privacy

Outbox state distinguishes queued/leased, provider-accepted, delivered, bounced, suppressed, failed and review-needed. Signed Resend webhooks require the HHL tag, bound provider ID and exact recorded replay URL. Event keys deduplicate callbacks. Staff history exposes scoped status and link-click counts, not provider IDs or inviter contact lookup. A click may be a mail scanner: **never label it a completed YouTube view or a human watch**. No click IP or user-agent is retained. HTML replay messages retain the complete plain-text Zoom invitation; other message types are unchanged.

Click ingestion is implemented, but live click reporting depends on separately verified provider tracking/webhook configuration. No domain-wide tracking was enabled, no tracking pixel added and no test email sent. Provider acceptance does not prove inbox delivery, reading or playback.

New private tables deny direct anon/authenticated/service-role access; only scoped definer commands can access them. Fixed empty search paths, existing staff/contact checks and existing public API roles are retained. Privacy exports include the new referral/permission/status metadata under the existing verified request process. Deletion cancels replay delivery and observes in-flight drain/provider cleanup; provider inventories include replay mail IDs. Retention removes expired replay approvals only after referencing recipient jobs/notices have expired or been deleted, preserving their cleanup evidence for the existing twelve-month recipient retention period. Source URLs are not stored in browser storage or telemetry.

## Exact technical scope

- Four static paths: `health-hope-live.html`, `js/health-hope-live.js`, `portal/health-hope-live.html`, `portal/health-hope-live.js`.
- Shared server HHL module plus one replay helper. Locally prepared replacements: **health-hope-live** and **health-hope-live-worker** only. Preserve the other eleven archives byte-for-byte, including retention and roadmap-processing; do not rebuild them just because they share source imports.
- One guarded migration: `20261029222717_health_hope_live_previous_week_replay.sql`. Two private tables, six additive columns, helper/command wrappers, immutable approval and cleanup triggers. It verifies exact current HHL dependency hashes and rejects repeat installation. It creates no replay, session, registration or queued message.
- No changes to session publishing, Zoom bindings, existing feature-control values, schedules, Roadmap/Calibration, payments, Founders, beta or questionnaire/scoring systems.

## Verification and release

Local PostgreSQL 17 tests use a disposable database, fictional identities and actual roles/RLS, including real concurrent transactions. Existing 319 unrelated application function definitions, RLS/ACLs and global roles are unchanged. Node tests cover original registration/Zoom security and delivery plus replay behavior. Chromium/WebKit desktop/tablet/mobile tests intercept all network transport and test both ordinary success and optional replay, stale/invalid URL denial, consent defaults, approval and logout. Two reproducibly bundled Function archives pass compiled held-mode smoke checks. See the private evidence folder outside Git: `deployment-evidence/2026-10-29-hhl-replay`.

Before any hosted release, require exact source/migration/manifest approval; freshly compare canonical static inventory, all thirteen Function hashes, configs/schedules and retained features. Stop on drift and preserve live enabled registration HTML. Apply only this guarded migration, then create one unpublished candidate overlaying four static paths and two reviewed Function ZIPs onto the complete canonical inventory. Run hosted fictional/anonymous acceptance before separate exact-candidate publication approval. Do not run a full stale-site rebuild or infer permission to publish. Additional replay emails and October 29 video approval remain separate actions.

Rollback: hold new replay notices first, drain in-flight leases/reconcile uncertain provider sends, and restore only the retained four original static assets and two original Function archives. Keep the additive database/history and existing public command wrappers so signed feedback/privacy cleanup can continue. Do not drop new tables, delete audits, undo guest consent/history or restore an old full-site deployment over newer work. A database rollback or cancellation of real queued messages requires separate exact reviewed authorization. Reverify Zoom, registrations, notices, all thirteen archives and unrelated features after reversal.
