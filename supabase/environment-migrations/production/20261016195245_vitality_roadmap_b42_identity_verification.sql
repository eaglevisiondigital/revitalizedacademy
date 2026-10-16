-- B4.2 candidate ONLY. Production forward migration; no cohort or source mutation.
begin;
do $$ begin
 if to_regprocedure('private.roadmap_b4_actor(uuid,boolean)') is null then raise exception 'Deployed B4 required'; end if;
 if (select count(*) from auth.users u where lower(trim(u.email)) in ('justyn@revitalizedacademy.com','elle@revitalizedacademy.com') and private.roadmap_b4_is_founder(u.id))<>2
 or (select count(distinct lower(trim(u.email))) from auth.users u where lower(trim(u.email)) in ('justyn@revitalizedacademy.com','elle@revitalizedacademy.com') and private.roadmap_b4_is_founder(u.id))<>2 then
 raise exception 'Exactly two authoritative founder identities required'; end if;
end $$;
create table private.roadmap_b42_founders(
 user_id uuid primary key references auth.users(id) on delete restrict,
 verified_email text not null unique check(verified_email in ('justyn@revitalizedacademy.com','elle@revitalizedacademy.com'))
);
-- Pin the two actual Auth UUIDs privately at installation, never publish real UUID literals.
insert into private.roadmap_b42_founders select u.id,lower(trim(u.email)) from auth.users u
 where lower(trim(u.email)) in ('justyn@revitalizedacademy.com','elle@revitalizedacademy.com') and private.roadmap_b4_is_founder(u.id);
create table private.roadmap_b42_requests(
 id uuid primary key default gen_random_uuid(), actor_id uuid not null references auth.users(id), session_id uuid not null,
 contact_id uuid not null references public.contacts(id), report_id uuid references public.vitality_reports(id), workflow_id uuid references public.workflow_records(id),
 source_fingerprint text check(source_fingerprint ~ '^[a-f0-9]{64}$'), metadata_fingerprint text not null,
 created_at timestamptz not null default clock_timestamp(), expires_at timestamptz not null default clock_timestamp()+interval '15 minutes'
);
create index roadmap_b42_requests_contact on private.roadmap_b42_requests(contact_id,created_at desc);
create table private.roadmap_b42_sop_attestations(
 id uuid primary key default gen_random_uuid(), actor_id uuid not null references auth.users(id), session_id uuid not null,
 sop_version text not null check(sop_version='RVA-B4-PILOT-READONLY-v1-2026-10-16'),
 acknowledgments jsonb not null,
 revocation_owner uuid references private.roadmap_b42_founders(user_id), backup_owner uuid references private.roadmap_b42_founders(user_id),
 starts_at timestamptz, revoke_by timestamptz, created_at timestamptz not null default clock_timestamp(),
 check((revocation_owner is null and backup_owner is null and starts_at is null and revoke_by is null) or
 (revocation_owner is not null and backup_owner is not null and revocation_owner<>backup_owner and starts_at is not null and revoke_by>starts_at and revoke_by<=starts_at+interval '14 days'))
);
create table private.roadmap_b42_verifications(
 id uuid primary key default gen_random_uuid(), request_id uuid not null unique references private.roadmap_b42_requests(id),
 actor_id uuid not null references auth.users(id), session_id uuid not null,
 contact_id uuid not null references public.contacts(id), report_id uuid references public.vitality_reports(id), workflow_id uuid references public.workflow_records(id),
 source_fingerprint text, metadata_fingerprint text not null, eligible_at_confirmation boolean not null,
 revision integer not null check(revision>0), subject_key uuid not null,
 decision text not null check(decision in ('confirmed','not_intended','needs_clarification')),
 reason_code text not null check(reason_code in ('identity_date_match','different_person','different_assessment','identifier_unclear','historical_only')),
 sop_id uuid not null unique references private.roadmap_b42_sop_attestations(id), request_key uuid not null,
 request_fingerprint text not null, created_at timestamptz not null default clock_timestamp(),
 unique(subject_key,revision),unique(actor_id,request_key)
);
do $$ declare t text; begin
 foreach t in array array['roadmap_b42_founders','roadmap_b42_requests','roadmap_b42_sop_attestations','roadmap_b42_verifications'] loop
 execute format('alter table private.%I enable row level security',t);
 execute format('revoke all on private.%I from public,anon,authenticated,service_role',t);
 execute format('create trigger %I before update or delete on private.%I for each row execute function private.roadmap_b4_immutable()',t||'_immutable',t);
 execute format('create trigger %I before truncate on private.%I for each statement execute function private.roadmap_b4_immutable()',t||'_no_truncate',t);
 end loop;
end $$;
create function private.roadmap_b42_actor(p_contact uuid default null) returns uuid language plpgsql stable security definer set search_path='' as $$
declare actor uuid:=private.roadmap_b4_actor(p_contact,false);
begin
 if not exists(select 1 from private.roadmap_b42_founders f join auth.users u on u.id=f.user_id where f.user_id=actor and lower(trim(u.email))=f.verified_email) then
 raise exception 'Founder verification unavailable' using errcode='42501'; end if;
 return actor;
end $$;
create function private.roadmap_b42_descriptor(p_contact uuid,p_report uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.contacts; r public.vitality_reports; w public.workflow_records; d private.vitality_assessment_drafts;
 warning boolean; peers integer; eligible boolean:=false; kind text; fingerprint text; masked text; meta jsonb; n integer;
begin
 select * into c from public.contacts where id=p_contact for share;
 if c.id is null then raise exception 'Unavailable' using errcode='42501'; end if;
 if p_report is not null then
 select * into r from public.vitality_reports where id=p_report and contact_id=p_contact for share;
 if r.id is null then raise exception 'Unavailable' using errcode='42501'; end if;
 select * into w from public.workflow_records where id=r.workflow_id and contact_id=c.id for share;
 select count(*) into n from private.vitality_assessment_drafts where workflow_id=r.workflow_id and contact_id=c.id;
 if n=1 then select * into d from private.vitality_assessment_drafts where workflow_id=r.workflow_id and contact_id=c.id for share; end if;
 end if;
 kind:=case when r.id is null then 'no_report' when w.id is null or w.workflow_type<>'vitality_assessment' or w.status<>'completed' or w.completed_at is null then 'incomplete_link'
 when n=0 then 'historical_only' when n<>1 then 'ambiguous_source' else 'ineligible_detailed' end;
 if d.id is not null then
 fingerprint:=encode(extensions.digest(jsonb_build_object('snapshot',d.snapshot,'final_form',d.final_form)::text,'sha256'),'hex');
 if d.status='completed' and d.verified_at is not null and d.completed_at is not null and d.snapshot->>'version'='1'
 and d.snapshot->>'pathway'='Adult' and jsonb_typeof(d.snapshot->'fields')='object' and jsonb_typeof(d.snapshot->'fields'->'assessment_for')='array' then
 eligible:=(select count(*)=1 and coalesce(bool_and(x->>'value'='Myself'),false) from jsonb_array_elements(d.snapshot->'fields'->'assessment_for') x where x->>'checked'='true');
 if eligible and w.workflow_type='vitality_assessment' and w.status='completed' and w.completed_at is not null then kind:='eligible_detailed'; else eligible:=false; end if;
 end if;
 end if;
 select count(*) into peers from public.contacts x where lower(trim(x.first_name))=lower(trim(c.first_name)) and lower(trim(x.last_name))=lower(trim(c.last_name));
 select exists(select 1 from public.contacts x join auth.users u on lower(trim(u.email))=lower(trim(x.email)) join public.staff_access s on s.user_id=u.id
 where x.id<>c.id and lower(trim(x.first_name))=lower(trim(c.first_name)) and lower(trim(x.last_name))=lower(trim(c.last_name))) into warning;
 masked:=case when position('@' in coalesce(c.email,''))>1 then left(c.email,1)||'•••@'||split_part(c.email,'@',2)
 when coalesce(length(regexp_replace(c.phone,'[^0-9]','','g')),0)>=4 then '••• '||right(regexp_replace(c.phone,'[^0-9]','','g'),4) else 'No second identifier recorded' end;
 meta:=jsonb_build_object('name',trim(concat_ws(' ',c.first_name,c.last_name)),'second_identifier',masked,'completed_at',coalesce(d.completed_at,w.completed_at),'workflow_completed_at',w.completed_at,
 'kind',kind,'eligible',eligible,'has_report',r.id is not null,
 'identity_confirmable',nullif(trim(c.first_name),'') is not null and nullif(trim(c.last_name),'') is not null
 and (coalesce(c.email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$',false) or coalesce(length(regexp_replace(c.phone,'[^0-9]','','g')),0)>=7)
 and coalesce(d.completed_at,w.completed_at) is not null,'same_name_contacts',peers,'staff_contact_warning',warning);
 return meta||jsonb_build_object('_contact',c.id,'_report',r.id,'_workflow',w.id,'_source',fingerprint,
 '_fingerprint',encode(extensions.digest(jsonb_build_object('contact',jsonb_build_array(c.id,c.first_name,c.last_name,c.email,c.phone),
 'report',r.id,'workflow',w.id,'source',fingerprint,'metadata',meta)::text,'sha256'),'hex'));
end $$;
-- Internal descriptor is reachable only through these independently guarded paths.
create function private.roadmap_b42_metadata(p_contact uuid,p_report uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin perform private.roadmap_b42_actor(p_contact); return private.roadmap_b42_descriptor(p_contact,p_report); end $$;
-- Operator-only read/preflight, NOT enrollment. Never granted to browser/service roles.
create function private.roadmap_b42_operator_plan(p_verification uuid) returns jsonb language plpgsql security definer set search_path='' as $$
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
create function private.roadmap_b42_public_metadata(m jsonb) returns jsonb language sql immutable set search_path='' as $$
 select jsonb_build_object('name',m->'name','second_identifier',m->'second_identifier','completed_at',m->'completed_at',
 'workflow_completed_at',m->'workflow_completed_at','kind',m->'kind','eligible',m->'eligible','has_report',m->'has_report',
 'identity_confirmable',m->'identity_confirmable','same_name_contacts',m->'same_name_contacts','staff_contact_warning',m->'staff_contact_warning');
$$;
create function public.roadmap_b42(p_action text,p_payload jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.roadmap_b42_actor(); sid uuid:=(auth.jwt()->>'session_id')::uuid; q text; completion_day date; c record; m jsonb; result jsonb:='[]';
 req private.roadmap_b42_requests; old private.roadmap_b42_verifications; sop private.roadmap_b42_sop_attestations;
 latest integer; key uuid; pin text; sopid uuid; decision text; reason text; ownerid uuid; backupid uuid; starts timestamptz; deadline timestamptz;
 acks jsonb; subject uuid; out_revision integer;
begin
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>6000 then raise exception 'Invalid request' using errcode='22023'; end if;
 if p_action in ('authorize','status') and p_payload<>'{}'::jsonb then raise exception 'Invalid request' using errcode='22023'; end if;
 if p_action='authorize' then return jsonb_build_object('authorized',true,'sop_version','RVA-B4-PILOT-READONLY-v1-2026-10-16','enrollment','held'); end if;
 if p_action='status' then
 for c in select distinct on(coalesce(report_id,contact_id)) * from private.roadmap_b42_requests order by coalesce(report_id,contact_id),created_at desc limit 30 loop
 m:=private.roadmap_b42_metadata(c.contact_id,c.report_id);
 select * into old from private.roadmap_b42_verifications where subject_key=coalesce(c.report_id,c.contact_id) order by revision desc limit 1;
 select * into sop from private.roadmap_b42_sop_attestations where id=old.sop_id;
 result:=result||jsonb_build_array(private.roadmap_b42_public_metadata(m)||jsonb_build_object('decision',coalesce(old.decision,'pending'),
 'source_changed',old.id is not null and old.metadata_fingerprint<>m->>'_fingerprint','revision',coalesce(old.revision,0),
 'reviewer',case when old.actor_id is null then null else (select case when verified_email='justyn@revitalizedacademy.com' then 'Justyn' else 'Elle' end from private.roadmap_b42_founders where user_id=old.actor_id) end,
 'revoke_by',sop.revoke_by,'revocation_owner',case when sop.revocation_owner is null then null else (select case when verified_email='justyn@revitalizedacademy.com' then 'Justyn' else 'Elle' end from private.roadmap_b42_founders where user_id=sop.revocation_owner) end,
 'enrollment','held'));
 end loop;
 return result;
 end if;
 if p_action='search' then
 if p_payload is null or not p_payload ? 'query' or exists(select 1 from jsonb_object_keys(p_payload) k where k not in ('query','completion_date')) or jsonb_typeof(p_payload->'query')<>'string' then raise exception 'Invalid request' using errcode='22023'; end if;
 if p_payload ? 'completion_date' and (p_payload->>'completion_date') is not null then
 if jsonb_typeof(p_payload->'completion_date')<>'string' or (p_payload->>'completion_date') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception 'Invalid date' using errcode='22023'; end if;
 completion_day:=(p_payload->>'completion_date')::date; end if;
 q:=lower(regexp_replace(trim(p_payload->>'query'),'\s+',' ','g'));
 if length(q) not between 5 and 160 or (position(' ' in q)=0 and position('@' in q)=0) then raise exception 'Use exact full name or email' using errcode='22023'; end if;
 -- Exact bounded lookup; no first-name, wildcard, bulk or pagination endpoint.
 for c in select x.id contact_id,r.id report_id from public.contacts x left join public.vitality_reports r on r.contact_id=x.id left join public.workflow_records w on w.id=r.workflow_id and w.contact_id=x.id
 where (lower(trim(x.email))=q or lower(regexp_replace(trim(concat_ws(' ',x.first_name,x.last_name)),'\s+',' ','g'))=q)
 and (completion_day is null or (w.completed_at at time zone 'UTC')::date=completion_day or exists(select 1 from private.vitality_assessment_drafts sd where sd.workflow_id=r.workflow_id and sd.contact_id=x.id and (sd.completed_at at time zone 'UTC')::date=completion_day))
 order by x.id,r.created_at desc limit 13 loop
 if jsonb_array_length(result)>=12 then raise exception 'Refine selection' using errcode='22023'; end if;
 m:=private.roadmap_b42_metadata(c.contact_id,c.report_id);
 select coalesce(max(revision),0) into latest from private.roadmap_b42_verifications where subject_key=coalesce(c.report_id,c.contact_id);
 insert into private.roadmap_b42_requests(actor_id,session_id,contact_id,report_id,workflow_id,source_fingerprint,metadata_fingerprint)
 values(actor,sid,c.contact_id,c.report_id,(m->>'_workflow')::uuid,m->>'_source',m->>'_fingerprint') returning * into req;
 result:=result||jsonb_build_array(private.roadmap_b42_public_metadata(m)||jsonb_build_object('request',req.id,'revision',latest));
 end loop;
 return result;
 end if;
 if p_action not in ('check','contact','attest') or p_action is null then raise exception 'Invalid action' using errcode='22023'; end if;
 if not p_payload ? 'request' then raise exception 'Invalid request' using errcode='22023'; end if;
 select * into req from private.roadmap_b42_requests where id=(p_payload->>'request')::uuid;
 if req.id is null or req.actor_id<>actor or req.session_id<>sid or req.expires_at<=clock_timestamp() then raise exception 'Request unavailable' using errcode='42501'; end if;
 subject:=coalesce(req.report_id,req.contact_id);
 perform pg_advisory_xact_lock(hashtextextended(subject::text,416));
 m:=private.roadmap_b42_metadata(req.contact_id,req.report_id);
 if m->>'_fingerprint'<>req.metadata_fingerprint or (m->>'_source') is distinct from req.source_fingerprint then raise exception 'Selection changed' using errcode='40001'; end if;
 if p_action in ('check','contact') then
 if exists(select 1 from jsonb_object_keys(p_payload) k where k<>'request') then raise exception 'Invalid request' using errcode='22023'; end if;
 if p_action='contact' then return jsonb_build_object('contact_id',req.contact_id); end if;
 return jsonb_build_object('authorized',true);
 end if;
 if not p_payload ?& array['request','request_key','expected_revision','decision','reason_code','sop_version','acknowledgments','revocation_owner','backup_owner','starts_at','revoke_by']
 or exists(select 1 from jsonb_object_keys(p_payload) k where k not in ('request','request_key','expected_revision','decision','reason_code','sop_version','acknowledgments','revocation_owner','backup_owner','starts_at','revoke_by')) then raise exception 'Invalid attestation' using errcode='22023'; end if;
 key:=(p_payload->>'request_key')::uuid;decision:=p_payload->>'decision';reason:=p_payload->>'reason_code';acks:=p_payload->'acknowledgments';
 if key is null or decision is null or decision not in ('confirmed','not_intended','needs_clarification')
 or reason is null or reason not in ('identity_date_match','different_person','different_assessment','identifier_unclear','historical_only')
 or (decision='confirmed' and reason<>'identity_date_match')
 or (decision='not_intended' and reason not in ('different_person','different_assessment'))
 or (decision='needs_clarification' and reason not in ('identifier_unclear','historical_only'))
 or p_payload->>'sop_version' is distinct from 'RVA-B4-PILOT-READONLY-v1-2026-10-16'
 or jsonb_typeof(acks) is distinct from 'object'
 or acks is distinct from '{"internal_only":true,"founders_only":true,"read_only":true,"no_ai_exports":true,"no_scores_emails":true,"manual_revocation_14_days":true,"separate_enrollment":true}'::jsonb then raise exception 'SOP acknowledgment required' using errcode='22023'; end if;
 if decision='confirmed' then
 if not (m->>'has_report')::boolean or not (m->>'identity_confirmable')::boolean then raise exception 'Complete identity and assessment date required' using errcode='22023'; end if;
 select user_id into ownerid from private.roadmap_b42_founders where verified_email=case p_payload->>'revocation_owner' when 'justyn' then 'justyn@revitalizedacademy.com' when 'elle' then 'elle@revitalizedacademy.com' end;
 select user_id into backupid from private.roadmap_b42_founders where verified_email=case p_payload->>'backup_owner' when 'justyn' then 'justyn@revitalizedacademy.com' when 'elle' then 'elle@revitalizedacademy.com' end;
 starts:=(p_payload->>'starts_at')::timestamptz;deadline:=(p_payload->>'revoke_by')::timestamptz;
 if ownerid is null or backupid is null or ownerid=backupid or starts is null or deadline is null or starts<clock_timestamp()-interval '5 minutes'
 or starts>clock_timestamp()+interval '30 days' or deadline<=starts or deadline>starts+interval '14 days' then raise exception 'Invalid manual revocation plan' using errcode='22023'; end if;
 else
 if (p_payload->>'revocation_owner') is not null or (p_payload->>'backup_owner') is not null or (p_payload->>'starts_at') is not null or (p_payload->>'revoke_by') is not null then raise exception 'Unexpected plan' using errcode='22023'; end if;
 end if;
 pin:=encode(extensions.digest(jsonb_build_object('actor',actor,'session',sid,'payload',p_payload)::text,'sha256'),'hex');
 select * into old from private.roadmap_b42_verifications where actor_id=actor and request_key=key;
 if old.id is not null then
 if old.request_fingerprint<>pin then raise exception 'Replay changed' using errcode='22023'; end if;
 return jsonb_build_object('revision',old.revision,'idempotent',true,'enrollment','held'); end if;
 select coalesce(max(revision),0) into latest from private.roadmap_b42_verifications where subject_key=subject;
 if (p_payload->>'expected_revision')::integer is distinct from latest then raise exception 'Newer decision exists' using errcode='40001'; end if;
 if exists(select 1 from private.roadmap_b42_verifications where request_id=req.id) then raise exception 'Refresh selection' using errcode='40001'; end if;
 insert into private.roadmap_b42_sop_attestations(actor_id,session_id,sop_version,acknowledgments,revocation_owner,backup_owner,starts_at,revoke_by)
 values(actor,sid,'RVA-B4-PILOT-READONLY-v1-2026-10-16',acks,ownerid,backupid,starts,deadline) returning id into sopid;
 insert into private.roadmap_b42_verifications(request_id,actor_id,session_id,contact_id,report_id,workflow_id,source_fingerprint,metadata_fingerprint,eligible_at_confirmation,revision,subject_key,decision,reason_code,sop_id,request_key,request_fingerprint)
 values(req.id,actor,sid,req.contact_id,req.report_id,req.workflow_id,req.source_fingerprint,req.metadata_fingerprint,(m->>'eligible')::boolean,latest+1,subject,decision,reason,sopid,key,pin) returning revision into out_revision;
 return jsonb_build_object('revision',out_revision,'enrollment','held','drafts','held','scoring','held','approval','held','release','held','email','held');
exception when others then
 -- Do not expose exception DETAIL, UUIDs, search text, pins or source data via RPC.
 raise exception 'Founder verification unavailable' using errcode=sqlstate;
end $$;
revoke all on function private.roadmap_b42_actor(uuid),private.roadmap_b42_descriptor(uuid,uuid),private.roadmap_b42_operator_plan(uuid),private.roadmap_b42_metadata(uuid,uuid),private.roadmap_b42_public_metadata(jsonb),public.roadmap_b42(text,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.roadmap_b42(text,jsonb) to authenticated;
comment on function public.roadmap_b42(text,jsonb) is 'Founder identity/SOP verification only; never enrolls, scores, saves Roadmap drafts, releases or emails.';
commit;
