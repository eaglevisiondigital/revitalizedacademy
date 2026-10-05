# Hosted Vitality acceptance checkpoint — 2026-10-05

This is an incomplete hosted acceptance receipt, not a readiness declaration. Latest user authority explicitly approves the exact dedicated inbox and staging-only lifecycle. Existing local suites are retained without broad rerun because no application source changed.

## Unchanged release

- Source: `e51b04545c5eba5f33d7b3a3aafca3b2cca854a8`.
- Staging Netlify: site `071b252e-a922-4846-a784-8dca1edad377`, deploy `6ac38599ba35bc77a266d41c`.
- Staging Supabase: `bvooallokgfktssadsrv`.
- Migration `20261005110245_vitality_assessment_secure_resume` was already applied; no replay.
- Initial Edge `vitality-resume` release was v1. Current read-only metadata reports v3; its bundle SHA-256 `62730d1ed9ae75f251ef1e38a61f199d4e191dc7b1189d732f766fd9cdd75ae3` matches the original v1 receipt. No Edge code redeployment occurred in this investigation.
- No production mutation. Current read-only release comparison is in `deployment-evidence/2026-10-05-vitality-hosted/release-receipt.json`.

## Exact approved recipient change

Added only `dave+rva-assessment@eaglevision.biz` to `RVA_SYNTHETIC_EMAIL_ALLOWLIST` through the authenticated staging dashboard. Saved 2026-10-05 11:17:59 UTC. Preserved `dave@theboss.biz`, `dave@eaglevision.biz`, `dave+rva-client-a@eaglevision.biz`, `dave+rva-client-b@eaglevision.biz`, `dave+rva-beta-staff@eaglevision.biz`; no domain wildcard. Final six-address SHA-256: `82e27fce504a8a5ca56c78283825cf3b6b036b881a8bc21b62b95d46aa2a498e`. No SMTP/provider, role, permission or feature-flag change.

Latest authority supersedes that testing identity: the plus-address was never confirmed as a receiving mailbox and must not be used. The user configured real alias `rva-assessment@eaglevision.biz` to forward to `dave@eaglevision.biz`. Added only that exact alias to the staging secret, preserving the six prior recipients and adding no wildcard. Dashboard-confirmed digest: `58168025c8e9fca07db5d30970c7eb1713daed8fe98d560f443f87db0256dcd3`, updated 2026-10-05 11:59:53 UTC. Supabase states updated Edge secrets are read immediately; no Edge redeploy occurred.

## Real-alias delivery checkpoint

Normal hosted Save & Continue used Synthetic / Vitality Alias, `rva-assessment@eaglevision.biz` and synthetic phone `0000000000`. Pre-start counts were zero contact/draft/workflow. The result is one each:

| Evidence | Result |
|---|---|
| Netlify lead | `6ac395a92a1105478a7ad04c`, captured 2026-10-05T12:18:49.605Z |
| Contact | `667aec53-0fe2-453b-b47a-8b3012777411` |
| Draft | `1d66c0f6-c6ad-4cd6-ab8f-5fc778e87ce2` |
| Workflow | `7d17430a-1e9e-4ba7-aacd-570d48cdf66d` |
| Journey | `409cdfcb-9aae-462b-9d49-abb3ac2ba2b4` |
| Draft state | Draft, revision 0, section 0, percent 0, unverified, no session, pending mail digest |
| Provider receipt | Resend `01a10c00-a40f-79b1-bc16-d6b2bcbe84f5`, sent 2026-10-05T12:18:51.165Z, status delivered |
| Actual external receipt | User confirmed received at `dave@eaglevision.biz` through the configured forwarding alias |
| Available business webmail | Confirmed `dave@theboss.biz`, not the forwarded destination; exact subject absent from Inbox and Spam |
| Local Mail app | Only a Google mailbox is configured and it has no matching message |

Provider “delivered” was not counted as receipt; the user's independent inbox confirmation establishes actual arrival. The user opened Continue normally. The resulting hosted page has no URL fragment, displays the Introduction at 0% with Saved state, and has zero console warnings/errors. Database state confirms the same draft is verified with an opaque session digest and no pending mail digest; exact contact/draft/workflow counts remain one. No provider email body or raw resume token was retrieved. No answer was entered and no final submission occurred. The earlier plus-address synthetic draft remains untouched as historical evidence and is excluded from continuation.

## Unavailable-link investigation

The user's unavailable-link screenshot is a real hosted failure of that page opening; it is not dismissed or converted into a completed lifecycle pass. It is reconciled with the separate successful first opening rather than overwriting either observation. Investigation uses only the same synthetic draft and narrowly bounded function logs, without retrieving any email body, raw mail/session token, request body, IP address or browser storage credential.

| Evidence | Finding |
|---|---|
| Function POST at 2026-10-05 12:27:59 UTC | HTTP 200; database verification timestamp is 12:27:59.548111 UTC |
| Function POST at 2026-10-05 12:32:34 UTC | HTTP 401; second tab shows the exact reported unavailable-link error and Contact step |
| Same draft | `1d66c0f6-c6ad-4cd6-ab8f-5fc778e87ce2`, status draft, revision 0; original contact/workflow/journey IDs retained |
| Mail lifecycle | Recovery digest and expiry are NULL after successful one-time exchange |
| Session lifecycle | Session digest present, verified, expires 2026-11-04 12:27:59.548111 UTC |
| Original browser tab | Normal reload finishes with Contact Saved / Introduction / 0% / Saved; no answer entry, recovery or final submission |
| Logs retained | Only function path, HTTP method/status, response timestamp and version; window 12:27:45–12:35:00 UTC |
| Current Edge metadata | ACTIVE v3; bundle hash identical to the original v1 release receipt |

**Diagnosis:** the original email credential was successfully consumed before the later rejection. Reopening that single-use credential is the evidence-backed explanation for the second-tab error. Expiration or replacement does not explain the original first-open result; forwarding did not prevent that successful exchange. The existing session remains functional, demonstrated by a fresh server-backed reload rather than stale visible DOM. Minimal logs do not record the POST action/body, so they do not independently prove the identity or bytes of the rejected credential; we deliberately did not retrieve it to compare. No implementation repair is needed for the demonstrated consumed-link sequence. The generic rejection message remains unchanged and does not disclose credential state to an unauthenticated caller.

**Changed and tested:** only maintained tests and documentation. The browser fixture now enforces one-time mail redemption. Added browser/runtime replay coverage, native database replay/state-preservation coverage and Edge generic-denial/no-resend coverage. All focused suites pass: runtime **21/21**, native PostgreSQL **17.11, 20/20**, Edge **18/18**, total **59/59**. Native tests use a newly created loopback-only cluster and disposable database, then remove both; no hosted migrations or test records. Earlier broad release totals remain historical and were not rerun or incremented without evidence.

**Security and preservation:** no new contact, draft, workflow, email or hosted health data; no token exposure; no credential reset/bypass; no role, permission, flag, schema, SMTP, payment or production mutation. No Netlify or Edge redeployment. The existing opaque session and single-use mail rule are preserved.

**Exact next user action:** return to the already-open Chrome assessment tab showing **✓ Contact Saved**, **Introduction**, **0%** and **Saved**, with **Who is this assessment for?** visible, and reply that this screen is visible. Do not click the email Continue button again, submit the Contact step again or request another link yet. Keep this tab open. If it is no longer available, report that before any separately authorized recovery; no duplicate identity is needed.

**Follow-up tab location:** after the user reported finding only the failed tab, fresh Chrome inventory confirmed both existing assessment tabs. Native tab selection brought the verified one into the selected Chrome tab, and accessibility confirmed Contact Saved / Introduction 0% / Saved. Read-only hosted state remains the same verified revision-0 draft with valid session and no pending mail. No resend or duplicate start occurred. The immediate next action is to switch to Chrome and confirm the selected assessment screen is visible. If its session is actually lost later, use the normal Returning to an unfinished assessment recovery form with exact `rva-assessment@eaglevision.biz`, not Contact Save & Continue. Recovery requests a new mail credential for the existing unfinished draft; opening the fresh link rotates the session, preserving contact/draft/workflow IDs, answers and prior dated evidence. Current recovery remains unexecuted.

**Latest approved recovery — supersedes those earlier next-action instructions:** user explicitly treats the earlier session as unavailable and requests one fresh recovery email. Fresh Chrome inventory now contains only the user's failed Contact tab. Opened Returning to an unfinished assessment and submitted its email-only recovery form with `rva-assessment@eaglevision.biz` once. Did not submit Contact or start another identity. UI shows Link request received and the neutral check-inbox notice. Resend message `01a10c3d-c8e4-7c75-a197-2b0603b06ca3` reports delivered, sent **2026-10-05 13:25:38.357 UTC / 08:25 Central**. Actual forwarding-destination receipt is not inferred from provider status; user must identify/open the new message normally.

Pre/post checks keep the same contact, draft, workflow and journey IDs above and contact/draft/workflow counts **1/1/1**. Draft remains revision 0, status draft, verified_at 12:27:59.548111 UTC; prior session digest present. New pending recovery digest exists, expiry **2026-11-04 13:25:38.095452 UTC**. The recovery request updates expected recovery/rate-limit state, not health answers or identity records. No raw credential, sent-email body or provider request payload retrieved. No application/backend/permission/flag/mail configuration/migration/Edge/Netlify/production change. No fresh token redemption or later acceptance performed. Earlier evidence files remain intact.

**Current exact next user action:** check `dave@eaglevision.biz` for the newest Continue Your Vitality Assessment message, sent **08:25 Central**, through `rva-assessment@eaglevision.biz`. Open that new email and click Continue **once** normally. Keep the resulting browser tab open and report its visible screen. Do not use the older 07:18 message or resubmit Contact. Stop here pending that user action. VITALITY RESUME NOT READY / BETA NOT READY. [Token-free receipt](../deployment-evidence/2026-10-05-vitality-hosted/fresh-recovery-receipt.json).

**Unresolved / next acceptance:** actual answer saving and restoration, fresh recovery email/open, stale-session denial, completion/final correlation and responsive lifecycle coverage remain pending. No readiness green flag follows from this investigation.

**Primary Chat handoff:** Hosted link error investigated against the existing real-alias draft. First exchange succeeded at 12:27:59 UTC and consumed the mail credential; a later POST returned 401 at 12:32:34. Original session reload restores Introduction/Saved. Evidence supports consumed-link replay; raw rejected credential deliberately not retrieved. Added three maintained regression cases, 59 focused checks passing. No application repair, resend, new identity, hosted write, migration or deployment; production untouched. Continue from the existing verified browser tab, then complete the still-pending hosted lifecycle gates. VITALITY RESUME NOT READY / BETA NOT READY.

## Historical plus-address start and mail

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

Initial real-alias receipt, first verification and original-session reload are confirmed. After the user identifies the preserved verified tab, remaining acceptance is synthetic radio/checkbox/select/textarea/range/conditional/symptom controls → Saving/Saved acknowledgment and server revision → Continue Later → fully leave → fresh actual emailed resumption and server-backed restoration → further answers and fresh recovery → stale-session denial → normal full completion → reconcile exact Netlify `assessment_resume_id` with the draft → one Journey completion → completed lock → all required hosted responsive states and clean console. The current investigation sends no recovery email.

Do not resend automatically or manually force completion. If final transport is ambiguous, preserve `submitting` / `delivery_uncertain` and inspect the correlation against captured Netlify data before any separately reviewed procedure.

No new feature package is started. Separate Client A/B/scoped staff/meal/workout beta acceptance remains incomplete.

VITALITY RESUME NOT READY

BETA NOT READY
