# B2.1 — Founder calibration candidate

Status: implementation ready for fictional founder calibration. **Candidate / Not Approved.** Numerical regression success is not founder, clinical or production-release approval. The A/B/C interpretation discrepancy below remains unresolved; no real-source pilot has begun.

## Implementation

Continues branch `codex/vitality-roadmap-b2-candidate-workbench`, draft PR #28, stacked on B1 PR #26. Reviewed PR #27 at `c5b3c27bf951b7ca4dbabd92ed50126b571dce39` and PR #28's October 15 handoff. No production-main merge, migration or Edge change.

- `js/vitality-roadmap-b21-engine.js`: pure browser/Node candidate `b2.1-founder-20261015-v1`, revision 0, with immutable source provenance and preserved B2 configuration. Health weights: Hydration/Neural/Detox/GI 1.4; Hormone/Diet/Recovery/Mentality 1.3; Electrobiology/Functional 1.2; Momentum 1.1. Total health weight 14.3. Wise Budgeting 1.0 stays separate with zero deduction and no health-stage effect.
- Weighted concern/lifestyle means and weighted weakest lifestyle gap feed the disclosed H/J geometric composite. Worst-concern 0.75, mean-lifestyle 0.8 and health exponent 0.55 remain candidate assumptions. Five provisional bands start at 95/80/60/40/0; colors remain separate. Peace checks qualifying current findings and daily impact. Cognitive/GI ceilings, multiple distinct reported conditions strictly over 90 days, and multiple persistent conditions with daily effects are configurable, unapproved interpretations. Overlapping ceilings take the most restrictive. Driver-specific numerical bands, optional lifestyle minimum and persistent-finding ceilings are explicit controls.
- Unknown/unsupported evidence remains unscored. Conflicting resolved/current answers withhold output. Historical zero-current-days findings are not treated as current conditions. Persistent grouping deduplicates condition identifiers; symptoms do not silently become diagnoses. No scoring input is inferred from a real questionnaire.
- `js/vitality-roadmap-b21-scenarios.js`: original 30 cases preserved, plus 20 new fictional measurement sheets. Eighteen independent expected-stage contracts and independent A/B/C arithmetic constants supplement deterministic checks of all 50 cases. Current questionnaire limitations are disclosed beside the purpose-built fictional inputs.
- `portal/portal-roadmap-b21-workbench.js` and CSS: side-by-side fictional answers/Roadmap, twelve Driver details, evidence/WHY/trace, reasoned parameter revisions, independent expected outcomes, Agree/Disagree/Needs information, correction and versioned KB proposals, and fictional-only packet export. Candidate packet is not authenticated signoff/audit or an approved KB update. Correction text must not contain actual participant information. No automatic scoring changes, browser storage, external AI or new consent checkbox.
- `scripts/build-vitality-roadmap-b21-staging.cjs`: extends the existing isolated B2 artifact with four assets at `v=100`. B1/B2 production allowlists and questionnaire/save-resume files remain unchanged. Build output is ignored by Git.

## Founder decisions still required

1. Confirm A/B/C answer sheets, independent expected ranges and maximum acceptable spread. Current A=70.65971946180458, B=35.481338923357555, C=70.00000000000000. A is close to C but not B; the current formula **does not satisfy** the requested close-score expectation. The symptom-free/poor-habits case lands in a numerical Chaos band, another interpretation concern. No arbitrary tuning or disease prediction is justified.
2. Define qualifying current intensity/frequency/impact and historical/resolved handling; mild/occasional cognitive/GI evidence is presently a disclosed comparison setting only.
3. Define whether Chronic counts reported conditions, diagnoses or symptoms, and how manifestations of one condition are grouped.
4. Define whether Chaos requires daily impact in each of multiple persistent groups, any one group or an overall measure; resolve the distinct Driver-local statement about multiple chronic symptoms.
5. Define infrequent persistent Driver-local ceilings, applicable Drivers, severity and impact requirements.
6. Confirm Peace 95 versus 90, habit/function minimums, overlaps and separate escalation/safety review.
7. Approve factual habit rubrics, symptom ownership, source conversions, exponents/breadth/ranking rules and curated evidence-based symptom–habit links before an actual-source scoring adapter.

## Security and release boundary

Only existing `list_vitality_roadmap_preparation` and `get_vitality_roadmap_preparation` read RPCs are invoked. B1 remains authoritative for verified current sessions, private-health permission and contact scope. Real-source review renders coverage only; all twelve real-source scores/stages and overall remain withheld. Source answers never enter candidate calculation/export automatically. Logout/reset removes private DOM and proposal state; denied/stale responses cannot repaint. Text-only source rendering prevents HTML execution.

Every candidate retains `policyApproved=false`, `releaseEligible=false`, `clientReport=null`, `approvedStage=null`. These labels are not authorization: B1 database/approval guards remain the release block. No report release, scoring of real participants, approval, notification, hosted write, role/permission/secret change, migration or Edge deployment. No production or primary-beta deployment is authorized by this package.

## Local validation — fresh final run

- 253 maintained unit/regression tests passed: B2 146; B2.1 28; intake/resume/person/session/B1/private-review/logout regressions 79. Zero failures/skips/cancellations.
- PostgreSQL 17: 24 existing private-review plus 23 B1 security/foundation checks passed. Verified session/revocation, private permission, contact scope, anonymous/member denial, free-access boundaries and held approval/release. Disposable local test database dropped; no hosted migration replay.
- Preserved B1/B2 browser integration: 116 checks in Chromium and WebKit passed.
- Final exact-built B2.1 browser suite: six engine/viewport runs at 1440×1000, 768×1024 and 390×844, covering 50-case selection, twelve Drivers, parameter revisions, unknown source, escaped private text, export exclusion, Escape/focus return, stale response/logout cleanup, account isolation and denied reads. Zero captured warnings/errors, hosted writes or page/modal overflow.
- JavaScript/CJS syntax: 149 files passed. Current source registry regenerated/checked: 743 fields, 190 symptom observations, no drift.
- Production build: 395 files; all 394 allowlisted source-derived files byte-matched B1 output and unchanged runtime-config inputs account for the final generated file. Questionnaire/save-resume/production manifest unchanged. `git diff --check` passed.
- Initial sandbox-only dependency/browser/shared-memory restrictions were resolved using existing local dependencies and approved local process execution; no implementation failures are hidden as passes.

## Deployment and hosted acceptance

Deployed application source: `3fb981342ab8b92d2d0114891c614384235e147c`. Isolated Netlify deploy: `6ad1a1f220c056de87f1fc75`, only the existing `roadmap-b2` alias on staging site `071b252e-a922-4846-a784-8dca1edad377`. No Functions upload. Preview: https://roadmap-b2--revitalizedacademy-staging.netlify.app/portal/ . PR #28 remains draft/unmerged on `codex/vitality-roadmap-b2-candidate-workbench`, based on B1. Later documentation commits do not change the deployed application bytes.

Production primary remained `6ad137d38d394a5c89beedc4` before/after this continuation. Primary beta remained `6acc33161511aa93c289bbcc`. The earlier B2 report's production ID is historical; this task did not replace the newer production publish.

All four B2.1 assets at `v=100`, portal HTML and runtime config returned HTTP 200 and exactly matched built bytes. SHA-256:

| Asset | SHA-256 |
| --- | --- |
| `js/vitality-roadmap-b21-engine.js` | `bb22e6a87b00489b5d4b6770b8d6ab56ae9427ac70862ace6dd6e4c4bc67b463` |
| `js/vitality-roadmap-b21-scenarios.js` | `81f3902b576ea28b25c2c18324de3f13cc707291baa15cb753f2f563765d87e4` |
| `portal/portal-roadmap-b21-workbench.js` | `d76ad089584a0116d2297ab7aeef041aee93708e38b239e8e12c84c90069aa73` |
| `css/vitality-roadmap-b21-workbench.css` | `b611a35faae407c7037fdc198e172694bfaf8a3bc8f1b1513b65144b37fbb473` |
| `portal/index.html` | `64d91cc9b50cf9eb68cef017f0c31e0d19e00511d2137f609b2f1eb7a0b99bc1` |
| `runtime-config.js` | `41414e3bf49ab8a29c3c94fb0687a88036796b9d58babe7f1c156974aed657bf` |

Hosted read-only Owner acceptance passed through the existing Staging Owner's normal session: launch; 50 fictional choices; twelve Drivers; A/B/C actual values matching the independent arithmetic; budget hardship leaves health 100 while Budget is 0; incomplete proficiency withholds output; reasoned comparison revision 1; existing Synthetic Vitality Alias loads through the secure B1 path with all twelve Drivers and overall unscored. No real-source calculation, review submission or downloaded actual data.

All four sections at 1440×1000, 768×1024 and 390×844 passed page/dialog overflow checks (12 combinations). Close removed the dialog. Normal refresh restored the same Owner and reset the session-only candidate revision to 0. Zero hosted warnings/errors captured. The temporary viewport override was reset; reference fictional overview was left open for founders. Logout/stale-response/account-switch/denial checks are covered by the isolated Chromium/WebKit harness and PostgreSQL tests, not falsely represented as separate live human-account transitions in this continuation.

No hosted participant/source/configuration records changed. The local disposable database was dropped and PostgreSQL cluster stopped. No production/private data was copied into staging.

## Next package

Prepare a controlled secure provisional-review pilot using existing completed adult questionnaires, with separately approved scoring definitions/calibration and data-use/location handling. Do not start the pilot or copy private production data as part of B2.1. Keep all client approval/release/email gates held.
