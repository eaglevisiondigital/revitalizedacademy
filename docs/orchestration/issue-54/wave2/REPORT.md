# Issue54 Wave2 - actual Client/Coach contract execution

Date: 2026-11-01. Native Lane B: `/root/platform_scope_audit`. Worktree `academy-wave2-client`; branch `codex/rva-wave2-client-20261101`; runtime/test starting source `fc6737415da36b4306afa0060a525eca2f1131ca`. Production source/deploy are references only; no current operation or private authority was accessed. The earlier discovery worktree is preserved.

## Completed and actual results

Concrete reusable fictional test harnesses now execute existing shipped onboarding JavaScript and actual source SQL/helpers/RLS. Writes are limited to `tests/wave2-client/` and this `docs/orchestration/issue-54/wave2/` directory.

| Execution | Actual result | Scope |
| --- | --- | --- |
| Onboarding DOM | **13 passed / 0 failed** | Actual onboarding HTML/JS, fake Auth/RPC transport; sign-in/verification/claim/signature/hold/reset/stale-account/recovery. |
| Actual PostgreSQL 17.11, baseline_auth | **21 passed / 2 failed** (23 tests) | Restored dated empty catalog + exact authorization repair. Scope helper, Owner override/inactivity, assignment policy, cross-client/household denial, goals/habits/progress and allowance triggers/review. |
| Actual PostgreSQL 17.11, production_hold | **13 passed / 0 failed** | Fresh dated catalog + exact staff-permission helper + exact production lifecycle source. Explicit payment/access holds, expired nonactive prerequisite, unrelated onboarding denial and scoped staff assignment. |
| Chromium 156.0.8078.4 + WebKit 26.5 | **24 bounded browser cases passed** | Six onboarding scenarios x two viewport sizes x two engines. Actual normal onboarding route/environment/JS; all requests locally intercepted; fake SDK/Auth/RPC. |

There are **73 executed test/case instances, 71 passed and 2 failed**, with four shared SQL helper scenarios executed separately in each profile. This is not 73 distinct full user journeys. No tests skipped/todo; PG command intentionally exits 1 for retained strict failures. Full Issue56 case packages remain incomplete.

Receipts: `onboarding-dom.tap`, `baseline_auth-tests.tap`, `production_hold-tests.tap`, `postgres-receipt.json`, `browser-receipt.json`. `results.json` maps exact subtest scope to Issue56's 57-case matrix. Browser results are functional/overflow observations, not visual-brand or screen-reader certification.

## Substantive failures - no unauthorized repair

**L54-F01 / N02 partial FAIL - dated source RLS overexposes goals to an unassigned Coach.** The seeded active, completed, assigned-only Coach B receives one Client A goal through the actual restored `client_goals_select` policy. The same actor's actual `staff_action_allowed('coaching.manage',contact A)` correctly returns false. The old permissive policy checks staff presence and self-client ownership, rather than the scoped helper. The test expects zero rows and remains failing. This is demonstrated on `baseline_auth`, not asserted as the current production state. Current installed policy/catalog metadata and all intervening approved source repairs were not retrieved.

**L54-F02 / E02 partial FAIL - permitted allowance review cannot reach private recalculation.** A current fictional assigned Coach with `coaching.manage` calls actual `public.resolve_coaching_entitlement_review` for its own no-show usage. The call fails SQLSTATE 42501 on EXECUTE of `private.recalculate_coaching_entitlement_used_value`. The actor savepoint rolls back the mutation. Session trigger consumption/release works because the trigger invokes the existing privileged boundary; that does not prove the public adjustment path works. The positive consume/release test is retained failing. A generic unrelated-actor call also denies, but that denial does **not** certify correct contact scope: it can fail at the same private-helper ACL.

These are source-composition findings, not automatic production vulnerability/incident claims. Smallest next step: core/QA compare the exact installed definitions, policies, grants, helper ownership/search path and any later approved repair against these pinned inputs; independently reproduce the current-source subset locally. Any correction must preserve explicit contact checks, lifecycle gates and least privilege. This lane does not grant private EXECUTE, add SECURITY DEFINER, broaden RLS or modify runtime. No assumption that the old baseline equals current production is allowed.

## What the passing subtests establish

- Actual staff permission helper honors explicit Owner deny, inactive Coach denial, assigned contact success and unrelated contact denial. Actual assignment RLS allows scoped Owner/assigned Coach changes and blocks unassigned Coach insert/update.
- In the historical authorized-member profile, actual goal/habit/progress functions operate on the current actor's contact; invalid titles/priority/frequency/targets/metric types/ranges reject. Cross-client goal read/write and habit check-in deny. Different households' raw membership read/update deny; no guardian/minor or same-household adult-sharing policy is inferred.
- Habit check-in retry updates the same day/actor row rather than duplicating it; genuine numeric zero remains zero. Numeric missing progress is rejected rather than converted to zero. These tests do not approve any medical metric or 49-day score.
- Actual session trigger transitions scheduled->reserved, completed->one consumed unit across repeated completion writes, cancelled->released, no-show->review without inferred consumption. Unlimited numeric representation yields NULL remaining rather than synthesized infinity. No selected minute/combined/reset/rollover/freeze/bonus/overage rules are supplied or certified.
- In the separate production-hold profile, fabricated active/onboarding/payment_suspended/suspended/inactive client-access rows cannot obtain paid access without the required bound enrollment. Goal/habit writes and entitlement reads stay closed. An expired completed membership also stays closed **under the existing payment hold**; this does not isolate or certify an independent expiry/reset engine.
- Actual onboarding rendering strips fictional invitation fragments, blocks unverified account claims, clears private context after denied claims, performs one existing claim then context read, displays payment hold, suppresses supplied agreement data for suspended/inactive contexts, clears password/private DOM on logout, rejects stale prior-account repaint, sends exact current signature hash once under duplicate submit and uses ordinary email-verification/signup/recovery flows. Transport results are fabricated; server identity/expiry enforcement is not reimplemented or thereby certified.

## Exact source and fixture custody

`tests/wave2-client/source-pins.json` records SHA256 of the existing empty baseline, synthetic managed-platform scaffold, permission metadata, exact authorization/enrollment source, exact production lifecycle source and unchanged app JS/HTML. The historical source checkout is `revitalizedacademy` at `88ee646c85cad9f5433b97099638582962ea9a7e`; the dated catalog is `supabase/baselines/2026-09-26/schema.sql` there. No customer/Auth/Storage rows are restored. Only permission catalog/default metadata and labeled fictional rows are seeded.

`baseline_auth` restores three explicitly pinned files: platform scaffold, empty catalog, authorization/enrollment repair. `production_hold` uses a **fresh database**, platform/catalog, one exact existing staff-permission function excerpt (hash `7e1dc3596323d4dc73fb734197033e174ee6cb16109abb599ef7e0d4a7cb61ab`) and the single exact production lifecycle SQL file. No migration glob/history, deployed connection, private runner, credential or protected Roadmap migration is used. The source-required active program entry is fictional and creates no payment/client activation approval.

Each PG run initializes its own disposable cluster, disables TCP, uses a unique temporary UNIX socket, refuses non-owned DB/stage settings and stops/removes the cluster on exit. `postgres-receipt.json` confirms cleanup. All role changes occur only inside that new cluster. An initial sandbox shared-memory block required approved local execution outside the sandbox; it did not trigger a production fallback.

Node was 24.20.0; pg 8.16.3 and jsdom 26.1.0 are read from the existing sibling dependency directory with version checks. Playwright is 1.62.1. Its expected Chromium revision was unavailable, so the explicitly selected installed Chromium revision1248 (actual version recorded above) was used; no download/install occurred. Every browser request was intercepted. No actual Supabase SDK refresh/broadcast or managed provider claim is implied by fake transport.

## Initial failures and corrections retained

- First PG attempt was stopped by sandbox shared memory; its class/reason is recorded here. First executable fixture run lacked completed Coach status after the existing insertion trigger, and attempted to apply overlapping signing definitions from two historical files to one database. `initial-fixture-run.log` and `initial-fixture-receipt.json` are retained.
- Second run exposed required achievement catalog/category/program preconditions; `second-fixture-run.log` and receipt are retained. Corrections added only labeled fictional required seeds, completed synthetic staff status, and separate fresh source profiles. No business helper/policy was altered.
- Third fixture run used unsupported synthetic membership status `inactive`; source enum supports `completed`, so that fixture was corrected. `third-fixture-run.log` and receipt are retained. It did not define a new expiry policy.
- Initial DOM signature comparison failed because strict equality compared browser-realm and Node-realm arrays. `initial-onboarding-dom.tap` is retained; normalization compares the same expected signature data, without weakening the expected value/count/hash.
- Initial browser launch pointed to an absent binary (`initial-browser-receipt.json`), and the first fake transport had a syntax error resulting in a timeout (`initial-browser-fixture-receipt.json`). The fake transport is now a separate syntax-checked file; existing application code and expected assertions were unchanged. Sandbox browser launch required approved local execution, with all requests still intercepted.

The two substantive SQL failures above remain failures; no test was inverted, skipped or marked expected-pass to hide them.

## Integration and ownership

Lane A commit `38c16c9baeaa013e867e1230d775c179e91410e4` was inspected read-only for its fixture/API contract. It restores a separate `/member/dashboard.html`, preserves onboarding, adds explicit index link and session epoch guards. It was **not** cherry-picked or edited in this lane. QA/Master jointly integrates and runs the normal-route dashboard cases. This lane's onboarding and SQL evidence must not be marked J10 complete or treated as testing that new route.

No edits to member/portal runtime, Auth, RLS, migrations, shared register, root current-state docs, build/allowlist, assets, financial settings or business policies. Master owns documentation/register integration. Existing production, Alex private source/authority/issuance/report lineage and other worktrees remain untouched. No network production/provider calls, invitations/emails, real money, live private session or client data were used.

## Remaining blockers and next package

1. L54-F01/L54-F02 need current-source/catalog reconciliation and isolated reviewed correction ownership by core/QA; no live metadata claim from this dated fixture.
2. J10 normal Client/Coach route acceptance requires integrating Lane A, not detached script execution. Its current route is still excluded from production allowlist and remains local-only.
3. Rich E02 allowance reset/minutes/combined/rollover/freeze/bonus/overage, exact 49-day curriculum, minor/guardian/private-sharing rules and self-guided/on-demand commercial choices remain specifically blocked by missing selected policy/content. Generic code/test success cannot invent those decisions.
4. N03 organization/tenant isolation was not executed because this lane has no approved current organization fixture; cross-client/contact/household portions only were tested.
5. Full J04/J05 managed Auth/recipient/expiry/server signing and J11/J12 renewal/end-to-end acceptance remain unexecuted. SQL/browser fixtures are useful partials, not operational release approval.

NEXT RECOMMENDED BUILD: QA integrates Lane A+B and independently reruns owned passing and strict failing suites, keeping case-level status partial/fail; core reconciles the two exact SQL findings and proposes the smallest local correction only after locating applicable current contracts. Continue unrelated generic course/activity tests without inventing missing policies.

CHAT HANDOFF: Wave2 Issue54 produced working reusable tests and actual execution: DOM13/13, Chromium/WebKit24/24, actual PG34/36 with two strict dated-source failures preserved. The source scoped helper denies unassigned contacts, but old goal RLS leaks one goal to an unassigned Coach; authorized no-show adjustment hits a private-helper EXECUTE denial. Current installed metadata was not queried, so reconcile before runtime repair. Production lifecycle hold13/13 remains closed. No runtime, migration, production or protected-client change occurred; Lane A dashboard awaits joint QA acceptance.

## Output-only independent-QA revision

After initial local commit `b188a8abd9ed7751ae619d49a74a4498ea7d8d4e`, Master requested independent reruns without overwriting author evidence. PG/browser runners now accept optional `RVA_WAVE2_B_OUTPUT`, retain the previous default, create the selected output directory and record their runner SHA256/output directory. A DOM receipt wrapper uses the same override and executes the unchanged 13 assertions. No SQL input, application behavior or substantive assertion changed.

`runner-output-revision.json` records the originally executed PG/browser runner hashes and final output-only hashes, plus unchanged author receipt hashes. Output-path unit tests passed 3/3. The DOM wrapper ran 13/13 into a separate temporary directory; a PG preflight smoke wrote to its separate override and deliberately failed before cluster initialization because the selected binary path was absent. No PG/browser business retest was performed solely for this output-only change, and the primary 73-instance result above is unchanged. Independent QA should set a fresh override directory; see the test README commands.
