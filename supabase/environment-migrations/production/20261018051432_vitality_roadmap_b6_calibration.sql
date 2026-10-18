-- B6 engineering candidate only. No seeds, participants, grants, drafts, reports or emails.
begin;
do $$ begin
 if to_regprocedure('private.roadmap_b5_context(uuid,boolean)') is null then raise exception 'Deployed B5 required'; end if;
end $$;
create function private.roadmap_b6_pins() returns jsonb language sql immutable set search_path='' as $$
 select '{"adapter":"b6-strict-source-20261018-v1","registry":"2f67c193c2e69b54d61a44599bf9308ca27d317f2bdb748adbeaedfdabe92ced","engine":"b2.1-founder-20261015-v1","contract":"b5-measurements-20261016-v1","ruleSet":"b6-observed-components-unapproved-v1","sop":"RVA-B6-EXPERIMENTAL-CALIBRATION-v1-2026-10-18","artifacts":{"js/vitality-roadmap-b6-adapter.cjs":"295128e878ef7c9ccc2ab795181eee820266e1002024d27e09f4b32a179c2b2f","js/vitality-roadmap-b2-engine.js":"2e81397373e098af9647f1f81acc7f75741cc602237cdc4b526913090c670f69","js/vitality-roadmap-b21-engine.js":"bb22e6a87b00489b5d4b6770b8d6ab56ae9427ac70862ace6dd6e4c4bc67b463","js/vitality-roadmap-b5-contract.js":"9faa311cdd6ba999d089d57338e64c6068130c9b669d01a5b07f7e5e3ea7cd78","js/vitality-roadmap-b4-coverage.js":"2fe30c8bfc9a39da7e96394ecca897b87e05035c9fea9b0ba3e14ded91864781","config/roadmap-b4/source-map.json":"2f67c193c2e69b54d61a44599bf9308ca27d317f2bdb748adbeaedfdabe92ced","netlify/lib/roadmap-calibration.cjs":"aab0a885a3000cb2898754c396a5de84cdb807589476d6f2ae1f82ea4b143a10","netlify/lib/roadmap-scoring-lab.cjs":"a852e398eecc4c5855de1b9c3a50103014fc1418fa6cd92e5feae73f7e38222b"}}'::jsonb;
$$;
create table private.roadmap_b6_purpose_events(
 sequence bigint generated always as identity primary key, report_id uuid not null references public.vitality_reports(id),
 actor_id uuid not null references private.roadmap_b42_founders(user_id),session_id uuid not null,
 source_fingerprint text not null check(source_fingerprint ~ '^[a-f0-9]{64}$'),pilot_sequence bigint not null references private.roadmap_b5_pilot_events(sequence),
 active boolean not null,acknowledgments jsonb not null,pins jsonb not null,created_at timestamptz not null default clock_timestamp()
);
create index roadmap_b6_purpose_latest on private.roadmap_b6_purpose_events(report_id,actor_id,sequence desc);
create table private.roadmap_b6_grant_events(
 sequence bigint generated always as identity primary key, report_id uuid not null references public.vitality_reports(id),contact_id uuid not null references public.contacts(id),
 active boolean not null,purpose_sequence bigint not null references private.roadmap_b6_purpose_events(sequence),source_fingerprint text not null check(source_fingerprint ~ '^[a-f0-9]{64}$'),
 pilot_sequence bigint not null references private.roadmap_b5_pilot_events(sequence),starts_at timestamptz not null,expires_at timestamptz not null,
 allow_feedback boolean not null default false,feedback_authorization text,authorization_reference text not null,
 operator_reference text not null,pins jsonb not null,created_at timestamptz not null default clock_timestamp(),
 check(expires_at>starts_at and expires_at<=starts_at+interval '14 days'),
 check(length(trim(authorization_reference)) between 10 and 1000 and length(trim(operator_reference)) between 3 and 200),
 check((allow_feedback and length(trim(feedback_authorization)) between 10 and 1000) or (not allow_feedback and feedback_authorization is null))
);
create index roadmap_b6_grant_latest on private.roadmap_b6_grant_events(report_id,sequence desc);
create table private.roadmap_b6_feedback(
 id uuid primary key default gen_random_uuid(),report_id uuid not null references public.vitality_reports(id),grant_sequence bigint not null references private.roadmap_b6_grant_events(sequence),
 revision integer not null check(revision>0),actor_id uuid not null references auth.users(id),session_id uuid not null,
 source_fingerprint text not null,pins jsonb not null,manual jsonb not null,notes text not null,citations jsonb not null,
 provenance text not null check(provenance='independent_manual_and_proposed_rules_not_adopted'),
 request_key uuid not null,request_fingerprint text not null,created_at timestamptz not null default clock_timestamp(),
 unique(report_id,revision),unique(actor_id,request_key)
);
create table private.roadmap_b6_audit(
 sequence bigint generated always as identity primary key,report_id uuid not null references public.vitality_reports(id),actor_id uuid not null references auth.users(id),
 session_id uuid not null,action text not null check(action in ('read','check','compute','hypothetical','feedback_save','feedback_history')),grant_sequence bigint not null,
 source_fingerprint text not null,created_at timestamptz not null default clock_timestamp()
);
do $$ declare t text; begin
 foreach t in array array['roadmap_b6_purpose_events','roadmap_b6_grant_events','roadmap_b6_feedback','roadmap_b6_audit'] loop
 execute format('alter table private.%I enable row level security',t);
 execute format('revoke all on private.%I from public,anon,authenticated,service_role',t);
 execute format('create trigger %I before update or delete on private.%I for each row execute function private.roadmap_b4_immutable()',t||'_immutable',t);
 execute format('create trigger %I before truncate on private.%I for each statement execute function private.roadmap_b4_immutable()',t||'_no_truncate',t);
 end loop;
end $$;
revoke all on sequence private.roadmap_b6_purpose_events_sequence_seq,private.roadmap_b6_grant_events_sequence_seq,private.roadmap_b6_audit_sequence_seq from public,anon,authenticated,service_role;

-- New experimental-purpose signoff never substitutes for B4.2 identity/no-score SOP, B4 cohort or B5 grant.
create function private.roadmap_b6_basis(p_report uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare c jsonb; begin
 c:=private.roadmap_b5_context(p_report,false);
 if (c->>'can_edit')::boolean or exists(select 1 from (select * from private.roadmap_b4_cohort_events where report_id=p_report order by sequence desc limit 1)e where e.allow_drafts) then raise exception 'B6 requires read-only originals/draft hold' using errcode='42501'; end if;
 return c;
end $$;
-- Operator only, separate participant-specific owner/privacy authorization is mandatory.
create function private.roadmap_b6_set_pilot(p_purpose bigint,p_expires timestamptz,p_authorization text,p_operator text,p_allow_feedback boolean default false,p_feedback_reference text default null) returns bigint
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
create function private.roadmap_b6_revoke(p_report uuid,p_reference text) returns bigint language plpgsql security definer set search_path='' as $$
declare g private.roadmap_b6_grant_events; seq bigint; begin
 perform pg_advisory_xact_lock(18062026);perform pg_advisory_xact_lock(hashtextextended(p_report::text,416));
 select * into g from private.roadmap_b6_grant_events where report_id=p_report order by sequence desc limit 1;
 if g.sequence is null or p_reference is null or length(trim(p_reference)) not between 10 and 1000 then raise exception 'Unavailable' using errcode='42501'; end if;
 insert into private.roadmap_b6_grant_events(report_id,contact_id,active,purpose_sequence,source_fingerprint,pilot_sequence,starts_at,expires_at,allow_feedback,feedback_authorization,authorization_reference,operator_reference,pins)
 values(g.report_id,g.contact_id,false,g.purpose_sequence,g.source_fingerprint,g.pilot_sequence,g.starts_at,g.expires_at,false,null,p_reference,g.operator_reference,g.pins) returning sequence into seq;
 return seq;
end $$;
create function private.roadmap_b6_context(p_report uuid,p_write boolean default false) returns jsonb language plpgsql security definer set search_path='' as $$
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
create function private.roadmap_b6_validate_manual(m jsonb) returns void language plpgsql immutable set search_path='' as $$
declare d jsonb; k text; i jsonb; r jsonb;begin
 if m is null or jsonb_typeof(m)<>'object' or not m ?& array['score_min','score_max','classification','strongest','weakest','priorities','reason','drivers','independence'] or exists(select 1 from jsonb_object_keys(m) as j(field) where j.field not in ('score_min','score_max','classification','strongest','weakest','priorities','reason','drivers','independence'))
 or (m->>'independence') is null or m->>'independence' not in ('founder_declared_before_candidate','revision_after_candidate_seen')
 or jsonb_typeof(m->'reason') is distinct from 'string' or length(trim(m->>'reason')) not between 3 and 2000 or (m->>'classification') is null or m->>'classification' not in ('Withheld','Peace','Impaired','Dysregulated','Chronic','Chaos')
 or jsonb_typeof(m->'drivers') is distinct from 'object' or (select count(*) from jsonb_object_keys(m->'drivers'))<>12 or exists(select 1 from jsonb_object_keys(m->'drivers') as j(field) where not j.field=any(private.roadmap_b4_driver_keys())) then raise exception 'Invalid manual review' using errcode='22023'; end if;
 if not ((m->'score_min'='null'::jsonb and m->'score_max'='null'::jsonb) or (jsonb_typeof(m->'score_min')='number' and jsonb_typeof(m->'score_max')='number' and (m->>'score_min')::numeric between 0 and 100 and (m->>'score_max')::numeric between (m->>'score_min')::numeric and 100)) then raise exception 'Invalid manual range' using errcode='22023'; end if;
 foreach k in array array['strongest','weakest'] loop
 if jsonb_typeof(m->k) is distinct from 'array' or jsonb_array_length(m->k)>3 or (select count(distinct value) from jsonb_array_elements(m->k))<>jsonb_array_length(m->k) then raise exception 'Invalid manual choices' using errcode='22023'; end if;
 for i in select value from jsonb_array_elements(m->k) loop if jsonb_typeof(i)<>'string' or not (i#>>'{}')=any(private.roadmap_b4_driver_keys()) then raise exception 'Invalid Driver' using errcode='22023'; end if; end loop;
 end loop;
 if jsonb_typeof(m->'priorities') is distinct from 'array' or jsonb_array_length(m->'priorities') not between 1 and 3 or (select count(distinct value->>'driver') from jsonb_array_elements(m->'priorities'))<>jsonb_array_length(m->'priorities') then raise exception 'Invalid priorities' using errcode='22023'; end if;
 for i in select value from jsonb_array_elements(m->'priorities') loop if jsonb_typeof(i)<>'object' or not i ?& array['driver','reason'] or exists(select 1 from jsonb_object_keys(i) as j(field) where j.field not in ('driver','reason')) or (i->>'driver') is null or not (i->>'driver')=any(private.roadmap_b4_driver_keys()) or jsonb_typeof(i->'reason') is distinct from 'string' or length(trim(i->>'reason')) not between 3 and 2000 then raise exception 'Invalid priority' using errcode='22023'; end if; end loop;
 for d in select value from jsonb_each(m->'drivers') loop
 if jsonb_typeof(d)<>'object' or not d ?& array['score','classification','reason'] or exists(select 1 from jsonb_object_keys(d) as j(field) where j.field not in ('score','classification','reason')) or not(d->'score'='null'::jsonb or (jsonb_typeof(d->'score')='number' and (d->>'score')::numeric between 0 and 100))
 or (d->>'classification') is null or d->>'classification' not in ('Withheld','Peace','Impaired','Dysregulated','Chronic','Chaos') or jsonb_typeof(d->'reason') is distinct from 'string' or length(d->>'reason')>2000 or ((d->'score'<>'null'::jsonb or d->>'classification'<>'Withheld') and length(trim(d->>'reason'))<3) then raise exception 'Invalid Driver review' using errcode='22023'; end if;
 end loop;
end $$;
create function public.roadmap_b6(p_action text,p_report uuid default null,p_payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.roadmap_b42_actor();sid uuid:=(auth.jwt()->>'session_id')::uuid;c jsonb;p jsonb;g private.roadmap_b6_grant_events;entry record;available jsonb:='[]';seq bigint;current_revision integer;old private.roadmap_b6_feedback;key uuid;pin text;ref jsonb;ack jsonb;ready boolean;identity_meta jsonb;
begin
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>20000 then raise exception 'Invalid request' using errcode='22023'; end if;
 if p_action='authorize' and p_report is null and p_payload='{}'::jsonb then return jsonb_build_object('authorized',true,'pins',private.roadmap_b6_pins(),'cohort','operator_only','drafts','held','release','held'); end if;
 if p_action='list' and p_report is null and p_payload='{}'::jsonb then
 for entry in select e.* from (select distinct on(report_id) * from private.roadmap_b5_pilot_events order by report_id,sequence desc)e where e.active and e.expires_at>clock_timestamp() loop
 begin
 c:=private.roadmap_b6_basis(entry.report_id);ready:=false;begin perform private.roadmap_b6_context(entry.report_id,false);ready:=true;exception when sqlstate '42501' or sqlstate '40001' or sqlstate '55000' then null;end;select * into g from private.roadmap_b6_grant_events where report_id=entry.report_id order by sequence desc limit 1;
 identity_meta:=private.roadmap_b42_public_metadata(private.roadmap_b42_descriptor((select contact_id from public.vitality_reports where id=entry.report_id),entry.report_id));
 available:=available||jsonb_build_array(jsonb_build_object('report_id',entry.report_id,'label','Individually verified source','identity',identity_meta,'ready',ready,'operator_grant',coalesce(g.active and g.expires_at>clock_timestamp() and g.source_fingerprint=c->>'source_fingerprint' and g.pilot_sequence=entry.sequence,false)));
 exception when sqlstate '42501' or sqlstate '40001' or sqlstate '55000' then null;end;
 end loop;return available;
 end if;
 if p_action='attest' and p_report is not null then
 c:=private.roadmap_b6_basis(p_report);ack:=p_payload->'acknowledgments';
 if not p_payload ?& array['active','sop','acknowledgments'] or exists(select 1 from jsonb_object_keys(p_payload)k where k not in ('active','sop','acknowledgments')) or jsonb_typeof(p_payload->'active') is distinct from 'boolean' or p_payload->>'sop' is distinct from private.roadmap_b6_pins()->>'sop'
 or ack is distinct from '{"experimental_purpose":true,"no_client_scores":true,"immutable_originals":true,"no_external_ai_exports":true,"manual_revocation_14_days":true,"separate_feedback_permission":true,"historical_provenance_limits":true}'::jsonb then raise exception 'New B6 purpose/SOP acknowledgment required' using errcode='22023'; end if;
 insert into private.roadmap_b6_purpose_events(report_id,actor_id,session_id,source_fingerprint,pilot_sequence,active,acknowledgments,pins)values(p_report,actor,sid,c->>'source_fingerprint',(c->>'pilot_sequence')::bigint,(p_payload->>'active')::boolean,ack,private.roadmap_b6_pins())returning sequence into seq;
 ready:=false;begin perform private.roadmap_b6_context(p_report,false);ready:=true;exception when sqlstate '42501' or sqlstate '40001' or sqlstate '55000' then null;end;
 return jsonb_build_object('acknowledged',true,'can_open',ready,'operator_activation','separate_required','enrolled',false);
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
revoke all on function private.roadmap_b6_pins(),private.roadmap_b6_basis(uuid),private.roadmap_b6_set_pilot(bigint,timestamptz,text,text,boolean,text),private.roadmap_b6_revoke(uuid,text),private.roadmap_b6_context(uuid,boolean),private.roadmap_b6_validate_manual(jsonb),public.roadmap_b6(text,uuid,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.roadmap_b6(text,uuid,jsonb) to authenticated;
commit;
