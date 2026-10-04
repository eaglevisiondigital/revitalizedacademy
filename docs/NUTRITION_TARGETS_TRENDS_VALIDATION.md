# Nutrition Targets + Trends — repair validation and original hold

## Repair acceptance — 2026-10-04

The later user-authorized frontend repair resolves all five release blockers below. The original failed validation is retained unchanged as history.

| Defect | Repair and maintained proof |
|---|---|
| D1 normal loading | Day, targets and selected 7/30-day trends load in parallel on normal open/reload/date/range selection. Only a complete successful snapshot renders; loading/errors cannot claim confirmed empty data. |
| D2 private DOM | Clear day summary/items, targets/source/access labels, trend summary/rows and status on every invalidating context change, denial and failure. Denied B never retains A. |
| D3 async ownership | A single generation/contact/date/range/open/permission context owns all read completions and captured target save/clear completions. Same-client cycles, late errors and transport exceptions cannot render or reload another review. Duplicate mutation clicks are blocked. |
| D4 date-only labels | A locally validated noon calendar Date formats SQL days without the global timestamp helper. Chicago, DST and Kiritimati tests preserve the exact day. |
| D5 target cap | Render every configured/default-visible target, including explicitly null coach overrides, with no24-row cap. A101-target normal-flow fixture retains all rows and202 action buttons. |

Updated the two obsolete Coach Review assertions to JS103 and the explicit five-RPC allowlist, retaining no-direct-table checks. Added `tests/nutrition-targets-trends-runtime.cjs`:102 normal-flow tests, no source instrumentation/export of internal loaders. Preserved the previously uncommitted37-test PostgreSQL suite byte-for-byte; no database implementation changes.

| Validation | Repaired result |
|---|---|
| Staging build / syntax |309 allowlisted output files; runtime configuration unchanged;72/72 JavaScript checks |
| Full frontend |398 total:371 pass,0 fail,27 historical skips |
| Coach Review / new runtime / target source |22/22;102/102;4/4 |
| Nutrition Engine / Content Builder / Member Nutrition |6/6;9/9;18/18 |
| Native PostgreSQL17 backend |163 total:154 pass;9 unchanged agreement onboarding-origin fixtures fail |
| Target/trend database / existing nutrition database |37/37 and29/29 pass, included above |
| Frozen Edge / entrypoint typechecks |25/25 pass;19 pass |
| Exact-built browser responsive |13 measurements: populated read-only, long text, synthetic editable and empty at1440×1000,768×1024,390×844, plus desktop30-day selection. No horizontal page/section/row overflow or out-of-viewport controls; clean console. |

All scoped release blockers pass. Candidate assets are Review JS103 / Wellness CSS120 / Wellness JS118. Only the dedicated staging site is authorized. The workspace receipt `STAGING_NUTRITION_TARGETS_REPAIR_2026-10-04.md` records final SHA/deploy ID/live SHA256 comparison and production/hosted before/after fingerprints. No migration replay, permission changes, published methodology or hosted data writes are part of this repair. The existing hosted session still displays Account Active / Staff access is pending; authenticated hosted Review acceptance remains explicitly unverified.

## Original held validation (historical)

Validated on 2026-10-04 against `codex/staging` candidate `8c030118239528cd2ddbfccbfe32edc31c5dc245`. All six requested commits are included. The staging deployment is **held** because the candidate introduces frontend loading and private-data isolation defects. No application, database implementation or Edge source was repaired during this validation.

## Approved contract and verified database

Methodology-level defaults feed effective client targets; active coach overrides take priority over program targets, and clearing the override restores the program default. Member-sourced values do not supersede coach/program. No methodology content or target values may be invented or published in hosted staging.

The already-applied staging `nutrition_targets_trends_reports` migration is ledger version `20261004055612`, while its source filename is `20261004062000_nutrition_targets_trends_reports.sql`. Stored migration SQL MD5 and source MD5 both equal `40f46ce425e50f9fca8131e12a6cdce4`; no replay or history correction was needed or performed.

Read-only hosted metadata confirms the methodology target columns, unique methodology/nutrient pair and nonnegative constraints. The Living Diet remains version 1.0 draft with null philosophy. Methodology targets, client targets and diary rows remain zero. No hosted synthetic values were created.

New maintained `tests/backend/nutrition-targets-trends.test.cjs` adds **37 passing PostgreSQL17 tests**. Fixtures run only in disposable loopback databases and roll back each case. These prove program default, coach precedence, member non-precedence, clear/fallback, zero/null values, negative constraints, in-scope private read, out-of-scope denial, override-only and Wellness-only read denial, scoped override writes, private-reader/member/out-of-scope write denials, inactive staff denial, anonymous denial and private-helper ACLs. The real 7/30-day SQL reports aggregate each logged day before averaging, exclude missing/future/out-of-range days, preserve measured zero and omit unknown nutrient values.

Reads require `health.private.view` AND contact scope. Set/clear writes require `plan.override` AND contact scope. A scoped writer without private read can write but cannot read targets/trends. No hosted grant was added to test this distinction. A nutrient's average uses only days containing a numeric value for that nutrient; missing values are not zero-filled.

## Release-blocking frontend findings

1. **Load wiring:** opening Review calls only the day RPC. `loadTargets()` is called only after Save/Clear, whose buttons cannot render without targets. `loadTrends()` runs only on an explicit 7/30 click. Date changes do not fetch the new trend end date. The normal UI falsely reports no configured targets/no logged days before making either read.
2. **Private DOM retention:** `clearReview()` resets target/trend variables but clears only the original day summary/items. After loading Client A trends, switching to denied Client B exposes A's old trend summary/rows in B's open panel. Closing the panel or refreshing permissions also fails to erase those private nodes.
3. **Stale replies:** target/trend loaders do not share the existing request generation/open-panel checks; trends also omit end-date ownership. Older date responses overwrite newer data, and delayed trend responses can populate private DOM after closure or a permission refresh/reload. Different-contact response rejection still works, but it does not fix previously rendered DOM or A→B→A/range cycles.
4. **Calendar labels:** new trend rows pass SQL `YYYY-MM-DD` dates to the existing timestamp formatter. With America/Chicago, a logged `2026-10-03` renders **Oct 2, 2026**. Preserve local calendar dates without globally changing timestamp formatting.
5. **Silent target cap:** renderer truncates configured targets with `rows.slice(0,24)`. A diagnostic 30-target response renders24; no pagination or disclosure explains the missing6. This was observed after explicitly invoking the otherwise unreachable loader in an isolated fixture, not through normal hosted flow.

The existing Coach Review suite also contains **two stale assertions**: JS version101 and a single day-read RPC/no mutation contract. Update them to the approved version102 and explicit secure target/trend read/write RPC allowlist while retaining permission/scope/no-direct-table protections. They are separate from the actual runtime defects above.

## Validation totals and boundaries

| Check | Result |
|---|---|
| Existing staging build |309files; explicit allowlist; staging runtime unchanged |
| JavaScript syntax |72passed |
| Full frontend |296total:267passed,2stale assertions failed,27historical skips |
| Full native PostgreSQL17 backend |163total:154passed,9 known agreement onboarding-origin fixture failures |
| New database target/trend tests |37/37passed, included in backend total |
| Maintained target/trend source suite |4/4passed, included in frontend total |
| Nutrition Engine / Content Builder |6/6 and9/9passed, included in frontend total |
| Member Nutrition Diary UI / existing nutrition DB |18/18 and29/29passed, included in full totals |
| Existing Coach Nutrition Review |20passed/2stale assertion failures |
| Supplemental exact-built runtime |14total:4passed/10failed |
| Explicitly instrumented target diagnostics |3total:2passed/1cap failure |
| Frozen Edge tests / typechecks |25/25passed;19 entrypoints passed |

Normal target-rendering and Save/Clear acceptance are blocked by missing load wiring. A separate diagnostic export of the existing loader confirms disabled read-only fields/badge, correct synthetic Save Override payload, client-override state, and Use Program Default reload. This is component evidence only, not end-to-end acceptance or an application fix.

Responsive browser checks: actual trend rows pass1440×1000,768×1024,390×844 with no horizontal overflow. Diagnostic target fields/actions and intentionally long labels also fit at all three widths, yielding9 layout cases. No warnings/errors were observed in those successful browser fixtures. The real hosted staff session still says **Staff access is pending**; hosted authenticated review remains unverified.

## Deployment and next step

Candidate assets are Review JS102 / Wellness CSS120 / Wellness JS118. They have **not** been deployed. Staging remains deploy `6ac1e6fd3020fcfb080bf7b7`, live Review JS101 / Wellness CSS119 / Wellness JS118. Production remains deploy `6ac036d3b48eac0008568e00`;20 sampled public status/hash fingerprints are unchanged. Hosted migration count 51, target/diary counts, RPC definitions and staff role/default/override fingerprint are unchanged before/after.

Next coherent package: repair only the frontend loading, clearing, response ownership, local-date labels, target completeness and maintained tests. Preserve the passing SQL/security implementation and already-applied migration. Re-run failed exact-built cases before the previously authorized staging release. No production, provider, permission, flag or hosted-data change is needed.

The workspace `STAGING_NUTRITION_TARGETS_TRENDS_2026-10-04.md` contains full evidence links and a copy/paste repair handoff. Test/docs changes remain local for the repair package; no new commit or push was made by this validation task.
