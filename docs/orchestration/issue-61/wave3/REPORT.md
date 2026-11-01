# Issue 61 — local allowance review correction

November 1, 2026. **VERIFIED-LOCAL for the narrow RPC correction; wider E02/security acceptance remains HELD.** No hosted query/write by this lane, canonical migration, grant, Auth change, deployment, real-client operation or private source/report operation.

[Issue 61](https://github.com/eaglevisiondigital/revitalizedacademy/issues/61). Worktree `academy-wave3-allowance`; branch `codex/rva-wave3-allowance-20261101`; accepted base `fad394ef683b711ba34866ec614bed71a26cee93`. Master authorized only tests, proposal SQL and this report subtree. Shared build-state/security documents are reserved for Master integration.

## Current evidence and call graph

Master's metadata-only capture on verified RVA project `voalfpxiyznnqfcqcymd` was observed at **2026-11-01T15:07:11.086986Z**, server17.6; supplement at **15:09:32.301961Z**. Raw wrapper SHA256 `26018c0d318252c775c6c059999e2d82371fddfdf6d83b6559abc8de12cd4ad9`; normalized SHA `94322f192cda7bdaeae45c7fb2137745933bf66eef2816467c012f41d380e757`; supplement SHA `7cc1fb4f753edc6eb703212f2ee9970c0d0f8607758663a07f84f49a15227c94`. These are dated metadata observations, not current customer-operation certification. Full captures remain outside Git.

The current public review RPC is SECURITY INVOKER, postgres-owned, `search_path=public, pg_temp`, EXECUTE postgres/authenticated/service_role. Its direct private recalculation call fails for authenticated callers: the helper is postgres-owned SECURITY DEFINER with postgres-only EXECUTE. Current usage and entitlement tables have **no user trigger**. The session trigger separately upserts usage and calls that helper under its existing definer boundary. Therefore removing the explicit recalculation alone would leave the review path stale. Session status audit/preparation triggers do not run when review updates usage directly.

The current usage policies grant global SELECT by `coaching.view` and INSERT/UPDATE by `coaching.manage`, with restrictive lifecycle access. Entitlement staff branches check staff existence with the lifecycle restriction. Existing contact scope is available through `private.staff_action_allowed(...,contact_id)` but was not applied by the original review RPC. A generic helper 42501 was never proof of wrong-Coach contact-scope enforcement.

## Tested correction and compatibility

`proposals/issue-61/correction.sql` preserves the RPC signature, invoker security, owner, ACL and search path. It keeps original resolution/reason validation and actor/reason/timestamp writes, reuses the existing scoped permission helper on the server-selected usage contact, requires global `coaching.view` to prevent partial-visibility totals, locks usage then target entitlement, and performs the exact existing SUM of consumed usage units under caller RLS. Missing/invisible entitlement fails before ledger mutation; aggregate UPDATE must affect exactly one row or the transaction rolls back. No private EXECUTE grant or new SECURITY DEFINER boundary exists. Master specifically approved these fail-closed checks and bounded scope predicate.

No allowance status, unit, limit/reset/rollover, no-show, hold/payment or lifecycle rule was changed. Retry preserves one usage row and total; original behavior updates its review actor/reason/timestamps rather than making an immutable correction history. The existing possibility that a later session status write can rederive usage remains unchanged. The correction does not create a financial or immutable entitlement ledger. Session reserve/complete/cancel/no-show triggers remain exact.

Guarded correction and revert check expected function definitions/security metadata, existing scope/lifecycle helpers, session trigger routine bodies, target RLS/policies/ACLs and caller role boundaries. Nullable metadata uses `IS DISTINCT FROM`. They reject drift before replacing the RPC. Revert restores only the original function; it restores the original broken authorized-review behavior and preserves any committed ledger rows. It is not a data undo or permission cleanup.

## Actual execution

The final author run uses actual **PostgreSQL17.11 Homebrew**, an ephemeral UNIX-socket-only cluster, fictional `example.invalid` identities and current SQL. Cluster stop/removal is confirmed in the receipt. No browser or GoTrue/live JWT session was used.

| Execution | Result | Meaning |
| --- | --- | --- |
| Original current RPC | 23 PASS / 7 FAIL of30 | Seven authorized paths fail42501 on private recalculation |
| Corrected RPC | 30 PASS / 0 FAIL | Bounded review/metadata/security/rollback/concurrency assertions pass |
| Reverted RPC | 23 PASS / same7 FAIL | Exact function-only revert reproduces original failures |
| Separate strict direct boundaries | 0 PASS / 3 FAIL | Unrelated Coach direct usage read/update and allowance update remain exposed in this fixture |

The 30 include Owner/assigned-Coach success, unrelated Coach and wrong-Client denial, Client/anon denial, pending/suspended staff, suspended Client, expired/completed membership Client denial, different-program total isolation, full multirow/multiunit aggregation, no-show review, reserve/consume/release/retry, blank/invalid/missing-record validation, missing entitlement, explicit UPDATE denial, injected zero-row UPDATE rollback, null-config/helper-definition guard drift and a two-connection lock wait. Concurrency observes the second PostgreSQL backend waiting on a real lock before first commit, then verifies both committed units. It proves two public review operations, not every cross-trigger booking race.

Expired/suspended Client cases establish no review authority; they do **not** prove an expiry scheduler or a business policy for staff corrections after membership expiry. Aggregate4 versus configured limit3 records the existing aggregate behavior; it does not approve overage. Missing `coaching.view` is fail closed. Two historical Wave2 strict assertions remain byte-identical in their original files; the authorized-review and unrelated-review requirements are also retained in this suite. The separate goal-policy failure belongs to the disjoint goal lane.

## Equivalence limits and retained failures

Historical empty schema SHA `60f38f157e338cce445e2ca391b1988a69c0586dfed9b289283380f3f3e9edc6`, platform scaffold, and exact published lifecycle migration supply dependencies only. Current overlay replaces40 relevant routine definitions and14 supporting-table policy/trigger/ACL sets and adds captured current support columns. Three target tables' complete column and constraint metadata and session trigger definitions are checked. Current permission catalog flags,95 defaults and40 legacy reference grants are captured metadata; fictional per-user overrides create the nominated permitted Coaches. No historical authorization repair is substituted for current installed helpers. No seed trigger bypass was needed.

Critical public/private/scoped-helper raw ACLs match. Three noncritical notification/membership trigger helpers differ only as captured NULL/default versus explicit default ACLs. PostgreSQL `aclexplode` with `acldefault` verifies exact effective grantor/grantee/privilege/grantability sets; raw differences are recorded. This is **not** a claim that all40 raw ACL representations are identical. The local postgres fixture owner is superuser whereas hosted postgres is not; both bypass RLS, while actual actor operations use non-superuser authenticated/anon. Managed Auth/session and unrelated side effects are not certified as a hosted replica.

Preserved history: sandbox shared-memory preflight stopped before tests; first run had24 fixture setup failures from a missing captured supporting column; first complete comparison was18/24 +6 failures, corrected24/24, reverted18/24 +6 failures. Expanded raw-ACL reconstruction failures are retained separately. They are setup/equivalence findings, not silently converted product passes. Final receipts pin runner/test/proposal/current-input hashes and refuse input drift during execution.

## 57-case mapping and remaining work

- **E02: HELD/FAIL at whole-case level.** The public review defect is corrected locally; direct ledger/allowance scope failures, unapproved modes/reset/expiry/rollover/bonus/no-show/overage and broader lifecycle/concurrency cases remain.
- **N02: FAIL at whole-case level.** Scoped RPC denial now works; direct table read/update strict negatives still fail. The unrelated goal lane is separately required.
- **N01/N04/N06: passing partial evidence only.** No private-helper EXECUTE expansion; existing explicit/scoped/lifecycle gates exercised. No complete Owner authorization, cross-org model or real paid membership acceptance claim.
- **J03/C02/F02 and all other macro IDs:** no completion promotion from these tests. No invented49-day/minor/Family/privacy policy.

Next separately reviewable local package: pin all direct usage/entitlement policy branches, propose contact-scoped restrictive rules or an approved bounded write boundary using existing contact authority, preserve legitimate Owner/assigned Coach/member reads, then run direct SELECT/INSERT/UPDATE, forged contact/membership/program and cross-trigger races. This report makes **no automatic policy edit**. Whole E02 remains held until those strict failures and missing policy choices are resolved.

## Exact production approval scope

No production approval is requested by this completed local package. Before any hosted action: independent QA must accept the exact proposal hash, current metadata must be recaptured with guards passing, scope/blockers must be disclosed, and the Owner must explicitly approve the exact function-only forward SQL (plus exact revert) against verified RVA project. Such approval would authorize only the named RPC replacement; no helper ACL, SECURITY DEFINER, direct-table policy, membership data, Auth, deployment, paid activation, source/report or private-client operation. Shared migrations/release integration remain Master-owned. The three direct-path failures currently prevent claiming the wider package release-ready.
