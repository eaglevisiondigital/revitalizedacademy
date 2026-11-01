# Wave 3 — independent integration QA

Issue 56. This native QA agent independently executes the exact local source in `academy-wave3-qa`, branch `codex/rva-wave3-qa-20261101`, from accepted Wave 2 checkpoint `fad394ef683b711ba34866ec614bed71a26cee93`. Final tested source and evidence-commit SHA are recorded in the handoff. PR 59 remains DRAFT / PRODUCTION NO-GO.

The goal and allowance checks use Master's dated metadata-only production captures and disposable local PostgreSQL 17 clusters. QA made **zero production API/database calls or writes**, queried no real-client data, and sent no messages to guests or clients. No hosted grant, migration, deployment, payment or report operation occurred. Capture integrity and fixture lineage were checked independently; raw captures remain outside Git.

## Independently executed

The machine-readable [EVIDENCE.json](EVIDENCE.json) gives exact totals, tested source, repeated assertion counts and each evidence hash. [RESULTS_MATRIX.json](RESULTS_MATRIX.json) retains every original 57-case ID and keeps full-package outcomes separate from passing component coverage.

- **Unaffected implementation: 40/40 assertions PASS.** Actual member script/DOM operations and detached V3 regressions contribute 25; 15 QR/share cases include four independently decoded direct PNGs and six Chromium/WebKit browser cases at 1440/768/390 CSS pixels with independently decoded rendered QR screenshots. One of the 25 cases deliberately reproduces the accepted-base weekly-checkin race; it is expected historical failure evidence, not a current behavior pass.
- **Independent QA probes: 12/12 PASS.** Pending revoked/expired/wrong-account QR responses, out-of-order results, non-OK responses, repeated same-account renewal, switched-away-and-back member identity, frozen V3 source/citation approval, handler-only diff, protected source preservation, and exact 101/10/57 inventories.
- **Independent metadata lineage: 3/3 PASS.** Five private Master capture hashes are pinned; all checked-in allowance subset table/routine records and the goal fixture's selected 25 tables, invoker view and 80 routine records match the current captures exactly. The SQL fixtures additionally verify effective ACLs and critical raw ACLs inside PostgreSQL.
- **Allowance current-original: 23/30 PASS, seven FAIL. Corrected: 30/30 PASS. Reverted: 23/30 PASS, the same seven FAIL.** The strict original/reverted authorized paths fail `42501` at the private helper; this is a reproduced defect, not a passing live workflow. The proposed public RPC stays invoker, retains its owner/signature/ACL, and adds scoped checks, row locks, exact visible aggregation and a one-row update requirement. No private helper EXECUTE grant or new definer function was introduced. Correction SHA256 `abceb1378897461bb4faa57fd69acddb60611132924a593c8a33cc5684136908`; local revert `a85c273c02a070373eb698283c1926866cad4d6697f293c022cf9c4a78c62828`.
- **Strict direct allowance boundaries: 0/3 PASS, three unresolved FAILs.** An unrelated fictional Coach with the nominated coaching permissions can read another fictional Client's usage, update that usage, and edit that Client's allowance under the reconstructed current policies. Fictional per-user overrides provide those permissions; no production staff-user/override rows were queried, and no live exposure is asserted. These strict assertions are retained unchanged. The runner's successful original/corrected/revert comparison does not suppress these failures or mean overall security PASS.
- **Current goals: original 29/35 PASS, six FAIL; corrected 35/35 PASS; reverted 29/35 PASS, the same six FAIL.** [A-pg/PG_RESULTS.json](A-pg/PG_RESULTS.json) independently verifies 25 current table definitions/security/constraints/triggers, 80 routine bodies/security, four role attributes and the invoker view. The local policy denies unrelated contact/household reads, inserts, updates and reassignment while preserving legitimate Owner/assigned Coach actions. All original policies, owner/ACL, constraints, triggers, helper bodies and payment hold remain exact. Original/revert drift and replay checks PASS; no production policy was applied. Proposal SHA256 `06834387bf3106298a0b072dfd1d5a5080c8b61f13a335b1d1e08abc122b17b6`; guarded local revert `ba588ced2b29433d419e4067714562b1e0f166f5e9c8d0cb3b82f451033655b7`. The revert deliberately reproduces known broad access; production should hold/fail closed and forward-repair, not blindly restore that exposure.

Both PostgreSQL runners start a **new UNIX-socket-only cluster**, reject TCP authentication and remove their clusters after the three successive schema states. They do not accept a production database URL. Corrected allowance concurrency observes a real second backend waiting on a PostgreSQL lock; zero-row update faults, missing entitlement, explicit update denial, outer rollback and helper/config drift are exercised. This is narrower than a complete booking/trigger concurrency certification.

## Security and evidence limitations

The three direct-table failures remain release blockers for **N02 and E02**. The narrow allowance RPC repair is not a substitute for direct-table access control. Next local policy work needs SELECT/INSERT/UPDATE coverage, forged contact/membership/program relations, legitimately assigned Coach/Owner access and preserved lifecycle holds. No blanket permission grant is justified.

Managed Auth/JWT/session transport is fictional plumbing in the SQL/browser fixtures. These are current-catalog-equivalent bounded tests, not a hosted copy, live exploit demonstration, real paid-member acceptance or real session-revocation certification. Historical empty schemas supply dependencies only; relevant current bodies/policies/security metadata are overlaid and asserted. Local PostgreSQL is 17.11, hosted metadata reports 17.6. The allowance cluster's postgres is a superuser; the goal cluster uses a separate fixture_admin and restores the captured four role attributes. Actor operations explicitly SET ROLE to non-superuser authenticated/anon.

Three noncritical allowance helper ACLs are captured NULL/default and reconstructed explicit defaults. PostgreSQL `aclexplode(coalesce(proacl,acldefault(...)))` proves equal effective grantor/grantee/privilege/grantability sets; raw differences remain in the JSONL receipt. Critical public/private/scoped-helper ACLs match raw. No claim that every raw catalog representation is identical is made.

The exact current payment helper remains `SELECT false`; a fictional enrolled Client cannot be declared positively operational by replacing that hold with true. Goal policy tests distinguish the self-contact predicate from the independent paid-access gate. Household membership alone grants no new adult access. No family/minor, 49-day curriculum, allowance-reset/overage, financial or methodology policy was invented.

The real QR preview is a loopback fictional tool, not authenticated production Share Center functionality. ReportLab/Pillow encode the QR, macOS Vision independently decodes it; no dependency download or user browser profile was used. The existing affiliate helper and detached V3 adapter hashes remain unchanged. All receipt text is invented and no unapproved intake was promoted. The only member runtime diff is inside the weekly-checkin handler.

Initial sandbox EPERM/framework launch failures and QA's two fixture-construction errors (handler delimiter, extra synthetic verifier response fields) are retained separately. The result writer's initial comparison used `caseId` for the original matrix's `id` field; its fail-closed assertion caught that schema difference, which was corrected without changing any IDs. The corrected fixtures did not weaken application expectations; final results above come from successful fresh executions. Author setup histories are preserved in their own evidence subtrees.

## Progressive 57-package position

**0 PASS / 2 FAIL / 43 BLOCKED / 12 NOT RUN.** N02/E02 now point to current-equivalent direct-table failures, rather than merely grandfathering historical Wave 2 findings. Passing QR, member, source, concurrency and local correction subsets are explicitly linked. None completes the full platform journey or overrides a business/security gate. All 101 requirement groups, ten source-detail groups, ten workstreams and 57 macro-case IDs remain present.

Source checks preserve canonical migration, Function, protected Roadmap/portal, approved asset/style and production configuration families relative to the accepted checkpoint. This demonstrates local source preservation and zero QA production writes; it is not an independent read of every production report or registration. Master's separate canonical read-only check supplies production deployment evidence.

## Reproduction and next checkpoint

Use the bundled Node runtime, installed PG17 and sibling `revitalizedacademy/node_modules/pg` 8.16.3. No network package installation is required. Output overrides prevent modifying author evidence:

```sh
node --test --test-reporter=tap tests/wave3-unaffected/member-operations.test.cjs tests/wave3-unaffected/v3-regression.test.cjs
RVA_PREVIEW_PYTHON=/Users/davesmacbookpro/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 node --test --test-reporter=tap tests/wave3-unaffected/qr.test.cjs tests/wave3-unaffected/preview-browser.cjs
node --test --test-reporter=tap tests/wave3-qa/adversarial.test.cjs tests/wave3-qa/catalog-lineage.test.cjs
RVA_WAVE3_B_OUTPUT="$PWD/docs/orchestration/issue-56/wave3/B-pg" node tests/wave3-allowance/run-pg.cjs
RVA_WAVE3_GOALS_OUTPUT="$PWD/docs/orchestration/issue-56/wave3/A-pg" node tests/wave3-goals/run.cjs
node tests/wave3-qa/summarize.cjs
```

Native Vision/browser execution and local PG shared memory may need the normal sandbox exception. Only fictional local surfaces are exercised. The goal output proposal copies are evidence; do not apply them to production.

Recommendation: **GO for continued isolated implementation and integration review; NO-GO for production permissions or release.** Continue the narrow direct-table scope correction and progressively run remaining cases. No new Owner authorization is needed for already approved local engineering. Any later live RLS/RPC change needs exact current integrity/compatibility/rollback evidence and separate explicit Owner approval. Do not deploy or merge PR 59 to production.
