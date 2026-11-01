# Wave4 Issue61 — finite local coaching allowance isolation

**LOCAL TESTED PROPOSAL; production NO-GO.** Base5926b915f60b1be6d009c94362b91356a303cb33, branch `codex/rva-wave4-access-20261101`, worktree `academy-wave4-access`. Owned files only: `tests/wave4-access/`, `proposals/issue-61/wave4/`, this report subtree. Alex remains paused and untouched. No private reads, Auth operations, real rows, production query/write, canonical migration, runtime/Function change, push or deployment.

## Result and evidence

Actual PostgreSQL17.11, fictional identities, ephemeral UNIX socket, no TCP or live credentials. Final runner confirms stopped/removed cluster and unchanged execution inputs. Both suites use the same assertions across each stage:

| Suite | Baseline | Corrected | Reverted |
| --- | --- | --- | --- |
| Main isolation/integrity/concurrency40 |17PASS/23FAIL|40PASS/0FAIL|17PASS/23FAIL|
| Critical session-entry8, separately retained |4PASS/4FAIL|8PASS/0FAIL|4PASS/4FAIL|

No skips. The prior complete40-case checkpoint is preserved separately. The new8-case file is separately hashed in the receipt, as are main tests, fixture and forward/revert SQL; execution rejects input drift. Baseline means **current metadata plus accepted LOCAL Wave3 RPC correction**, not the installed production routine. Master captures from15:07/15:09UTC on November1 and all Wave3 source pins are reused unchanged. No historical authorization repair is presented as current. Historical empty schema/platform/lifecycle sources supply dependencies; managed Auth is fictional, not GoTrue/live session certification. Wave3 raw/default ACL equivalence limitations remain.

The original three strict direct usage SELECT/UPDATE and coaching allowance UPDATE failures now pass locally. Added evidence covers direct INSERT, scoped positives, forged valid-FK tuples, wrong membership/program, actor spoofing, pending/suspended/inactive/null actors, explicit permission/role changes, complete cache totals, shared partial visibility, reassignment across existing scope channels, replay/rollback, no-entitlement session tracking, null sessions, safe abort and preexisting-data gates. Current paid Client access remains held; no fake positive overrides the exact payment predicate. No whole57-case promotion follows.

## Exact proposed boundary

The proposal layers on Wave3; it is **not a standalone production installation package**. Five new private postgres-owned SECURITY DEFINER functions have fixed empty search paths:

- `wave4_membership_allowed(uuid,text)`: read-only boolean authorization predicate; actor exclusively `auth.uid()`, active existing staff/permission/contact helpers, only `coaching.view` or `coaching.manage`. Requires scope over all existing membership primary, client_access, session and ledger contacts. Only this new function grants authenticated EXECUTE, because restrictive RLS needs to evaluate it. It exposes no row/identity/amount and cannot mutate anything. Missing/partial scope returns false. No anon/service shortcut.
- `wave4_usage_before()`: trusted row trigger validates authoritative session contact/membership/key, optional entitlement membership/key and explicit contact-membership relation; forbids bound usage transfers; derives updated_by from authenticated actor; locks sorted OLD/NEW membership/key advisory keys and the authoritative session FOR SHARE.
- `wave4_usage_after()`: trusted row trigger recalculates each distinct affected key using the existing private aggregate helper, bypassing caller-filtered ledger visibility. No browser callable aggregate endpoint.
- `wave4_entitlement_before()`: coaching-only derived-cache integrity and sorted key locks. Direct fabricated used_value and referenced binding transfers reject. Non-coaching counters return unchanged.
- `wave4_session_binding_before()`: session INSERT/tuple UPDATE requires primary contact or explicit matching client_access affiliation for a nonnull membership. Existing session usage cannot transfer. NULL membership remains nonconsuming. Household-only affiliation is not inferred.

Four new triggers install those functions on usage BEFORE/AFTER, entitlement BEFORE and session BEFORE INSERT/tuple UPDATE. All trigger functions have postgres-only EXECUTE, no authenticated/anon/service direct grants. The existing private recalculation helper retains signature/owner/definer/search path/postgres-only ACL; it adds matching advisory serialization and rejects a zero-row update when a target exists, while preserving legitimate missing-entitlement tracking.

Six additive restrictive policies scope usage SELECT/INSERT/UPDATE and coaching entitlement SELECT/INSERT/UPDATE. Existing permissive and restrictive lifecycle policies remain exact. Entitlement policy clauses explicitly pass through `entitlement_key<>'private_coaching'`; unrelated modules retain existing permissions/behavior. A positive regression preserves non-coaching broad staff access and counter updates. That exposure is **unreviewed**, not fixed by this package.

The public review RPC remains SECURITY INVOKER with existing owner/ACL/search path and validation/scope/actor contract. Its unsafe caller-filtered SUM and early entitlement row lock are removed. It fails closed if its conservatively scoped allowance is unavailable; the trusted ledger trigger recalculates the full consumed-unit aggregate. Existing session sync helper stays byte-identical. Session transfers that its upsert cannot keep consistent reject rather than enabling unapproved transfers.

## Critical session-entry closure

Independent QA identified the bypass: assigned Coach inserts own contact session against an unrelated membership; existing private sync bypasses usage RLS and charges that membership. Eight new assertions test completed/scheduled denial, normal primary relation, explicit ready/unpaid client_access nonprimary relation, nullable session preservation, null-to-unrelated tuple update denial, rejection of a legacy forged session during direct ledger insert, and installation preflight rejection. The relation guard is enforced at session entry, usage validation and preexisting-data gate. Shared fixture declares its explicit affiliation; it never invents family sharing or paid access.

No program-transfer/household/minor/49-day/reset/no-show/overage policy was selected. Ambiguous household-only or historical affiliation cases fail closed and require a separate decision. Future changes to shared membership/access relationships need coordinated acceptance; these tests do not certify every external relationship mutation race.

## Locks, guard and rollback limits

OLD/NEW advisory keys use stable membership UUID + entitlement key ordering. Usage then locks its session FOR SHARE, preventing a concurrent first insertion and session move from both validating stale tuples. Aggregate recalculation is VOLATILE and reads the complete ledger after acquiring the key lock. Three-backend direct/RPC/session writers verify exact final totals; opposite OLD/NEW transfers verify consistent key acquisition and rejection.

**Concurrency remains operationally BLOCKED:** the natural session-row then usage-row order opposes a direct usage-row then session-share order. Actual tests observe a safe deadlock/timeout abort, rollback integrity and an explicit subsequent retry. A passing safety assertion does not make normal competing writes universally available. An approved application retry/lock-order design and independent review are still required before production readiness.

Forward/revert use transaction-local5s lock/30s statement bounds. Existing source/security hashes and new object collisions are checked; current policies and private ACLs are pinned. Forward integrity checks refuse preexisting invalid session affiliations, malformed usage tuples and inconsistent coaching cache values, with **no repair/backfill**. Those checks were tested using bounded fictional legacy-state injection with origin restored before actual actor operations. No real rows were inspected; preflight success on production is unknown. Full guard hardening/release integration is Master/QA-owned; this local layered proposal is not installation authority.

The local revert restores known broad boundaries and stale direct-update behavior. It is regression proof, **not a recommended production rollback**. If ever installed, prefer a separately reviewed forward correction or fail-closed response; do not restore known exposure automatically. Revert changes definitions/policies/triggers, not historical usage data.

Preserved receipts include initial7/20, first corrected20/20, expanded36/37 with a harness commit-order timeout, a guard correctly stopping baseline-contaminated fixture data, an initdb shared-memory resource failure, and final complete comparisons. Fixture scheduling was fixed without changing assertions; corrected stage now starts from a fresh pinned database. No unexplained IPC segment, persistent server or kernel setting was touched.

## Remaining acceptance and next checkpoint

Issue61/E02 remains **partially verified, not fully resolved**. N02 gains passing coaching direct-boundary evidence; no whole cross-org/Family/paid Client package is accepted. Non-coaching isolation, real paid member positives, shared/family policy, lifecycle resets/expiry/overage, full immutable audit and universal concurrency remain held. Independent QA must rerun both suites, its own entry-path probes and inspect internal privilege/guard scope on the exact commit.

Next safe work is bounded independent QA and an explicit application retry/lock-order package, followed by separately reviewed scope decisions. Any production action requires fresh verified metadata, separately authorized real-data integrity preflight, exact reviewed integrated SQL and explicit Owner approval. Nothing here authorizes migration, live DML, grant issuance, Auth/report/private client work, deployment or financial activation.
