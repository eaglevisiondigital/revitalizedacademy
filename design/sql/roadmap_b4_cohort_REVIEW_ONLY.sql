-- REVIEW TEMPLATE ONLY. Not part of deployment. NO actual cohort is authorized.
-- After separate explicit cohort/data-use/SOP approval, operator supplies private
-- report UUID, verified founder Auth UUID, exact source fingerprint, approval reference.
-- Never put those values/answers into Git, URLs, logs, chat or staging.
-- Source fingerprint is sha256(jsonb_build_object('snapshot', snapshot, 'final_form', final_form)::text).
-- Restrict metadata lookup to the exact privately approved existing report/workflow.
begin;
select private.roadmap_b4_set_cohort(
 :'approved_report'::uuid,true,false,:'approved_source_sha256',
 :'verified_founder_auth_id'::uuid,:'approval_and_retention_sop_reference');
-- Read-only by default. Changing false to true requires separate derivative-write approval.
rollback; -- Deliberate safety stop; an authorized execution plan must be reviewed separately.
