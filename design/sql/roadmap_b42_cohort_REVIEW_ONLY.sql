-- REVIEW ONLY. Not a migration, not called by the UI or release.
-- Separately authorize exact private verification IDs, source pins, operator
-- execution and a tracked manual revocation appointment first. Bind privately;
-- never inline participant IDs, pins or approval data in Git/chat/logs.
-- A founder confirmation itself NEVER authorizes enrollment.
begin;
set local lock_timeout='5s';
set local statement_timeout='20s';
-- The protected operator client binds these transaction-local values without
-- returning them: rva.b42_selected_verifications (JSON UUID array),
-- rva.b42_release_reference, rva.b42_revocation_task (non-identifying references).
do $$
declare selection jsonb:=nullif(current_setting('rva.b42_selected_verifications',true),'')::jsonb;
 release_ref text:=nullif(current_setting('rva.b42_release_reference',true),'');
 task_ref text:=nullif(current_setting('rva.b42_revocation_task',true),'');
 chosen uuid; plan jsonb; n integer;
begin
 if selection is null or jsonb_typeof(selection)<>'array' then raise exception 'Explicit private selections required'; end if;
 n:=jsonb_array_length(selection);
 if n not between 1 and 2 or (select count(distinct value) from jsonb_array_elements_text(selection))<>n
 or release_ref is null or task_ref is null or length(release_ref)>100 or length(task_ref)>100 then raise exception 'Exact bounded release and revocation approval required'; end if;
 perform pg_advisory_xact_lock(hashtextextended('RVA B4.2 initial pilot',416));
 if exists(select 1 from private.roadmap_b4_cohort_events) or exists(select 1 from private.roadmap_b4_versions) then raise exception 'Initial empty pilot baseline changed'; end if;
 -- Validate every source before any write; plan locks the exact source in this
 -- transaction and verifies latest signoff, pinned identity, live approval
 -- session, current founder/scope, eligibility, source hash and UTC SOP window.
 for chosen in select value::uuid from jsonb_array_elements_text(selection) order by value loop
 perform private.roadmap_b42_operator_plan(chosen);
 end loop;
 for chosen in select value::uuid from jsonb_array_elements_text(selection) order by value loop
 plan:=private.roadmap_b42_operator_plan(chosen);
 perform private.roadmap_b4_set_cohort((plan->>'report_id')::uuid,true,false,plan->>'source_fingerprint',
 (plan->>'approved_by')::uuid,(plan->>'approval_reference')||'; release='||release_ref||'; revocation task='||task_ref);
 end loop;
 if (select count(*) from private.roadmap_b4_cohort_events)<>n
 or exists(select 1 from private.roadmap_b4_cohort_events where not active or allow_drafts)
 or (select count(*) from private.roadmap_b4_audit where action='cohort_approve')<>n
 or exists(select 1 from private.roadmap_b4_versions) then raise exception 'Pilot postconditions failed'; end if;
end $$;
-- A separately reviewed execution must replace this with COMMIT. The release
-- procedure never executes this file; no automatic expiry exists. Revoke each
-- enrollment through the existing operator-only setter with active=false,
-- allow_drafts=false and the enrollment's pin; retain all immutable evidence.
rollback;
