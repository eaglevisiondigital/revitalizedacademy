# B4.2 founder identity verification — candidate, not deployed

Implements [Issue #32](https://github.com/eaglevisiondigital/revitalizedacademy/issues/32). No real participant names, assessment dates, identifiers, source pins, answers or snapshots were retrieved for implementation or put into this packet. Test values and preview metadata are wholly fictional. Actual alternative-candidate eligibility must be established by designated founders in the protected production interface after a separately authorized technical release; no new real-person eligibility count is claimed here.

## Production reconciliation

Base: exact accepted B4.1 `0ae7726e8e60718af0ab8f674c058e6c50227d01`; production deploy `6ad2320001df1be7217aca20`. Current main remains pre-B4 `79debed92925b920f9052d9c522a796bbf929223`, including the merged PR #29 NDA fix. This branch is stacked on PR #31, not a replacement of live production with stale main. Do not merge B1/B2/B3 or stale stacked branches wholesale.

All seven existing Function entrypoints/libraries, B4.1 founder script, portal core, staff NDA module, assessment/resume, content, pricing/payment and synchronization source remain byte-identical. New transport is an eighth additive Function, `roadmap-verification`; no existing Function is rebuilt or removed by this candidate's release plan. One existing assessment script receives only a same-session event bridge into its existing authorized historical-review drawer, with cache v102. Public build retains every existing asset, changes only portal HTML and that bridge script, and adds verification JS/CSS v100. Build output: 431 files (429 previously).

## User workflow

People → Vitality Roadmaps → **Founder Pilot Verification**. Server authorization determines entry visibility. Only the two actual pinned founder Auth identities can use it; ordinary Owners (including the operator account), Admins, Coaches, members, anonymous callers, replaced identities and invalid/revoked sessions are denied.

Search requires an exact full name or exact email; no first-name-only, wildcard or bulk listing. Optional UTC completion-date filter narrows the same exact identity search. Dates from the detailed secure source and linked workflow are handled without inventing a completion time; the UI displays UTC date alongside local time. Date alone cannot select anyone.

Cards show only relevant metadata: full contact name, masked email/phone, completion date, separate contact/report distinction, source class and duplicate/similarly named staff warnings. No card is automatically selected. A short-lived actor/session-bound opaque handle maps to contact/report/workflow/source pins privately. No source UUIDs/pins/answers render in the screen, audit UI, URLs or downloads. The existing authorized Contact drawer can show the full second identifier if needed; the bridge resolves contact ID only inside the authenticated response, never a URL or visible label.

Confirm only after checking full identity, independent second identifier and assessment date. The server and UI refuse confirmation when the stored full name, usable independent email/phone or completion date is missing; clarification remains available. Alternatives are **Not the intended record** and **Needs clarification**. Non-identifying reasons are fixed choices, not free text into which someone could paste health information. Acknowledgment is explicit for the versioned SOP: internal quality testing, Justyn/Elle only, no AI exports/screenshots/downloads, no scores or email, original answers read-only, separate enrollment authorization, manual 14-day maximum.

Confirmation requires named founder revocation owner/backup and a proposed UTC start/deadline within 14 days. The status panel tracks that plan and warns that a privileged operator appointment is still required. There is **no automatic cohort expiry or reminder**. It does not activate access. Historical-only identities may be confirmed as identities while remaining ineligible; no secure snapshot is fabricated. Use their existing historical-review drawer for retained information only.

Status distinguishes pending, ambiguous, confirmed, not-intended, needs-clarification, historical/ineligible, changed-source and expired-plan conditions. It shows generic revision and founder actor names, not raw audit IDs. Source/contact changes require a fresh exact verification.

## SQL and security boundary

Single unapplied production-only migration:
`supabase/environment-migrations/production/20261016195245_vitality_roadmap_b42_identity_verification.sql`.

Installation requires deployed B4 and exactly two unique authoritative founder identities. Their actual UUIDs are selected privately into immutable `roadmap_b42_founders`, rather than shipping production UUID literals. A replacement Auth account with the same email is not accepted automatically.

Four private RLS-enabled, append-only tables: founders, issued metadata requests, SOP attestations and identity verifications. No direct browser/service-role table or helper grants; update/delete/truncate denied. Verification stores actor/current session/UTC time, exact source anchors, internal source and metadata fingerprints, reason/decision/revision and separate SOP attestation reference. No answer snapshot, contact display-name/email copy or free-form PHI justification is stored in these tables.

`public.roadmap_b42(text,jsonb)` is the only authenticated RPC. Every action rechecks the current production session/issuer, authoritative verified founder identity, Owner active/onboarding complete/All People, health-private/CRM and contact scope. Authorize/search/status/check/contact/attest are the only actions. No enrollment, Roadmap draft/correction save, scoring, approval, release, provider or email path exists.

A private descriptor computes metadata/pins in place. The authenticated metadata wrapper and separate operator preflight guard it independently; no direct descriptor execution grant exists. Public metadata uses an explicit allowlist. Response errors never echo exception details, source IDs/pins, search text or answers. Same-origin transport forwards only the caller's JWT and the existing public publishable key to one fixed RPC; no service-role key/new secret, CORS, arbitrary query URL, AI, cache or request-body logging.

Issued requests expire after 15 minutes and bind actor/session. Append decisions require a current unchanged descriptor, all SOP acknowledgments, valid reason, expected revision and actor/session/content-bound request key. Competing updates serialize under report advisory locks. Identical retry has one canonical verification and one SOP attestation; changed replay/stale identity/source/revision fails closed. This request TTL is **not cohort auto-expiry**.

The portal cancels/aborts pending work, discards metadata on close/logout/pagehide, rejects stale completions, reauthorizes on foreground and every 15 seconds while open, and initializes cleanly for a new identity. The bootstrap checks session epoch again after asynchronous getSession and before fetch. No storage, analytics, source logging, screenshots or downloads are performed by application code. Print hides the private verification screen. Manual screen capture/copy cannot be prevented by the web app; the SOP expressly forbids it for real records.

## Independent operator gate

A founder click records signoff only. `private.roadmap_b42_operator_plan(uuid)` is operator-only and read-only: validates the latest confirmed eligible decision, unchanged exact source/identity pins, original/current founder authority, live approval session, contact scope, owner/backup and current UTC SOP window. It returns exact anchors and approval reference only within the protected production operator workflow. It never calls the cohort setter.

`design/sql/roadmap_b42_cohort_REVIEW_ONLY.sql` is excluded from builds/migrations and ends with ROLLBACK. It requires separately bound exact private verification IDs, a real release authorization and tracked revocation appointment; validates every selection before writes, limits the initial cohort to 1–2 explicitly reviewed eligible sources, calls only the existing operator setter with drafts false, and checks aggregate postconditions. Execute nothing until the exact count/records/SOP/operator timing are separately approved. No substitutions. A larger future initial count needs explicit review.

At or before the agreed deadline, the named owner and backup ensure the operator appends targeted inactive/drafts-false events using existing enrollment pins. Preserve all original sources, verifications, SOP and B4 audit history. Founder panels clear on next server/foreground/approximately 15-second check (background throttling is possible); confirm repeat reads/refresh denied and zero active pilot. No immutable evidence deletion or silent extension. If no accountable operator/revocation appointment exists, do not enroll.

## Safe preview and validation

`node scripts/preview-roadmap-b42.cjs` serves a loopback-only fictional design preview at `http://127.0.0.1:48842/`. It has an explicit synthetic banner, no environment config/token/production transport, a strict static-file allowlist and CSP `connect-src 'none'`. It is not deployed to beta/production and is not hosted authentication acceptance. Refresh discards its fictional decisions.

Automated integration uses exact-built production HTML/CSS plus the current module, intercepted same-origin transport and a disposable localhost PostgreSQL 17 database; Chromium and WebKit at 1440×1000, 768×1024 and 390×844. No real source or mailbox is used. Local fixture actor claims model Auth; they do not replace post-release normal real-founder authentication acceptance. Validation totals and screenshots are recorded in the companion validation evidence. Focused preview/fixture failures were repaired before final validation; no production setting was changed to pass a test.

## Final validation result

| Check | Result |
| --- | --- |
| Production build | 431 files; 428 existing public source paths retained, two modified and two added |
| JavaScript syntax | 156 passed |
| Maintained unit/frontend/runtime suites | 185 passed, 0 failed; includes 11 new B4.2 transport/preservation tests |
| Native PostgreSQL 17 / RLS / authorization | 192 passed, 0 failed; includes 24 new B4.2 tests |
| Retained B4 browser matrix | 168 checks, 6 runs |
| New B4.2 browser matrix | 186 checks, 6 runs |
| Exact-built production session regression | 39 passed, Chromium and WebKit |
| Maintained mocked Edge tests | 40 passed; 6 unchanged entrypoints typechecked |
| B4.2 overlapping PostgreSQL workers | 4 groups × 8; one canonical competing decision, idempotent retry, safe changed-source/session-revocation denials |
| Retained overlapping-worker regressions | B4: 4 groups; Vitality reliability: 1; lifecycle: 4 |
| Browser console / horizontal overflow | Zero warnings/errors or overflow across all 12 B4/B4.2 matrix runs |
| Local cleanup | Zero disposable databases remain; task test cluster stopped |
| Hosted state | Production and beta deploys unchanged; cohort 0, B4 versions 0; B4.2 RPC absent |

All source fixtures are fictional. The demonstration search cases contain **one detailed eligible assessment, one historical ineligible assessment and one same-name staff contact without an assessment**. These are not eligibility counts for Justyn's real proposed alternatives. Actual assessment matching remains private and unperformed in this candidate.

The maintained browser fixtures calculate future SOP dates at runtime; they do not expire after this engineering date. The final matrix includes missing-identifier confirmation denial, date-filter narrowing/clearing, an intentionally delayed status response with disabled action controls, stale completions, permission/session revocation, account transition, reinitialization, keyboard focus/escape, private-DOM removal and no storage/network export. The Clear control resets WebKit's native segmented date editor; a new search removes the preceding attestation form. No active cohort was needed to test the new verification workflow.

[Machine-readable validation](evidence/b42/validation.json) · [Artifact SHA-256 and preservation evidence](evidence/b42/artifact-preservation.json). Fictional screenshots: [Chromium desktop](evidence/b42/chromium-1440.png), [tablet](evidence/b42/chromium-768.png), [mobile](evidence/b42/chromium-390.png); [WebKit desktop](evidence/b42/webkit-1440.png), [tablet](evidence/b42/webkit-768.png), [mobile](evidence/b42/webkit-390.png).

## Release approval still required

Review the exact final PR SHA and recheck live deploy/main before mutation. Apply only the new production B4.2 migration once; do not replay B4/B4.1 or shared/beta migrations. Deploy additive `roadmap-verification` and matching frontend only on production site `ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06`, preserving the exact seven existing Function bundles/IDs/routes/runtime/schedule and all accepted production artifacts. No hosted migration or production deploy has occurred in this task.

After explicit exact-SHA release approval: verify private ACL/RLS, zero cohort/versions, exact live hashes and all seven preserved Functions, then normal individual Justyn/Elle login and metadata-only hosted verification/denials. No source-answer pilot or enrollment is authorized by a technical release. Founder signs actual identity/SOP in-platform; user independently approves the operator procedure/count/records and tracked revocation window later.

## Rollback / failure response

Fail closed by revoking authenticated EXECUTE on `public.roadmap_b42(text,jsonb)` only, then a forward frontend revert of this candidate's assets/bridge from the recorded live B4.1 base, reconciled against any subsequent accepted changes. The new transport may remain deployed but returns unavailable with its RPC disabled. Preserve the exact original seven Functions, B4 SQL/cohort/security gates and all immutable B4.2 evidence. Do not replay/reverse the migration, drop private tables or delete attestations. The separately authorized operator controls remain separate from the browser verification feature.

No draft writes, actual scoring/stages, approval, release, notifications, emails, production/beta private-data transfer or external AI processing is enabled. No pilot is activated. No unrelated work follows this package.

## Exact bounded release checklist (not authorized/executed)

1. Reconfirm the production published deploy and complete deployed artifact/Function inventory against `6ad2320001df1be7217aca20` and this PR base. If production changed, reconcile the candidate and obtain new exact-SHA approval before mutation. Check the remote PR head is the approved SHA. Do not merge stacked PRs or substitute main.
2. Record the current immutable file manifest, seven Function bundle SHA-256s, Function IDs, runtimes, regions, routes and worker schedule privately. The preserved Functions are `exercise-library`, `food-database`, `payment-webhook`, `payment-worker`, `payments`, `reusable-content-sync` and `roadmap-founder`. Verify all eighteen existing Function/library source files still match the B4.1 base.
3. Obtain explicit approval for this exact PR head, the single new migration, additive Function and matching production frontend. Privately check both designated verified Auth identities still satisfy the existing active Owner/all-scope contract. Never publish those UUIDs. Record only aggregate counts in release evidence.
4. Apply **only** `20261016195245_vitality_roadmap_b42_identity_verification.sql`, once, to `voalfpxiyznnqfcqcymd`. Record the actual hosted ledger ID (it may differ from the source timestamp). Verify four private tables have RLS, no direct browser/service grants and immutable update/delete/truncate triggers. Verify cohort and B4 versions remain zero and every previous B4 function definition/grant is unchanged. No B1/B2/B3/beta migration or unfiltered database push.
5. Build the exact approved source, verify the candidate artifact hashes and complete prior-file preservation. Bundle/upload **only** new `roadmap-verification` with its current library/config dependency. Prepare a complete Netlify deploy manifest by reusing all seven current Function bundle pins/configuration and every existing file digest; change only the two documented old public paths and add the two new assets. Never publish an incomplete Function manifest or run an indiscriminate branch/production build. Publish only to production site `ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06` after all required uploads pass.
6. Check exact live JS/CSS hashes, canonical HTML references, preserved seven Function pins/routes/schedule, production-only origin/deploy guards, signed-out/ordinary Owner/invalid session denials and private/no-store headers. Recheck zero cohort, zero B4 versions and all scoring/approval/release/email gates. Normal separate Justyn/Elle sign-ins are required for genuine hosted founder acceptance; synthetic local claims are not evidence of that login.
7. Do not search real candidates, record real identity/SOP confirmations or enroll anyone merely because technical deployment was approved. The founders use the released interface to inspect exact existing metadata after the separately reviewed workflow is authorized. A genuine founder signoff does not substitute for distinct operator enrollment approval or a tracked revocation appointment. Stop on any permission, privacy, source-pin or release-gate failure.

### Fail-closed RPC disable (operator review only)

If this new feature fails after an approved release, the narrow emergency boundary is:

```sql
begin;
revoke execute on function public.roadmap_b42(text,jsonb) from authenticated;
commit;
```

Then forward-revert only the two changed old public files from the approved B4.1 source, after checking for subsequent independent edits. Remove references to the two new assets; their unreferenced bytes may remain. Retain the seven original Functions and their configuration. Do not drop/replay SQL, remove immutable verification/SOP records, or touch B4 cohort/source data. This disable never grants enrollment or draft authority.
