**Publication update, October 20, 2026:** The separately authorized popup-only update is now live as deploy `6ad7ed9be0bd165b997e0be1`; three public assets over the exact current primary manifest, with registration held and Roadmap/Zoom/email unchanged. [Release report and live verification](HEALTH_HOPE_LIVE_POPUP_RELEASE_2026-10-20.md). All registration-readiness backend changes and four event migrations remain unreleased. Earlier local/unpublished website status below is historical.

# Health & Hope Live — final registration activation preparation

2026-10-20 · `codex/health-hope-live` · continuing acknowledged `f6db6b6`.

**Engineering candidate prepared; hosted acceptance and public activation remain held.** No production migration, deployment, Zoom setting, credential, email send or actual participant deletion occurred. The approved Registered Guest architecture, website design and twelve-month retention policy remain in place.

## Essential launch gates and optional work

| Requirement | Current evidence | Remaining action |
| --- | --- | --- |
| Registered Guest CRM identity, deduplication, weekly session, consent | Existing approved implementation and tests; new controlled registration uses its same handler and database contract | Install exact held candidate and verify the hosted synthetic transaction |
| Twelve-month event retention and scoped export/deletion | Existing retention implementation; manual attendance uses the same expiry/export/deletion boundary | Deploy independent maintenance, prove a fresh heartbeat and document actual external-provider retention/cleanup arrangements |
| Complete Zoom invitation and basic security | Supplied shared meeting configured server-side; account inspection stopped at sign-in | Justyn or authorized admin supplies a secure read-only account review and host-assisted joining evidence |
| Email sender and confirmation | Existing Resend; `auth.revitalizedacademy.com` verified, sending enabled; local confirmation templates tested | Securely configure existing approved sender/key/webhook, then verify exactly one authorized confirmation to the nominated inbox |
| Hosted end-to-end acceptance | Actor-bound, single-recipient/session/request case implemented and locally tested | Separately authorize held installation and the bounded test below |
| Automated attendance/webhooks | Optional, unverified and disabled | May follow launch; do not describe manual evidence as automation |

**Launch can proceed without automated Zoom attendance** after the essential gates pass and the authorized manual attendance workflow is installed. Missing attendance is unreviewed; staff must verify identity and evidence before crediting a Thursday or recording a no-show. Event participation never promotes someone into a prospect/client or grants client access.

## Completed engineering

The earlier observation-review controls required a Zoom observation to exist. Added an explicit manual evidence action so an authorized host can record verified participation while Zoom API/webhooks remain off. It requires the existing active, onboarded Owner/Admin, CRM management and live per-contact scope; a completed, published, unexpired session; verified identity; observed Eastern time; an evidence source and a short reference without health details. Duplicate request IDs are idempotent; stale decisions, mixed run UUIDs, future/canceled/expired/held sessions and guessed identities are rejected. History explicitly labels manual evidence. Existing guest stages, master contacts, Auth accounts, health data and onboarding are unchanged.

Added a disabled-by-default, thirty-minute hosted acceptance case. It pins an existing authorized All People operator, recipient, selected session/revision and request UUID in both private database configuration and server environment. It uses the same website registration endpoint and approved guest/privacy contracts with the operator's normal JWT. Public registration stays held. Only the exact case's confirmation is eligible for delivery; reminders, Zoom operations and other recipients are excluded. The worker rechecks recipient/session/revision/type and retains the existing delivery idempotency key. A separate acceptance delivery latch keeps the worker held when the case expires or its enable flag is removed. Expired case identifiers are hidden immediately and removed by maintenance.

No second contact database, new permission key, role, RLS policy, email provider, client record or marketing subscription was introduced. The private acceptance scope is not returned in ordinary manager settings; only its pinned authorized operator receives it after matching server/database checks.

### Changed files and migration dependencies

- `netlify/functions/_shared/health-hope-live-acceptance.mjs` and the existing shared event handler: bounded held acceptance and confirmation delivery guard.
- `portal/health-hope-live.html` and `.js`: staff-only manual evidence form and hidden controlled test form; logout/revocation clears both.
- `supabase/migrations/20261020215108_health_hope_live_launch_acceptance.sql`: CLI-created forward candidate; one nullable private settings column and narrow event helper/wrapper updates. No shared function or policy replacement.
- Targeted API/database/browser tests, test runner and package script; reconciliation guards retain exact primary bytes and separately pin the owner-requested popup presentation change.

All **four** event migrations remain unapplied. Apply only the exact ordered files in [migrations.json](health-hope-live-launch-preparation-2026-10-20/migrations.json) after explicit authorization. The first three migration hashes are unchanged. Existing primary B6 SQL is already hosted as version `20261020201519` despite its different local filename; **never replay it or run a blanket database push**.

Reconciled baseline remains primary `fa1f490012507319bb93cca64d6cbaf039ceaec3`; its separate worktree is clean and untouched. The latest verified publication is `6ad7cd0111dae0b60c7d9656`, publication locked, source `fa1f490`. Recheck source, deployment manifest, Function archives/config/schedules and migration ledger immediately before any release; this is a historical readiness observation, not permission to replace a newer primary build.

## Smallest Zoom verification — action by Justyn

Use Justyn's normal authenticated Zoom session or an authorized admin's secure operator session. Do not share passwords, API credentials or tokens in ChatGPT. Read only; do not change the meeting.

1. Open meeting **825 1611 2925**, topic **ReVitalized Health & Hope Livestream**, and confirm the intended host owns it and can start it. Record whether Elle can host/admit guests under current permissions.
2. Inspect passcode requirements and the actual complete attendee invitation. The supplied URL has no embedded passcode; that does not prove a passcode is unnecessary. Save any complete invitation/passcode through protected server configuration, not public source or chat.
3. Record Waiting Room/admission, authentication restrictions, joining before the host, and account/group locks. Confirm ordinary invited guests can use the intended joining path and who admits them. No setting changes are implied.
4. Record actual host plan/license, meeting-duration capability and reporting access. Paid reporting access/API scopes are informational for manual-mode launch, not an essential API-integration gate.
5. Under the separate test approval, have the host admit one synthetic guest using the exact confirmation invitation. Record success or the actual blocker. A technical join today is not Thursday attendance and must not be credited as such.

Public schedule remains Thursdays at **6:30 PM America/New_York**, thirty minutes; website session records distinguish Thursdays even though the shared URL is the same. No Fixed Time meetings cannot use Zoom-native registration; that separate adapter remains guarded. Automated reports would later require authorized account/reporting capabilities and actual run UUID matching, not merely the recurring meeting ID. [Zoom registration requirements](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0065026), [reporting prerequisites](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0073594), [Waiting Room and early joining](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0060501).

## Email configuration — existing Resend only

Read-only provider review confirms domain `auth.revitalizedacademy.com`, domain ID `7c4abebc-98d3-4a8f-b769-dcec628f4a3a`, status verified, sending enabled, receiving disabled, tracking disabled. No secret was retrieved. Actual sending-key readiness/runtime overrides and delivery are unproven.

Reuse the existing approved source-default From **ReVitalized Academy &lt;noreply@auth.revitalizedacademy.com&gt;**, with approved monitored Reply-To **contact@revitalizedacademy.com**. This uses the owner's preference for the existing Academy Resend identity; it requires no new email service or DNS. `contact@revitalizedacademy.com` as the From itself is not proven verified by the auth-subdomain result.

An authorized operator must securely install/confirm the existing appropriate Resend sending credential (or an account-approved restricted credential), `RVA_HHL_EMAIL_FROM`, `RVA_HHL_EMAIL_REPLY_TO`, `RVA_HHL_RESEND_API_KEY` and the existing signed-feedback configuration `RVA_HHL_RESEND_WEBHOOK_SECRET`. Validate actual sender/domain restrictions and event-message feedback mapping. Never echo values, use generic configuration tools that reveal secret values, or request them in chat. Reuse the established email infrastructure.

Templates already include the selected session's full Eastern date/time and private manual invitation. Registration confirmation is distinct from inbox delivery; a provider acceptance response is distinct from delivered status and recipient receipt. Reminders use the same approved sender and selected session, remain operational event notices, and require their own controlled acceptance before general activation. Optional marketing stays separately unchecked; the synthetic case fixes it off.

## Controlled hosted acceptance — prepared, not authorized or executed

The owner nominated **dave@theboss.biz** as the controlled inbox. This designation does not authorize a send. The read-only CRM preflight found zero matching CRM/non-CRM contacts; recheck before the test and stop if an existing identity or relationship now exists. Never merge, downgrade or impersonate an existing person for QA.

[Prepared packet](health-hope-live-launch-preparation-2026-10-20/acceptance-case.template.json) pins request `5577813d-27f3-4a70-adae-c85a44dfc2b2`, synthetic name HHL Acceptance Test, marketing off, one delivered confirmation maximum. Session/operator/revision/window remain null deliberately. The anticipated October 22 Thursday is a planning value, not advertised availability; use the actual reviewed session when the test is authorized.

1. **Held installation:** under separate authority, reconcile current primary publication/ledger and install only the four hash-pinned event migrations in order. Publish the reconciled HHL API, worker, independent retention Function and staff assets while preserving every existing Function archive/config/schedule and protected primary asset. Keep public page mode held, `RVA_HHL_REGISTRATION_ENABLED=false`, Zoom integration off and normal delivery off. Verify fail-closed behavior and rollback controls before proceeding.
2. **Readiness:** complete the Zoom review/full invitation, secure sender configuration and actual external-provider retention/deletion evidence. Enable independent retention maintenance, verify its fresh heartbeat and configure the existing provider readiness controls. Do not manufacture cleanup attestations.
3. **Pin one case:** an existing authorized active/onboarded Owner/Admin with CRM management and All People scope signs in normally. Review/publish one correct future manual Thursday session with the verified invitation; capture its actual ID/revision. Select a maximum thirty-minute window. Populate private `acceptance_case` with exactly seven keys: `email`, `session_id`, `request_id`, `operator_id`, `revision`, `starts_at`, `expires_at`. Do not copy the entire packet. Configure identical `RVA_HHL_ACCEPTANCE_EMAIL`, `_SESSION_ID`, `_REQUEST_ID`, `_OPERATOR_ID`, `_SESSION_REVISION`, `_STARTS_AT`, `_EXPIRES_AT`, plus `_ENABLED=true` and independent `RVA_HHL_DELIVERY_MODE=acceptance`. Use matching ISO strings and numeric revision. Keep the public registration flag false; the existing DB registration/notification readiness controls can be enabled only inside this protected case. Enable the worker/notification server flags only for this bounded acceptance mode.
4. **Submit once:** the pinned operator's private controlled form submits through the same `/api/health-hope-live/register` handler. Required event confirmation consent must be affirmatively checked; marketing remains false. Capture private case/contact/session/registration/job audit IDs, with no tokens or health data. Verify exactly one Registered Guest master contact and one correct Thursday registration, no Auth/profile/enrollment/assessment/client access and no relationship promotion. A same-UUID retry must deduplicate without another confirmation.
5. **Delivery/joining acceptance:** verify exactly one confirmation job for the nominated recipient, provider acceptance, signed delivered feedback and recipient receipt. Check From, Reply-To, selected Thursday/Eastern timezone and complete usable invitation. A host-assisted technical joining test uses the existing meeting without altering settings. Verify no other recipient, reminder, marketing or Zoom API operation occurred. Keep automated attendance described as disabled/manual.
6. **Close and clean up:** turn off test delivery/worker and notifications before clearing case configuration; preserve the acceptance delivery latch until all pending/in-flight case work is safely drained. Cancel test-only pending reminders/jobs and verify no delayed delivery can occur. Retain independent privacy maintenance, public hold and Zoom hold. Use the existing identity-verified event deletion workflow after capturing restricted QA evidence and satisfying any genuine provider-cleanup requirement. The normal deletion preserves the master contact. Removing that synthetic contact would need explicit cleanup approval plus proof it was newly created by this exact case, still Registered Guest/HHL source, and has no unrelated references/independent purpose; otherwise retain it flagged for QA review. Never broadly delete contacts.
7. **Final decision:** present hosted transaction, delivery, invitation, consent, retention, negative/public-hold and primary-preservation evidence. Public registration activation is a separate approval after all essential gates pass. The confirmation-only QA case does not prove general reminder delivery; validate reminder eligibility/rendering/timezone and any requested delivery acceptance without adding recipients or messages beyond its authority.

### Rollback

Keep the current locked published artifact and exact Function/config snapshots. If installation or acceptance fails, hold public registration and providers, stop test delivery, preserve independent privacy maintenance, invalidate the acceptance window and drain pending case work. Roll back only the reviewed HHL source/flags to its held compatible release. Do not remove forward privacy protections, restore erased identifiers, roll back shared primary data or replay the B6 migration. The nullable case column can remain dormant. Capture the failed gate without claiming operational registration.

## TESTED / SECURITY

- **8** new API/worker acceptance cases, plus **13** existing scope/reconciliation guards: **21 pass**. Public hold/auth/operator pins, case bounds/expiry, recipient/session/revision/type restrictions, delivery latch, no Zoom execution and primary preservation covered.
- **13** new PostgreSQL 17 cases: **pass**, synthetic disposable database only. Manual authorization/scope/evidence/time/idempotency/run UUIDs; export/deletion/expiry and CRM boundaries; controlled registration/claims, actor revocation, metadata validation and existing Auth identity protection. All branch migrations restored locally in order.
- All **319** pre-existing shared application function definitions and existing table RLS/policies/ACLs/function owners/global roles preserved. Local security advisors retain **25** baseline findings plus **11** expected private deny-direct INFO; **zero new warning/error or unexpected findings**. The disposable database was removed.
- **40** targeted private UI checks at desktop 1440 and mobile 390: **pass**, including unchecked consent/evidence prevention, explicit manual provenance, read-only restrictions and delayed-reply/logout clearing. No provider calls, hosted writes or browser errors.
- Production static build: **448 files, pass**. Existing approved feature/retention/weekly-rollover suites from acknowledged `f6db6b6` were not repeated; this package tests the changed behavior and preservation boundaries.
- [Machine-readable evidence](health-hope-live-launch-preparation-2026-10-20/validation.json), [migration hashes](health-hope-live-launch-preparation-2026-10-20/migrations.json). New popup presentation review is documented separately below; all protected assessment code remains unchanged apart from the marketing-only preview label capitalization.

## UNRESOLVED / NEXT RECOMMENDED BUILD

Justyn: secure read-only meeting/security/full invitation review and availability for one authorized guest joining check. Owner/operator: secure existing Resend setup, actual provider retention evidence and separate held-installation/one-message test authorization. Codex can execute that exact approved acceptance package and verify the resulting evidence; neither public activation nor a live email test has already been authorized.

**Exact next approval:** authorize installation of the four manifest-pinned HHL migrations and reconciled held HHL server/staff/retention package, secure reuse of existing Resend configuration, one synthetic confirmation only to dave@theboss.biz, one host-assisted technical joining test without meeting-setting changes, and scoped event QA cleanup as described above. Keep public registration and automated Zoom off. Do not include synthetic master-contact deletion unless explicitly desired and its preconditions pass. After successful acceptance, request a separate final public activation approval.

**Ready for final public activation approval now: no. Ready for the controlled held installation/acceptance approval after Justyn's essential verification: yes.**

## CHAT HANDOFF

Health & Hope Live remains on isolated `codex/health-hope-live`, with no production writes/sends. The existing guest/retention architecture is preserved. Added verified manual attendance, explicit manual history and a disabled, operator-bound, one-inbox confirmation acceptance case, so automated Zoom reporting is optional at launch. New tests/security preservation pass. Existing Resend auth domain is verified; real sender/delivery and Justyn's complete Zoom invitation/security still need hosted evidence. dave@theboss.biz is nominated only, not permission to send. The next release package must separately authorize four exact event migrations, held HHL installation, one confirmation and host-assisted joining acceptance; public activation follows only after those gates pass.

## WORK TASK NEEDED

RECOMMENDED THINKING LEVEL: MEDIUM

Copy-ready operator assignment:

> In Justyn Oliver's authenticated Zoom account, perform a read-only review of meeting 825 1611 2925, ReVitalized Health & Hope Livestream. Record intended host/Elle's existing hosting and admission rights, license/plan and duration capability, complete attendee invitation and passcode requirement, Waiting Room, external-guest authentication restrictions, early joining and account/group locks. Do not change meeting settings or create apps. Keep invitation credentials and account secrets in approved protected configuration, never ChatGPT or public source. Report any discrepancy with the supplied recurring meet-anytime link and Thursday 6:30 PM America/New_York/30-minute public schedule. Record reporting capabilities as optional information; API automation is not a launch gate when verified manual attendance is installed. Do not join the meeting, install production migrations, activate registration or send an email during this read-only review. Return a concise factual security/joining readiness record and the exact remaining owner action. The separately prepared hosted test nominates dave@theboss.biz but requires its own explicit installation, one-message and host-assisted joining approval.
