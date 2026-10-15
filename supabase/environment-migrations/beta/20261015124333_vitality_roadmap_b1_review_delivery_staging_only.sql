-- PHASE B1, STAGING ONLY. Requires the inspected 20261014222835 foundation.
-- Deliberately outside supabase/migrations: not part of production migration replay.
begin;
alter table private.vitality_roadmap_versions
 add column draft_document jsonb not null default '{}'::jsonb,
 add column source_snapshot jsonb not null default '{}'::jsonb,
 add column created_by uuid references auth.users(id),
 add column request_id uuid,
 add column request_fingerprint text;
create unique index roadmap_version_request on private.vitality_roadmap_versions(report_id,request_id);
create table private.vitality_roadmap_approvers (
 user_id uuid primary key references auth.users(id) on delete restrict,
 verified_at timestamptz not null default now()
);
alter table private.vitality_roadmap_approvers enable row level security;
revoke all on private.vitality_roadmap_approvers from public,anon,authenticated;
-- No role grants. Resolve the two existing verified founders, never arbitrary user_metadata.
insert into private.vitality_roadmap_approvers(user_id)
 select u.id from auth.users u join public.staff_access s on s.user_id=u.id
 where lower(u.email) in ('justyn@revitalizedacademy.com','elle@revitalizedacademy.com')
 and u.email_confirmed_at is not null and s.role='owner' and s.status='active'
 and s.onboarding_status in ('complete','waived') and s.contact_scope='all';

create function private.roadmap_actor() returns uuid language plpgsql stable security definer set search_path='' as $$
declare actor uuid:=auth.uid(); sid text:=auth.jwt()->>'session_id';
begin
 if actor is null or coalesce(auth.jwt()->>'is_anonymous','false')='true'
 or not exists(select 1 from auth.users u where u.id=actor and u.email_confirmed_at is not null
   and u.deleted_at is null and (u.banned_until is null or u.banned_until<now()))
 or not exists(select 1 from auth.sessions s where s.user_id=actor and s.id::text=sid
   and (s.not_after is null or s.not_after>now())) then
 raise exception 'Verified active account required' using errcode='42501'; end if;
 return actor;
end $$;
create function private.roadmap_review_guard(p_contact uuid default null,p_write boolean default false)
returns uuid language plpgsql stable security definer set search_path='' as $$
declare actor uuid:=private.roadmap_actor();
begin
 if not private.staff_has_permission(actor,'health.private.view')
 or not private.staff_has_permission(actor,'crm.view')
 or (p_contact is not null and not private.staff_can_access_contact(actor,p_contact))
 or (p_write and (not private.staff_has_permission(actor,'health.progress.manage')
   or not exists(select 1 from public.staff_access where user_id=actor and status='active' and role in ('owner','admin')))) then
 raise exception 'Roadmap review not authorized' using errcode='42501'; end if;
 return actor;
end $$;
create function private.roadmap_driver_keys() returns text[] language sql immutable set search_path='' as $$
 select array['cellular_hydration','systemic_detoxification','electrobiology_rhythms','the_living_diet','functional_training','holistic_recovery','gastrointestinal_renovation','hormone_balancing','neural_repatterning','momentum_regimens','mentality_realignment','wise_budgeting']::text[];
$$;
create function private.roadmap_empty_document() returns jsonb language sql immutable set search_path='' as $$
 select jsonb_build_object('summary','','strengths','[]'::jsonb,'priorities','[]'::jsonb,'opportunities','[]'::jsonb,'actions','[]'::jsonb,
 'reviewer_notes','','clarification','', 'drivers',(select jsonb_object_agg(k,jsonb_build_object('summary','','reason','','evidence','[]'::jsonb)) from unnest(private.roadmap_driver_keys()) k));
$$;
create function private.roadmap_validate_document(doc jsonb,source jsonb) returns void language plpgsql immutable set search_path='' as $$
declare k text; item jsonb; ref jsonb;
begin
 if doc is null or jsonb_typeof(doc)<>'object' or octet_length(doc::text)>120000
 or not doc ?& array['summary','strengths','priorities','opportunities','actions','reviewer_notes','clarification','drivers']
 or exists(select 1 from jsonb_object_keys(doc) x where x not in ('summary','strengths','priorities','opportunities','actions','reviewer_notes','clarification','drivers')) then
 raise exception 'Invalid Roadmap document' using errcode='22023'; end if;
 foreach k in array array['summary','reviewer_notes','clarification'] loop
 if jsonb_typeof(doc->k)<>'string' or length(doc->>k)>6000 then raise exception 'Invalid text' using errcode='22023'; end if;
 end loop;
 if jsonb_typeof(doc->'drivers')<>'object' or (select count(*) from jsonb_object_keys(doc->'drivers'))<>12
 or not (doc->'drivers') ?& private.roadmap_driver_keys() then raise exception 'All twelve Drivers required' using errcode='22023'; end if;
 foreach k in array array['strengths','priorities','opportunities','actions'] loop
 if jsonb_typeof(doc->k)<>'array' or jsonb_array_length(doc->k)>(case when k='actions' then 12 else 3 end) then
 raise exception 'Invalid recommendation list' using errcode='22023'; end if;
 end loop;
 for item in select value from jsonb_each(doc->'drivers') union all
 select value from jsonb_array_elements((doc->'strengths')||(doc->'priorities')||(doc->'opportunities')||(doc->'actions')) loop
 if jsonb_typeof(item)<>'object' or not item ?& array['summary','reason','evidence']
 or exists(select 1 from jsonb_object_keys(item) x where x not in ('summary','reason','evidence'))
 or jsonb_typeof(item->'summary')<>'string' or length(item->>'summary')>4000
 or jsonb_typeof(item->'reason')<>'string' or length(item->>'reason')>2000
 or jsonb_typeof(item->'evidence')<>'array' or jsonb_array_length(item->'evidence')>30 then
 raise exception 'Invalid Driver or evidence record' using errcode='22023'; end if;
 if trim(item->>'summary')<>'' and (trim(item->>'reason')='' or jsonb_array_length(item->'evidence')=0) then
 raise exception 'Written interpretation requires evidence and rationale' using errcode='22023'; end if;
 for ref in select value from jsonb_array_elements(item->'evidence') loop
 if jsonb_typeof(ref)<>'string' or not coalesce(source->'answers','{}'::jsonb) ? (ref#>>'{}') then
 raise exception 'Evidence must reference an available source question' using errcode='22023'; end if;
 end loop;
 end loop;
end $$;
create function private.roadmap_public_document(doc jsonb) returns jsonb language sql immutable set search_path='' as $$
 -- Exact whitelist. Never return reviewer_notes, clarification, answers or evidence identifiers.
 select jsonb_build_object('summary',doc->>'summary','drivers',(select coalesce(jsonb_object_agg(k,jsonb_build_object('summary',doc->'drivers'->k->>'summary','reason',doc->'drivers'->k->>'reason')),'{}'::jsonb) from unnest(private.roadmap_driver_keys()) k),
 'strengths',(select coalesce(jsonb_agg(jsonb_build_object('summary',x->>'summary','reason',x->>'reason')),'[]'::jsonb) from jsonb_array_elements(coalesce(doc->'strengths','[]'::jsonb)) x),
 'priorities',(select coalesce(jsonb_agg(jsonb_build_object('summary',x->>'summary','reason',x->>'reason')),'[]'::jsonb) from jsonb_array_elements(coalesce(doc->'priorities','[]'::jsonb)) x),
 'opportunities',(select coalesce(jsonb_agg(jsonb_build_object('summary',x->>'summary','reason',x->>'reason')),'[]'::jsonb) from jsonb_array_elements(coalesce(doc->'opportunities','[]'::jsonb)) x),
 'actions',(select coalesce(jsonb_agg(jsonb_build_object('summary',x->>'summary','reason',x->>'reason')),'[]'::jsonb) from jsonb_array_elements(coalesce(doc->'actions','[]'::jsonb)) x));
$$;
create function private.roadmap_append_only() returns trigger language plpgsql set search_path='' as $$
begin raise exception 'Roadmap versions and audit history are immutable' using errcode='55000'; end $$;
create trigger roadmap_version_immutable before update or delete on private.vitality_roadmap_versions for each row execute function private.roadmap_append_only();
create trigger roadmap_audit_immutable before update or delete on private.vitality_roadmap_review_audit for each row execute function private.roadmap_append_only();
create function private.roadmap_b1_gate() returns trigger language plpgsql set search_path='' as $$
begin
 if new.state not in ('draft','needs_clarification','under_review') or new.approved_by is not null or new.approved_at is not null
 or new.released_at is not null or new.scoring_version is not null or new.approved_snapshot<>'{}'::jsonb then
 raise exception 'B1 approval and release held pending founder scoring and security acceptance' using errcode='55000'; end if;
 if not exists(select 1 from public.vitality_reports r where r.id=new.report_id and r.contact_id=new.contact_id and r.workflow_id=new.source_workflow_id) then
 raise exception 'Report source mismatch' using errcode='23514'; end if;
 return new;
end $$;
create trigger roadmap_b1_release_held before insert on private.vitality_roadmap_versions for each row execute function private.roadmap_b1_gate();

create function public.list_vitality_roadmap_preparation() returns setof jsonb language plpgsql stable security definer set search_path='' as $$
begin
 perform private.roadmap_review_guard();
 return query select jsonb_build_object('report_id',r.id,'contact_id',r.contact_id,'participant_name',concat_ws(' ',c.first_name,c.last_name),
 'completed_at',w.completed_at,'version',coalesce(v.version,0),'state',coalesce(v.state,'not_started'),'release_held',true)
 from public.vitality_reports r join public.contacts c on c.id=r.contact_id join public.workflow_records w on w.id=r.workflow_id
 left join lateral(select version,state from private.vitality_roadmap_versions where report_id=r.id order by version desc limit 1)v on true
 where w.workflow_type='vitality_assessment' and w.status='completed' and private.staff_can_access_contact(auth.uid(),r.contact_id)
 order by w.completed_at desc nulls last,r.id;
end $$;
create function public.get_vitality_roadmap_preparation(p_report_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare r public.vitality_reports; actor uuid; source jsonb; v private.vitality_roadmap_versions; history jsonb;
begin
 select * into r from public.vitality_reports where id=p_report_id;
 actor:=private.roadmap_review_guard(r.contact_id);
 if r.id is null then raise exception 'Report unavailable' using errcode='42501'; end if;
 source:=public.get_vitality_assessment_review(r.contact_id);
 -- The existing source API selects the latest assessment; never attach it to a different anchor.
 if r.workflow_id is distinct from (select id from public.workflow_records where contact_id=r.contact_id and workflow_type='vitality_assessment' order by coalesce(completed_at,last_activity_at,created_at) desc,created_at desc,id desc limit 1)
 or source->>'status' is distinct from 'completed' then raise exception 'Source requires manual reconciliation' using errcode='55000'; end if;
 select * into v from private.vitality_roadmap_versions where report_id=r.id order by version desc limit 1;
 select coalesce(jsonb_agg(jsonb_build_object('version',vv.version,'state',vv.state,'action',a.action,'reason',a.reason,'created_at',a.created_at,'actor_id',a.actor_id,'change_summary',a.change_summary) order by vv.version desc),'[]'::jsonb) into history
 from private.vitality_roadmap_versions vv join private.vitality_roadmap_review_audit a on a.roadmap_version_id=vv.id where vv.report_id=r.id;
 return jsonb_build_object('report_id',r.id,'version',coalesce(v.version,0),'state',coalesce(v.state,'not_started'),
 'document',coalesce(v.draft_document,private.roadmap_empty_document()),'source',source,'history',history,
 'questionnaire_version',coalesce((select 'secure-snapshot-v'||(d.snapshot->>'version') from private.vitality_assessment_drafts d where d.workflow_id=r.workflow_id),'historical-unmapped'),
 'source_changed',v.id is not null and v.source_fingerprint<>encode(extensions.digest(source::text,'sha256'),'hex'),
 'coverage',jsonb_build_object('available_question_count',(select count(*) from jsonb_object_keys(coalesce(source->'answers','{}'::jsonb))),
 'historical',coalesce((source->>'historical_record')::boolean,false),'calculation_coverage','not_validated'),
 'can_edit',private.staff_has_permission(actor,'health.progress.manage') and exists(select 1 from public.staff_access where user_id=actor and status='active' and role in ('owner','admin')),
 'designated_approver',exists(select 1 from private.vitality_roadmap_approvers where user_id=actor),
 'can_approve',false,'can_release',false,'release_gate','held');
end $$;
create function public.save_vitality_roadmap_draft(p_report_id uuid,p_expected_version integer,p_request_id uuid,p_action text,p_state text,p_reason text,p_document jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.vitality_reports; actor uuid; context jsonb; source jsonb; doc jsonb; old private.vitality_roadmap_versions; fresh private.vitality_roadmap_versions; fingerprint text;
begin
 select * into r from public.vitality_reports where id=p_report_id for update;
 actor:=private.roadmap_review_guard(r.contact_id,true);
 if r.id is null then raise exception 'Report unavailable' using errcode='42501'; end if;
 if p_request_id is null or p_action is null or p_action not in ('save','regenerate','status') or p_state is null or p_state not in ('draft','needs_clarification','under_review')
 or coalesce(length(trim(p_reason)),0) not between 3 and 1000 or p_expected_version is null or p_expected_version<0 then raise exception 'Invalid review action' using errcode='22023'; end if;
 fingerprint:=encode(extensions.digest(jsonb_build_object('actor',actor,'expected',p_expected_version,'action',p_action,'state',p_state,'reason',p_reason,'document',p_document)::text,'sha256'),'hex');
 select * into fresh from private.vitality_roadmap_versions where report_id=r.id and request_id=p_request_id;
 if fresh.id is not null then
 if fresh.request_fingerprint<>fingerprint then raise exception 'Idempotency key reused with different content' using errcode='22023'; end if;
 return jsonb_build_object('version',fresh.version,'idempotent',true); end if;
 context:=public.get_vitality_roadmap_preparation(r.id); source:=context->'source';
 select * into old from private.vitality_roadmap_versions where report_id=r.id order by version desc limit 1;
 if coalesce(old.version,0)<>p_expected_version then raise exception 'A newer version exists; reload before saving' using errcode='40001'; end if;
 if source->>'pathway' is distinct from 'Adult' or source->>'assessment_for' is distinct from 'Myself' then raise exception 'Child or proxy preparation held for approved pathway rules' using errcode='55000'; end if;
 if p_action<>'regenerate' and (context->>'source_changed')::boolean then raise exception 'Source changed; regenerate a new draft first' using errcode='40001'; end if;
 doc:=case when p_action='regenerate' then private.roadmap_empty_document() when p_action='status' then coalesce(old.draft_document,private.roadmap_empty_document()) else p_document end;
 perform private.roadmap_validate_document(doc,source);
 if p_state='needs_clarification' and trim(doc->>'clarification')='' then raise exception 'Clarification notes required' using errcode='22023'; end if;
 insert into private.vitality_roadmap_versions(report_id,contact_id,source_workflow_id,version,state,questionnaire_version,source_fingerprint,source_snapshot,draft_document,created_by,request_id,request_fingerprint)
 values(r.id,r.contact_id,r.workflow_id,coalesce(old.version,0)+1,p_state,context->>'questionnaire_version',
 encode(extensions.digest(source::text,'sha256'),'hex'),source,doc,actor,p_request_id,fingerprint) returning * into fresh;
 insert into private.vitality_roadmap_review_audit(roadmap_version_id,actor_id,action,reason,change_summary)
 values(fresh.id,actor,p_action,trim(p_reason),jsonb_build_object('previous_version',coalesce(old.version,0),'state',p_state,'source_fingerprint',fresh.source_fingerprint,'changed_sections',
 (select coalesce(jsonb_agg(key),'[]'::jsonb) from jsonb_each(doc) where value is distinct from old.draft_document->key)));
 return jsonb_build_object('version',fresh.version,'idempotent',false);
end $$;
create function public.get_vitality_roadmap_saved_version(p_report_id uuid,p_version integer) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare c uuid; result jsonb;
begin
 select contact_id into c from public.vitality_reports where id=p_report_id;
 perform private.roadmap_review_guard(c);
 if c is null then raise exception 'Report unavailable' using errcode='42501'; end if;
 select jsonb_build_object('version',version,'state',state,'document',draft_document,'questionnaire_version',questionnaire_version,'created_at',created_at)
 into result from private.vitality_roadmap_versions where report_id=p_report_id and version=p_version;
 if result is null then raise exception 'Version unavailable' using errcode='42501'; end if;
 return result;
end $$;
create function public.approve_vitality_roadmap(p_report_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare actor uuid; c uuid;
begin
 select contact_id into c from public.vitality_reports where id=p_report_id;
 actor:=private.roadmap_review_guard(c,true);
 if c is null or not exists(select 1 from private.vitality_roadmap_approvers where user_id=actor) then raise exception 'Final approver required' using errcode='42501'; end if;
 raise exception 'Approval and release held: scoring, Driver stages, coverage and interpretations not approved' using errcode='55000';
end $$;
create table private.vitality_roadmap_claim_audit (id uuid primary key default gen_random_uuid(),contact_id uuid not null references public.contacts(id),actor_id uuid not null references auth.users(id),created_at timestamptz not null default now());
alter table private.vitality_roadmap_claim_audit enable row level security;
revoke all on private.vitality_roadmap_claim_audit from public,anon,authenticated;
create trigger roadmap_claim_audit_immutable before update or delete on private.vitality_roadmap_claim_audit for each row execute function private.roadmap_append_only();
create function public.claim_my_vitality_roadmap() returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.roadmap_actor(); candidates uuid[]; c uuid; existing public.vitality_roadmap_access;
begin
 -- Exact verified-email match to existing adult/self contact; no contact or membership creation.
 select array_agg(id) into candidates from public.contacts where lower(trim(email))=(select lower(trim(email)) from auth.users where id=actor);
 if coalesce(cardinality(candidates),0)<>1 then raise exception 'Roadmap claim unavailable; contact support' using errcode='42501'; end if;
 c:=candidates[1]; perform 1 from public.contacts where id=c for update;
 if not exists(select 1 from public.vitality_reports r join public.workflow_records w on w.id=r.workflow_id and w.contact_id=r.contact_id
 where r.contact_id=c and w.status='completed' and (
 exists(select 1 from private.vitality_assessment_drafts d where d.workflow_id=w.id and d.status='completed' and d.snapshot->>'pathway'='Adult' and private.vitality_snapshot_first_text(d.snapshot,'assessment_for')='Myself')
 or exists(select 1 from private.vitality_historical_reviews h where h.workflow_id=w.id and h.pathway='Adult' and h.assessment_for='Myself'))) then
 raise exception 'Roadmap claim unavailable; contact support' using errcode='42501'; end if;
 select * into existing from public.vitality_roadmap_access where contact_id=c;
 if existing.contact_id is not null and (existing.user_id<>actor or existing.revoked_at is not null) then raise exception 'Roadmap claim unavailable; contact support' using errcode='42501'; end if;
 insert into public.vitality_roadmap_access(contact_id,user_id,verified_at) values(c,actor,now()) on conflict(contact_id) do nothing;
 if existing.contact_id is null then insert into private.vitality_roadmap_claim_audit(contact_id,actor_id) values(c,actor); end if;
 return jsonb_build_object('claimed',true,'release_status','pending_review');
end $$;
create or replace function public.get_my_released_vitality_roadmaps() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare actor uuid:=private.roadmap_actor(); result jsonb;
begin
 select coalesce(jsonb_agg(jsonb_build_object('report_id',r.report_id,'version',r.version,'approved_at',r.approved_at,'released_at',r.released_at,
 'report',private.roadmap_public_document(r.approved_snapshot),'checksum',encode(extensions.digest(private.roadmap_public_document(r.approved_snapshot)::text,'sha256'),'hex')) order by r.released_at desc),'[]'::jsonb) into result
 from (select distinct on(v.report_id) v.* from private.vitality_roadmap_versions v join public.vitality_reports vr on vr.id=v.report_id and vr.contact_id=v.contact_id
 join public.vitality_roadmap_access a on a.contact_id=v.contact_id join auth.users u on u.id=a.user_id join public.contacts c on c.id=a.contact_id
 where a.user_id=actor and lower(trim(u.email))=lower(trim(c.email)) and a.revoked_at is null and a.verified_at is not null
 and v.state='released' and v.approved_by is not null and v.approved_at is not null and v.released_at is not null and v.scoring_version is not null
 order by v.report_id,v.version desc)r;
 return result;
end $$;
-- Explicit privileges on every new RPC and private helper; no direct browser table access.
revoke all on function private.roadmap_actor(),private.roadmap_review_guard(uuid,boolean),private.roadmap_driver_keys(),private.roadmap_empty_document(),private.roadmap_validate_document(jsonb,jsonb),private.roadmap_public_document(jsonb),private.roadmap_append_only(),private.roadmap_b1_gate() from public,anon,authenticated;
revoke all on function public.list_vitality_roadmap_preparation(),public.get_vitality_roadmap_preparation(uuid),public.save_vitality_roadmap_draft(uuid,integer,uuid,text,text,text,jsonb),public.approve_vitality_roadmap(uuid),public.get_vitality_roadmap_saved_version(uuid,integer),public.claim_my_vitality_roadmap(),public.get_my_released_vitality_roadmaps() from public,anon,authenticated;
grant execute on function public.list_vitality_roadmap_preparation(),public.get_vitality_roadmap_preparation(uuid),public.save_vitality_roadmap_draft(uuid,integer,uuid,text,text,text,jsonb),public.approve_vitality_roadmap(uuid),public.get_vitality_roadmap_saved_version(uuid,integer),public.claim_my_vitality_roadmap(),public.get_my_released_vitality_roadmaps() to authenticated;
commit;
