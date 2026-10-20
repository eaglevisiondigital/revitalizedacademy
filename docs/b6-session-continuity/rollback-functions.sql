-- Reviewed forward repair: first hold processing/review under separate authorization.
-- Restore only these definitions; do not delete confirmations or immutable evidence.
begin;
create or replace function private.roadmap_b42_operator_plan(p_verification uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare v private.roadmap_b42_verifications; s private.roadmap_b42_sop_attestations; m jsonb;
begin
 select * into v from private.roadmap_b42_verifications where id=p_verification;
 if v.id is null then raise exception 'Verified selection unavailable' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(v.subject_key::text,416));
 select * into s from private.roadmap_b42_sop_attestations where id=v.sop_id;
 if v.decision<>'confirmed' or not v.eligible_at_confirmation or v.report_id is null
 or exists(select 1 from private.roadmap_b42_verifications where subject_key=v.subject_key and revision>v.revision)
 or not private.roadmap_b4_is_founder(v.actor_id)
 or not exists(select 1 from private.roadmap_b42_founders f join auth.users u on u.id=f.user_id where f.user_id=v.actor_id and lower(trim(u.email))=f.verified_email)
 or not exists(select 1 from auth.sessions where id=v.session_id and user_id=v.actor_id and (not_after is null or not_after>now()))
 or s.sop_version<>'RVA-B4-PILOT-READONLY-v1-2026-10-16' or s.starts_at is null or s.starts_at>clock_timestamp() or s.revoke_by<=clock_timestamp()
 or not private.roadmap_b4_is_founder(s.revocation_owner) or not private.roadmap_b4_is_founder(s.backup_owner)
 or not private.staff_has_permission(v.actor_id,'health.private.view') or not private.staff_has_permission(v.actor_id,'crm.view')
 or not private.staff_can_access_contact(v.actor_id,v.contact_id) then raise exception 'Current verified SOP and founder approval required' using errcode='42501'; end if;
 m:=private.roadmap_b42_descriptor(v.contact_id,v.report_id);
 if not (m->>'eligible')::boolean or (m->>'_source') is distinct from v.source_fingerprint or m->>'_fingerprint'<>v.metadata_fingerprint
 or (m->>'_workflow')::uuid is distinct from v.workflow_id then raise exception 'Verified source changed' using errcode='40001'; end if;
 return jsonb_build_object('report_id',v.report_id,'contact_id',v.contact_id,'workflow_id',v.workflow_id,'source_fingerprint',v.source_fingerprint,
 'approved_by',v.actor_id,'allow_drafts',false,'revoke_by',s.revoke_by,'revocation_owner',s.revocation_owner,'backup_owner',s.backup_owner,
 'approval_reference','B4.2 verification '||v.id::text||'; SOP '||s.id::text||'; '||s.sop_version||'; revoke by '||s.revoke_by::text,
 'execution','separate_operator_authorization_required');
end $$;

create or replace function private.roadmap_b6_set_pilot(p_purpose bigint,p_expires timestamptz,p_authorization text,p_operator text,p_allow_feedback boolean default false,p_feedback_reference text default null) returns bigint
language plpgsql security definer set search_path='' as $$
declare p private.roadmap_b6_purpose_events;c jsonb;old private.roadmap_b6_grant_events; plan jsonb; n integer;contact uuid; seq bigint;
begin
 perform pg_advisory_xact_lock(18062026);
 select * into p from private.roadmap_b6_purpose_events where sequence=p_purpose;
 if p.report_id is not null then perform pg_advisory_xact_lock(hashtextextended(p.report_id::text,416)); end if;
 if p.sequence is null or not p.active or p.pins<>private.roadmap_b6_pins() or exists(select 1 from private.roadmap_b6_purpose_events where report_id=p.report_id and actor_id=p.actor_id and sequence>p.sequence)
 or not exists(select 1 from auth.sessions where id=p.session_id and user_id=p.actor_id and (not_after is null or not_after>clock_timestamp())) then raise exception 'Current experimental-purpose founder signoff required' using errcode='42501'; end if;
 -- Operator helper cannot use auth.uid(): it deliberately verifies the authenticated signoff chain explicitly.
 select private.roadmap_b42_operator_plan(e.verification_id) into plan from private.roadmap_b5_pilot_events e where e.sequence=p.pilot_sequence and e.active and e.expires_at>clock_timestamp();
 if plan is null or not exists(select 1 from private.roadmap_b42_founders where user_id=(plan->>'revocation_owner')::uuid and verified_email='justyn@revitalizedacademy.com') or not exists(select 1 from private.roadmap_b42_founders where user_id=(plan->>'backup_owner')::uuid and verified_email='elle@revitalizedacademy.com') or plan->>'source_fingerprint' is distinct from p.source_fingerprint
 or not exists(select 1 from (select * from private.roadmap_b5_pilot_events where report_id=p.report_id order by sequence desc limit 1)e where e.sequence=p.pilot_sequence and e.active)
 or not exists(select 1 from (select * from private.roadmap_b4_cohort_events where report_id=p.report_id order by sequence desc limit 1)e where e.active and not e.allow_drafts and e.source_fingerprint=p.source_fingerprint)
 or p_expires is null or p_expires<=clock_timestamp() or p_expires>clock_timestamp()+interval '14 days' or p_expires>(plan->>'revoke_by')::timestamptz
 or p_expires>(select expires_at from private.roadmap_b5_pilot_events where sequence=p.pilot_sequence)
 or p_allow_feedback is null or p_authorization is null or length(trim(p_authorization)) not between 10 and 1000 or p_operator is null or length(trim(p_operator)) not between 3 and 200
 or (p_allow_feedback and (p_feedback_reference is null or length(trim(p_feedback_reference)) not between 10 and 1000)) or (not p_allow_feedback and p_feedback_reference is not null) then raise exception 'Separate bounded B6 owner/privacy authorization required' using errcode='42501'; end if;
 contact:=(plan->>'contact_id')::uuid;
 select count(*) into n from (select distinct on(report_id) * from private.roadmap_b6_grant_events order by report_id,sequence desc)e where e.active and e.expires_at>clock_timestamp() and e.report_id<>p.report_id;
 if n>=4 or exists(select 1 from (select distinct on(report_id) * from private.roadmap_b6_grant_events order by report_id,sequence desc)e where e.active and e.expires_at>clock_timestamp() and e.contact_id=contact and e.report_id<>p.report_id) then raise exception 'At most four distinct verified participants' using errcode='42501'; end if;
 insert into private.roadmap_b6_grant_events(report_id,contact_id,active,purpose_sequence,source_fingerprint,pilot_sequence,starts_at,expires_at,allow_feedback,feedback_authorization,authorization_reference,operator_reference,pins)
 values(p.report_id,contact,true,p.sequence,p.source_fingerprint,p.pilot_sequence,clock_timestamp(),p_expires,p_allow_feedback,p_feedback_reference,p_authorization,p_operator,private.roadmap_b6_pins()) returning sequence into seq;
 return seq;
end $$;

create or replace function private.roadmap_b6_context(p_report uuid,p_write boolean default false) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid; c jsonb;g private.roadmap_b6_grant_events; p private.roadmap_b6_purpose_events;issuer private.roadmap_b6_purpose_events;
begin
 c:=private.roadmap_b6_basis(p_report);actor:=private.roadmap_b42_actor();
 select * into g from private.roadmap_b6_grant_events where report_id=p_report order by sequence desc limit 1;
 select * into p from private.roadmap_b6_purpose_events where report_id=p_report and actor_id=actor order by sequence desc limit 1;
 select * into issuer from private.roadmap_b6_purpose_events where sequence=g.purpose_sequence;
 if g.active is distinct from true or g.starts_at>clock_timestamp() or g.expires_at<=clock_timestamp() or g.pins<>private.roadmap_b6_pins()
 or g.source_fingerprint is distinct from c->>'source_fingerprint' or g.pilot_sequence is distinct from (c->>'pilot_sequence')::bigint
 or p.active is distinct from true or p.session_id is distinct from (auth.jwt()->>'session_id')::uuid or p.source_fingerprint is distinct from g.source_fingerprint or p.pilot_sequence<>g.pilot_sequence or p.pins<>g.pins
 or issuer.active is distinct from true or exists(select 1 from private.roadmap_b6_purpose_events x where x.report_id=issuer.report_id and x.actor_id=issuer.actor_id and x.sequence>issuer.sequence)
 or not exists(select 1 from auth.sessions where id=issuer.session_id and user_id=issuer.actor_id and (not_after is null or not_after>clock_timestamp()))
 or (p_write and (not g.allow_feedback or not private.staff_has_permission(actor,'health.progress.manage'))) then raise exception 'B6 purpose, compute or separate feedback grant held' using errcode='42501'; end if;
 return c||jsonb_build_object('identity',private.roadmap_b42_public_metadata(private.roadmap_b42_descriptor((select contact_id from public.vitality_reports where id=p_report),p_report)),'grant_sequence',g.sequence,'purpose_sequence',p.sequence,'can_feedback',g.allow_feedback and private.staff_has_permission(actor,'health.progress.manage'),'can_edit',false,'expires_at',g.expires_at,'pins',g.pins,'source_revision_confidence','version_label_only_not_exact_questionnaire_revision','drafts','held','approval','held','release','held','email','held');
end $$;

create or replace function public.roadmap_b6(p_action text,p_report uuid default null,p_payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.roadmap_b42_actor();sid uuid:=(auth.jwt()->>'session_id')::uuid;c jsonb;p jsonb;g private.roadmap_b6_grant_events;entry record;available jsonb:='[]';seq bigint;current_revision integer;old private.roadmap_b6_feedback;key uuid;pin text;ref jsonb;ack jsonb;ready boolean;identity_meta jsonb;purpose_acknowledged boolean;existing_purpose private.roadmap_b6_purpose_events;purpose_retry boolean:=false;
begin
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>20000 then raise exception 'Invalid request' using errcode='22023'; end if;
 if p_action='authorize' and p_report is null and p_payload='{}'::jsonb then return jsonb_build_object('authorized',true,'pins',private.roadmap_b6_pins(),'cohort','operator_only','drafts','held','release','held'); end if;
 if p_action='list' and p_report is null and p_payload='{}'::jsonb then
 for entry in select e.* from (select distinct on(report_id) * from private.roadmap_b5_pilot_events order by report_id,sequence desc)e where e.active and e.expires_at>clock_timestamp() loop
 begin
 c:=private.roadmap_b6_basis(entry.report_id);ready:=false;begin perform private.roadmap_b6_context(entry.report_id,false);ready:=true;exception when sqlstate '42501' or sqlstate '40001' or sqlstate '55000' then null;end;select * into g from private.roadmap_b6_grant_events where report_id=entry.report_id order by sequence desc limit 1;
 identity_meta:=private.roadmap_b42_public_metadata(private.roadmap_b42_descriptor((select contact_id from public.vitality_reports where id=entry.report_id),entry.report_id));
 select coalesce((select p.active and p.session_id=sid and p.source_fingerprint=c->>'source_fingerprint' and p.pilot_sequence=(c->>'pilot_sequence')::bigint and p.pins=private.roadmap_b6_pins() and p.acknowledgments='{"experimental_purpose":true,"no_client_scores":true,"immutable_originals":true,"no_external_ai_exports":true,"manual_revocation_14_days":true,"separate_feedback_permission":true,"historical_provenance_limits":true}'::jsonb from private.roadmap_b6_purpose_events p where p.report_id=entry.report_id and p.actor_id=actor order by p.sequence desc limit 1),false) into purpose_acknowledged;
 available:=available||jsonb_build_array(jsonb_build_object('purpose_acknowledged',purpose_acknowledged,'report_id',entry.report_id,'label','Individually verified source','identity',identity_meta,'ready',ready,'operator_grant',coalesce(g.active and g.expires_at>clock_timestamp() and g.source_fingerprint=c->>'source_fingerprint' and g.pilot_sequence=entry.sequence,false)));
 exception when sqlstate '42501' or sqlstate '40001' or sqlstate '55000' then null;end;
 end loop;return available;
 end if;
 if p_action='attest' and p_report is not null then
 perform pg_advisory_xact_lock(hashtextextended(p_report::text,416));
 c:=private.roadmap_b6_basis(p_report);ack:=p_payload->'acknowledgments';
 if not p_payload ?& array['active','sop','acknowledgments'] or exists(select 1 from jsonb_object_keys(p_payload)k where k not in ('active','sop','acknowledgments')) or jsonb_typeof(p_payload->'active') is distinct from 'boolean' or p_payload->>'sop' is distinct from private.roadmap_b6_pins()->>'sop'
 or ack is distinct from '{"experimental_purpose":true,"no_client_scores":true,"immutable_originals":true,"no_external_ai_exports":true,"manual_revocation_14_days":true,"separate_feedback_permission":true,"historical_provenance_limits":true}'::jsonb then raise exception 'New B6 purpose/SOP acknowledgment required' using errcode='22023'; end if;
 select * into existing_purpose from private.roadmap_b6_purpose_events where report_id=p_report and actor_id=actor order by sequence desc limit 1;
 if existing_purpose.sequence is not null and existing_purpose.session_id=sid and existing_purpose.source_fingerprint=c->>'source_fingerprint'
 and existing_purpose.pilot_sequence=(c->>'pilot_sequence')::bigint and existing_purpose.active=(p_payload->>'active')::boolean
 and existing_purpose.acknowledgments=ack and existing_purpose.pins=private.roadmap_b6_pins() then
 purpose_retry:=true;seq:=existing_purpose.sequence;
 else
 insert into private.roadmap_b6_purpose_events(report_id,actor_id,session_id,source_fingerprint,pilot_sequence,active,acknowledgments,pins)values(p_report,actor,sid,c->>'source_fingerprint',(c->>'pilot_sequence')::bigint,(p_payload->>'active')::boolean,ack,private.roadmap_b6_pins())returning sequence into seq;
 end if;
 ready:=false;begin perform private.roadmap_b6_context(p_report,false);ready:=true;exception when sqlstate '42501' or sqlstate '40001' or sqlstate '55000' then null;end;
 return jsonb_build_object('acknowledged',true,'idempotent',purpose_retry,'can_open',ready,'operator_activation','separate_required','enrolled',false);
 end if;
 if p_action is null or p_action not in ('read','check','compute','hypothetical','feedback_save','feedback_history') or p_report is null then raise exception 'Invalid action' using errcode='22023'; end if;
 c:=private.roadmap_b6_context(p_report,p_action='feedback_save');
 if p_action<>'feedback_save' and p_payload<>'{}'::jsonb then raise exception 'Invalid payload' using errcode='22023'; end if;
 select coalesce(max(revision),0) into current_revision from private.roadmap_b6_feedback where report_id=p_report;
 if p_action='feedback_save' then
 if not p_payload ?& array['expected_revision','request_key','source_fingerprint','grant_sequence','manual','notes','citations'] or exists(select 1 from jsonb_object_keys(p_payload)k where k not in ('expected_revision','request_key','source_fingerprint','grant_sequence','manual','notes','citations')) then raise exception 'Invalid feedback' using errcode='22023'; end if;
 perform private.roadmap_b6_validate_manual(p_payload->'manual');
 if p_payload->>'source_fingerprint' is distinct from c->>'source_fingerprint' or p_payload->'grant_sequence' is distinct from c->'grant_sequence' then raise exception 'Source changed' using errcode='40001'; end if;
 if jsonb_typeof(p_payload->'notes') is distinct from 'string' or length(trim(p_payload->>'notes')) not between 3 and 2000 or jsonb_typeof(p_payload->'citations') is distinct from 'array' or jsonb_array_length(p_payload->'citations') not between 1 and 20 then raise exception 'Cited proposed rule feedback required' using errcode='22023'; end if;
 for ref in select value from jsonb_array_elements(p_payload->'citations') loop if jsonb_typeof(ref)<>'string' or not (c->'source'->'answers') ? (ref#>>'{}') then raise exception 'Invalid citation' using errcode='22023'; end if;end loop;
 key:=(p_payload->>'request_key')::uuid;pin:=encode(extensions.digest(p_payload::text,'sha256'),'hex');
 select * into old from private.roadmap_b6_feedback where actor_id=actor and request_key=key;
 if old.id is not null then if old.report_id<>p_report or old.request_fingerprint<>pin then raise exception 'Changed retry' using errcode='22023'; end if;return jsonb_build_object('revision',old.revision,'idempotent',true,'adopted',false);end if;
 if jsonb_typeof(p_payload->'expected_revision') is distinct from 'number' or p_payload->>'expected_revision' !~ '^[0-9]+$' or (p_payload->>'expected_revision')::integer<>current_revision then raise exception 'Feedback conflict' using errcode='40001'; end if;
 insert into private.roadmap_b6_feedback(report_id,grant_sequence,revision,actor_id,session_id,source_fingerprint,pins,manual,notes,citations,provenance,request_key,request_fingerprint)
 values(p_report,(c->>'grant_sequence')::bigint,current_revision+1,actor,sid,c->>'source_fingerprint',private.roadmap_b6_pins(),p_payload->'manual',p_payload->>'notes',p_payload->'citations','independent_manual_and_proposed_rules_not_adopted',key,pin);
 current_revision:=current_revision+1;
 end if;
 insert into private.roadmap_b6_audit(report_id,actor_id,session_id,action,grant_sequence,source_fingerprint)values(p_report,actor,sid,p_action,(c->>'grant_sequence')::bigint,c->>'source_fingerprint');
 if p_action='feedback_save' then return jsonb_build_object('revision',current_revision,'adopted',false,'drafts','held','release','held');end if;
 if p_action='feedback_history' then select coalesce(jsonb_agg(jsonb_build_object('revision',revision,'manual',manual,'notes',notes,'citations',citations,'pins',pins,'reviewer',case when actor_id=(select user_id from private.roadmap_b42_founders where verified_email='justyn@revitalizedacademy.com') then 'Justyn' else 'Elle' end,'created_at',created_at,'provenance',provenance)order by revision),'[]')into p from private.roadmap_b6_feedback where report_id=p_report and source_fingerprint=c->>'source_fingerprint';return p;end if;
 if p_action='check' then return jsonb_build_object('authorized',true,'grant_sequence',c->'grant_sequence','purpose_sequence',c->'purpose_sequence','can_feedback',c->'can_feedback','expires_at',c->'expires_at','pins',private.roadmap_b6_pins());end if;
 return c||jsonb_build_object('revision',current_revision,'actual_score',null,'actual_stage',null);
exception when others then raise exception 'Assessment calibration unavailable' using errcode=sqlstate;
end $$;

create or replace function private.roadmap_processing_set_grant(p_purpose bigint,p_expires timestamptz,p_operator uuid,p_session uuid,p_authorization text,p_review boolean default false,p_approve boolean default false,p_pdf boolean default false) returns bigint language plpgsql security definer set search_path='' as $$
declare p private.roadmap_processing_purposes;b private.roadmap_b6_grant_events;plan jsonb;n bigint;old private.roadmap_processing_grants;begin
 perform pg_advisory_xact_lock(18062026);
 select * into p from private.roadmap_processing_purposes where sequence=p_purpose;
 if p.report_id is not null then perform pg_advisory_xact_lock(hashtextextended(p.report_id::text,416));end if;
 select * into b from private.roadmap_b6_grant_events where sequence=p.b6_grant;
 select private.roadmap_b42_operator_plan(verification_id) into plan from private.roadmap_b5_pilot_events where sequence=b.pilot_sequence;
 if plan is null or p.active is distinct from true or exists(select 1 from private.roadmap_processing_purposes where report_id=p.report_id and actor_id=p.actor_id and sequence>p.sequence)
 or b.active is distinct from true or exists(select 1 from private.roadmap_b6_grant_events where report_id=b.report_id and sequence>b.sequence)
 or p.fingerprint is distinct from b.source_fingerprint or plan->>'source_fingerprint' is distinct from p.fingerprint
 or not exists(select 1 from auth.sessions where id=p.session_id and user_id=p.actor_id and (not_after is null or not_after>clock_timestamp()))
 or not exists(select 1 from public.staff_access where user_id=p.actor_id and status='active' and onboarding_status='complete' and role='owner' and contact_scope='all')
 or not exists(select 1 from private.roadmap_b42_founders where user_id=p.actor_id)
 or not exists(select 1 from auth.sessions where id=p_session and user_id=p_operator and (not_after is null or not_after>clock_timestamp()))
 or not exists(select 1 from public.staff_access where user_id=p_operator and status='active' and onboarding_status='complete' and role in ('owner','admin') and contact_scope='all')
 or not private.staff_has_permission(p_operator,'staff.manage')
 or p_expires is null or p_expires<=clock_timestamp() or p_expires>b.expires_at or p_expires>(plan->>'revoke_by')::timestamptz
 or p_authorization is null or length(trim(p_authorization)) not between 10 and 1000 or p_review is null or p_approve is null or p_pdf is null or (p_approve and not p_review) or (p_review and not b.allow_feedback)
 then raise exception 'Separate operator/storage authorization required' using errcode='42501';end if;
 select * into old from private.roadmap_processing_grants where report_id=p.report_id order by sequence desc limit 1;
 if old.active and old.purpose=p.sequence and old.expires_at=p_expires and old.allow_review=p_review and old.allow_approval=p_approve and old.allow_pdf=p_pdf and old.operator_id=p_operator and old.operator_session=p_session and old.authorization_reference=p_authorization then return old.sequence;end if;
 insert into private.roadmap_processing_grants(purpose,report_id,fingerprint,b6_grant,active,expires_at,allow_review,allow_approval,allow_pdf,operator_id,operator_session,authorization_reference)
 values(p.sequence,p.report_id,p.fingerprint,b.sequence,true,p_expires,p_review,p_approve,p_pdf,p_operator,p_session,p_authorization)returning sequence into n;
 if (select ingest from private.roadmap_processing_controls where singleton) then
 insert into private.roadmap_processing_jobs(draft_id,contact_id,workflow_id,fingerprint)
 select d.id,d.contact_id,d.workflow_id,p.fingerprint from private.vitality_assessment_drafts d join public.vitality_reports report on report.contact_id=d.contact_id and report.workflow_id=d.workflow_id where report.id=p.report_id and encode(extensions.digest(jsonb_build_object('snapshot',d.snapshot,'final_form',d.final_form)::text,'sha256'),'hex')=p.fingerprint on conflict do nothing;
 end if;
 insert into private.roadmap_processing_audit(report_id,actor_id,session_id,action)values(p.report_id,p_operator,p_session,'grant');return n;
end $$;
commit;
