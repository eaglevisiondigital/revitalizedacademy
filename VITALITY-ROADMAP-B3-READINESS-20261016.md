# B3 — Secure adult pilot preparation

**Candidate engineering only. Real participant scoring, approval, release and notifications remain held.** Continues PR #28 from B1/B2/B2.1; no merge to main, production deployment, primary-beta deployment or hosted SQL/Edge update.

## What is implemented

- `js/vitality-roadmap-b3-adapter.js`: deterministic `b3-source-coverage-20261016-v1`, pinned registry fingerprint `2f67c193c2e69b54d61a44599bf9308ca27d317f2bdb748adbeaedfdabe92ced`, exact question references and all twelve Driver coverage cards. Distinguishes explicit zero, unknown, missing, inapplicable, conflicting, unsupported and historical evidence. No ordinal frequency-to-days guess, duration midpoint, diagnosis, factual-proficiency inference, fabricated impact or computed health score. Self-perception/confidence/income are context. Budget remains separate. Metadata must agree with the selected Adult/Myself answer; child/proxy/in-progress and unmatched versions are held.
- Snapshot version labels and client-supplied hash claims are **not verified provenance**. Current field/option mappings are reference metadata, not proof of the exact historical questionnaire code revision. Scores and stages remain null; `scoreActualSource()` always refuses execution.
- `portal/portal-roadmap-b3-workbench.js`, fixtures and CSS: fictional completed source selector, original answers beside unscored provisional report, all twelve Driver traces/coverage/conflict counts, source-backed reviewer corrections, session-only revision rehearsal/regeneration/comparison and shared B1 interactive/print renderer. Safe text rendering, focus/Escape, session reset and stale-response cancellation. No private write transport, download, browser persistence or production connection.
- **The hosted rehearsal is explicitly not durable storage or authenticated signoff.** Durable persistence is validated separately against PostgreSQL using existing B1 append/version/idempotency/conflict/audit functions. No second assessment or production draft system.
- `design/sql/vitality_roadmap_b3_readiness_LOCAL_ONLY.sql`: tested **local-only specification, not a migration**. Designated founder registry + verified current active Owner/private-health/contact guard; operator-registered fictional report/source-fingerprint manifest; wrapper around existing B1 draft/version functions; immutable adapter/registry/source sidecar provenance. No browser fixture registration, real-scoring switch or approval bypass. Registration depends on trusted operator designation; a label alone does not prove data is fictional. **Not installed in production or beta.**
- B3 builder extends the existing isolated preview, preserving B1/B2/B2.1 and excluding B3 from the production allowlist. No public production-health bridge or service credential is introduced.

## Production read-only audit — October 16, 2026

Only SQL schema metadata, safe aggregate counts/coverage and the two known founder authorization booleans were returned. No source answers, participant IDs/names/emails, tokens, raw final forms or private rows were exported to local files, logs, fixtures, GitHub or staging. Audit predicates: completed Vitality workflow, completed secure draft, explicit Adult pathway, selected Myself, and at least one nonblank selected saved answer. This is **source eligibility**, not scoring readiness.

- **16** completed workflows / distinct contacts.
- **12** completed Adult/Myself sources with usable saved responses, all labelled **secure-snapshot-v1**. Between **162 and 412** nonblank selected question keys per source. A snapshot schema label alone does not identify the exact code revision.
- None of these twelve match the three known approved production acceptance inboxes checked by the aggregate query. This is not proof of individual consent, data-use eligibility or measurement completeness; cohort authorization remains a separate gate.
- **4** historical Adult/Myself summary sources without detailed question coverage through the protected review contract. They require provenance/clarification; do not invent or backfill missing answers.
- **0** completed workflows lacking both a secure or historical source.
- All **12/12** secure sources contain some nonblank reference-mapped context for **each** Driver. This does not establish complete calculation inputs or approved conversion.

| Driver | Secure sources with some context | Minimum–maximum nonblank reference keys |
| --- | ---: | ---: |
| Cellular Hydration | 12 | 6–32 |
| Systemic Detoxification | 12 | 15–48 |
| Electrobiology Rhythms | 12 | 7–31 |
| The Living Diet | 12 | 17–41 |
| Functional Training | 12 | 18–39 |
| Holistic Recovery | 12 | 13–52 |
| Gastrointestinal Renovation | 12 | 9–43 |
| Hormone Balancing | 12 | 3–32 |
| Neural Repatterning | 12 | 14–47 |
| Momentum Regimens | 12 | 5–5 |
| Mentality Realignment | 12 | 7–40 |
| Wise Budgeting | 12 | 6–8 |

Both known production founders independently retain verified Auth, active Owner, All People, `health.private.view`, `crm.view` and `health.progress.manage`. No role/permission or Auth change was made. These are authoritative configuration checks, not a claim that this task performed fresh human sign-in as each founder.

## Recommended real-data architecture — prepared, not deployed

Keep real assessments **in their existing production environment**. Prefer a separately approved same-origin production-only private founder workspace and RPC boundary, reconciled onto the latest accepted production source including PR #29's NDA fix. Reuse server-authoritative current-session/private-health/contact checks and immutable B1 draft/audit concepts. Permit only explicitly verified designated founder Owners and a private approved adult cohort. Preserve original source records; pin source/adapter/config versions, save only non-releasable derivative drafts, record reasons and optimistic conflicts, and clear all private state on logout/revocation/account change. No browser/service-role credentials, staging proxy, automatic PHI transfer, download or public report endpoint.

Production does not gain that route or B1/B3 schema from this task. A future bounded production candidate must reconcile current schema/source and receive exact approval before migration/deployment. Do not merge the stacked B1/B2 branch wholesale into main. PR #29's production `portal/index.html`, `portal/portal.js` and `portal/portal-staff-onboarding.js` were not changed here.

## Exact remaining gates before a real-submission pilot

1. Justyn/Elle independently specify A/B/C expected ranges/spread and resolve Spectrum eligibility, especially B's numeric Chaos result. Complete the [decision worksheet](VITALITY-ROADMAP-B3-FOUNDER-DECISIONS.md), including source rubrics/missingness and Driver-stage definitions. Do not tune formulas to invented ranges.
2. Approve a versioned source-to-measurement/scoring contract and authoritative provenance handling. Existing sources lack several required factual measurements; approve any clarification/new questions rather than fabricating values. Four historical summaries are not detailed scored candidates.
3. Explicitly authorize the bounded in-place production data-use/cohort, reviewer/retention/audit SOP and derivative-draft handling under existing privacy disclosures. No extra quality-improvement checkbox, external AI processing or third-party training.
4. Review and approve the exact production-only, founder-only fail-closed implementation/migration/deployment candidate, preserving PR #29 and all independently released changes. This is additional authorization; B3 only prepares/tests locally. Verify founder sessions, scoped and cross-contact denials, revocation, source pinning and immutable revision comparison before use.
5. Separately authorize pilot execution and any provisional calculations against selected adult records. Approval/release/client notification remain server-blocked even during that pilot. No live pilot has begun.

## Validation and isolated preview

- **271 unit/regression checks** passed: 253 preserved B1/B2/B2.1/intake/resume/session/private-review/logout tests plus the final 18 B3 adapter/rehearsal cases. Unknown/zero/applicability/conflicts, unsupported/historical versions, source immutability, provenance claims, adult/self contradictions, evidence validation and actual-score refusal are covered.
- **62 PostgreSQL 17 checks** passed: 24 established private-review, 23 B1 and 15 B3. Separate verified Justyn/Elle synthetic sessions succeed; non-designated Owner, Admin, Coach, member/anonymous, missing private permission, inactive/unverified/revoked, unregistered report and changed-source/pathway reads/writes fail closed. B1 exact retries, optimistic conflicts, regenerate/old-version retrieval, audit and immutable provenance remain intact. Score injection and foreign evidence are rejected; B1 approval still denies. All test data was fictional in a disposable local database, which was dropped; the local cluster was stopped.
- **Two native durable browser integration flows** passed, one Chromium and one WebKit: the exact-built existing B1 editor calls the local B3 fixture wrappers through a test-only RPC transport into PostgreSQL 17. Each flow saved two reasoned versions, previewed the first immutable version with twelve Drivers, regenerated a third unscored draft, verified the previous correction remained intact, and verified all three immutable audit/provenance entries. Logout cleared the private DOM; no captured warnings/errors. This is an actual local browser/database contract test, not a claim that the hosted session rehearsal writes a database. The test-only transport is not shipped.
- Preserved browser suites: **71 B1 checks**, **116 B2 checks**, and **six B2.1 engine/viewport runs** passed in Chromium/WebKit. Final exact-built B3: **six runs**, both engines × 1440×1000 / 768×1024 / 390×844, covering twelve Drivers, fictional revision append/regeneration/comparison, shared interactive/print preview, visible conflicts, historical unknowns, escaped text, focus/Escape, signed-out/stale response/reset/account transition and denied reads. Zero captured warnings/errors, hosted writes or horizontal overflow.
- **157 JS/CJS syntax checks** passed; source-map check remains **743 fields / 190 symptom observations, no drift**. Production build **395 files** is byte-identical to the B2.1 branch baseline (including unchanged runtime-config inputs). This is not a claim that the parked preview branch contains later production-only releases; production/PR #29 are preserved by not deploying this branch there.
- Fictional print-to-PDF used the shared B1 renderer, included all twelve Drivers, and was rendered/visually inspected. Private raw source answers/correction editor are excluded from print. No actual report/PDF was generated.
- The first browser runs identified missing explicit select labels and conflict counts hidden in collapsed details; both were repaired and all six final runs passed. Initial database assertions were scoped to their fictional report to exclude the intentionally pre-B1 released baseline fixture; no gate was weakened.

Native durable persistence acceptance and the session-only browser rehearsal are reported separately. No production/primary-beta mutation or real participant scoring is permitted by a passing test. Isolated deployment/source/hash and hosted rehearsal evidence follows after upload.
