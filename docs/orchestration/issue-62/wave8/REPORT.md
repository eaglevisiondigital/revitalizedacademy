# Wave8 Lane A / Issue62 — audited account provisioning

LOCAL checkpoint only. Base2cbd6de16097890f501a410a276308ca5c4e000c, branch codex/rva-wave8-provisioning-20261101. No production query, migration, permission change, grant, Function replacement, private/Alex read, message, protected processing, financial activation or push.

## Diagnosis and bounded disposition

The unchanged Wave5 test directly inserts an assigned Coach-selected non-null account binding. It still fails42501 under Wave7. The asserted operation is not the current Owner enrollment/verified member claim application contract. No bypass or permissive fix is justified. The original source/test/guard/failure remains unchanged, explicitly FAIL. We did not relabel the original assertion PASS.

The actual existing audited workflow works without changing one SQL routine or application line: Owner public plan-intent RPC → existing enrollment trigger/foundation → verified member public token claim → original onboarding context. This includes actual onboarding HTML/JavaScript invoking actual public SQL RPCs in the fictional fixture, and a genuinely NULL-user foundation claimed after account creation through the original Auth-user trigger. A privileged fixture client_access INSERT is not the proof. See WORKFLOW_TRACE.md and proposals/wave8-provisioning/DECISION.md.

No existing application-path regression was demonstrated by the retained direct-write positive. The engineering correction is to use/verify the established audited contract, not restore arbitrary identity binding. Current full J05 business acceptance is still BLOCKED pending independent QA, deployed-catalog/managedAuth, legally approved invitation publication/delivery, payment/paid access and relevant household policies. Historical J05FAIL evidence remains intact. Do not claim full account, family, financial or business acceptance.

## Actual execution

PostgreSQL17.11, pg8.16.3, socket-only disposable cluster, synthetic Auth rows/GUCs. Final receipt final-pinned/postgres-receipt.json records334 assertions:315PASS/19FAIL. Eighteen FAILS deliberately reproduce nine baseline and nine reverted isolation defects; one is the untouched direct-account-binding compatibility assertion. Corrected other suites and allnine strict isolation boundaries PASS. Do not report334/334PASS or discard any historic FAIL.

The new39-case actual provisioning/DOM→SQL suite passes39/39 in each of baseline, corrected and reverted stages (117executions). It covers existing/new account, NULL binding, authoritative Owner plan/catalog/actor, exact verified Auth/contact/profile/token binding, active/expired/revoked links, wrong actors, current profile ACL denial, separately corrupted fixture mapping, existing account conflict, suspended/inactive access/Owner, cancelled/completed membership, caller-metadata spoofing, same/different-account replay, concurrent valid/wrong claims, concurrent Owner retries, audit actors, transaction rollback, own-household isolation, paid/contract holds, exact UI RPC ordering, failed/unverified UI access and refresh without duplicate claim. Seven Node source-contract checks PASS separately.

Existing reusable onboarding link semantics are preserved: same-owner/account reopen or simultaneous same-account claims preserve one foundation/access and append two actual open audits. They do not create two jobs/grants. The invitation is not misrepresented as one-time processing authority. Existing contact locks and link FOR UPDATE serialize these operations.

Fifteen existing provisioning routine signatures/definitions/owner/definer/config/ACL fingerprints are identical before and after Wave7 layers/reverts. Exact source inputs and hashes are in final receipt and SOURCE_PINS.json. Existing migrations, thirteen Function sources, shared Auth, portal/member runtime, assets, Roadmap, consent/signature tables, financial source and all previous proposals/tests are unchanged by this lane.

## Failed diagnostic fixtures retained

Initial3case attempts lacked fictional direct-membership journey metadata (23503) or captured permission-reference seed (42501). Adding only those fictional prerequisites made the actual path pass. Expanded27/29 initially exposed two incorrect fixture assumptions: profiles.contact_id is unique; authenticated profiles UPDATE is denied by current captured ACL. Tests now separately assert precise42501 and corrupted-fixture mapping rejection. Old receipts remain retained and are not counted as product failures or hidden. First sandbox IPC inventory was denied, safely stopped before initdb; approved local-process execution used metadata gates thereafter. No unknown resource was removed.

Current profile-policy nuance: self-update policy alone does not establish write ability. Captured authenticated table ACL lacks UPDATE/INSERT, which the actual denial test verifies. It retains unrelated destructive privileges; this lane does not certify them or modify shared Auth. Independent QA is reviewing that separate boundary. Synthetic identity/GUC/staff checks do not establish real GoTrue logout/JWT/MFA revocation.

## Resource and preservation evidence

Every owned cluster was stopped/removed. Final before/after inventory preserves both preexisting segments65536(PID991) and5308417(unattached, unknown provenance); no unexpected new IPC remains. No persistent/production/staging database or unrelated process was used/stopped. The same SysV exclusive lease was held throughout tests and released after final handoff; QA must independently execute on its own disposable cluster.

## Changes, rollback and next action

Only new tests/wave8-provisioning, proposals/wave8-provisioning/DECISION.md and this bounded evidence/report directory are introduced. No SQL correction, migration or private runner is prepared because the actual established workflow does not need one. No production installation or rollback is required for this lane. To reverse this local package remove only its new tests/docs; retain strict Wave7 guards. Prior regression reverts intentionally reopen exposure and are not recommended production rollback.

Next: independently run exact source/pins/combined suite, retain original direct-write FAIL, independently validate actual existing workflow and remaining profile/managedAuth/complete journey gates, then Master may classify current J05BLOCKED without rewriting historical FAIL. No new Owner approval is required for already authorized local verification. Production remains NO-GO and separately gated. Alex remains PAUSED.
