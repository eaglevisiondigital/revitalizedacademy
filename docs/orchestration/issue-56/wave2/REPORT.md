# Issue56 Wave2 — independent executed foundation QA

**Verdict: release NO-GO.** Local component progress is verified; no full Academy journey package is accepted. The unchanged 57-package matrix is now mapped separately to **0 PASS, 2 FAIL, 43 BLOCKED and 12 NOT_RUN**. Passing subsets and their missing coverage are explicit in `RESULTS_MATRIX.json`.

Independent native reviewer: `/root/issue56_independent_qa`. QA worktree `academy-wave2-qa`, branch `codex/rva-wave2-qa-20261101`. Accepted base `fc6737415da36b4306afa0060a525eca2f1131ca`; final combined tested source `e2f108261b831668618588acdc635e2113dcdf8a`. Master integrated exact lane commits; QA did not alter branches or cherry-pick. QA's containing commit is returned in the handoff message. Only `tests/wave2-qa/` and this directory are owned outputs.

## Actually executed independently

| Suite / own receipt | Result | Actual execution and adapter limit |
| --- | --- | --- |
| C `QA_C_UNIT_REGRESSION_RETRY.tap` |142/142 PASS |78 new pure affiliate contract cases plus64 existing assessment/resume/staff-session regressions. Actual app JS; fictional DOM/Auth/RPC transport. |
| C `QA_C_BROWSER_RETRY.tap` |6/6 PASS |Chromium/WebKit at1440/768/390. Exact old error sink reproduction and patched text rendering; actual helper in a standalone fictional share form. No production Share Center. |
| A `QA_A_CONTRACTS.tap` |4/4 PASS |Actual DOM/route linkage, approved assets/member CSS and unchanged build controls. |
| A `A-browser/BROWSER_RESULTS.json` |36/36 PASS |34 patched-source scenarios and2 expected old-source race reproductions. Actual HTML/CSS/member/signing JS, fake SDK/Auth/RPC;320/390/768/1440 in Chromium/WebKit. Eight independent screenshots retained;390px Chromium and1440px WebKit inspected. |
| `QA_PAYMENTS.tap` |18/18 PASS |Existing payment modules with injected gateway/Auth/database fetchers; currency/environment isolation, raw-byte HMAC, hosted-request shape, cents/recurring date, redaction and uncertainty behavior. No merchant or durable SQL certification. |
| B `B-dom/onboarding-dom.tap` |13/13 PASS |Actual onboarding HTML/JS; fake own-account verification/claim/signing/recovery/logout/delayed-response transport. |
| B `B-pg/baseline_auth-tests.tap` |21/23 PASS;2 FAIL |Actual PostgreSQL17.11, exact pinned Sep26 schema+authorization source, fictional Auth helpers/roles/rows. Failing assertions retained unchanged. |
| B `B-pg/production_hold-tests.tap` |13/13 PASS |Separate fresh baseline plus exact production lifecycle SQL/permission helper and labeled fictional catalog precondition. Real RLS/RPC execution; deliberately incomplete current production composition. |
| B `B-browser/browser-receipt.json` |24/24 PASS |Actual onboarding/environment JS in Chromium/WebKit1440/390; locally intercepted fake SDK/Auth/RPC. |
| B `QA_B_OUTPUT_ROUTING.tap` |3/3 PASS |Output destination resolver only. |
| V3 `QA_V3_CATALOG.tap` |87/87 PASS |Detached builtins-only fictional catalog/claim/receipt adapter. No V3 base/engine/config import or real corpus. |
| QA `QA_ADVERSARIAL.tap` |10/10 PASS |Three additional malicious server-error markup payloads rendered literally; own flags/clock/policy trust-limit, private projection, unsupported finance event, independent-consumer and wrong-scope probes. |
| QA `QA_V3_PROBES.tap` |3/3 PASS |Production mode remains unavailable; private payload rejected; unknown speaker held despite permissive fictional verifier. |
| QA `QA_INVARIANTS_FINAL.tap` |8/8 PASS |Original57 SHA,101 baseline identities/wording/owners,10 inventory-only details, unchanged Function/migration/Auth/assets/style/build families and honest127 missing trace. Same eight controls rerun after final integration; counted once. |

**Final recorded instances:388 PASS /2 FAIL /390 total**, including15 static/output-routing/invariant controls. The other375 unit/DOM/browser/SQL instances are373 PASS/2 FAIL. These are test instances, with repeated assertions/profiles and two expected baseline browser reproductions; they are not390 unique features or57 completed journeys. Browser instances total66. Syntax, source/document whitespace and final receipt integrity checks pass and are not inflated into the business total. Raw runner failure TAP/log files retain emitted trailing spaces; the full staged whitespace check reports those preserved evidence lines.

The first C unit attempt lacked jsdom in bundled NODE_PATH, and the first C browser attempt was blocked by host sandbox launch restrictions. Both logs remain. They are **bootstrap failures**, not product assertion failures. Successful retries used existing `jsdom26.1.0`/`pg8.16.3`, bundled `Playwright1.62.1`, existing Chromium1248/WebKit2336 and authorized isolated browser launches; no install, download or user browser profile. Browser network routes were intercepted. No production/provider/private call occurred.

## Two confirmed bounded failures

**QA-W2-F01 / N02 / P1 local security assertion:** `[N02 STRICT] unrelated Coach cannot directly read another Client goal through actual RLS` returned **1 row instead of0**. The scoped staff helper correctly denied the contact, while the table policy in the pinned historical composition permitted the goal read. See own `B-pg/baseline_auth-tests.tap` and exact input hashes in `EVIDENCE.json`/`tests/wave2-client/source-pins.json`. This is an actual SQL assertion failure, not a mocked response. It is not evidence of a current production exploit: the fixture is Sep26 schema plus an explicit repair file, not the full installed catalog.

**QA-W2-F02 / E02 / P1 local functional assertion:** `[E02 partial] authorized review consumes/releases with recorded reason and actor` failed with **42501, permission denied for function recalculate_coaching_entitlement_used_value**. The assigned permitted Coach's public review RPC could not execute the private recalculation helper. The transaction did not complete the expected adjustment. Reserve/consume/release, repeated completion, no-show review, denied actors and unknown remaining values have separate passing subtests. The same historical/current-catalog limitation applies.

No assertion was inverted, waived, skipped or patched to obtain green SQL results. PG's overall exit1 is retained. Core should first reconcile exact applicable current catalog/source, owner/ACL/search path and selected contact rights; propose a narrowly reviewed correction afterward. A broad helper EXECUTE grant or permissive RLS change is not a QA remedy and was not performed.

## Coverage and status rules

`RESULTS_MATRIX.json` retains the exact57 IDs and requirement links from immutable input SHA `58671aa98737d77175c452267cf74b432132e7506ed25dc53af2ce903e831746`. The original matrix remains byte-identical. FAIL means a relevant assertion failed, with the unexecuted remainder still visible. BLOCKED names a missing policy, source, catalog composition, implemented adapter or fixture. NOT_RUN means the complete procedure was not executed; any actual passing subset is separately listed. Absence of production approval alone is not used to block an otherwise executable local procedure.

N02 and E02 are FAIL. Examples of BLOCKED packages: J09 lacks an approved exact payment→enrollment contract/current positive fixture; J11 lacks the49-day specification; F01/F02 lack selected adult/guardian/minor sharing policy; A03 lacks QR encoding/decoding and authenticated current-consent/media adapters; P01/P02 lack actual ledger/reconciliation/payout contracts. S01/N07/O02 remain NOT_RUN at full-package level because source/assets, one repaired sink and responsive subsets do not cover their whole prescribed local procedure. O01's eight invariants are partial; full new-wave dispatch/ownership negative probes were not rerun. No whole-package PASS is manufactured from these subsets.

R03 has actual87+3 passing fictional catalog probes, yet remains BLOCKED for real approved source admission/registry, actual Auth/RLS, personalized retrieval and escalation integration. CP10 is field/audience rejection, **not real role authorization**. Safety flags are supplied schema data, **not semantic medical classification**. Fixture verifier callbacks are local trusted code, not an authenticated founder registry. Current-source hashes and untrusted-source citations are checked, but no source was promoted or private report processed.

The affiliate helper likewise accepts self-consistent caller flags, clock and destination policy. Independent probes confirm those are input contracts, not authentication, current consent or approval proofs. Two independent calls with the same prior in-memory state both produce a new event, demonstrating why this is not durable concurrency control. QR is a payload string; no QR renderer/decoder, OS clipboard, media download, actual send, settled attribution, commission, credit/points book or payout is accepted. Full advanced scope remains required; single-level RVA, optional MLM/genealogy/ranks OFF and separate Coach compensation are preserved.

## Source, environment and preservation

The actual PG runner verifies every source pin before initialization, ignores production DATABASE_URL/PG connection settings, creates a fresh PG17 cluster with **TCP disabled**, and connects only over a unique temporary Unix socket. Two fresh databases receive only the explicit reviewed input files; no migration glob, protected Roadmap migration or private production command is used. Synthetic platform roles exist only there. `B-pg/postgres-receipt.json` confirms cluster stop and removal after failures. This proves bounded source behavior and not managed GoTrue/JWT/Storage or the current production catalog.

Master's retained canonical observation at2026-11-01T13:41:54.228Z records deploy `6ae6b971e17bce85e37aa95c`, source `10dec6682e7e87bf637482fc027e54c6800260e4`,459paths/13Functions/lock true. Its13:46 public read finds both `/member/` and `/member/onboarding/` still mounting Enrollment & Signature Center. These are explicitly **Master-observed**, not independently hosted-queried by QA. The new local dashboard and link do not imply a published route: the production allowlist/build controls remain held.

Local invariants verify Netlify/Supabase Function source families, migration/Auth/RLS sources, approved assets/styles, build allowlist and Netlify routing unchanged from accepted base. This source comparison is not a fresh archive-by-archive hosted check.101 baseline groups and ten inventory-only details remain; full127 originals and specific49-day/chosen policy gaps remain. Exact source hashes, component commits, worktree metadata, commands, adapters, own receipt hashes and separate author hashes are in `EVIDENCE.json`.

No author log/screenshot/receipt was overwritten. Independent A/B output overrides direct all files here. C started at `7e8f00a…`; Master integrated A while the longer142 run continued, but executed assessment/staff/C file families did not change. A ran at `34d948d…`; B at `05590b9…`; V3 and final invariants at `e2f1082…`. Only the explicit five new detached V3 files were imported, with no older V3 base/engine/config. No real answers, credentials, grants, recovery, generation, protected Alex action, billing, notification, payout, deployment or push was performed by QA.

## Next safe action / completion handoff

**Release NO-GO** remains appropriate for the full Academy candidate: two historical-source failures need current-catalog reconciliation, and broad policy/source/adapter/readiness gaps remain. The passing local dashboard race repair, safe referral-error rendering, pure nonfinancial sharing contracts and detached fictional lookup are useful candidate components, not full launch readiness. A separately reviewed nonproduction integration/PR may preserve these results without authorizing a production release.

Next: Core compare the exact goal policy and entitlement-review ACL chain with the applicable current source/catalog, then define a bounded correction/testing package; Master resolves remaining chosen policy/source and payment/route/admission interfaces and assigns the next finite local fixture slice. Do not weaken assertions, remove financial holds, grant broad permissions, import old worktrees wholesale or change live systems to clear tests. Existing RB-STATIC/RB-APP/RB-DB/RB-FIN/RB-DR definitions remain applicable only through exact later reviewed packages; no rollback was executed here.

COMPLETED: independent actual A/B/C/V3 foundation execution, adversarial probes, unchanged57 input mapped to complete statuses, exact bounded failures retained and release NO-GO documented.

CHANGED: only new QA tests and this Wave2 evidence/report/results/handoff directory. No runtime implementation, schema, migration or shared register edit by QA.

TESTED:388/390 final instances pass;2 actual dated-source SQL failures;66 browser instances; startup failures retained separately. Full57 package counts0/2/43/12 (PASS/FAIL/BLOCKED/NOT_RUN).

SECURITY: actual disposable SQL/RLS and fictional browser negatives; no hosted security certification or real/private data access. Function/asset/build/auth source preservation checks pass; Alex untouched.

DOCUMENTATION: own Wave2 artifacts only; prior initial/source-packet report/matrix and author evidence remain unchanged. Master owns CURRENT_BUILD_STATE and aggregate state updates.

UNRESOLVED: current catalog applicability/remediation for the two failures; missing127/49-day/selected policies; complete route/financial/admission/operational acceptance.

NEXT RECOMMENDED BUILD: narrow current-source policy/helper reconciliation and a subsequent approved correction fixture; continue unrelated finite local work independently.

CHAT HANDOFF: Wave2 independently executed at e2f1082 with388PASS/2FAIL instances; N02 unassigned-Coach goal read and E02 helper EXECUTE failure are real in the pinned historical fixture, not asserted live incidents. Full57 acceptance remains0PASS/2FAIL/43BLOCKED/12NOT_RUN. Exact source/runtime preservation and adapter limits recorded. Keep release NO-GO; review candidate components and reconcile current source/policy before the next bounded package.
