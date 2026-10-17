-- B4 PRODUCTION CANDIDATE ONLY. Never apply to beta. No cohort, role grants or source writes.
begin;
do $$ begin
 if to_regclass('private.vitality_assessment_drafts') is null
 or to_regclass('public.vitality_reports') is null
 or to_regclass('auth.sessions') is null
 or to_regprocedure('private.staff_has_permission(uuid,text)') is null
 or to_regprocedure('private.staff_can_access_contact(uuid,uuid)') is null
 or to_regprocedure('private.vitality_form_value(text,text)') is null then
 raise exception 'Inspected production source/session prerequisites required'; end if;
 -- B1/B3 staging storage must not be silently assumed or migrated in place.
 if to_regclass('private.vitality_roadmap_versions') is not null then
 raise exception 'Unexpected B1 storage: separately reconcile before installing B4'; end if;
end $$;
create table private.roadmap_b4_cohort_events(
 sequence bigint generated always as identity primary key,
 report_id uuid not null references public.vitality_reports(id) on delete restrict,
 active boolean not null,
 allow_drafts boolean not null default false,
 source_fingerprint text not null check(source_fingerprint ~ '^[a-f0-9]{64}$'),
 approved_by uuid not null references auth.users(id) on delete restrict,
 approval_reference text not null check(length(trim(approval_reference)) between 3 and 1000),
 created_at timestamptz not null default clock_timestamp()
);
create index roadmap_b4_cohort_latest on private.roadmap_b4_cohort_events(report_id,sequence desc);
create table private.roadmap_b4_versions(
 id uuid primary key default gen_random_uuid(),
 report_id uuid not null references public.vitality_reports(id) on delete restrict,
 cohort_sequence bigint not null references private.roadmap_b4_cohort_events(sequence) on delete restrict,
 version integer not null check(version>0),
 state text not null check(state in ('draft','needs_clarification','under_review')),
 document jsonb not null,
 corrections jsonb not null default '[]',
 source_fingerprint text not null check(source_fingerprint ~ '^[a-f0-9]{64}$'),
 questionnaire_version text not null check(questionnaire_version='secure-snapshot-v1'),
 provenance_state text not null check(provenance_state='version_label_only'),
 registry_fingerprint text not null,
 adapter_version text not null,
 overall_score numeric check(overall_score is null), spectrum_stage text check(spectrum_stage is null),
 created_by uuid not null references auth.users(id) on delete restrict,
 request_id uuid not null, request_fingerprint text not null,
 created_at timestamptz not null default clock_timestamp(),
 unique(report_id,version),unique(report_id,request_id)
);
create table private.roadmap_b4_audit(
 id bigint generated always as identity primary key,
 actor_id uuid not null references auth.users(id) on delete restrict,
 report_id uuid references public.vitality_reports(id) on delete restrict,
 version_id uuid references private.roadmap_b4_versions(id) on delete restrict,
 action text not null check(action in ('list','read','check','version_read','save','regenerate','cohort_approve','cohort_revoke')),
 reason text not null default '', source_fingerprint text,
 created_at timestamptz not null default clock_timestamp()
);
create index roadmap_b4_audit_report on private.roadmap_b4_audit(report_id,id);
alter table private.roadmap_b4_cohort_events enable row level security;
alter table private.roadmap_b4_versions enable row level security;
alter table private.roadmap_b4_audit enable row level security;
revoke all on private.roadmap_b4_cohort_events,private.roadmap_b4_versions,private.roadmap_b4_audit from public,anon,authenticated,service_role;
revoke all on sequence private.roadmap_b4_cohort_events_sequence_seq,private.roadmap_b4_audit_id_seq from public,anon,authenticated,service_role;
create function private.roadmap_b4_immutable() returns trigger language plpgsql set search_path='' as $$
begin raise exception 'B4 review history is append-only' using errcode='55000'; end $$;
create trigger roadmap_b4_cohort_immutable before update or delete on private.roadmap_b4_cohort_events for each row execute function private.roadmap_b4_immutable();
create trigger roadmap_b4_version_immutable before update or delete on private.roadmap_b4_versions for each row execute function private.roadmap_b4_immutable();
create trigger roadmap_b4_audit_immutable before update or delete on private.roadmap_b4_audit for each row execute function private.roadmap_b4_immutable();
create trigger roadmap_b4_cohort_events_no_truncate before truncate on private.roadmap_b4_cohort_events for each statement execute function private.roadmap_b4_immutable();
create trigger roadmap_b4_versions_no_truncate before truncate on private.roadmap_b4_versions for each statement execute function private.roadmap_b4_immutable();
create trigger roadmap_b4_audit_no_truncate before truncate on private.roadmap_b4_audit for each statement execute function private.roadmap_b4_immutable();
create function private.roadmap_b4_is_founder(p_actor uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.users u join public.staff_access s on s.user_id=u.id
 where u.id=p_actor and lower(trim(u.email)) in ('justyn@revitalizedacademy.com','elle@revitalizedacademy.com')
 and u.email_confirmed_at is not null and u.deleted_at is null and (u.banned_until is null or u.banned_until<now())
 and s.role='owner' and s.status='active' and s.onboarding_status='complete' and s.contact_scope='all');
$$;
create function private.roadmap_b4_actor(p_contact uuid default null,p_write boolean default false) returns uuid
language plpgsql stable security definer set search_path='' as $$
declare actor uuid:=auth.uid(); sid text:=auth.jwt()->>'session_id';
begin
 if actor is null or auth.jwt()->>'iss' is distinct from 'https://voalfpxiyznnqfcqcymd.supabase.co/auth/v1'
 or coalesce(auth.jwt()->>'is_anonymous','false')<>'false'
 or not private.roadmap_b4_is_founder(actor)
 or not exists(select 1 from auth.sessions s where s.user_id=actor and s.id::text=sid and (s.not_after is null or s.not_after>now()))
 or not private.staff_has_permission(actor,'health.private.view') or not private.staff_has_permission(actor,'crm.view')
 or (p_contact is not null and not private.staff_can_access_contact(actor,p_contact))
 or (p_write and not private.staff_has_permission(actor,'health.progress.manage')) then
 raise exception 'Founder review unavailable' using errcode='42501'; end if;
 return actor;
end $$;
-- Operator-only cohort procedure: separate explicit data-use approval required before calling.
-- No browser, anonymous or service-role execution grant; no automatic cohort population.
create function private.roadmap_b4_set_cohort(p_report uuid,p_active boolean,p_allow_drafts boolean,p_fingerprint text,p_approved_by uuid,p_reference text) returns bigint
language plpgsql security definer set search_path='' as $$
declare seq bigint;
begin
 if not private.roadmap_b4_is_founder(p_approved_by) or p_active is null or p_allow_drafts is null then raise exception 'Explicit founder approval required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_report::text,416));
 insert into private.roadmap_b4_cohort_events(report_id,active,allow_drafts,source_fingerprint,approved_by,approval_reference)
 values(p_report,p_active,p_allow_drafts,p_fingerprint,p_approved_by,p_reference) returning sequence into seq;
 insert into private.roadmap_b4_audit(actor_id,report_id,action,reason,source_fingerprint)
 values(p_approved_by,p_report,case when p_active then 'cohort_approve' else 'cohort_revoke' end,p_reference,p_fingerprint);
 return seq;
end $$;
create function private.roadmap_b4_context(p_report uuid,p_write boolean default false) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid; r public.vitality_reports; d private.vitality_assessment_drafts; w public.workflow_records;
 c private.roadmap_b4_cohort_events; fingerprint text; source jsonb;
begin
 actor:=private.roadmap_b4_actor();
 perform pg_advisory_xact_lock(hashtextextended(p_report::text,416));
 select * into c from private.roadmap_b4_cohort_events where report_id=p_report order by sequence desc limit 1;
 if c.active is distinct from true or (p_write and not c.allow_drafts) then raise exception 'Founder review unavailable' using errcode='42501'; end if;
 select * into r from public.vitality_reports where id=p_report for share;
 actor:=private.roadmap_b4_actor(r.contact_id,p_write);
 select * into w from public.workflow_records where id=r.workflow_id and contact_id=r.contact_id for share;
 select * into d from private.vitality_assessment_drafts where workflow_id=r.workflow_id and contact_id=r.contact_id for share;
 if r.id is null or w.workflow_type is distinct from 'vitality_assessment' or w.status is distinct from 'completed' or w.completed_at is null
 or d.id is null or d.status is distinct from 'completed' or d.verified_at is null or d.completed_at is null
 or d.snapshot->>'version' is distinct from '1' or d.snapshot->>'pathway' is distinct from 'Adult'
 or jsonb_typeof(d.snapshot->'fields') is distinct from 'object'
 or jsonb_typeof(d.snapshot->'fields'->'assessment_for') is distinct from 'array' then
 raise exception 'Completed secure Adult/Myself source required' using errcode='55000'; end if;
 if (select count(*) from jsonb_array_elements(d.snapshot->'fields'->'assessment_for') a where a->>'checked'='true')<>1
 or not exists(select 1 from jsonb_array_elements(d.snapshot->'fields'->'assessment_for') a where a->>'checked'='true' and a->>'value'='Myself') then
 raise exception 'Completed secure Adult/Myself source required' using errcode='55000'; end if;
 fingerprint:=encode(extensions.digest(jsonb_build_object('snapshot',d.snapshot,'final_form',d.final_form)::text,'sha256'),'hex');
 if fingerprint<>c.source_fingerprint then raise exception 'Pinned source changed; new explicit cohort approval required' using errcode='40001'; end if;
 source:=jsonb_build_object('status','completed','pathway','Adult','assessment_for','Myself','questionnaire_version','secure-snapshot-v1',
 'answers',d.snapshot->'fields','completed_at',d.completed_at,
 'participant_name',(select concat_ws(' ',first_name,last_name) from public.contacts where id=r.contact_id),
 'coach_summary',coalesce(private.vitality_form_value(d.final_form,'assessment_summary'),''),
 'coach_review_flags',coalesce(private.vitality_form_value(d.final_form,'coach_review_flags'),''));
 return jsonb_build_object('report_id',r.id,'source',source,'source_fingerprint',fingerprint,'cohort_sequence',c.sequence,
 'can_edit',c.allow_drafts and private.staff_has_permission(actor,'health.progress.manage'),
 'adapter_version','b4-source-coverage-20261016-v1','registry_fingerprint','2f67c193c2e69b54d61a44599bf9308ca27d317f2bdb748adbeaedfdabe92ced',
 'provenance_state','version_label_only','questionnaire_version','secure-snapshot-v1',
 'overall_score',null,'spectrum_stage',null,'scoring','held','approval','held','release','held','email','held');
end $$;
-- B1 unscored document contract, namespaced for absent production B1 prerequisites.
create function private.roadmap_b4_driver_keys() returns text[] language sql immutable set search_path='' as $$
 select array['cellular_hydration','systemic_detoxification','electrobiology_rhythms','the_living_diet','functional_training','holistic_recovery','gastrointestinal_renovation','hormone_balancing','neural_repatterning','momentum_regimens','mentality_realignment','wise_budgeting']::text[];
$$;
create function private.roadmap_b4_empty_document() returns jsonb language sql immutable set search_path='' as $$
 select jsonb_build_object('summary','','strengths','[]'::jsonb,'priorities','[]'::jsonb,'opportunities','[]'::jsonb,'actions','[]'::jsonb,
 'reviewer_notes','','clarification','', 'drivers',(select jsonb_object_agg(k,jsonb_build_object('summary','','reason','','evidence','[]'::jsonb)) from unnest(private.roadmap_b4_driver_keys()) k));
$$;
create function private.roadmap_b4_validate_document(doc jsonb,source jsonb) returns void language plpgsql immutable set search_path='' as $$
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
 or not (doc->'drivers') ?& private.roadmap_b4_driver_keys() then raise exception 'All twelve Drivers required' using errcode='22023'; end if;
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
create function public.roadmap_b4(p_action text,p_report uuid default null,p_payload jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid; context jsonb; result jsonb; old private.roadmap_b4_versions; fresh private.roadmap_b4_versions;
 request uuid; fingerprint text; doc jsonb; corrections jsonb; correction jsonb; expected integer; state text; reason text; action text;
begin
 actor:=private.roadmap_b4_actor();
 if p_action='authorize' then return jsonb_build_object('authorized',true,'drafts','cohort_specific','scoring','held','release','held'); end if;
 if p_action='list' then
 select coalesce(jsonb_agg(jsonb_build_object('report_id',x.report_id,'label','Approved source '||x.position,'allow_drafts',x.allow_drafts) order by x.position),'[]'::jsonb) into result
 from (select e.report_id,e.allow_drafts,row_number() over(order by e.sequence) position from
 (select distinct on(report_id) * from private.roadmap_b4_cohort_events order by report_id,sequence desc)e
 join public.vitality_reports r on r.id=e.report_id where e.active and private.staff_can_access_contact(actor,r.contact_id))x;
 insert into private.roadmap_b4_audit(actor_id,action) values(actor,'list');
 return result;
 end if;
 if p_action is null or p_action not in ('read','check','version','save') or p_report is null then raise exception 'Invalid founder action' using errcode='22023'; end if;
 context:=private.roadmap_b4_context(p_report,p_action='save');
 if p_action='check' then
 insert into private.roadmap_b4_audit(actor_id,report_id,action,source_fingerprint) values(actor,p_report,'check',context->>'source_fingerprint');
 return jsonb_build_object('authorized',true,'cohort_sequence',context->'cohort_sequence','can_edit',context->'can_edit'); end if;
 if p_action='version' then
 select * into old from private.roadmap_b4_versions where report_id=p_report and version=(p_payload->>'version')::integer;
 if old.id is null then raise exception 'Version unavailable' using errcode='42501'; end if;
 insert into private.roadmap_b4_audit(actor_id,report_id,version_id,action,source_fingerprint) values(actor,p_report,old.id,'version_read',old.source_fingerprint);
 return jsonb_build_object('version',old.version,'document',old.document,'corrections',old.corrections,'source_fingerprint',old.source_fingerprint,'source_matches_current',old.source_fingerprint=context->>'source_fingerprint','overall_score',null,'spectrum_stage',null,'release','held');
 end if;
 select * into old from private.roadmap_b4_versions where report_id=p_report order by version desc limit 1;
 if p_action='read' then
 select coalesce(jsonb_agg(jsonb_build_object('version',v.version,'state',v.state,'reason',a.reason,'actor_id',v.created_by,'created_at',v.created_at) order by v.version desc),'[]'::jsonb) into result
 from private.roadmap_b4_versions v join private.roadmap_b4_audit a on a.version_id=v.id and a.action in ('save','regenerate') where v.report_id=p_report;
 insert into private.roadmap_b4_audit(actor_id,report_id,action,source_fingerprint) values(actor,p_report,'read',context->>'source_fingerprint');
 return context||jsonb_build_object('version',coalesce(old.version,0),'state',coalesce(old.state,'draft'),
 'document',coalesce(old.document,private.roadmap_b4_empty_document()),'corrections',coalesce(old.corrections,'[]'::jsonb),'history',result,
 'draft_source_changed',old.id is not null and old.source_fingerprint<>context->>'source_fingerprint');
 end if;
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or not p_payload ?& array['request_id','expected_version','action','state','reason','document','corrections']
 or exists(select 1 from jsonb_object_keys(p_payload) k where k not in ('request_id','expected_version','action','state','reason','document','corrections')) then raise exception 'Invalid draft payload' using errcode='22023'; end if;
 request:=(p_payload->>'request_id')::uuid; expected:=(p_payload->>'expected_version')::integer;
 state:=p_payload->>'state';reason:=p_payload->>'reason';action:=p_payload->>'action';
 if request is null or expected is null or expected<0 or state is null or state not in ('draft','needs_clarification','under_review')
 or action is null or action not in ('save','regenerate') or coalesce(length(trim(reason)),0) not between 3 and 1000 then raise exception 'Invalid draft action' using errcode='22023'; end if;
 fingerprint:=encode(extensions.digest(jsonb_build_object('actor',actor,'cohort_sequence',context->'cohort_sequence','payload',p_payload)::text,'sha256'),'hex');
 select * into fresh from private.roadmap_b4_versions where report_id=p_report and request_id=request;
 if fresh.id is not null then
 if fresh.request_fingerprint<>fingerprint then raise exception 'Request key content changed' using errcode='22023'; end if;
 return jsonb_build_object('version',fresh.version,'idempotent',true); end if;
 if coalesce(old.version,0)<>expected then raise exception 'Newer draft exists; reload' using errcode='40001'; end if;
 if old.id is not null and old.source_fingerprint<>context->>'source_fingerprint' and action<>'regenerate' then raise exception 'Source changed; regenerate' using errcode='40001'; end if;
 doc:=case when action='regenerate' then private.roadmap_b4_empty_document() else p_payload->'document' end;
 corrections:=case when action='regenerate' then '[]'::jsonb else p_payload->'corrections' end;
 perform private.roadmap_b4_validate_document(doc,context->'source');
 if state='needs_clarification' and trim(doc->>'clarification')='' then raise exception 'Clarification note required' using errcode='22023'; end if;
 if corrections is null or jsonb_typeof(corrections)<>'array' or jsonb_array_length(corrections)>30 then raise exception 'Invalid corrections' using errcode='22023'; end if;
 for correction in select value from jsonb_array_elements(corrections) loop
 if jsonb_typeof(correction)<>'object' or not correction ?& array['question_id','proposed_text','reason']
 or exists(select 1 from jsonb_object_keys(correction) k where k not in ('question_id','proposed_text','reason'))
 or jsonb_typeof(correction->'question_id')<>'string' or not (context->'source'->'answers') ? (correction->>'question_id')
 or jsonb_typeof(correction->'proposed_text')<>'string' or length(trim(correction->>'proposed_text')) not between 1 and 2000
 or jsonb_typeof(correction->'reason')<>'string' or length(trim(correction->>'reason')) not between 3 and 1000 then raise exception 'Invalid source correction proposal' using errcode='22023'; end if;
 end loop;
 insert into private.roadmap_b4_versions(report_id,cohort_sequence,version,state,document,corrections,source_fingerprint,questionnaire_version,provenance_state,registry_fingerprint,adapter_version,created_by,request_id,request_fingerprint)
 values(p_report,(context->>'cohort_sequence')::bigint,expected+1,state,doc,corrections,context->>'source_fingerprint','secure-snapshot-v1','version_label_only',context->>'registry_fingerprint',context->>'adapter_version',actor,request,fingerprint) returning * into fresh;
 insert into private.roadmap_b4_audit(actor_id,report_id,version_id,action,reason,source_fingerprint)
 values(actor,p_report,fresh.id,action,reason,context->>'source_fingerprint');
 return jsonb_build_object('version',fresh.version,'scoring','held','approval','held','release','held','email','held');
end $$;
-- Explicitly close default PUBLIC function grants, including helpers in private schema.
revoke all on function private.roadmap_b4_immutable(),private.roadmap_b4_is_founder(uuid),private.roadmap_b4_actor(uuid,boolean),
 private.roadmap_b4_set_cohort(uuid,boolean,boolean,text,uuid,text),private.roadmap_b4_context(uuid,boolean),
 private.roadmap_b4_driver_keys(),private.roadmap_b4_empty_document(),private.roadmap_b4_validate_document(jsonb,jsonb),
 public.roadmap_b4(text,uuid,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.roadmap_b4(text,uuid,jsonb) to authenticated;
comment on function public.roadmap_b4(text,uuid,jsonb) is 'Production founder/cohort-only unscored review. No approval/release/email action. Source reads never mutate assessment answers.';
commit;
