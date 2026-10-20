# Health & Hope Live — held release handoff

Implementation: `22683c369618d75b772d88504e016833eac133b3` on `codex/health-hope-live`, based on `17fa5533856138ecdf853f23955a5b1f19fc2aa9`. This is a local, unpushed package. The primary workstream's current checkout and source changes must be reconciled before publication; do not overwrite them with this baseline.

Migration: `supabase/migrations/20261020141529_health_hope_live.sql`. Exact migration: 37800 bytes; SHA256 `3c34381dbb2add5bde325e5a932edac977980404b3ae38d848f8a1077a1c79aa`. The same receipt is in `health-hope-live-review/validation.json`. It is unapplied remotely. Check current schema/actual migration ledger and name collisions before any separately authorized installation; never run a blanket `db push` from this partial history.

## Runtime configuration

All four activation flags default off/unset: `RVA_HHL_REGISTRATION_ENABLED`, `RVA_HHL_WORKER_ENABLED`, `RVA_HHL_ZOOM_ENABLED`, `RVA_HHL_NOTIFICATIONS_ENABLED`. The migration separately defaults all three database controls off. Both layers must permit an operation. No runtime configuration was changed.

Server Functions require explicit canonical `RVA_HHL_ORIGIN` and `RVA_HHL_SUPABASE_URL`, the expected Netlify site identity, `RVA_HHL_SUPABASE_ANON_KEY`, `RVA_HHL_SUPABASE_SERVICE_ROLE_KEY` and `RVA_HHL_RATE_SECRET`. Keys stay server-side; private service credentials must never be supplied through chat, tool arguments, public variables or source.

Zoom requires `RVA_HHL_ZOOM_ACCOUNT_ID`, `RVA_HHL_ZOOM_CLIENT_ID`, `RVA_HHL_ZOOM_CLIENT_SECRET`, `RVA_HHL_ZOOM_WEBHOOK_SECRET` and `RVA_HHL_ZOOM_MEETING_ID`, plus validated supported account/scopes. Subscribe only to the required meeting participant-join/update/delete events on `/api/health-hope-live/zoom-webhook`. Do not configure or activate these under this implementation task.

Event email requires `RVA_HHL_RESEND_API_KEY` and an approved verified `RVA_HHL_EMAIL_FROM`. No marketing dispatcher is implemented. Optional marketing requests remain event consent records; public retries cannot modify existing preferences. Staff may record requested withdrawals with an audit. Event delivery is subject to provider acceptance/suppression and explicit authorization.

Netlify Function secrets are site-wide within their configured scope, rather than isolated to one Function. Preserve existing co-resident application trust and runtime settings. Neither existing payment configuration nor the ten recorded published Function archives were touched by this workstream.

## Exact publication authorization needed

The user's October 20 release restrictions require separate authority. After reviewing this source and reconciling any primary-workstream drift, the owner can authorize the following bounded website/database release:

> I authorize the reviewed Health & Hope Live application from implementation commit 22683c369618d75b772d88504e016833eac133b3, plus its documentation-only follow-up, for production release after current-source, migration-ledger, protected-asset and release checks pass. Apply only the exact `20261020141529_health_hope_live.sql` bytes/hash in the validation manifest once, with every new database/runtime activation control held off. Publish only the reviewed allowlisted site assets and the two additive Health & Hope Live Functions; preserve existing Function artifacts, production lock, payments, beta, Vitality Roadmap, founder tools and private-health permissions. Do not publish if current production/source drift requires a different unreviewed package. This authorization does not enable registration, live Zoom, participant notifications, optional marketing or unreviewed data retention.

A working participant launch additionally needs approved retention/erasure handling, actual provider readiness/acceptance, real reviewed session/meeting bindings and explicit authorization of the particular registration/Zoom/notification controls. No exact live-integration activation text can truthfully name a Zoom app, verified sender or session bindings yet; those dependencies have not been validated. Do not insert credentials into a reply. An unpublished candidate ID, if created during a later authorized release, must be recorded and verified before publication.

## RECOMMENDED THINKING LEVEL: HIGH

## CHAT DECISION NEEDED

Copy-ready prompt:

> ReVitalized Academy has a local Health & Hope Live implementation on `codex/health-hope-live`. Its eight new private event tables reference the existing master contacts and keep per-session registrations, attendance observations, communication permissions, jobs and audit history separate from health assessments. No production change or participant collection has occurred. The free weekly event and returning-session history are approved, but no event retention duration or treatment in existing privacy erasure/export workflows was found. Please decide the identified-record retention period, which aggregate history (if any) should survive de-identification, and how participant withdrawal/deletion/export requests should be handled. Options include a finite rolling history, or a defined operational period followed by de-identified aggregate counts; both need an explicit period and audit/reference rules. Longer identified history helps founder participation reporting but retains more personal data. Restrictive contact/event references currently prevent accidental deletion, and no automatic deletion was invented. Return the narrow approved policy and privacy-notice wording so engineering can implement/test it before enabling registration. Preserve existing health-data permissions, consent approvals, assessment records and Roadmap scope. Existing already-published client-story teasers are reused; no new guest testimonial or publication permission is assumed.

## RECOMMENDED THINKING LEVEL: HIGH

## WORK TASK NEEDED

Copy-ready prompt:

> Perform read-only Health & Hope Live vendor readiness inspection for ReVitalized Academy using `docs/HEALTH_HOPE_LIVE_REVIEW_2026-10-20.md` and its release handoff. Identify the actual Zoom account/app, licensed meeting host, current supported scopes, fixed-time weekly Thursday 6:30 PM America/New_York recurrence, 30-minute duration, per-occurrence registration, and ability to disable Zoom-generated registration emails. Inspect credential-name/presence/scope metadata only through a safely masked interface; never reveal secret values, participant records or host/start/join credentials. Check required participant-join, meeting-update and meeting-delete webhook payloads, endpoint challenge/signature rules, occurrence IDs and registrant IDs against current official documentation and the actual account. Identify an existing approved verified ReVitalized transactional sender and report readiness without sending. Do not create meetings, register attendees, change subscriptions/configuration, apply migrations, deploy, enable flags, submit public forms or send messages under this read-only task. Prepare a separate, bounded synthetic hosted acceptance plan covering CRC/signature rejection, occurrence mismatch/DST, repeat registration, uncertain provider outcomes, cancellation/rescheduling, missing identities/manual review, mail idempotency/suppression and scoped staff access. Use only explicitly approved test recipients if later authorized; do not impersonate founders or use private health data. Return primary-source links, masked readiness evidence, exact missing dependencies and the narrow next authorization. Do not reopen approved event name, schedule, free price or existing Roadmap privacy approvals.
