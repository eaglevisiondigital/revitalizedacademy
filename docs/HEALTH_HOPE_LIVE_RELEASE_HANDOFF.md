# Health & Hope Live — website published / registration held

The owner-authorized website-only release is complete: [production event page](https://revitalizedacademy.com/health-hope-live), deploy `6ad7baf2e7b6f17c96d9dc78`, application source `7403a4ff20895200e2655745181f37b5ef7d5c7b`, pushed isolated branch `codex/health-hope-live`. [Release report, exact public delta, canonical evidence and screenshots](HEALTH_HOPE_LIVE_WEBSITE_RELEASE_2026-10-20.md). Gold CTAs, the new homepage promotion and redirects are live. The 447-path digest preserves all ten existing Functions/configs/schedule, protected assets, production lock and beta. Future primary releases must reconcile this public delta; do not restore a stale pre-event manifest.

**Registration/Zoom/email remain inactive.** Public client mode disables all fields and event requests; no unvalidated date/countdown is shown. No event API, worker, staff event view or migration was published. The owner approved [12 months per session, then identifier removal and anonymous aggregates](HEALTH_HOPE_LIVE_RETENTION_APPROVAL_2026-10-20.md). Master contacts/consent follow separate approved policies. Expiry/provider cleanup and authenticated audited export/deletion remain implementation gates; do not reopen the duration decision.

Migration: `supabase/migrations/20261020141529_health_hope_live.sql`. Exact migration: 37800 bytes; SHA256 `3c34381dbb2add5bde325e5a932edac977980404b3ae38d848f8a1077a1c79aa`. The same receipt is in `health-hope-live-review/validation.json`. It is unapplied remotely. Check current schema/actual migration ledger and name collisions before any separately authorized installation; never run a blanket `db push` from this partial history.

## Registered Guest requirement — implemented locally, not activated

The approved [guest model and validation](HEALTH_HOPE_LIVE_REGISTERED_GUESTS_2026-10-20.md) is now part of the activation package. New contacts use `registered_guest`, not default lead/client; native CRM stage display/filters and event membership reuse existing contacts/tags. Existing client/prospect relationships are preserved. Only deliberate scoped audited staff actions advance Registered → Engaged → Prospective; Active Client still requires existing approved onboarding. No attendance/registration/marketing trigger qualifies a guest. Private weekly history includes reviewed no-shows and verified corrections.

Add the subsequent CLI-generated local `20261020193400_health_hope_live_registered_guests.sql` (37417 bytes; SHA256 `4bfafeb108713436c2aaf46283bdfb008a4089dd28bfd7bf3ad6750a9d530b24`). Both original and guest migrations are unapplied remotely. The new API injects `hhl-guest-v1`; old event SQL rejects it, and new SQL requires it, preventing silent lead-based collection on a mismatched release. Reconcile only the small CRM markup options with the current primary portal; never overwrite its whole file. No new person table, permission, onboarding/health record or automatic backfill.

## Runtime configuration

Masked site/shared inspection found no event/Zoom configuration keys. All four activation flags remain off/unset: `RVA_HHL_REGISTRATION_ENABLED`, `RVA_HHL_WORKER_ENABLED`, `RVA_HHL_ZOOM_ENABLED`, `RVA_HHL_NOTIFICATIONS_ENABLED`. Candidate database controls also default off. No runtime configuration or secret was changed. The enabled public client alone cannot authorize server/database operations.

Server Functions require explicit canonical `RVA_HHL_ORIGIN` and `RVA_HHL_SUPABASE_URL`, the expected Netlify site identity, `RVA_HHL_SUPABASE_ANON_KEY`, `RVA_HHL_SUPABASE_SERVICE_ROLE_KEY` and `RVA_HHL_RATE_SECRET`. Keys stay server-side; private service credentials must never be supplied through chat, tool arguments, public variables or source.

Zoom requires `RVA_HHL_ZOOM_ACCOUNT_ID`, `RVA_HHL_ZOOM_CLIENT_ID`, `RVA_HHL_ZOOM_CLIENT_SECRET`, `RVA_HHL_ZOOM_WEBHOOK_SECRET` and `RVA_HHL_ZOOM_MEETING_ID`, plus validated supported account/scopes. Subscribe only to the required meeting participant-join/update/delete events on `/api/health-hope-live/zoom-webhook`. Do not configure or activate these under this implementation task.

Event email requires `RVA_HHL_RESEND_API_KEY` and an approved verified `RVA_HHL_EMAIL_FROM`. Resend confirms `auth.revitalizedacademy.com` is verified/sending-enabled with tracking disabled; event identity/credential/delivery/joining-details acceptance remain unvalidated. No real message was sent. No marketing dispatcher is implemented. Optional marketing requests remain event consent records; public retries cannot modify existing preferences. Staff may record requested withdrawals with an audit. Event delivery is subject to provider acceptance/suppression and explicit authorization.

Netlify Function secrets are site-wide within their configured scope, rather than isolated to one Function. Preserve existing co-resident application trust and runtime settings. Neither existing payment configuration nor the ten recorded published Function archives were touched by this workstream.

## Remaining participant activation gates

The owner-authorized website publication was completed once; do not request the earlier website approval again. Participant collection remains dependent on implemented retention/export handling, guest-aware production persistence/access-control acceptance, actual Zoom/email readiness and real reviewed session/meeting/sender bindings. Check current schema/ledger and prepare an exact forward package; no blanket branch deployment or migration replay.

Do not activate unvalidated controls or send real participant test emails. After prerequisites pass, record bounded authority for the exact client/server/database controls and validated session/meeting/sender bindings. Preserve current protected assets/Function artifacts, lock, payments, beta, Roadmap/founder tools and private-health permissions.

No exact live-integration activation text can truthfully name a validated Zoom app, event From identity or session bindings yet. Do not insert credentials into a reply. The twelve-month policy is already approved; its implementation is not complete.

## RECOMMENDED THINKING LEVEL: HIGH

## NEXT IMPLEMENTATION PACKAGE

Copy-ready prompt:

> ReVitalized Academy Health & Hope Live website is live at deploy6ad7baf2e7b6f17c96d9dc78/source7403a4ff20895200e2655745181f37b5ef7d5c7b. Registration/Zoom/email are held and the event schema is not installed. In an isolated worktree, inspect the private event candidate, current schema/ledger metadata and docs/HEALTH_HOPE_LIVE_RETENTION_APPROVAL_2026-10-20.md. Preserve the implemented Registered Guest mapping and staff-only progression in docs/HEALTH_HOPE_LIVE_REGISTERED_GUESTS_2026-10-20.md and both ordered local event migrations. Implement a local reviewed forward package for twelve months of identifiable history after each session, then identifier removal with anonymous aggregate counts. Cover registration/attendance (including reviewed no-shows), requests/jobs/audit/provider linkage and event-derived contact-tag/guest-progression activity while preserving shared contacts and separately governed consent/withdrawal records. Add authenticated, authorized, audited event export/deletion integration without touching health records or existing permission rules. Test expiry boundaries, returning registrations, aggregate anonymity, cross-user/staff denial, races and rollback implications. Keep all client/server/database activation held; do not install hosted SQL, deploy, create meetings or send email under this local implementation task. Return exact migration provenance, tests and remaining release gates. Do not request reapproval of the twelve-month duration.

## RECOMMENDED THINKING LEVEL: HIGH

## WORK TASK NEEDED

Copy-ready prompt:

> Perform read-only Health & Hope Live vendor readiness inspection for ReVitalized Academy using `docs/HEALTH_HOPE_LIVE_REVIEW_2026-10-20.md` and its release handoff. Identify the actual Zoom account/app, licensed meeting host, current supported scopes, fixed-time weekly Thursday 6:30 PM America/New_York recurrence, 30-minute duration, per-occurrence registration, and ability to disable Zoom-generated registration emails. Inspect credential-name/presence/scope metadata only through a safely masked interface; never reveal secret values, participant records or host/start/join credentials. Check required participant-join, meeting-update and meeting-delete webhook payloads, endpoint challenge/signature rules, occurrence IDs and registrant IDs against current official documentation and the actual account. Identify an existing approved verified ReVitalized transactional sender and report readiness without sending. Do not create meetings, register attendees, change subscriptions/configuration, apply migrations, deploy, enable flags, submit public forms or send messages under this read-only task. Prepare a separate, bounded synthetic hosted acceptance plan covering CRC/signature rejection, occurrence mismatch/DST, repeat registration, uncertain provider outcomes, cancellation/rescheduling, missing identities/manual review, mail idempotency/suppression and scoped staff access. Use only explicitly approved test recipients if later authorized; do not impersonate founders or use private health data. Return primary-source links, masked readiness evidence, exact missing dependencies and the narrow next authorization. Do not reopen approved event name, schedule, free price or existing Roadmap privacy approvals.
