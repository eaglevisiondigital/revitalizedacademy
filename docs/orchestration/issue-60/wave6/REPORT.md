# Wave6 Lane B — guarded operations/household isolation proposal

**Checkpoint: LOCAL PREPARATION COMPLETE; PostgreSQL verification BLOCKED. Production NO-GO.**

Base: `9beae3bb40c154d2bfd623e8d2355b3a6c3cd306`. Branch `codex/rva-wave6-security-20261101`; worktree `academy-wave6-security`. Exclusive changes: `proposals/wave6-security/`, `tests/wave6-security/`, this report folder. No application runtime, canonical migration, Function, Auth, report/voice/ruleset, financial or public-asset change. Alex remains paused. No production queries, writes, grant/session actions or private records.

## Five-failure matrix

All five were **actually demonstrated in Wave5 fictional PostgreSQL**, not claimed production attacks. Unchanged source `tests/wave5-operations/durable-operations.test.cjs` SHA256 `c65c35c7b6b2a01f3fe388434c7683fd289de8a386f4c4291942a9fa4914e0fe`; original failure TAP SHA256 `7d859447a45b6bdbae40b01fd4259da9ade0333efdcdc8ebf9a8d4cbb85ebf76` at `docs/orchestration/issue-54/wave5/receipts/current-unresolved-scopes.tap`.

| Existing strict probe | Verified historical result | Narrow proposal | Current resolution |
|---|---|---|---|
| Foreign Coach check-in SELECT | FAIL, unrelated row returned | RESTRICTIVE current active-staff + coaching.view + per-contact scope; own-member branch retains original lifecycle gate | PREPARED / NOT VERIFIED |
| Foreign Coach assignment SELECT | FAIL, unrelated row returned | Same per-contact coaching.view restriction | PREPARED / NOT VERIFIED |
| Foreign-client assignment INSERT with unrelated valid membership | FAIL, INSERT accepted | coaching.manage + per-contact scope + active membership/contact tuple agreement + assigned_by actor pin | PREPARED / NOT VERIFIED |
| Unrelated household member SELECT | FAIL, unrelated relationship returned | Per-contact CRM scope; member branch narrowed to own contact rather than implied household sharing | PREPARED / NOT VERIFIED |
| Guardian UPDATE to unrelated valid contact | FAIL, update accepted even after deferred constraint check | Per-contact CRM write scope plus immutable household/contact/guardian/relationship tuple for authenticated direct writes | PREPARED / NOT VERIFIED |

Root cause is the existing permissive `EXISTS(staff_access WHERE user_id=auth.uid())` predicates, which recognize staff membership without the contact-specific authorization used elsewhere. Foreign membership/contact and guardian references are valid foreign keys, so FK constraints alone do not establish the relationship's authority.

## Exact proposed correction

- Nine **additive RESTRICTIVE** policies: SELECT/INSERT/UPDATE on each `client_checkins`, `client_assignments`, `household_members`. Original permissive and paid-lifecycle policies remain byte-unchanged. No new member/staff access is granted.
- One new `private.wave6_operation_tuple_before()` **SECURITY INVOKER**, empty search_path, postgres owner, no PUBLIC/anon/authenticated/service_role EXECUTE. Three `a_wave6_operation_tuple_before` triggers precede existing validation triggers. Existing functions/ACLs are not replaced.
- Direct authenticated check-ins pin creator/reviewer to the current actor and preserve original contact/membership/template/period/responses/creator on review. Assignments pin assigned_by and freeze contact/membership/creator. Existing status/title/instructions/member-note operations remain subject to original policies.
- New non-null membership writes require an active membership whose primary contact or explicit current access association matches the target contact. Nullable legacy membership remains nullable. Nonactive writes are conservatively held; historical read access stays scoped.
- Direct authenticated household identity/guardian/relationship changes are held, including Owner changes, pending an explicitly reviewed relationship-correction workflow. New guardian bindings are held; no adult/minor consent or inferred family-sharing rule is invented. Existing trusted security-definer initialization remains unchanged; the new INVOKER trigger does not grant those trusted roles to callers.
- Revoke only authenticated TRUNCATE on the three tables. RLS cannot restrict TRUNCATE. Trusted-role privileges and all other caller rights are retained.
- Forward transaction guards pin original schema columns/indexes, owner/RLS/ACL, original policies, original trigger routine source/security and authorization-helper definitions, reject bypass-role/function collisions, and use bounded locks/timeouts. Applying twice must fail closed, not silently duplicate policies.

SQL SHA256: `4a545932faa3553e2c6461494db55257bb598c6cc10356bd8e23f4f589e6b4df`.
Local regression revert SHA256: `e4fa7c9231c4d0d41f8f1ff56a6a9366a92b86b85f7fb69fb80224b09279009f`.
Manifest SHA256: `58a12beb8cc06344cfeebca1efa7b6064e3be83cdf4bec25fb7b7740f97852f9`.

## Tests and honest limits

- **9/9 source/manifest contract checks PASS** (`contracts.tap`). They verify exact hashes/scope, restrictive-only policies, no grant/definer broadening, original failure source preservation and source/actor guard coverage. They are **not PostgreSQL/RLS acceptance**.
- Node syntax checks PASS for the prepared SQL regression test sources.
- **45 actual PostgreSQL security assertions PREPARED / NOT RUN**, plus the unchanged original five probes and separately staged current-access identity hypothesis. Coverage includes assigned Coach/Owner positives, role/permission/contact revocation, null/changed actor, direct versus existing invoker RPC, household identity holds, TRUNCATE ACL, active membership/actor binding and transactional rollback.
- Existing Wave5 actual two-backend concurrency/idempotency/rollback probes are retained for combined independent execution. Their historical author PASS is not a current combined PASS.
- **Actual PostgreSQL execution, final guarded SQL syntax/installation, original-five before/after closure, rollback, concurrency and full-package business acceptance remain BLOCKED.** Lane A found Mac SysV shared-memory capacity exhausted at 32/32; remaining resources cannot be safely attributed to this RVA workflow. Lane B attempted no initdb/SQL and removed no process/resource. No persistent/staging/production DB fallback is used.
- One initial source-test harness assertion incorrectly matched the word TRUNCATE in `GRANT TRUNCATE` as if it were a destructive statement. Corrected to reject statement-start TRUNCATE; initial 8PASS/1FAIL is retained in `harness-history.json`. No policy or permission assertion was weakened.

## Authentication and policy boundaries

The captured `private.active_staff_session()` checks staff status/onboarding; it does **not** validate provider JWT/session_id against auth.sessions. Synthetic GUC actor changes, suspension, scope withdrawal and permission revocation do not prove GoTrue logout/MFA/token expiration/revocation. Strict managed-session acceptance stays BLOCKED; no shared Auth change is made to fake it.

The assigned-Coach `client_access.user_id` substitution hypothesis remains **NOT RUN**, not a verified exposure and not included in this correction. The exact strict probe is staged separately. No new identity-bypass workaround or unapproved user binding is added.

Positive paid-Client operations remain held by the original production-equivalent payment predicate. Family-wide visibility, guardians/minors, Support/financial compatibility and an audited household identity-correction process remain product/security release decisions. This proposal does not select new policies or claim full Family Hub usability.

## Rollback / next checkpoint

Before any future production approval, run exact pinned cumulative LOCAL SQL, unchanged failures, all new assertions, genuine positives, combined concurrency and guarded revert in a positively owned disposable PG17 fixture. Check both original rows and existing routine/ACL metadata, then verified teardown. Any SQL/guard/RLS failure is retained and corrected locally, never bypassed.

The supplied revert drops only this proposal's policy/trigger/function layer and restores prior ACLs for **fictional regression proof**. It deliberately restores known exposures and is **not a recommended production reversal**. No production rollback is needed because nothing was installed. Eventual production failure handling should retain a fail-closed hold and use a separately reviewed forward correction rather than reopen exposed rows.

No production approval is requested; the next safe action is independent source review now and exact disposable-PG execution once safe capacity exists. Master should update CURRENT_BUILD_STATE.md and the 57-package matrix with PREPARED/NOT_VERIFIED rather than promote these five to PASS.

### CHAT DECISION NEEDED — eventual Family Hub release only

RECOMMENDED THINKING LEVEL: HIGH

Current local proposal permits per-contact staff metadata access and only a member's own household contact, and holds direct guardian/identity rebinding. Existing production-equivalent broad staff policies and incomplete family/privacy decisions do not establish who may see another family member's records. Please define the intended adult/guardian/minor visibility and the audited relationship-correction actor/workflow. Options include own-contact-only until explicit consent, or a separately scoped household authorization with per-member consent/minor safeguards. Wider sharing requires reviewed consent, revocation, source/actor audit and role-boundary tests; retain the conservative hold until those decisions are approved. This decision does not block independent Academy local development.
