# Post-handoff independent finding and bounded forward correction

This appendix supersedes only the earlier no-SQL-needed disposition for the newly discovered TRUNCATE privilege family. Original source, initial provisioning diagnosis and all old test receipts remain unchanged in prior commits. No production read/write or shared Auth application change occurred.

Independent QA demonstrated a different real local catalog-equivalent security failure: authenticated TRUNCATE public.profiles succeeds without CASCADE or FK masking and deletes every mapping within the probe. Master assigned a forward-only LOCAL proposal. Lane A independently reproduced authenticated and anon success: each fixture had1profile row,0after attempt, no denial code,1restored by rollback. Exact strict failures remain in profiles-original/profiles-privilege-original.tap. This establishes disposable SQL-role exposure, not a demonstrated HTTP exploit or independently observed live production vulnerability.

## Exact narrow proposal

profiles-truncate.sql checks current installer postgres, exact existing table ACL, postgres ownership, ordinary table kind, RLS enabled/nonforced, anon/authenticated nonsuperuser/nonbypass roles and no inherited trusted-role privileges. It locks only public.profiles in an atomic transaction and executes exactly:

REVOKE TRUNCATE ON TABLE public.profiles FROM anon,authenticated;

Postcondition verifies both effective TRUNCATE privileges denied and the exact expected resulting ACL. All SELECT/INSERT/UPDATE/DELETE/REFERENCES/TRIGGER/MAINTAIN rights, trusted postgres/service_role rights, table policies/security, Auth functions/triggers, account claim/provisioning functions, consent and invitation logic remain unchanged. No new definer, EXECUTE, role, policy, table, function, column or canonical migration is added.

Corrected actual non-CASCADE TRUNCATE probes both return42501 with every mapping preserved. Current captured UPDATE/INSERT denials also remain. Fifteen corrected PostgreSQL tests cover installer rejection, exact role/ACL/table security drift, privileged inheritance, replay, all unrelated ACL bits, transactional reversal and row preservation. Revert is guarded to the exact resulting ACL and restores only both original TRUNCATE grants; it intentionally recreates exposure for regression proof and is NOT a recommended production rollback.

## Final complete actual results

profiles-final/postgres-receipt.json:357 assertions,334PASS/23FAIL. Eighteen failures retain the nine original isolation exposures before/after regression reversion; four separately retain the two profile-role TRUNCATE exposures before/after reversion; one remains the unchanged historical direct-Coach account-binding assertion. Do not report all357PASS, conflate deliberate reproductions with current corrected failures, or erase the direct-write assertion.

New actual audited provisioning remains39/39PASS before correction,39/39after all corrections,39/39after regression revert. Allnine previously corrected identity/household isolation boundaries stillPASS. Existing13concurrency, rollback and relevant security regressionsPASS. Nine source-contract assertionsPASS separately. No actual legitimate application provisioning failure was discovered: this new correction protects mapping integrity while retaining the established audited Owner/enrollment/verified-account path.

Whole-catalog metadata snapshots before/after the profile correction compare1,128public/private pg_class relations (tables/views/indexes/sequences, not1,128business tables),590policies,294functions and132noninternal triggers. Every inspected definition/owner/config/security flag and ACL remains exactly equal except the two intended public.profiles TRUNCATE entries. Fifteen provisioning routine/security fingerprints also remain unchanged. Expected/actual complete security snapshot hashes match in the final receipt.

Final disposable PG17cluster stopped and removed; the two preexisting IPC segments remain unchanged, no unexpected new IPC. No production/staging DB, unrelated process, Alex data, private sessions, grant or financial action was used. All earlier receipts preserved. New generated whitespace normalization retains full original bytes as gzip with hash mapping.

## Scope and next gate

LOCAL correction and independent validation only. The proposal is not a production migration or installation-approved package. No production deployment, permission mutation, issuance or report processing is authorized. Independent QA must reproduce the exact final source, both-role42501 denials and actual audited provisioning path. Full J05/business acceptance remains separately gated by current installed-catalog verification, managed Auth, legal contract/invitation delivery, paid access and relevant household decisions. Historical direct-binding FAIL remains evidence even if Master moves the new complete-package status toBLOCKED after validated correct-path proof.

Safest local reversal: remove the new proposal/tests/docs while retaining security guards; do not restore dangerous table privileges as a production rollback. Any eventual production correction requires exact source/SQL manifest approval, current catalog compatibility/readback and preservation verification. No private runner is prepared here.
