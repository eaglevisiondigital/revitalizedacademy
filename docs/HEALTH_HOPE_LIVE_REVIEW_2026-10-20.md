# Health & Hope Live — local review package

**Status: implemented and locally validated; unpublished; all live integrations held.**

Repository: `eaglevisiondigital/revitalizedacademy`. Branch: `codex/health-hope-live`. Separate worktree: `health-hope-live/`. Base: published-source commit `17fa5533856138ecdf853f23955a5b1f19fc2aa9`, selected from the workspace release record rather than the older beta `codex/staging` checkout. Implementation commit: `22683c369618d75b772d88504e016833eac133b3`. Subsequent documentation does not change the tested application.

## COMPLETED

- Permanent `/health-hope-live` page, Thursday 6:30 PM Eastern / 30-minute / free event messaging, approved founder photographs and logo, existing published client-story links, responsive registration form, confirmation and countdown.
- Homepage promotion, popup event option, navigation and account event promotion updated. Both HTML and extensionless obsolete webinar URLs redirect permanently; historical paid registrations and payment code remain intact. Legacy account webinar status is not relabeled as new event participation.
- Session-specific registration against the existing master `public.contacts`; normalized exact email/name reuse; ambiguous or conflicting identities require review. Repeated session registration cannot create another registration, notification or overwrite an existing identity/consent. Subsequent weeks retain separate history.
- Staff session preparation/editing, up to 12 weekly drafts, cancellations, rescheduling, per-contact counts/history/search, audited private joining information, identity/attendance review and consent withdrawal. Drafts are never advertised automatically.
- Held server-side Zoom and transactional-email adapters, signed webhook handling, durable leases, retries and review states. No payment collection is introduced.

## Existing architecture and implementation files

The existing website is static HTML/CSS/JavaScript on Netlify; its staff/member applications use Supabase Auth and guarded RPCs. The old webinar schema assumes a single paid event with a $50 reservation and 50 seats. It remains historical infrastructure, with no migration or payment/configuration change. No Zoom API adapter was found in the repository.

| Area | Implementation |
|---|---|
| Public experience | `health-hope-live.html`, `css/health-hope-live.css`, `js/health-hope-live.js` |
| Public integration | `index.html`, `account.html`, `js/account104.js`, `webinar*.html`, `netlify.toml` |
| Staff experience | `portal/health-hope-live.html`, `.js`, `.css`; one portal header link |
| API and worker | `netlify/functions/health-hope-live.mjs`, `health-hope-live-worker.mjs`, `_shared/health-hope-live.mjs` |
| Database | CLI-generated `supabase/migrations/20261020141529_health_hope_live.sql`; **not applied remotely** |
| Build | Existing production builder; six additive entries in `config/production-public-files.json`; no removals |
| Review | `scripts/preview-health-hope-live.cjs`, maintained tests and `docs/health-hope-live-review/` |

The eight new private tables cover settings, sessions, registrations, request identities, rate windows, jobs, attendance observations and audit. Foreign keys point to existing contacts. There is no second contact/marketing database, client-account creation, assessment-answer ingestion or new role/permission key.

## Scheduling and integrations

Every regular session is constructed as Thursday 18:30 in `America/New_York`. UTC offsets change naturally across DST. Registration closes at the session start by default; staff can explicitly close earlier or reschedule. Ambiguous/nonexistent Eastern exception times are rejected. Public availability comes only from published, open, ready database sessions, with polling and a server recheck at registration; an empty schedule remains empty.

The Zoom adapter validates a pinned, fixed-time recurring meeting, per-occurrence registration, 30-minute duration, New York timezone, weekly Thursday recurrence and disabled Zoom-generated emails. Supported signed `meeting.updated`/`meeting.deleted` events hold or cancel affected sessions and invalidate pending notices/old Zoom links. A bounded worker checks provider occurrences every minute when released; Zoom availability expires after ten minutes without renewed validation. Network detection has normal webhook/poll latency; no instantaneous cross-provider cancellation guarantee is claimed. Manual joining mode remains staff-managed.

Attendance requires a bound meeting instance plus the recorded registrant ID. Missing or conflicting identities remain review items. An authorized manager may bind an observed instance and resolve a participant with documented evidence; names/emails are not guessed automatically. “Not credited” does not assert someone was absent, and attendance is not a duration/completion or health measure.

Email jobs contain only event information. Provider idempotency keys and exact message content persist across retries, which stop before 24-hour provider key expiry. Uncertain Zoom POSTs are held for reconciliation, never blindly repeated. Already-dispatched external messages cannot be recalled. The review queue exposes failures; uncertain provider outcomes still need operator investigation.

Current API behavior follows [Zoom meeting registration](https://developers.zoom.us/docs/api/meetings/), [webhook verification](https://developers.zoom.us/docs/api/webhooks/) and [Server-to-Server OAuth](https://developers.zoom.us/docs/internal-apps/s2s-oauth/). Actual account support, app scopes and provider behavior remain unvalidated.

## TESTED

| Gate | Final result |
|---|---|
| Feature, transport and source-scope checks | 32 pass |
| Real PostgreSQL 17 cases | 37 pass |
| Eight simultaneous registration requests | 1 master contact, 1 session registration, 1 confirmation job |
| Existing assessment/resume/payment/lifecycle and staff regressions | 106 pass |
| Chromium + WebKit at 1440 / 768 / 390 px | 6 runs, 120 checks; no page errors or horizontal overflow |
| Production static build | 448 files; 6 added, 0 removed |
| Preservation | 765 protected tracked files byte-identical to base; all 319 pre-existing restored application function definitions unchanged |
| Syntax / whitespace | Seven new JS modules checked; staged diff clean |

Evidence: [validation manifest](health-hope-live-review/validation.json), [database output](health-hope-live-review/database-tests.log), [browser output](health-hope-live-review/browser-tests.json), [desktop](health-hope-live-review/desktop.png), [mobile](health-hope-live-review/mobile.png). All identities and sessions in acceptance fixtures are fictional. Historical Build 81 whole-page snapshot tests describe the retired promotion; they were preserved, not renewed as a shortcut. Current semantic/scope tests assert the approved replacement and unchanged assessment/footer/shared assets.

An intermediate SQL-string generation defect was detected by a disposable restore, repaired and followed by the full passing restore/permission/race gate. A dedicated atomicity/duplicate-definition guard now covers that failure mode. Initial browser binary/fixture timing and local PostgreSQL-cluster resource issues were resolved without altering other worktrees, servers or databases. Tests use a separately named disposable database on the existing loopback PG17 server; it is dropped and global role metadata is verified unchanged.

## SECURITY

- RLS enabled and direct browser/service table ACLs revoked on all eight new private tables. Only narrow public invoker RPCs reach private fixed-search-path helpers.
- Staff reads use current active/onboarded staff plus existing `crm.view` and contact scope. Global management requires existing Owner/Admin plus `crm.manage`; global unresolved-identity review also requires All People scope. No existing grants, role defaults, RLS policies, private-health permissions or founder-tool code changed.
- Public requests have bounded JSON bodies, strict fields, source/consent checks, trusted-IP HMAC rate keys and generic responses. No identity enumeration, contact IDs or joining secrets are returned publicly. Names/email/answers are not stored in browser storage.
- Server credentials remain environment-only. Caller JWTs are forwarded with the publishable key for staff operations. Provider requests use fixed hosts; webhook signatures bind raw bytes and a fresh timestamp, then check account and meeting.
- Staff private DOM/forms/links clear on logout, account changes, access denial, hidden pages and failed/replaced loads. Delayed responses cannot repaint a different person/session.
- No production API calls, migrations, deployments, secret retrieval/configuration, live Zoom calls, real notifications, member activation, scoring or private health-data changes occurred.

## DOCUMENTATION

Updated this isolated branch's `CURRENT_BUILD_STATE.md`, `ARCHITECTURE.md`, `SECURITY_MODEL.md` and `DECISIONS.md`. The parent workspace/primary workstream documents and working files were not edited. Operational variables and precise release authority are in [release handoff](HEALTH_HOPE_LIVE_RELEASE_HANDOFF.md).

## UNRESOLVED

1. Hosted Zoom credential presence, licensed-host capabilities, app scopes and webhook subscriptions have not been inspected through a channel that exposes only safe metadata. Local source/environment-name inspection is not proof of their presence or absence.
2. Verified event sender, suppression behavior, actual email delivery and real provider attendance shapes need authorized hosted/synthetic acceptance. No real participant notifications are authorized.
3. The owner must decide retention and how event records participate in existing erasure/export requests before collecting participant data. Restrictive references deliberately prevent accidental deletion; no retention period or destructive workflow was invented.
4. Reconcile against the primary workstream's then-current release source before any integration/publication. There is no hosted candidate, push, PR, production migration or release authorization from this workstream.

## NEXT RECOMMENDED BUILD

Resolve the narrow retention decision, perform read-only vendor readiness inspection, then authorize isolated synthetic provider acceptance and a reviewed release package. Preserve primary-workstream changes and the existing production lock, beta, payment and Roadmap safeguards. Do not replay historical migrations or deploy the repository root.

## CHAT HANDOFF

Health & Hope Live is ready for local design/code review on isolated `codex/health-hope-live`, based on production source 17fa553. The free Thursday 6:30 PM Eastern experience, session registrations, CRM deduplication, staff history, attendance review and held Zoom/email infrastructure are implemented. Local security, database, race, regression, responsive-browser and static-build gates pass. No production or participant operations occurred. The remaining decisions are event retention/erasure integration, actual Zoom/sender readiness, primary release reconciliation and explicit release/activation authority. Full copy-ready Chat/Work assignments and release text are in the release handoff.
