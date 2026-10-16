-- B5 candidate only. Production-only additive install; grants/cohort/proposals start EMPTY.
begin;
do $$ begin
 if to_regprocedure('private.roadmap_b42_operator_plan(uuid)') is null then raise exception 'Deployed B4.2 required'; end if;
end $$;
create table private.roadmap_b5_pilot_events(
 sequence bigint generated always as identity primary key,
 report_id uuid not null references public.vitality_reports(id), active boolean not null,
 verification_id uuid not null references private.roadmap_b42_verifications(id),
 source_fingerprint text not null check(source_fingerprint ~ '^[a-f0-9]{64}$'),
 approved_by uuid not null references private.roadmap_b42_founders(user_id), session_id uuid not null,
 starts_at timestamptz not null, expires_at timestamptz not null,
 authorization_reference text not null check(length(trim(authorization_reference)) between 10 and 1000),
 created_at timestamptz not null default clock_timestamp(),
 check(expires_at>starts_at and expires_at<=starts_at+interval '14 days')
);
create index roadmap_b5_pilot_latest on private.roadmap_b5_pilot_events(report_id,sequence desc);
create table private.roadmap_b5_proposals(
 id uuid primary key default gen_random_uuid(),report_id uuid not null references public.vitality_reports(id),
 pilot_sequence bigint not null references private.roadmap_b5_pilot_events(sequence),
 revision integer not null check(revision>0),source_fingerprint text not null,
 contract_version text not null check(contract_version='b5-measurements-20261016-v1'),
 registry_fingerprint text not null check(registry_fingerprint='2f67c193c2e69b54d61a44599bf9308ca27d317f2bdb748adbeaedfdabe92ced'),
 adapter_version text not null check(adapter_version='b4-source-coverage-20261016-v1'),
 rubric_version text not null check(rubric_version='b5-rubric-unapproved-v1'),
 config_version text not null check(config_version='b2.1-founder-20261015-v1'),
 proposal jsonb not null, actor_id uuid not null references auth.users(id),session_id uuid not null,
 request_key uuid not null,request_fingerprint text not null,
 provenance text not null check(provenance='hypothetical_proposal_not_adopted'),
 created_at timestamptz not null default clock_timestamp(),
 unique(report_id,revision),unique(actor_id,request_key)
);
create table private.roadmap_b5_audit(
 sequence bigint generated always as identity primary key,report_id uuid not null references public.vitality_reports(id),
 actor_id uuid not null references auth.users(id),session_id uuid not null,
 action text not null check(action in ('read','check','proposal_read','proposal_save')),
 proposal_id uuid references private.roadmap_b5_proposals(id),source_fingerprint text not null,
 created_at timestamptz not null default clock_timestamp()
);
do $$ declare t text; begin
 foreach t in array array['roadmap_b5_pilot_events','roadmap_b5_proposals','roadmap_b5_audit'] loop
 execute format('alter table private.%I enable row level security',t);
 execute format('revoke all on private.%I from public,anon,authenticated,service_role',t);
 execute format('create trigger %I before update or delete on private.%I for each row execute function private.roadmap_b4_immutable()',t||'_immutable',t);
 execute format('create trigger %I before truncate on private.%I for each statement execute function private.roadmap_b4_immutable()',t||'_no_truncate',t);
 end loop;
end $$;
revoke all on sequence private.roadmap_b5_pilot_events_sequence_seq,private.roadmap_b5_audit_sequence_seq from public,anon,authenticated,service_role;
-- Operator-only independent experimental compute grant. No browser/admin/service grant.
-- External exact-source authorization is required; existing identity/SOP approval is NOT sufficient.
create function private.roadmap_b5_set_pilot(p_verification uuid,p_expires timestamptz,p_reference text) returns bigint
language plpgsql security definer set search_path='' as $$
declare v private.roadmap_b42_verifications; plan jsonb; c jsonb; seq bigint;
begin
 select * into v from private.roadmap_b42_verifications where id=p_verification;
 if v.report_id is null then raise exception 'Unavailable' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(v.report_id::text,416));
 plan:=private.roadmap_b42_operator_plan(p_verification);
 select jsonb_build_object('active',e.active,'pin',e.source_fingerprint) into c from private.roadmap_b4_cohort_events e where report_id=v.report_id order by sequence desc limit 1;
 if c->>'active' is distinct from 'true' or c->>'pin' is distinct from plan->>'source_fingerprint'
 or p_expires is null or p_expires<=clock_timestamp() or p_expires>(plan->>'revoke_by')::timestamptz
 or p_expires>clock_timestamp()+interval '14 days' or length(trim(p_reference)) not between 10 and 1000 then raise exception 'Separate bounded pilot authorization required' using errcode='42501'; end if;
 insert into private.roadmap_b5_pilot_events(report_id,active,verification_id,source_fingerprint,approved_by,session_id,starts_at,expires_at,authorization_reference)
 values(v.report_id,true,v.id,v.source_fingerprint,v.actor_id,v.session_id,clock_timestamp(),p_expires,p_reference) returning sequence into seq;
 return seq;
end $$;
create function private.roadmap_b5_revoke(p_report uuid,p_reference text) returns bigint
language plpgsql security definer set search_path='' as $$
declare p private.roadmap_b5_pilot_events; seq bigint;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_report::text,416));
 select * into p from private.roadmap_b5_pilot_events where report_id=p_report order by sequence desc limit 1;
 if p.sequence is null then raise exception 'Unavailable' using errcode='42501'; end if;
 insert into private.roadmap_b5_pilot_events(report_id,active,verification_id,source_fingerprint,approved_by,session_id,starts_at,expires_at,authorization_reference)
 values(p_report,false,p.verification_id,p.source_fingerprint,p.approved_by,p.session_id,p.starts_at,p.expires_at,p_reference) returning sequence into seq;
 return seq;
end $$;
create function private.roadmap_b5_context(p_report uuid,p_write boolean default false) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid; p private.roadmap_b5_pilot_events; c jsonb; plan jsonb;
begin
 actor:=private.roadmap_b42_actor();
 perform pg_advisory_xact_lock(hashtextextended(p_report::text,416));
 -- Recheck after locks: a concurrent logout/revocation must not resurrect a stale request.
 actor:=private.roadmap_b42_actor();
 select * into p from private.roadmap_b5_pilot_events where report_id=p_report order by sequence desc limit 1;
 if p.active is distinct from true or p.starts_at>clock_timestamp() or p.expires_at<=clock_timestamp() then raise exception 'Scoring pilot held' using errcode='42501'; end if;
 plan:=private.roadmap_b42_operator_plan(p.verification_id);
 if plan->>'source_fingerprint' is distinct from p.source_fingerprint then raise exception 'Source changed' using errcode='40001'; end if;
 c:=private.roadmap_b4_context(p_report,p_write);
 if c->>'source_fingerprint' is distinct from p.source_fingerprint then raise exception 'Source changed' using errcode='40001'; end if;
 return c||jsonb_build_object('pilot_sequence',p.sequence,'expires_at',p.expires_at,'compute','experimental_only','writes',case when (c->>'can_edit')::boolean then 'explicit_cohort_only' else 'held' end);
end $$;
create function private.roadmap_b5_validate_proposal(p jsonb,c jsonb) returns void
language plpgsql immutable set search_path='' as $$
declare i jsonb; param_key text; ref jsonb;
begin
 if p is null or jsonb_typeof(p)<>'object' or octet_length(p::text)>16000
 or not p ?& array['reason','items','parameters','case_id'] or exists(select 1 from jsonb_object_keys(p) k where k not in ('reason','items','parameters','case_id'))
 or jsonb_typeof(p->'reason')<>'string' or length(trim(p->>'reason')) not between 3 and 2000
 or jsonb_typeof(p->'case_id')<>'string' or (p->>'case_id') !~ '^[a-z0-9_]{1,80}$'
 or jsonb_typeof(p->'parameters')<>'object' or jsonb_typeof(p->'items')<>'array' or jsonb_array_length(p->'items')>12 then raise exception 'Invalid proposal' using errcode='22023'; end if;
 for param_key,i in select key,value from jsonb_each(p->'parameters') loop
 if param_key in ('concernPeak','lifestyleMean','healthExponent','symptomBreadth') then
 if jsonb_typeof(i)<>'number' or (i::text)::numeric not between 0 and 1 then raise exception 'Invalid parameter' using errcode='22023'; end if;
 elsif param_key in ('peaceMinimum','minimumDays','persistentDays') then
 if jsonb_typeof(i)<>'number' or i::text !~ '^[0-9]+$' then raise exception 'Invalid rule' using errcode='22023'; end if;
 if (param_key='peaceMinimum' and (i::text)::integer not in (90,95)) or (param_key='minimumDays' and (i::text)::integer not between 1 and 30) or (param_key='persistentDays' and (i::text)::integer not between 1 and 36500) then raise exception 'Invalid rule' using errcode='22023'; end if;
 elsif param_key='chaosImpact' then
 if jsonb_typeof(i)<>'string' or (i#>>'{}') not in ('each_condition','any_condition') then raise exception 'Invalid rule' using errcode='22023'; end if;
 elsif param_key='chronicKind' then
 if jsonb_typeof(i)<>'string' or (i#>>'{}') not in ('reported_condition','reported_diagnosis','symptoms_or_conditions') then raise exception 'Invalid rule' using errcode='22023'; end if;
 else raise exception 'Invalid parameter' using errcode='22023'; end if;
 end loop;
 for i in select value from jsonb_array_elements(p->'items') loop
 if jsonb_typeof(i)<>'object' or not i ?& array['driver','kind','proposal','reason','evidence']
 or exists(select 1 from jsonb_object_keys(i) k where k not in ('driver','kind','proposal','reason','evidence'))
 or jsonb_typeof(i->'driver') is distinct from 'string' or jsonb_typeof(i->'kind') is distinct from 'string' or not (i->>'driver'=any(private.roadmap_b4_driver_keys())) or i->>'kind' not in ('correction','strength','priority','starting_action','kb_relationship','clarification')
 or jsonb_typeof(i->'proposal')<>'string' or length(trim(i->>'proposal')) not between 1 and 2000
 or jsonb_typeof(i->'reason')<>'string' or length(trim(i->>'reason')) not between 3 and 2000
 or jsonb_typeof(i->'evidence')<>'array' or jsonb_array_length(i->'evidence') not between 1 and 20 then raise exception 'Invalid cited proposal' using errcode='22023'; end if;
 for ref in select value from jsonb_array_elements(i->'evidence') loop
 if jsonb_typeof(ref)<>'string' or not coalesce(c->'source'->'answers','{}') ? (ref#>>'{}') then raise exception 'Available question citation required' using errcode='22023'; end if;
 end loop;
 end loop;
end $$;
create function public.roadmap_b5(p_action text,p_report uuid default null,p_payload jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.roadmap_b42_actor(); sid uuid:=(auth.jwt()->>'session_id')::uuid;
 c jsonb; p jsonb; seq bigint; old private.roadmap_b5_proposals; fresh private.roadmap_b5_proposals; pin text; current_revision integer; key uuid; entry record; available jsonb;
begin
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>20000 then raise exception 'Invalid request' using errcode='22023'; end if;
 if p_action='authorize' and p_report is null and p_payload='{}'::jsonb then return jsonb_build_object('authorized',true,'real_scoring','independent_pilot_required','drafts','held','client_release','held'); end if;
 if p_action='list' and p_report is null and p_payload='{}'::jsonb then
 -- Do not reveal reports without a complete, current grant chain. Revalidate again on open.
 available:='[]'::jsonb;
 for entry in select e.* from (select distinct on(report_id) * from private.roadmap_b5_pilot_events order by report_id,sequence desc)e
 where e.active and e.starts_at<=clock_timestamp() and e.expires_at>clock_timestamp() order by e.report_id loop
 begin
 perform private.roadmap_b5_context(entry.report_id,false);
 available:=available||jsonb_build_array(jsonb_build_object('report_id',entry.report_id,'label','Explicit scoring pilot source'));
 exception when sqlstate '42501' or sqlstate '40001' or sqlstate '55000' then null;
 end;
 end loop;
 return available;
 end if;
 if p_action is null or p_action not in ('read','check','history','save') or p_report is null then raise exception 'Invalid request' using errcode='22023'; end if;
 c:=private.roadmap_b5_context(p_report,p_action='save');
 if p_action<>'save' and p_payload<>'{}'::jsonb then raise exception 'Invalid request' using errcode='22023'; end if;
 if p_action='save' then
 if not p_payload ?& array['expected_revision','request_key','proposal','source_fingerprint'] or exists(select 1 from jsonb_object_keys(p_payload) k where k not in ('expected_revision','request_key','proposal','source_fingerprint')) then raise exception 'Invalid save' using errcode='22023'; end if;
 if p_payload->>'source_fingerprint' is distinct from c->>'source_fingerprint' then raise exception 'Stale proposal' using errcode='40001'; end if;
 p:=p_payload->'proposal'; perform private.roadmap_b5_validate_proposal(p,c);
 key:=(p_payload->>'request_key')::uuid;
 pin:=encode(extensions.digest(p_payload::text,'sha256'),'hex');
 select * into old from private.roadmap_b5_proposals where actor_id=actor and request_key=key;
 if old.id is not null then
 if old.report_id<>p_report or old.request_fingerprint<>pin then raise exception 'Changed retry' using errcode='22023'; end if;
 return jsonb_build_object('revision',old.revision,'idempotent',true,'adopted',false); end if;
 select coalesce(max(revision),0) into current_revision from private.roadmap_b5_proposals where report_id=p_report;
 if jsonb_typeof(p_payload->'expected_revision') is distinct from 'number' or p_payload->>'expected_revision' !~ '^[0-9]+$' or (p_payload->>'expected_revision')::integer<>current_revision then raise exception 'Proposal conflict' using errcode='40001'; end if;
 insert into private.roadmap_b5_proposals(report_id,pilot_sequence,revision,source_fingerprint,contract_version,registry_fingerprint,adapter_version,rubric_version,config_version,proposal,actor_id,session_id,request_key,request_fingerprint,provenance)
 values(p_report,(c->>'pilot_sequence')::bigint,current_revision+1,c->>'source_fingerprint','b5-measurements-20261016-v1','2f67c193c2e69b54d61a44599bf9308ca27d317f2bdb748adbeaedfdabe92ced','b4-source-coverage-20261016-v1','b5-rubric-unapproved-v1','b2.1-founder-20261015-v1',p,actor,sid,key,pin,'hypothetical_proposal_not_adopted') returning * into fresh;
 insert into private.roadmap_b5_audit(report_id,actor_id,session_id,action,proposal_id,source_fingerprint) values(p_report,actor,sid,'proposal_save',fresh.id,c->>'source_fingerprint');
 return jsonb_build_object('revision',fresh.revision,'adopted',false,'release','held');
 end if;
 insert into private.roadmap_b5_audit(report_id,actor_id,session_id,action,source_fingerprint) values(p_report,actor,sid,case p_action when 'history' then 'proposal_read' else p_action end,c->>'source_fingerprint');
 select coalesce(max(revision),0) into current_revision from private.roadmap_b5_proposals where report_id=p_report;
 if p_action='check' then return jsonb_build_object('authorized',true,'pilot_sequence',c->'pilot_sequence','can_edit',c->'can_edit','expires_at',c->'expires_at'); end if;
 if p_action='history' then select coalesce(jsonb_agg(jsonb_build_object('revision',revision,'proposal',proposal,'reviewer',actor_id,'created_at',created_at,'provenance',provenance) order by revision),'[]') into p from private.roadmap_b5_proposals where report_id=p_report; return p; end if;
 return c||jsonb_build_object('revision',current_revision,'actual_score',null,'actual_stage',null,'scoring_status','withheld_insufficient_measurements_and_unapproved_rubrics');
exception when others then raise exception 'Founder Scoring Lab unavailable' using errcode=sqlstate;
end $$;
revoke all on function private.roadmap_b5_set_pilot(uuid,timestamptz,text),private.roadmap_b5_revoke(uuid,text),private.roadmap_b5_context(uuid,boolean),private.roadmap_b5_validate_proposal(jsonb,jsonb),public.roadmap_b5(text,uuid,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.roadmap_b5(text,uuid,jsonb) to authenticated;
commit;
