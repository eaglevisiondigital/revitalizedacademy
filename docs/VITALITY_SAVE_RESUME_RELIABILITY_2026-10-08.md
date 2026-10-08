# Production Vitality save/resume reliability repair — 2026-10-08

Status: **VITALITY SAVE/RESUME FLOW BLOCKED — release approval and fresh hosted iPhone acceptance pending.** Local repair and verification are complete. No hosted mutations, participant emails, GitHub push, migration, Edge deployment, or Netlify deployment were performed during this investigation/build.

## Baseline and boundaries

- Isolated branch: `codex/vitality-resume-reliability`, checkout `revitalizedacademy-vitality-reliability`.
- Deployed production source/base: `862f4b6e2edb9b6af5332a389c0081fefec6adae`.
- Production Netlify site: `ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06`; current ready deploy remains `6ac6b471ac8ed68bec8bd8d6`.
- Production Supabase: `voalfpxiyznnqfcqcymd`; current `vitality-resume` Edge version 2.
- Beta Supabase `bvooallokgfktssadsrv`, beta mail configuration, content sync, payments, Auth, staff permissions, and the separate unapproved client-lifecycle/contract package remain untouched.
- The already-applied RepDB DELETE guard source `20261007220506_repdb_delete_guard_return_contract.sql` is preserved in this checkout for local restored-schema parity. Its production ledger is already `20261007221345`. It is **not a new release migration** and must not be reapplied. Do not run an unfiltered `db push` against production.

## Minimal real production trace

Read-only investigation used Netlify Forms via its supported CLI API, the connected Resend message list, Supabase database metadata, and unified Edge log metadata. No health answers, raw tokens, credential hashes, complete provider messages, names, email addresses, IPs, or raw form payloads are included in this report. No participant record was edited.

The correlated window is October 8, 17:59–18:12 UTC (12:59–13:12 Central). A single normalized participant email group has five Netlify `vitality-lead` submissions:

| UTC | Interpretation |
| --- | --- |
| 17:59:42.399 | First initial Contact submission |
| 17:59:51.704 | Repeated Contact submission |
| 17:59:55.078 | Repeated Contact submission |
| 18:00:35.659 | Repeated Contact submission |
| 18:05:22.145 | Repeated Contact submission |

An enabled `submission_created` email hook exists. These five submissions explain five staff-notification opportunities and corroborate the user's approximately five received notifications. Netlify's submission/hook APIs do not prove the final delivery of each individual staff email.

The matching iPhone Edge metadata contains five Contact-sized POSTs, five recovery-sized POSTs, and three credential-exchange-sized POSTs. Two exchanges returned 401 at 18:06:18.871 and 18:11:12.870; one returned 200 at 18:11:36.681. Large successful save requests follow. **Action classification is inferred from the deployed request shapes, packet sizes, and correlated timestamps; the prior handler did not log individual actions or request bodies.**

Three participant continuation emails were issued, with provider timestamps 17:59:45.018, 18:05:23.677 and 18:06:45.162 UTC. All three have provider status `delivered`; no bounce/deferred state appears in the returned message list. Provider delivery does not establish when the inbox displayed the email or when the participant received/read it. The rate bucket records three allowed sends; later neutral recovery responses are consistent with the existing three-per-hour throttle.

Authoritative state: **one contact, one Vitality workflow, one private draft, and one durable `vitality_started` Journey event**. The draft remains unfinished; verification succeeded at 18:11:36.636 UTC. Last observed revision was 531 with a live session and no remaining email credential. No snapshot was read to obtain this metadata. The participant may continue editing independently; these are observations, not a freeze on their activity.

## Root causes and limits of attribution

1. The browser posted every initial attempt directly to Netlify before requesting the secure email. Database contact/workflow deduplication and email throttling therefore did not deduplicate Netlify staff notifications. The submit handler lacked an independent pending guard and re-enabled the same button after success.
2. Success was a small status below the Contact area. The Contact form and entry choices remained available, encouraging repeated starts instead of waiting for mail.
3. Each allowed start/recovery replaced the current email credential. A delayed older email therefore became unusable after a later email request. Several subsequent requests were throttled without explaining the wait in the visible action area.
4. A transport timeout previously called `cancel_mail`, which could invalidate an email already accepted by the provider. The old Edge handler did not record provider IDs or acceptance outcomes. This is a reproduced failure mode, **not proven as the cause of these specific production messages**.
5. **WebKit reproduced a real navigation defect:** opening a newer email into an existing assessment tab can be same-document fragment navigation. The original bootstrap ran only at document load, so it did not exchange that newly arrived credential. A second email verification round-trip is not required by the security architecture.
6. Early history stripping kept the emailed credential only in a window variable until scripts loaded. Reloading during that interval lost it. The repair preserves only the opaque pending credential in session storage, then removes it after exchange/denial. No answer or identity snapshot is stored there.

The exact rejected historical token cannot be identified as consumed versus superseded versus malformed from the old logs without retrieving credentials. None were retrieved. Thirty-day expiry is not consistent with this minutes-long new-draft sequence. The concrete rotation and same-document failure paths are separately reproduced and repaired.

## Changes

- Contact: synchronous pending/accepted guard; “Saving your assessment…”; replace the form with focused/scrolled **Check Your Email**, masked recipient, no-restart advice, latest-email advice, and a 60-second resend cooldown. Recovery stays non-enumerating, including definitive provider failure, unknown address and throttle outcomes.
- Initial capture: the secured Edge/RPC remains the immediate system of record; the browser no longer separately POSTs the lead in the current protocol. A durable new-draft start claim authorizes at most one server Netlify lead POST. Explicit recovery never issues another staff start notification.
- Rollout compatibility: `intake_version=2` marks the current browser's server-owned lead capture. Old browsers retain ownership of their existing direct Netlify submission, avoiding a second server lead POST during a staggered rollout. They must reload to obtain the new UI/pending guard; save/read/completion sessions continue to work.
- Database: private delivery-attempt journal; unique start claim per draft; request-key replay suppression; exact normalized-email advisory serialization; unchanged one-minute/three-per-hour mail limit. The journal stores digests, provider references and result states, not raw credentials or mail bodies.
- Mail: stable environment/project/attempt idempotency key; up to three bounded identical-byte attempts for transient failures; provider ID and HTTP outcome captured; definite rejection preserves a previously accepted link; uncertain transport preserves the possibly delivered credential. No durable plaintext email queue or new provider configuration is introduced.
- Exchange: pending newest credential can be redeemed while its send response is delayed. A later acknowledgement cannot resurrect a consumed credential. Superseded/consumed links deny safely with newest-email guidance.
- Safari: same-document `#resume=` navigation triggers a fresh page load through the existing exchange path, preventing old form state from being merged into a different draft. Early history stripping and interrupted-startup recovery are covered. Malformed links do not fall back to displaying a prior private session.
- Public assets: `js/vitality55.js?v=reliability-1`, `js/vitality-resume.js?v=3`, `css/vitality55.css?v=89`. Only `consult.html` and those three files differ among 382 public source files; the other 378 remain byte-identical to the deployed base.

New unapplied forward migration: **`20261008192530_vitality_start_delivery_reliability.sql`**.

Changed Edge: `vitality-resume/handler.ts`, `index.ts`, new `mail.ts`. Preserve existing service secrets and `verify_jwt=false`; no other Edge function needs deployment.

Netlify does not provide a form-submission idempotency key. Its lead mirror uses an **at-most-one dispatch claim**, with uncertain/failed outcome retained for operator review; it is never blindly retried after a timeout. This prevents uncontrolled duplicate staff notifications but cannot guarantee external delivery when a process dies or a network response is uncertain. The contact/draft remain saved independently, and explicit participant recovery remains available. Provider API acceptance is kept distinct from inbox receipt; there is no invented delivery proof or new webhook pipeline.

## Tested

| Coverage | Result |
| --- | --- |
| Production build | 383 files |
| Exact public-build JavaScript syntax | 70 passed |
| Existing production content/FDC/RepDB/sync/Vitality Review frontend regressions | 55 passed |
| Maintained secure-resume DOM regressions | 34 passed |
| Approved adult/child/proxy questionnaire and completion regressions | 20 passed |
| Full restored production PostgreSQL 17 regressions | 96 passed |
| PostgreSQL concurrency | 1 race group passed, 8 independent sessions overlapping behind server barrier |
| Supabase Edge regressions | 24 passed |
| Changed Edge bundle type check | passed, existing pinned SDK |
| Exact-built WebKit 26 | 75 checks at 1440×1000, 768×1024, 390×844; iPhone emulation |
| Public isolation | no service secrets, beta refs/URLs, synthetic fixture identities, private journal or dataset in artifact |

Five rapid initial submit events result in one browser start request and zero browser Netlify posts. Database replay across throttle windows and eight-worker overlap result in one contact/workflow/draft/event, one mail reservation and one staff dispatch reservation. Provider tests cover identical-key retry, definitive rejection, uncertain timeout, delayed acknowledgement and no token/body leakage. Database tests preserve completion locking, stale revision rejection, cross-draft denial, existing legacy drafts, expiry and thirty-day saves. The read/save/finalization SQL body remains byte-identical to the existing accepted implementation.

WebKit covers older Safari without crypto.randomUUID, delayed start, cooldown/resend, superseded-link denial, newest-link direct restoration of actual synthetic answers, no automatic second email, same-tab Mail-style navigation, refresh, back/forward, another-tab return, reload between early stripping and module execution, malformed-link isolation, no console/runtime issues and no horizontal overflow. Screenshots were inspected. Physical iPhone Mail app and actual external inbox receipt remain **hosted acceptance gates**, not claimed by local emulation.

## Release gate and next action

Exact immutable source SHA is returned in the completion report after the local commit. No new production deploy or migration ledger exists yet.

Required approval must cover only this branch/source, the single new production migration, `vitality-resume` Edge update, and the production assessment frontend. Do not promote the parked client-lifecycle package. Apply the new migration first, update the one Edge function, then publish the exact production build. Never replay secure-resume, referral, RepDB or other already-applied migrations.

Copyable approval template (replace SHA with the completion report's exact SHA):

> I approve pushing the exact Vitality reliability candidate at **SHA**, applying only `20261008192530_vitality_start_delivery_reliability.sql` to production Supabase `voalfpxiyznnqfcqcymd`, updating only `vitality-resume`, and deploying the matching production build to Netlify site `ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06`. Preserve all real participant data, credentials and in-progress sessions. Do not replay other migrations or release unrelated work. After release, use the existing approved `rva-assessment@eaglevision.biz` synthetic assessment for controlled resume/replay acceptance; confirm actual external receipt and have me open the latest link normally on iPhone. Do not create a duplicate assessment or complete a real participant assessment.

After release: verify live asset hashes; the production ledger/Edge version; existing-draft Start replay produces no new staff notification; explicit recovery produces one bounded provider send; actual external receipt; newest link directly restores the existing draft/answers on iPhone; refresh and Mail return preserve the session. A new-draft hosted staff-notification smoke requires a separately confirmed disposable receiving identity if no unused approved one is available. Do not silently repurpose a real participant.

Only after that hosted acceptance may the status become **VITALITY SAVE/RESUME FLOW ACCEPTED**.

## Documentation references

- [Resend idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys): identical requests use one key, retained for 24 hours; retries here occur within one bounded invocation, while the database start claim persists independently.
- [PostgreSQL 17 explicit/advisory locking](https://www.postgresql.org/docs/17/explicit-locking.html): transaction-scoped serialization and server-barrier test model.
- Existing original secure-resume/referral migrations and current `tests/vitality-resume.cjs`, `tests/backend/vitality-resume.test.cjs`, `tests/edge/vitality_resume_test.ts` remain the underlying contract.
