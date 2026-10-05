# Free Vitality Assessment save/resume — required beta gate

Date: 2026-10-05. User authority: attached additional beta green-flag requirement. This is additive to the client/staff/meal/workout hosted acceptance, not a replacement. Primary Chat retains the Justin/Elle green flag.

**VITALITY RESUME NOT READY. BETA NOT READY.** Current progress tracking is not answer persistence. The audit is complete; the new save/resume implementation and hosted acceptance are not complete.

## Evidence-backed implementation audit

| Area | Actual implementation and implication |
|---|---|
| Initial contact capture | `js/vitality55.js` posts `vitality-lead` to Netlify before entering health questions. Preserve this independent first action. |
| Answers and current section | Controls and `currentSection` remain in the current document. `showSection` computes section percentage. No partial-answer save/restore API is called. |
| User-facing statement | `consult.html` explicitly states that unfinished answers are not saved on reload/close. Keep this truthful until implementation and acceptance succeed. |
| Final submission | The full form and generated coach summary post to the separate Netlify assessment form. This is final capture, not partial persistence. There is no observed end-to-end durable finalization idempotency key. |
| Supabase mirror | `js/revitalized-data.js` sends initial identity, progress percentage/current label and completion/derived tags. Its 350ms debounce observes progress labels, not answer changes. Errors are swallowed; a progress request is not a successful answer save. |
| Backend answers | `public-intake/index.ts` writes `workflow_answers` only for the allowlisted `enrollment_start` fields. Vitality paths create/update workflow metadata and Journey events, not the full adult/child answer bank. |
| Existing secure Journey links | Random 32-byte tokens, stored hashes, active/expiry checks are reusable security patterns. But the Vitality action simply links to `/consult.html`. Staff issue links; self-issuance requires active member access. This does not provide free-user draft recovery. |
| Contact matching | Current public intake uses email `ilike` and a separate lookup/insert sequence. Do not use that unverified lookup as authority to read private answers. Escape wildcard semantics, handle ambiguous matches and concurrent retries deterministically in the eventual contract. No live duplicate-contact failure was induced. |
| Completion/retry | In-memory flags and selecting the latest non-abandoned workflow do not establish cross-device final-submit idempotency or completed-draft immutability. These need transactional tests. |
| Browser storage | No authoritative answer draft is present. The separate post-completion session identity used for VSL tracking is not resume. |

The reproducible [exact-built audit](../deployment-evidence/2026-10-05-vitality-resume/audit.cjs) loads `dist/consult.html` and its three actual scripts with a synthetic in-memory network transport. It enters an answer, advances to section 1, closes/recreates the browser-style document, and preserves any browser storage. [Result](../deployment-evidence/2026-10-05-vitality-resume/reload-result.json): answer not restored, initial lead step shown, restart at section 0, two lead POST attempts across restart, progress metadata observed but no answer payload or resume request. This proves a missing capability, not duplicate hosted records, a hosted final submission, or a working cross-device flow. No real health data was used.

## Required implementation contract

Audit validation: `node --test tests/assessment-person.cjs` passed **20/20**, zero failures/skips (106.3 seconds), covering existing capture/routing/conditional/final behavior. This is not a resume suite. All three live staging script hashes match the audited built assets. `consult.html` has a different raw hash because of observed Netlify clean-link/Form-attribute processing; its assessment text, complete form/control contract and script references match. See [asset hashes](../deployment-evidence/2026-10-05-vitality-resume/live-assets.json) and [DOM comparison](../deployment-evidence/2026-10-05-vitality-resume/html-comparison.json). No source rebuild, full-suite rerun or hosted submission occurred.

- Preserve independent initial first/last/email/phone capture, approved question content and adult/child/proxy authorization behavior. Starting or saving must not require paid membership.
- Use a durable assessment identity bound to the verified recovery identity/contact and assessed-person/pathway identity. Email lookup alone must never return answers. Repeated start/resume must not create another contact or implicitly merge two assessed people sharing a respondent email.
- Persist a versioned typed answer snapshot, current section, percentage, pathway, timestamps and revision. Explicit checkbox/radio selection and numeric zero must remain distinct from absent/unanswered values. Define deterministic conditional-field clearing and adult/child switching consistent with current behavior.
- Debounce answer changes; flush at section navigation/Continue and safely on visibility changes. Treat unload flushing as best effort, not a persistence guarantee. Show Saving/Saved only from matching successful server acknowledgments. Preserve entered answers and retry after failures; reject stale revisions instead of overwriting newer work.
- Protect private drafts behind narrowly scoped server APIs and least-privilege storage. No broad anonymous reads, browser service-role secrets, raw answers in URLs/logs, or local-storage-only recovery. Redact delivery copies containing credentials after use/delivery.
- Bind secure resume access to exactly one draft/verified recipient and purpose; enforce expiry, revocation and completed-state denial. Existing Journey tokens must not automatically acquire health-answer access.
- Finalization must be idempotent across retries/devices, preserve existing final coach summary and Journey events, reach 100%, and atomically close the unfinished state. Coordinate the Netlify final submission and authoritative draft state explicitly; do not report complete when only one system succeeded.
- No invented assessment score, changed question set, paid-member gate, household-sharing grant or production change.

## Identity/product decision still required

No existing public health-answer recovery contract was found. The user has been asked to choose **email-verified resume links without an account** or **a free verified account**. This changes the free-participant UX and identity authority, not merely implementation syntax. Engineering recommendation: email-verified, assessment-scoped recovery without requiring paid membership; never expose an existing draft just because someone enters its email. The storage/privacy review must identify server authority, draft retention and access expiry; these are not silently borrowed from a different token purpose.

RECOMMENDED THINKING LEVEL: HIGH

CHAT DECISION NEEDED

Approve the recovery identity and private draft storage policy for the newly required free Vitality save/resume capability. Current code independently captures contact details and final assessment in Netlify Forms; Supabase stores Journey/progress metadata, not the full Vitality answer set. Existing Journey links open a fresh assessment and cannot recover drafts. Choose (A) verified-email, assessment-scoped resume links without an account, recommended for the free flow, or (B) a free verified account for recovery. Confirm private server-backed draft storage alongside the existing final Netlify submission, the intended unfinished-draft retention/access expiry, and who may read unfinished health answers. Recommendation: participant-only recovery initially, with no automatic broadening of staff/household access; retain existing final coach-review permissions. Both options must preserve immediate lead capture, adult/child pathways, no unverified-email reads, cross-person isolation and idempotent final submission. This decision gates the new secure recovery design, not the already-authorized client/staff/meal/workout acceptance. No production change is requested.

## Maintained test and hosted acceptance matrix

The following are mandatory before this gate can pass. Existing form coverage is identified separately; none is a claim that resume currently works.

| # | Required case | Current evidence / missing work |
|---|---|---|
| 1 | Start assessment | Existing form regression; add stable draft identity coverage |
| 2 | First contact save | Existing independent-save/failure regression; add retry/concurrency and mirror integration |
| 3 | Answer autosave | Missing; cover debounce, flush, acknowledgments and revisions |
| 4 | Radio restore | Missing |
| 5 | Checkbox/multi-select restore | Missing |
| 6 | Text/textarea restore | Reload audit proves absent |
| 7 | Conditional answer restore | Existing conditional behavior only; resume case missing |
| 8 | Symptom-detail restore | Existing validation only; resume case missing |
| 9 | Adult pathway restore | Existing completion only; resume case missing |
| 10 | Child pathway restore | Existing ages 0/8/18 and switch tests only; resume case missing |
| 11 | Current section restore | Reload audit restarts at 0 instead of 1 |
| 12 | Percentage restore | Metadata exists; no restore contract |
| 13 | Close/reopen | Audit demonstrates lost answer/current section |
| 14 | Cross-device server-backed resume | No endpoint/identity flow implemented |
| 15 | Duplicate email/contact handling | Deterministic draft/subject matching and concurrency tests required |
| 16 | Wrong-person denial | New private-answer contract required; test wrong token, ID and verified recipient |
| 17 | Stale/expired/revoked access | New purpose-scoped contract required; existing Journey checks insufficient |
| 18 | Autosave failure recovery | No answer autosave; test offline retry without false Saved or answer loss |
| 19 | Final submission after resume | No resume; preserve existing coach summary and downstream events |
| 20 | No duplicate final submission | Durable finalization/retry tests required |
| 21 | Completed not unfinished | Require server closed state and stale-token write denial |
| 22 | Desktop/tablet/mobile resume UX | Hosted and isolated checks required at 1440×1000, 768×1024, 390×844 |

Hosted gate: use a separately approved disposable assessment identity and synthetic health responses. Start → several sections → leave → return through verified recovery → restore → continue → submit. Record stable contact/draft/final IDs, no duplicate lead, correct final answer set/summary, 100% complete and closed partial state. Verify wrong-person and stale/completed access denial without reading real records. Existing approved Client A/B/staff identities remain reserved for their pending lifecycle work; do not repurpose them silently. No hosted assessment test was run during this audit because the required recovery flow does not exist.

## Release and continuation

No application/backend source, schema, migration, Edge Function, permissions, feature flags or deployment changed. Current client/staff/meal/workout work remains authorized and pending normal activation. Add this gate to every subsequent beta report, even if those other gates pass. The next coherent assessment package is the approved identity/private-draft contract, then backend/frontend implementation and maintained tests, followed by controlled staging rollout and complete hosted proof. Existing progress-only behavior must never be labeled save/resume.

VITALITY RESUME NOT READY

BETA NOT READY
