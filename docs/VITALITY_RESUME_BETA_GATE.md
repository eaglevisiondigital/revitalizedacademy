# Free Vitality Assessment save/resume — beta acceptance

Updated 2026-10-05. Authority: latest approved verified-email implementation request. It supersedes the earlier unresolved identity/storage handoff. This gate is additional to client/staff/meal/workout acceptance.

**VITALITY RESUME NOT READY. BETA NOT READY.** Implementation and local security/functionality checks are complete; hosted email lifecycle acceptance is pending. Deployment receipts under `deployment-evidence/2026-10-05-vitality-resume/` distinguish applied, deployed, tested and unverified states.

## Implemented contract

- No full/free member account. Initial contact is captured in the existing independent Netlify lead form. The Edge start command creates/reuses the exact normalized contact and one unfinished draft. Participant verifies email before health entry or restoration.
- Private authoritative PostgreSQL draft stores identity linkage, typed active answer controls, pathway/proxy/guardian state, section, percent, revision, timestamps and lifecycle. The browser holds answers in memory only; sessionStorage contains an opaque credential, not the answer payload.
- Random 32-byte mail/session credentials; SHA-256 digests only in the database. URL fragment is stripped before analytics/navigation. Single-use emailed link exchanges for a session credential and invalidates an older session. Recovery issues a fresh email link with a neutral response; failed delivery revokes the pending mail hash without invalidating a live session. One request/minute and three/hour per normalized email.
- Thirty-day credential lifetime; successful authenticated saves refresh the session's 30-day inactivity window. Expired credentials are denied; eligible drafts can recover by email. No destructive retention policy was invented. An already-used mail link requires a fresh recovery email if its session was lost.
- Autosave debounces 650 ms and also flushes on section navigation, visibility and Continue Later. Server revision acknowledgment controls Saved; failed saves preserve current input and expose Retry. Concurrent edits are serialized and stale revisions cannot overwrite newer answers.
- Restoration uses existing pathway, conditional and symptom-detail helpers. Existing required validation remains active. No question wording, scoring or child questionnaire change.
- Finalization first stores/locks the exact generated coach-summary form and a unique dispatch ticket, then sends the existing Netlify assessment form once. Success closes draft/workflow, reaches 100%, records the existing completion Journey event and approved concern/goal tags. Completed credentials cannot return editable answers. Repeated completion cannot duplicate dispatch/events.

## Applied/deployed state

- Repository/branch: `eaglevisiondigital/revitalizedacademy`, `codex/staging`.
- Staging Supabase: `bvooallokgfktssadsrv` (PostgreSQL 17.6).
- One reviewed migration applied once: **20261005110245_vitality_assessment_secure_resume**. Local filename reconciled to actual hosted ledger version. Historical migrations were not replayed.
- New Edge `vitality-resume` **version 1**, ACTIVE. `verify_jwt=false` because free participants use the handler's assessment-scoped opaque credentials, not member JWTs. Public callers cannot execute the private storage RPC directly.
- Frontend release: consult integration, `js/vitality-resume.js?v=1`, `js/vitality55.js?v=resume-1`, `css/vitality55.css?v=86`, bridge `js/revitalized-data.js?v=20261005`; child asset unchanged. See deployment receipt for final SHA/deploy ID and live hashes.
- No production, existing roles, permissions, flags, payments, SMS/Twilio, SMTP or existing Edge functions changed. Recipient allowlist has not changed for this assessment task. No hosted assessment/contact/answer record has been created by these checks.

## Validation

- Build: 314 allowlisted public files, exact existing staging environment; no service credentials in output.
- JavaScript syntax: 78/78.
- Native PostgreSQL 17.11: 234/234 maintained tests, including 19 new resume tests. All restores happen in a newly named disposable loopback database, never hosted.
- Edge: 47/47, including 17 new resume tests; new entrypoint frozen type-check passes.
- New browser-runtime resume tests: 20/20, including normal final submission through the restored form, generated coach summary and lock.
- Existing assessment regression: 20/20 in the broad run. The approved adult/child/proxy pathways remain covered.
- Full frontend release rerun: **466 passed, 0 failed, 27 skipped (493 total)**; recorded in `tests-summary.json`. Earlier broad run had four expected protected-file hash failures for this authorized implementation; the four diffs were reviewed and fingerprints updated. Existing HTML assessment controls are identical except the new hidden final correlation ID; child questions unchanged. No test was removed or skipped to accommodate a defect.
- Hosted non-writing security smoke: random token 401; foreign origin 403; unapproved recipient neutral 200; none returns private payloads. Hosted grants verified: RLS enabled; anon/authenticated cannot execute RPC or SELECT draft table; service role can execute the RPC. Draft count remains zero.

## 22-case acceptance matrix

Local results below are isolated runtime/native tests, not claims of completed hosted email acceptance.

| # | Case | Current evidence | Hosted status |
|---|---|---|---|
| 1 | Start assessment | Runtime start/email gate and native stable draft | Pending approved inbox |
| 2 | Immediate contact save | Existing independent lead/failure test + new start contract | Pending |
| 3 | Answer autosave | Debounce, server acknowledgment, outstanding-save serialization pass | Pending |
| 4 | Radio restoration | New document/server fixture restores checked selection | Pending |
| 5 | Checkbox/multi-select | Checked states preserved; array controls supported | Pending |
| 6 | Text/textarea | New document restores saved text; no answer storage | Pending |
| 7 | Conditional answers | Adult proxy/guardian/child conditional restoration pass | Pending |
| 8 | Symptom details | Controlling selection recreates detail controls before restoring | Pending |
| 9 | Adult pathway | Self/adult proxy restoration and normal completion pass | Pending |
| 10 | Child pathway | Child age/guardian/pathway restoration pass; existing child completions pass | Pending |
| 11 | Current section | Section 1 restored after leave/reopen | Pending |
| 12 | Progress percent | Saved percent restored; completion 100% | Pending |
| 13 | Same-browser reopen | New document/session loads server snapshot | Pending emailed lifecycle |
| 14 | Cross-device recovery | New mail exchange restores same native draft, rotates session | Pending actual email link |
| 15 | Duplicate contacts/drafts | Exact normalized email, wildcard-safe lookup, advisory lock and unique draft/workflow pass | Pending |
| 16 | Wrong-person denial | A token with B draft ID cannot read or write; direct browser role bypass denied | Random-token hosted smoke passes; two-person hosted pending |
| 17 | Expired/stale/replaced | Expired mail/session and replaced session denied; completed locked | Pending hosted lifecycle |
| 18 | Save failure/retry | Current input retained, error truthful, retry persists | Local browser failure/retry/reload passes at all three sizes |
| 19 | Final after resume | Normal form navigation yields full coach summary and completed state | Actual Netlify record pending |
| 20 | No duplicate final | One dispatch permit; repeated final/completion event idempotent | Pending |
| 21 | Completed not unfinished | Completed state inaccessible for edit; no duplicate restart | Pending |
| 22 | Responsive resume UX | 1440×1000, 768×1024, 390×844 Saved/section/actions fit with no horizontal overflow | Hosted resume/error/completion pending |

## Important limits and next actions

1. Await explicit approval for proposed separate alias `dave+rva-assessment@eaglevision.biz`, or another controlled address. Add only the approved exact address to staging recipient safety controls. Existing Client A/B/staff aliases remain reserved. Do not infer approval from a generic “resume.”
2. Run actual synthetic START → answer multiple sections → Saved → request Continue Later → leave/close → open delivered email → restore answers/section → complete. Inspect the exact Netlify final record, stable contact/draft/workflow and one Journey completion. Repeat email recovery and wrong-person/stale denial. No raw tokens in evidence/logs.
3. Check all required responsive states and normal console after real hosted email restoration. Local fixture checks do not replace hosted proof.
4. The Netlify write and PostgreSQL transaction are not atomically coupled. Ambiguous transport sets `delivery_uncertain`; interrupted dispatch may remain `submitting`. Answers and final payload remain private and locked. Reconcile the correlation ID against actual Netlify capture before manually completing/retrying through a separately reviewed operator procedure. No automatic resend and no claim of external exactly-once delivery.
5. Existing workflow uniqueness permits one non-abandoned assessment per contact, including completed assessments. Preserve it; repeated start after completion returns neutral and does not invent a new assessment lifecycle. Future intentional reassessments require a separate approved model.
6. Separate beta track remains incomplete: Client A and staff emails show provider delivery but normal activation/receipt, Client B, scoped staff lifecycle and meal/workout acceptance remain pending. Do not claim the Justin/Elle green flag.

VITALITY RESUME NOT READY

BETA NOT READY
