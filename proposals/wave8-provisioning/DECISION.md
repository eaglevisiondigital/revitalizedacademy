# Issue 62 — audited provisioning compatibility disposition

LOCAL fictional verification only; no production approval or installation artifact.

No SQL correction is proposed. The original Wave5 positive directly INSERTs an authenticated Coach-selected non-null account binding. Wave7 intentionally rejects that operation with42501. The original assertion/source and its failing evidence remain unchanged; it has not been converted into a passing direct-write test.

The actual existing application contract is different: the Owner portal calls public.save_production_client_plan_intent, whose existing guarded private implementation invokes the enrollment foundation trigger. The verified member then calls public.claim_onboarding_enrollment with the existing invitation digest. That existing definer implementation checks Auth email confirmation, matching contact and profile, active/unexpired link, compatible current account/access/membership, then records the actor and refreshes the held lifecycle. The new Wave7 invoker guard runs with postgres current_user only inside those pre-existing reviewed routines, so the established contract remains functional without a new bypass, role, grant, permissive policy or execution privilege.

A fixture administrator inserting a client_access row is not the positive proof: new tests invoke the actual public Owner RPC and actual public member RPC, including the existing onboarding HTML/script calling those SQL functions. Auth signup and a source-equivalent invitation digest are fictional fixture prerequisites. Agreement publication and email delivery stay held; no contract approval or real invitation acceptance is inferred.

The historical direct-write compatibility assumption is invalid as a substitute for the approved audited workflow. This resolves the narrow routing/contract diagnosis, not full business acceptance. Retain J05 historical FAIL; independently verified new workflow evidence may support current J05 BLOCKED because live catalog compatibility, managed Auth, legal invitation publication/delivery, paid access and relevant household policy acceptance are not complete.

No production migration or rollback is required for this lane. Do not apply an empty migration or relax the Wave7 guard. Regression reverts from previous waves deliberately restore exposures and are not a production rollback recommendation.
