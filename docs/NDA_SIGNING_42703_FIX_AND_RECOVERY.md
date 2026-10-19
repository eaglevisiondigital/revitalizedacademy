# Staff NDA signing: tested trigger repair and separate evidence-backed recovery

Status: **tested draft PR #50; production migration and recovery both HELD**. Continues [Issue #49](https://github.com/eaglevisiondigital/revitalizedacademy/issues/49) and PR #50 starting at `02278e8a03f3d5b4d138ee07ea7b89abd3f4bcac`. Staff identifiers, signatures and original timestamps must remain private.

## Root cause and live schema

Deployed `staff-agreement-sign` v5 returns HTTP 500 / SQLSTATE `42703` when its agreement update invokes `private.sync_staff_onboarding_from_agreements()`. The shared SQL CASE dereferences `NEW.staff_agreement_id` on `staff_agreements`, which has no such column. Native PostgreSQL 17 reproduces the error. PR #29's NDA-modal correction is a separate client repair and remains untouched.

The function has two **AFTER ROW** trigger bindings: `staff_agreements` INSERT/DELETE/UPDATE OF status,required; and `staff_agreement_acceptances` INSERT/DELETE/UPDATE. The repair uses separate table/event statements, `OLD` on DELETE and `NEW` on INSERT/UPDATE. During a parent cascade, acceptance deletion can no longer find the deleted parent; the parent agreement trigger handles recalculation. Trigger registrations remain unchanged. Onboarding-only staff updates do not invoke the separate role/status NDA-issuance trigger.

Native testing also exposed an existing constraint conflict: staff onboarding permits only `pending`, `complete`, `waived`, but the original declined branch produces `blocked`. Required declined agreements now produce **pending**, which the existing Coach permission helper denies. No new state, permission or constraint is introduced. Inactive staff keep their existing onboarding; any unsigned required agreement keeps active staff pending.

## Exact migration and artifacts

`supabase/environment-migrations/production/20261018194500_staff_agreement_trigger_42703_fix.sql`

| Artifact | SHA256 |
| --- | --- |
| Migration bytes | `c78a502c0cac7b2cc4277bff467e0d6b331dce5b20bbba64997093545530bf61` |
| Required original function body | `46703cca16ab2bb8e6b4302b0838479a2ce067ded19f2118f5cbb8ead53d0c3f` |
| Repaired function body | `5adb9b593dd4f0540ff281a73020501b5e3ee020d4b41d891427825df36e0363` |
| Observed live Edge v5 source fixture, 6,560 bytes | `b4d27ebcd4fe97907be64f1b79d2b6999cd1675a3c36c1ad63d1189e5482ebbd` |

The migration transaction checks the original body digest and exactly two expected attachments, then replaces **only** this private trigger function. A repeat or drift fails before replacement. Owner, ACL, SECURITY DEFINER, fixed search path, trigger definitions, RLS and permissions remain unchanged. No existing staff/agreement/acceptance row is updated automatically. Apply only through the separately authorized migration mechanism and record its actual hosted ledger ID; do not assume the filename becomes the ledger ID.

## Private recovery readiness

Read-only production checks privately resolve exactly one existing active Coach account, its precise required agreement and one stored typed acceptance. Accepted terms, signer/account identity, original timestamp and template/rendered-content evidence match. The agreement remains unsigned in Sent/Viewed state, onboarding pending, with no other required agreement incomplete. Existing private audit history is present.

Exact target bindings and the whole-acceptance digest are held privately for the operator, never in GitHub, fixtures or logs. Revalidate immediately before execution. These findings authorize **neither** production action. Do not ask the Coach to sign again: the genuine acceptance already exists.

## Guarded recovery procedure

`scripts/reconcile-staff-nda.cjs` exports an operator library only: no connection, credentials, CLI, record IDs, endpoint or automatic execution. After both approvals, a protected operator process supplies exact private staff/agreement/acceptance bindings, the previously pinned acceptance digest, an independently verified existing Owner/Admin audit actor and the approval reference. The boolean approval input is only an execution interlock, not authentication or a substitute for human approval.

1. Require the exact repaired function hash and separate owner recovery approval. Verify the audit actor is an active/complete, email-verified, unbanned Owner/Admin with `staff.manage`.
2. Acquire a per-agreement advisory lock and exact agreement/acceptance/staff row locks, with lock/statement timeouts. Check published required Coach NDA, existing account/state, exact content/version/name/email, valid original time, whole-acceptance digest and zero other incomplete required agreements.
3. Update **one existing agreement only** to Signed, setting `signed_at` directly from its existing acceptance. Never INSERT/UPDATE/UPSERT the acceptance and never call the signing Edge Function.
4. Let the trigger calculate onboarding; require Complete and Signed at the original time. Verify the entire acceptance, NDA content, role/scope/status and other staff/agreement fields remain unchanged.
5. Append exactly one private `staff_agreement_acceptance_reconciled` audit at actual repair time, attributed to the verified operator/approval. Do not invent a historical `staff_agreement_signed` event. Verify every earlier audit row is unchanged.
6. Commit only after all postconditions. Any error rolls back the entire recovery. Replays cannot redate a signature or create another repair audit.

## Validation

- Native **PostgreSQL 17.11: 23/23**. Covers old 42703 reproduction; both tables' INSERT/UPDATE/DELETE; cascades; multiple required/signed/waived/declined; inactive staff; no reissuance/recursion; unchanged owner/ACL/RLS/permissions; staff/Coach/member/anonymous write denial; exact-one recovery; evidence/content/timestamp/actor mismatch; acceptance/audit preservation; repeat/drift rejection; late-audit atomic rollback.
- Concurrency: **eight independent backends** overlap at a coordinator-held server barrier. One recovery commits, seven attempts safely deny, exactly one repair audit, signature unchanged.
- Exact deployed v5 source tested with fictional clients and no network: **8/8** method/origin/session/account/validation/conflict/signing-sequence tests. This fixture is never a deployment input.
- Maintained B4/B4.2/B5/B6, session runtime, assessment-person and Edge regressions: **108/108 distinct tests pass**. Initial missing-local-build prerequisite was resolved by generating the 439-path local build and rerunning affected B4 tests, 12/12. No Netlify build/upload/deploy was triggered.
- JavaScript syntax, migration hashes and diff checks pass. Read-only hosting verification preserves locked B6, 439 paths, nine Function archives/Node22/routes/configuration, payment-worker schedule and unchanged beta.

Reproduction uses the project's existing schema-only local baseline at `../revitalizedacademy/supabase/baselines/2026-09-26/schema.sql`, its managed-platform test shim, this candidate's 17 production forward files and `pg@8.16.3`. These local baseline files contain schema, never restored real Auth/staff/customer rows. Start a disposable loopback PostgreSQL17 cluster on port 55541 (or set `RVA_LOCAL_PGPORT`), then run `NODE_PATH=../revitalizedacademy/node_modules RVA_NDA_LOCAL=1 node scripts/test-staff-nda-trigger.cjs`. The runner checks version/local-only controls, creates and always drops its own database. Node source tests use `NODE_PATH=../revitalizedacademy/node_modules node --test tests/staff-nda-edge-v5.cjs`. Validation ran on Node24.20.0; no production Node22 archive was built or modified. Existing deployed browser behavior is preserved by unchanged assets; this stage makes no new hosted browser/signing acceptance claim.

### Existing live Edge limitation, deliberately unchanged

Live v5 differs from the repository's newer RPC-based handler. It sequentially saves acceptance, updates agreement, then unconditionally writes onboarding Complete. Its handling of multiple required/declined agreements or inactive staff is therefore **not certified by this trigger-only repair**. Retry upserts can also replace acceptance evidence while agreement completion has failed. These existing handler limitations are documented; no Edge deployment is authorized. Guarded recovery avoids this path, requires zero other incomplete agreements and preserves the original acceptance. Do not broaden this PR or claim the handler was repaired.

## Separate owner approval gates

**A — migration only:** approve this PR's final tested SHA and the migration digest above, applying only that SQL to production `voalfpxiyznnqfcqcymd`. Recheck baseline, triggers, constraint and ledger. Verify repaired body, unchanged metadata/RLS and no staff/acceptance-row changes; record actual ledger ID. A does not authorize recovery.

**B — one existing acceptance recovery:** separately approve the privately verified one-account/one-agreement transaction using the genuine acceptance and original timestamp through the exact tested library. Recheck private pins, bind the actual authorized audit actor, stop on drift/ambiguity or another pending agreement. A must pass first. No new signature/invitation/email.

After A+B: verify Signed, trigger-calculated Complete, acceptance/audit/role/scope preservation. The Coach then signs in normally with their own existing account, verifies the Coach dashboard/Assigned People Only scope, and performs the genuine authenticated **non-founder Assessment Calibration denial** test without accessing participant records. Hosted login and that denial remain **pending** until observed.

## Rollback and preservation

- Before A, capture schema-only original function definition/owner/ACL/search path/triggers and ledger privately. Original definition is already captured. SQL/preflight failure rolls back the migration transaction; never replay unrelated migrations.
- If committed A fails validation, halt B. A function reversal requires a separately reviewed/authorized **forward migration** restoring only the captured definition/metadata. It restores the known broken/fail-closed signing behavior, not a repaired service; prefer a reviewed narrow forward correction. Never drop triggers/functions or undo B6/other ledger entries.
- B errors before COMMIT roll back agreement/onboarding/audit changes. After successful COMMIT, do not delete immutable audit, unsign a genuine agreement or rewrite acceptance evidence as automatic rollback; investigate and obtain a bounded correction authorization.
- No Netlify deployment, Function/Edge update, publication-lock change, NDA content change, staff permissions, client access, beta change, payment action, invitation or email. Published B6 remains `6ad4e3b0952dc55ce5f6657c`, locked, with nine Functions and its existing worker schedule.
