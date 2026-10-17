# B5.3 — readable fictional Founder Scoring Lab candidate

Implements Issue #43 on the exact PR #42 head `e142c394750720a8c39dffc62db31a7726c7b225`. PR #42 remains draft and unmerged; its Person A/B/C buttons, synchronized first-three dropdown positions, 50-case catalog and calculations are retained. PR #39 (`cf590b576388e61100cc1b88222723fb016a0381`) remains separate and unreleased. This branch deliberately does not merge stale main or either independent repair.

## Founder walkthrough

1. Open **Founder Scoring Lab** and choose Person A, B or C (or any of the remaining 47 cases).
2. Read **Fictional test input sheet**. Each of the 12 Drivers shows supplied assumptions, exact habit roles/consistency/proficiency, independent function, finding days/intensity/duration/impact, and qualification evidence where supplied. Unknown, absent, explicit zero and reasoned exclusions remain distinct. Unnamed model habits/findings are explicitly unnamed.
3. Use **Current questionnaire: evidence and gaps** to select any Driver and search its actual current question wording/options. All 707 Driver-context fields remain accessible. These are question references, never assigned fictional answers. Conditional visibility and rubric/proficiency gaps remain explicit.
4. Review all 12 **Candidate calculations and explanations** and the **Fictional Roadmap preview**. Driver burden/lifestyle/weights/exponents and overall health/lifestyle ingredients are readable; engineering JSON is behind Technical details. Strengths/priorities/opportunities identify their candidate Driver/evidence and require coach interpretation. No curated recommendation or symptom–habit causation is invented.
5. Enter detached what-if assumptions, compare the unchanged baseline with the experiment, then record session-local founder judgment. Notes are neither saved/adopted nor printed and clear on case/session change. Separately authorized private append-only proposal functionality remains in its original gated zone; proposal text is no longer mixed into a fictional report.

A/B/C remain approximately **70.66 / 35.48 / 70.00**. Symptom-free B’s numerical Chaos remains an unresolved founder calibration issue. Neither scores nor Spectrum classifications constitute adopted policy, participant scoring, diagnosis or a client report. Missing current questionnaire measurements are not filled in. Wise Budgeting remains separate with **zero health deduction**.

## Architecture and security

No Function, engine, fixture, SQL/RLS/ACL, authorization, questionnaire, source-coverage or private API contract changes. A generated static reference contains only the unchanged 50 fictional input sheets, their existing engine finding traces and public question metadata. It is an intentional public display projection, not participant data or a new scoring engine. `generate-roadmap-b53-reference.cjs --check` pins fixture/engine/contract/registry hashes; the production build fails closed on drift. Catalog pins and all case IDs must match before display. An additive view module uses textContent and no network, storage or HTML injection.

Authenticated source reads still require the existing independent verified-founder/current-session/contact/cohort/source-pinning/expiring-pilot authorization chain. Empty cohort does not enable source reads or writes. Private source and proposal text never enter the fictional view model, print view or standalone preview. Print is disabled and the entire Lab hidden in print media whenever a private source is loaded. Logout, account change, revocation and stale async completion clear private state under the existing epoch guard.

All nine existing Function source trees/configuration and the payment-worker `* * * * *` schedule remain unchanged. Production `6ad2acb16d6d38c15ce3e489` and beta `6acc33161511aa93c289bbcc` remain published. No hosted database access, participant searches, scoring, identity confirmation, cohort enrollment, proposals, migration, release or email is performed by this work. The separate PR #39 signed-out legacy-request issue is not claimed fixed here.

## Synthetic preview

The preview runs a local in-memory fictional session adapter; it is **not an authenticated portal or an authorization bypass**. It contains only fictional fixtures/public wording and no Auth, Supabase environment, private records, Functions or durable writes. CSP prohibits all connections and forms. It is hosted in a dedicated independent Netlify project, never the production or beta site. `.netlify/` remains ignored; no site linking metadata is committed. Preview details and hashes are supplied in the external release evidence and completion report.

## Release gate and rollback

**No production/beta release is authorized.** A future production static-only release must first recheck the live baseline, all public hashes, nine archive digests, routes/configuration and worker schedule. Only five public paths differ from live: portal HTML, Lab JS/CSS and the two additive display modules (436 public files; 431 unchanged live paths). Preserve the opaque legacy `/netlify.toml` digest; do not replace it with rebuilt bytes. `review-roadmap-b53-release.cjs` produces an offline, NOT_EXECUTED full manifest and baseline revert manifest. Never ordinary-merge/rebuild/rebundle Functions or deploy stacked PRs wholesale.

A failed unpublished deploy leaves the prior publication intact. If a future published UI release needs reversal, separately authorize a narrow static forward revert using exact prior three asset bytes, removing the two new paths and retaining all nine existing Function artifacts/configuration/schedule. No SQL is changed or rolled back.

Next authorization: founders review the fictional preview and unresolved rubric/calibration decisions, then explicitly approve the exact tested SHA and reviewed static-only production manifest. Actual source cohort/pilot, derivative writes, scoring-policy adoption, client report approval/release and email each remain separately held. This candidate authorizes none of them.

Validation is recorded in `docs/evidence/b53/validation.json`; source and Function preservation are recorded alongside it. No real participant identities, dates, answers or fingerprints appear in evidence.
