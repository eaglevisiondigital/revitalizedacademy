# RepDB DELETE guard repair — accepted 2026-10-07

**EXERCISE LIBRARY + BETA SYNC FULLY ACCEPTED**

This closes the sole blocker in the existing RepDB hosted release report. No application source, frontend build, Netlify deployment, Edge Function, source dataset, FK, policy, role, permission, Auth, client, payment or content-sync configuration changed.

## Applied forward migration

Source: `20261007220506_repdb_delete_guard_return_contract.sql`.
SHA-256: `1382ce22448e9ff03011071b209ea883ee9e2f4cb1ec0f83bcbdf3e2149f24c0`.

| Environment | Supabase | New hosted ledger | Netlify deploy unchanged |
| --- | --- | --- | --- |
| Production | voalfpxiyznnqfcqcymd | 20261007221345 | 6ac6b471ac8ed68bec8bd8d6 |
| Beta | bvooallokgfktssadsrv | 20261007221355 | 6ac6b620e735903c2285ec3f |

Both hosted ledger entries are named `repdb_delete_guard_return_contract`; MCP assigns the hosted version, so it differs from the CLI-generated source filename. Applied once each, not replayed. Original source migration `20261007201539` and its existing hosted ledger entries remain intact.

## Root cause and exact repair

Confirmed both triggers are enabled BEFORE ROW INSERT/UPDATE/DELETE (tgtype 31). The existing authenticated/anonymous DELETE branch returned OLD, but privileged postgres/service_role fell through to NEW, which is NULL on DELETE. Returning NULL silently suppresses the row operation and can suppress cascades or FK enforcement.

The only behavioral change is the final `if tg_op='DELETE' then return old;end if;` before the existing `return new`. INSERT/UPDATE checks remain byte-for-byte unchanged. Trigger definition, security-invoker behavior, empty search_path, owner and closed function ACL remain unchanged. Archive remains the normal user-facing UPDATE lifecycle. No permissive browser DELETE policy was added; beta's preexisting restrictive ALL paid-access policy remains unchanged.

## Native regression evidence

Native PostgreSQL **17.11**, fresh isolated environment-specific databases:
- Before repair: production 87 passed / 6 failed out of 93, reproducing privileged DELETE, service-role DELETE, missing audit FK enforcement, cancelled methodology cascade, missing workout RESTRICT enforcement and cancelled restriction cascade.
- After final repair: production **93/93**, beta **296/296**, zero skips/failures.
- RepDB database suite **20/20 each**, including **9 new focused DELETE/dependency/security cases each**.
- Source/API/DOM suites **16/16 each**; changed test JavaScript syntax and git diff checks pass.
- Existing frontend/Edge/build release evidence remains in the prior hosted report. No application changes or rebuild/redeploy were needed.

Cascades and dependencies:
- Privileged postgres and service_role delete a disposable imported exercise correctly.
- Methodology CASCADE removes only its disposable exercises; unrelated workouts/programs and methodology hashes remain unchanged.
- Exercise restriction CASCADE removes only its local disposable restriction, retaining its local disposable contact. No hosted client fixture was created.
- Workout reference RESTRICT prevents deletion with SQLSTATE 23503 and preserves the referencing workout/program.
- Source audit mandatory FK still prevents removal until evidence is explicitly retained and its exact QA-only audit row removed. Audit evidence is not implicitly cascaded away.
- Beta polymorphic source mappings have no automatic FK cascade. Explicit ID-bounded mapping cleanup is tested; unrelated mappings are retained.
- Owner/Admin, unauthorized staff, member, inactive/pending staff and anonymous browser DELETE remain denied; normal Owner Archive/Publish remains passing.

## Hosted acceptance and cleanup

Each environment imported exactly one previously absent real RepDB Goblet Squat through the existing protected `exercise_library_server` path with an existing authorized Owner and existing methodology. No new identity, role or methodology was created.
- Production disposable exercise: `1be122c4-151f-489b-b0ba-c734a844ce5c`.
- Beta disposable exercise: `d4a47fe8-9c5a-4ffd-abd6-da9022d18635`.
- Provider slug/version and QA import actor/time audit were verified and exported before cleanup.
- Each had zero workout references and zero private client restrictions. Direct imports do not create production-content-sync mapping rows.
- Actual existing non-owner staff, member, Owner browser and anonymous DELETE attempts were denied in rollback-only hosted checks. The record remained.
- Owner Archive worked in rollback-only hosted checks; original published state restored.
- Attempted privileged DELETE while its audit FK was retained correctly raised 23503 and retained the record.
- After retained audit export and exact one-row audit cleanup, ordinary privileged DELETE affected **one exercise in each environment** with all normal triggers enabled. No replication-role override, trigger disabling or grants were used.
- Fresh queries show **zero remaining disposable exercise, source audit, workout reference or restriction rows**.

Original reusable content row hashes, all policy/FK/table-grant fingerprints, all other public/private function definitions and guard ACL/owner/search-path metadata match before/after. All **176 protected public-table/identity fingerprints per environment**, production **9 private tables**, beta **14 private tables**, and beta sync mapping count/hash match exactly. Original custom beta content remains intact. No unrelated hosted row content changed. QA audit sequence advancement and the explicitly approved migration ledger/function update are expected.

## Evidence and documentation

Workspace evidence: `deployment-evidence/2026-10-07-repdb-delete-repair/`:
- `acceptance-audit-evidence.json`: retained minimal source/actor/time audit; no raw dataset.
- `post-cleanup-verification.json`: migration, hosted denial/cleanup results, content/private metadata and preservation comparisons.
- `RELEASE_REPORT.md`: this report.

Local native logs: `/private/tmp/rva-repdb-delete-red.log`, `rva-repdb-delete-green-production-final.log`, `rva-repdb-delete-green-beta-final.log`. Test databases were disposable and dropped. Local PostgreSQL was stopped after verification.

Supabase security advisors were checked. No new guard-specific issue; existing unrelated legacy definer view/RPC and leaked-password-protection findings remain outside this narrow repair. This package is not whole-project security certification. Existing remediation references: [legacy definer views](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view), [authenticated definer RPCs](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [anonymous definer RPCs](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Repository CURRENT_BUILD_STATE, ARCHITECTURE, SECURITY_MODEL and DECISIONS now record this applied acceptance; the previous blocker report is retained as historical evidence. Migration and test files are preserved in both local release checkouts. No Git push or frontend deployment was performed by this repair task.

## Remaining work

No remaining blocker for the approved RepDB exercise library and one-way beta-sync acceptance. Production remains authoritative; beta edits never write back. No unrelated work started.
