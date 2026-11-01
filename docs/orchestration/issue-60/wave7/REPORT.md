# Wave 7 A — Executable PostgreSQL security checkpoint

LOCAL ONLY; base `38f086792addaa9b131cecaf261ef21f89f5ffc7`, branch `codex/rva-wave7-security-20261101`, worktree `academy-wave7-security`; Issue60. No production query/write, client data, Alex action, grant, release or financial activation. Production NO-GO pending independent QA and compatibility decisions.

## Environment and exact initial execution

Fresh system metadata showed1/32SysV segments, belonging to unrelated persistent PostgreSQL PID991, with31free. The disappearance of prior31unattributed orphan segments is unconfirmed; neither Master nor this lane removed them. The exact accepted Wave6 runner first executed unchanged and independently reproduced allfive strict historical failures. Every owned disposable PG17 cluster used a private UNIX socket, rejected host connections, stopped and removed its own directory, and returned the system to the same PID991segment with zero new IPC. No persistent service, kernel setting or unidentified resource was altered. Full sanitized before/after receipts are retained in each run directory. Exclusive slot released to QA.

The initial combined guard stopped legitimately before correction because the historical fixture overlay retained explicit PUBLIC ACL on two trigger functions while current captured metadata has NULL(default)ACL. New fixture code drops only the two own no-dependency notification functions after dropping their own triggers, recreates them, and restores the exact captured seven trigger/ACL representations. It does not CASCADE or update system catalogs. It also restores the captured service_role private-schema USAGE missing from the historical fixture. These are fictional fixture operations, not proposed production grants.

Two real prepared-SQL guard defects were exposed: captured constraint/trigger definitions used pretty=true, while the SQL guard called default pretty=false. New core proposal changes only `pg_get_constraintdef(oid,true)` and `pg_get_triggerdef(oid,true)`. Every original captured expected hash/definition and security predicate remains unchanged. Original Wave6 files and failed executions are retained.

## Final actual PostgreSQL results

`final-pinned-2/postgres-receipt.json`: 217 assertions,198PASS/19FAIL overall. Eighteen FAILS are explicitly required old-exposure reproductions (nine baseline and nine reverted); one FAIL is an intentionally retained direct-identity-provisioning compatibility hold. Corrected stage:194PASS/1compatibilityFAIL. Do not report217/217PASS.

Five original strict failures: baseline0/5, corrected5/5, revert0/5. They cover foreign check-in read, assignment read, foreign assignment insert, household-member read and guardian update. Unchanged45Wave6 security tests now PASS; unchanged4precise independent denial tests PASS;13usage-concurrency,39Wave4access,8session,9independent allowance,9durable check-in/assignment assertions PASS. The old durable positive omits `created_by` and correctly gets42501 under the actor guard; its original failure remains in `third-combined`. A copied new positive supplies the actual actor without changing original assertions/index semantics. Three local source/format invariants PASS separately.

Newly confirmed source-boundary failures (not production exploit claims): assigned Coach changes CA.user_id; unassigned Coach reads parent household; unassigned Coach changes parent primary_contact_id; assigned Coach changes own CA.household_id to an unrelated parent. Allfour strict probes fail before new identity layer and after exact revert, and PASS after correction. Member leakage is NOT claimed: the existing paid-member predicate remains closed. Thirteen new assertions (12identity boundaries plus1household association) PASS, with legitimate NULL-user onboarding, current membership association, scoped parent update/insert, revocation, actor switches, TRUNCATE denial and helper privilege checks.

## Narrow new proposal

After the exact core predecessor, `identity-household.sql` adds:
- One private SECURITY INVOKER, empty-search_path trigger function with EXECUTE revoked from PUBLIC/anon/authenticated/service_role.
- Three trigger attachments: client_access identity INSERT/UPDATE, parent households primary-contact UPDATE, and early household_members INSERT scope denial before the old invoker validator. The latter retains exact42501 denial, avoiding a safe but different P0001'Household not found' result after parent RLS hides the row.
- Three additive RESTRICTIVE parent household policies, based on active existing staff crm.view/crm.manage and existing primary-contact scope; current member-paid/lifecycle predicates remain.
- Authenticated TRUNCATE revoked on parent households only, preserving trusted-role rights.

Direct authenticated CA user_id/contact_id/household_id transfer is held. Direct INSERT with nonnull account or household association is held pending reviewed source-binding workflow. Membership fields and legitimate existing same-tuple updates remain unchanged. Trusted existing postgres/service-role/SECURITY DEFINER initializers are untouched, not newly authorized. No general EXECUTE, definer bypass, permissive RLS or family sharing is added.

## Compatibility and acceptance holds

The unchanged Wave5 suite is44/45PASS: its old positive direct Coach INSERT restoring a nonnull account binding is now explicitly denied42501. This is an intentional least-privilege compatibility hold, not certified business completion. Public profiles self-update makes profiles mapping unsuitable as proof for arbitrary account-to-contact linkage. An existing audited provisioning path must be positively traced/tested before approving production installation. CRM-only Support/financial holds, household/minor/sharing policies and paid-member positive acceptance remain unresolved. Synthetic Auth GUC/staff suspension/scope tests do not establish GoTrue JWT revocation, MFA, logout or managed-session security. New local SQL is NOT a production-approved installation package.

## Revert, preservation and source integrity

Order: current approved LOCAL Wave3/Wave4 predecessors, Wave5 usage/security layers, current row-free catalog fixture, Wave7 core, then identity-household layer. Regression reverse: identity-household-revert then core revert. It deliberately restores exposure, so it is not the recommended production rollback. Actual rollback and concurrency tests preserve row/notification/allowance consistency. Original methods, policies and audit/permission semantics outside bounded objects are untouched; exact source pins and post-run input hashes are retained.

Generated evidence trailing spaces/tabs only were normalized; all raw variants are retained outsideGit with raw/normalized hashes in EVIDENCE_FORMAT.json. Source/test/SQL bytes in executionInputs were not changed during execution. SOURCE_PINS.json pins every new source file. No production or private data appears in fixtures/evidence.

Next: independent QA reexecutes exact combined suite in its own owned cluster, reviews the explicit provisioning compatibility hold and new safeguards; Master retains all57full-package statuses honestly. No source push, candidate or deployment is authorized here.
