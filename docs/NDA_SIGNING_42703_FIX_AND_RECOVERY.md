# Staff NDA signing incident: 42703 trigger fix and evidence-backed recovery

Status: **draft for review; never deployed**. Parent [Issue #49](https://github.com/eaglevisiondigital/revitalizedacademy/issues/49).

## Verified diagnosis (private operational evidence; no identifiers)
- The coach NDA opens in the staff portal; clicking Sign Agreement produces Supabase Edge HTTP 500.
- Logs from active `staff-agreement-sign` show PostgreSQL SQLSTATE `42703`: `record "new" has no field "staff_agreement_id"`. Client name/checkbox inputs are not the cause.
- Shared trigger function `private.sync_staff_onboarding_from_agreements()` runs for **both** `public.staff_agreements` and `public.staff_agreement_acceptances`. Its existing SQL CASE refers to `new.staff_agreement_id` even when invoked on `staff_agreements`, whose row has `staff_user_id` and `id` instead. An SQL expression can resolve table-incompatible field references even if another CASE arm is selected.
- The Edge handler upserts an acceptance and then separately updates `staff_agreements.status`. Thus an electronically accepted NDA can exist while its workflow stays Sent and onboarding stays Pending. This was observed read-only for the affected coach: one typed acceptance with `accepted_terms=true`, accepted timestamp, matching signer account and matching rendered agreement hash; agreement still Sent and onboarding Pending.
- The existing PR #29 client-side fix succeeded in making the NDA modal appear. **This is a separate server/database trigger defect.**

## Candidate migration
`supabase/environment-migrations/production/20261018194500_staff_agreement_trigger_42703_fix.sql`

- Forward-only `CREATE OR REPLACE FUNCTION` of exactly `private.sync_staff_onboarding_from_agreements()`. Keeps SECURITY DEFINER/search_path and two original trigger bindings.
- Uses PL/pgSQL `IF TG_TABLE_NAME` and `IF TG_OP` with separate statements for `staff_user_id` versus `staff_agreement_id`. On unrecognized trigger relation, fail closed.
- Preserves the existing required/unsigned/declined counts and active-staff-only onboarding calculation. Leaves NDA content/hash, acceptances, roles, contact scope and audit permissions alone.
- Only schema/function replacement. **No existing NDA acceptance, staff state or onboarding is edited by the migration.**

## Native PostgreSQL 17 tests REQUIRED before approval
1. Disposable staff with synthetic required coach NDA, status Sent. Insert acceptance, assert no SQLSTATE 42703 and onboarding remains Pending until agreement status becomes Signed.
2. Update agreement to Signed with exact prior acceptance and assert staff onboarding becomes Complete if all required documents complete.
3. Separate multiple-required NDA case: one Signed + another Sent => Pending.
4. Declined required document => Blocked. Inactive staff onboarding must not be forcibly Completed.
5. Test both shared trigger tables for INSERT, UPDATE, DELETE using disposable synthetic data. Match trigger registrations and no recursion after `staff_access` onboarding-only update.
6. Verify existing Edge request/response behavior with synthetic authenticated staff account and no confidential documents copied to tests. Legitimate 400/401/403/409 still deny; do not weaken role/session/RLS restrictions.
7. Compare function definition/signature/grants and triggers before/after, preserve PR29 NDA modal, main portal, nine Netlify Functions, worker schedule, B6 lock, privacy and payment functions.
8. Document exact SQL SHA, database migrations ledger preflight and safe forward-revert. Never replay applied migrations or simulate a signature for the real coach.

## Separately approved ONE-record reconciliation, not part of this migration
The affected coach has an **already-recorded genuine electronic acceptance**, but the required agreement status was not synchronized. Recover it without another signing event:

- A privileged operator privately resolves one exact staff user, its precise required agreement, linked acceptance, and current agreement template. Check the same staff ID, content-hash equality, `accepted_terms=true`, `signature_type='typed'`, and nonnull original `signed_at`. Ensure no signature version/source conflict, no other already-signed status or duplicate ambiguity.
- With **separate explicit owner/operator authorization**, in an auditable, exact-ID guarded transaction update only that agreement's status and signed_at to match the saved acceptance. **Do not UPDATE/INSERT/UPSERT the acceptance or invent a timestamp.** Let the fixed onboarding sync trigger determine `staff_access.onboarding_status`, and separately record a truthful minimal repair audit entry without duplicating a signed-on-date user event.
- Enforce one-row affected guard and postcondition: agreement status Signed, signed_at equal to original acceptance, hash still matches, and onboarding Complete only if no other required unsigned agreements remain. Roll back on any mismatch or out-of-scope impact.
- If acceptance evidence is missing/invalid, STOP and let the staff member sign themselves after the fix. Never mark accepted on an operator's guess.
- After deployment and controlled reconciliation, the coach signs in with their **existing** portal account and reports whether the NDA prompt is gone and Coach dashboard is accessible. Expect Assigned People Only scope and possibly zero visible clients. No new invitation/account.

## Release gates
**Gate A:** Review/testing/owner approval and apply ONLY the trigger-function repair to production. Check original NDA status unchanged and no unexpected staff updates; live NDA route remains unaffected.

**Gate B:** Obtain separate evidence-checked operator approval for one stored-acceptance state reconciliation. No staff login credential requests or delegation of signing.

**Gate C:** Normal staff login, targeted read-only acceptance/onboarding verification, and optional non-founder Assessment Calibration denial using that same genuine staff session. Never mix this with real participant health-data grants.

Stop if any expected trigger/audit behavior differs. Do not change beta, publish an app, merge old stacked PRs, or unlock Netlify auto-publishing under this fix.
