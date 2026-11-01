# Wave5 Issue61 — security checkpoint

**LOCAL TESTED; PRODUCTION NO-GO.** Base024b1c20c802ce6a9470fc46fabdd3bae75ed980, branch codex/rva-wave5-security-20261101, worktree academy-wave5-security. No production query/write, private Alex read, grant, report, migration, deployment or financial action occurred. All changes are owned tests, local SQL proposals and this report subtree; no existing source was edited.

## What changed

The original three direct-table allowance failures were already fixed by accepted LOCAL Wave4, not installed in production. We independently reproduced their pre-Wave4 failure and their continued success under exact Wave4 before new work.

New actual PostgreSQL17.11 fictional tests proved a scope bootstrap: broad current client_memberships UPDATE permits an unassigned Coach to set assigned_coach_id to self; the existing trusted assignment trigger then grants legitimate helper-based access to that client's usage. Broad client_access UPDATE permits an assigned Coach to link an owned contact to an unrelated membership; the otherwise-valid explicit relation lets the existing session path consume the unrelated allowance. An explicit-ready probe also permits an unassigned Coach to alter another access.user_id. The previous active-status probe had hit the correct payment hold; it was not proof of identity validation.

The minimum local correction adds six RESTRICTIVE policies on client_memberships and client_access. Staff reads use existing active/crm.view/contact scope; exact current self-member/user branches and lifecycle holds remain. Writes use existing active/crm.manage/contact scope with both OLD USING and NEW WITH CHECK. A nonnull access membership uses the already-accepted actor-bound complete-participant boolean helper, avoiding recursive table-policy lookups. No helper, public definer, EXECUTE grant, permissive policy, role default or canonical migration is added or changed.

A separate real fictional SQL TRUNCATE probe proved row security alone could not prevent erasing the usage ledger and leaving its cache unchanged. Exactly four additional authenticated TRUNCATE rights are revoked, on coaching_entitlement_usage, membership_entitlements, client_memberships and client_access. Tests require actual42501 denial for each table. Every other table privilege and postgres/service_role TRUNCATE remains unchanged. This is an SQL-role capability finding; no exposed PostgREST TRUNCATE endpoint or real production exploit was asserted.

## Executed evidence

| Stage | PASS | FAIL | Meaning |
|---|---:|---:|---|
| Three historical direct assertions before Wave4 |0|3|Known failure retained |
| Accepted LOCAL Wave4, expanded45 |27|18|New strict scope/privilege gaps reproduced |
| Wave5 correction, same45 |45|0|Current author security assertions |
| Original Wave4 safety suite |40|0|Unchanged regressions under combined policies |
| Original Wave4 session-entry suite |8|0|Unchanged regressions under combined policies |
| Local Wave5 revert, same45 |27|18|Same known failures restored |

No skips. Current corrected checks93PASS; across repeated before/after/revert executions147PASS/39FAIL, with every39 expected historical/reverted failure labeled. Two diagnostic cases deliberately prove the baseline self-assignment/foreign-charge chains; guard and compatibility holds are within45, not additional business journeys. Actual session actor switches, missing/overridden permissions, active/inactive/pending states, Owner/Admin/Coach scoped positives, wrong-Coach RPC denial, INSERT/UPDATE spoofing, contact/task/assignment bootstrap denials, rollback and private function ACLs are covered.

The final receipt pins every executable input, exact predecessor metadata/scaffold files, PostgreSQL version and before/after/revert counts. Cluster stopped and removed. No other server, IPC segment or kernel setting was changed. Earlier42P17, paid-hold fixture-positive and guard-probe-ordering failures are retained separately with source snapshots. Fixes preserved the assertions: invoker recursion was removed using the existing approved boolean, legitimate positives explicitly use ready instead of bypassing the current active/payment hold, and a helper-drift test now isolates that exact guard from the already-installed policy collision check.

## Compatibility and security limits

- Existing CRM-only Support access updates involving a membership fail closed because the reused helper also requires coaching.manage. Financial-only direct membership writes formerly admitted by broad staff policy now fail closed. These are explicit conservative compatibility holds, not approved final business policy or complete onboarding acceptance. Original postgres-only onboarding/assignment routines and trusted-role rights remain unchanged; end-to-end privileged onboarding is not certified.
- The exact current payment predicate remains SELECTfalse. No fictional paid-member override makes a future business case pass.
- Family sharing, minors, household historical amendments,49-day program policy, allowance resets/overage and non-coaching data isolation were not invented or accepted.
- Managed Auth revocation/MFA/JWT routing, real service integration, full business journeys and hosted acceptance are not proven by synthetic SQL identities.
- LaneB owns usage/session lock and retry changes. The security policies change none of those functions. Independent QA must test the combined exact source, including target table ACL changes.
- No complete57 integration package is marked PASS by this partial author evidence. All101 requirements,10 source-detail groups, existing design/runtime assets and13Functions remain unchanged.

## Hashes, release and reversal

Forward proposal SHA256:3c3ed1f351e8ffdc687f80fdbf4455197c752e4b988c80a89ed64df39f1e55a8.
Local regression revert SHA256:083009a044252580062653de07c1af885047a9e7ae074a950d60cf5f233b5c01.
See proposals/wave5-security/manifest.json for exact six policy/four privilege inventory. Source is layered on accepted LOCAL Wave3/Wave4; it is not a standalone production installation package. Forward pins original relationship policies, all four target ACLs and relevant helper definitions, and rejects collisions. No real-data integrity preflight was run.

The local revert drops only the six new policies and restores only the four removed TRUNCATE rights. It reproduces known unsafe capabilities, is not a recommended production rollback, and must not be applied to production. Prefer a separately reviewed forward correction or fail-closed response. Historical records are not rewritten by either proposal.

Next: independent combined-source QA, explicit compatibility decisions for supported staff onboarding, current catalog and protected no-data-leak integrity preflight, integrated migration/release packaging and exact separate Owner approval. PR59 stays DRAFT; source remains local/unpushed. Alex remains PAUSED with no private activity.
