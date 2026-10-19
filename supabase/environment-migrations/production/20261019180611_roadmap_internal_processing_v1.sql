-- LOCAL ENGINEERING CANDIDATE ONLY. No seeds/backfill/grants, no existing B4/B5/B6 mutation.
begin;
create table private.roadmap_processing_controls (
 singleton boolean primary key default true check(singleton), ingest boolean not null default false,
 process boolean not null default false, review boolean not null default false, approve boolean not null default false,
 internal_pdf boolean not null default false
);
insert into private.roadmap_processing_controls(singleton) values(true);
create table private.roadmap_processing_purposes (
 sequence bigint generated always as identity primary key, report_id uuid not null references public.vitality_reports(id),
 actor_id uuid not null references auth.users(id), session_id uuid not null, fingerprint text not null,
 b6_grant bigint not null references private.roadmap_b6_grant_events(sequence), active boolean not null,
 acknowledgment text not null check(acknowledgment='private_internal_draft_storage_review_separate_from_read_only_pilot_v1'),
 created_at timestamptz not null default clock_timestamp()
);
create table private.roadmap_processing_grants (
 sequence bigint generated always as identity primary key, purpose bigint not null references private.roadmap_processing_purposes(sequence),
 report_id uuid not null references public.vitality_reports(id), fingerprint text not null,
 b6_grant bigint not null references private.roadmap_b6_grant_events(sequence), active boolean not null,
 expires_at timestamptz not null, allow_review boolean not null default false, allow_approval boolean not null default false,
 allow_pdf boolean not null default false, operator_id uuid not null references auth.users(id), operator_session uuid not null,
 authorization_reference text not null check(length(trim(authorization_reference)) between 10 and 1000), created_at timestamptz not null default clock_timestamp()
);
create table private.roadmap_processing_jobs (
 id uuid primary key default gen_random_uuid(), draft_id uuid not null references private.vitality_assessment_drafts(id),
 contact_id uuid not null references public.contacts(id), workflow_id uuid not null references public.workflow_records(id),
 fingerprint text not null check(fingerprint ~ '^[a-f0-9]{64}$'), pipeline text not null default 'roadmap-internal-processing-v1', pins jsonb not null default private.roadmap_b6_pins(),
 regeneration_key uuid unique, parent_version uuid, generation integer not null default 1 check(generation>0), status text not null default 'pending' check(status in ('pending','leased','complete')),
 attempts integer not null default 0 check(attempts between 0 and 3), lease_hash text, lease_until timestamptz,
 actor_id uuid, session_id uuid, grant_sequence bigint references private.roadmap_processing_grants(sequence),
 document_hash text, seal_hash text, created_at timestamptz not null default clock_timestamp(),
 unique(draft_id,fingerprint,pipeline,generation)
);
create index roadmap_processing_pending on private.roadmap_processing_jobs(workflow_id,contact_id,status,created_at);
create table private.roadmap_processing_versions (
 id uuid primary key default gen_random_uuid(), job_id uuid not null unique references private.roadmap_processing_jobs(id),
 report_id uuid not null references public.vitality_reports(id), revision integer not null check(revision>0),
 fingerprint text not null, pipeline text not null, document jsonb not null, document_hash text not null,
 actor_id uuid not null references auth.users(id), session_id uuid not null, grant_sequence bigint not null references private.roadmap_processing_grants(sequence),
 created_at timestamptz not null default clock_timestamp(), unique(report_id,revision)
);
alter table private.roadmap_processing_jobs add foreign key(parent_version) references private.roadmap_processing_versions(id);
create table private.roadmap_processing_reviews (
 sequence bigint generated always as identity primary key, version_id uuid not null references private.roadmap_processing_versions(id),
 revision integer not null, actor_id uuid not null references auth.users(id), session_id uuid not null,
 request_key uuid not null, request_hash text not null, proposal jsonb not null,
 created_at timestamptz not null default clock_timestamp(), unique(version_id,revision),unique(actor_id,request_key)
);
create table private.roadmap_processing_approvals (
 sequence bigint generated always as identity primary key, version_id uuid not null references private.roadmap_processing_versions(id),
 review_revision integer not null, actor_id uuid not null references auth.users(id),session_id uuid not null,
 rationale text not null check(length(trim(rationale)) between 3 and 2000),created_at timestamptz not null default clock_timestamp(),
 unique(version_id,review_revision,actor_id)
);
create table private.roadmap_processing_audit (
 sequence bigint generated always as identity primary key, report_id uuid, job_id uuid, actor_id uuid, session_id uuid,
 action text not null check(action in ('enqueue','attest','grant','revoke','claim','seal','finish','review','approve','regenerate','read','pdf')),
 created_at timestamptz not null default clock_timestamp()
);
do $$ declare t text;begin
 foreach t in array array['controls','purposes','grants','jobs','versions','reviews','approvals','audit'] loop
 execute format('alter table private.roadmap_processing_%I enable row level security',t);
 execute format('revoke all on private.roadmap_processing_%I from public,anon,authenticated,service_role',t);
 if t not in ('controls','jobs') then
 execute format('create trigger %I before update or delete on private.roadmap_processing_%I for each row execute function private.roadmap_b4_immutable()','roadmap_processing_'||t||'_immutable',t);
 execute format('create trigger %I before truncate on private.roadmap_processing_%I for each statement execute function private.roadmap_b4_immutable()','roadmap_processing_'||t||'_no_truncate',t);
 end if;
 end loop;
end $$;
revoke all on sequence private.roadmap_processing_purposes_sequence_seq,private.roadmap_processing_grants_sequence_seq,private.roadmap_processing_reviews_sequence_seq,private.roadmap_processing_approvals_sequence_seq,private.roadmap_processing_audit_sequence_seq from public,anon,authenticated,service_role;
-- Completion occurs before the workflow update; report mirror may arrive later. Only source metadata is enqueued.
create function private.roadmap_processing_completion() returns trigger language plpgsql security definer set search_path='' as $$
declare pin text;j uuid;begin
 if not (select ingest from private.roadmap_processing_controls where singleton) or new.status<>'completed' or new.verified_at is null or new.completed_at is null or new.contact_id is null or new.workflow_id is null or new.snapshot->>'pathway' is distinct from 'Adult' or jsonb_typeof(new.snapshot->'fields'->'assessment_for') is distinct from 'array'
 or not exists(select 1 from jsonb_array_elements(coalesce(new.snapshot->'fields'->'assessment_for','[]'))a where a->>'value'='Myself' and a->'checked'='true') then return new;end if;
 pin:=encode(extensions.digest(jsonb_build_object('snapshot',new.snapshot,'final_form',new.final_form)::text,'sha256'),'hex');
 insert into private.roadmap_processing_jobs(draft_id,contact_id,workflow_id,fingerprint) values(new.id,new.contact_id,new.workflow_id,pin) on conflict do nothing returning id into j;
 if j is not null then insert into private.roadmap_processing_audit(job_id,action)values(j,'enqueue');end if;return new;
end $$;
create trigger roadmap_processing_completion after insert or update of status,snapshot,final_form on private.vitality_assessment_drafts for each row execute function private.roadmap_processing_completion();
create function private.roadmap_processing_context(p_report uuid,p_mode text default 'read') returns jsonb language plpgsql security definer set search_path='' as $$
declare c jsonb;p private.roadmap_processing_purposes;g private.roadmap_processing_grants;issuer private.roadmap_processing_purposes;flags private.roadmap_processing_controls;a uuid;begin
 c:=private.roadmap_b6_context(p_report,false);a:=private.roadmap_b42_actor();
 select * into flags from private.roadmap_processing_controls where singleton for share;
 perform 1 from auth.sessions where id=(auth.jwt()->>'session_id')::uuid and user_id=a for share;
 perform 1 from public.staff_access where user_id=a for share;
 -- Revalidate after row locks; logout/status changes cannot resurrect an in-flight writer.
 c:=private.roadmap_b6_context(p_report,false);
 select * into g from private.roadmap_processing_grants where report_id=p_report order by sequence desc limit 1;
 select * into p from private.roadmap_processing_purposes where report_id=p_report and actor_id=a order by sequence desc limit 1;
 select * into issuer from private.roadmap_processing_purposes where sequence=g.purpose;
 if not flags.process or g.active is distinct from true or g.expires_at<=clock_timestamp() or g.expires_at>(c->>'expires_at')::timestamptz
 or g.b6_grant is distinct from (c->>'grant_sequence')::bigint or g.fingerprint is distinct from c->>'source_fingerprint'
 or p.active is distinct from true or p.session_id is distinct from (auth.jwt()->>'session_id')::uuid or p.fingerprint is distinct from g.fingerprint or p.b6_grant is distinct from g.b6_grant
 or issuer.active is distinct from true or not exists(select 1 from public.staff_access where user_id=issuer.actor_id and role='owner' and status='active' and onboarding_status='complete' and contact_scope='all') or not private.staff_has_permission(issuer.actor_id,'health.private.view') or exists(select 1 from private.roadmap_processing_purposes where report_id=p_report and actor_id=issuer.actor_id and sequence>issuer.sequence)
 or not exists(select 1 from auth.sessions where id=issuer.session_id and user_id=issuer.actor_id and (not_after is null or not_after>clock_timestamp()))
 or (p_mode='review' and (not flags.review or not g.allow_review or not (c->>'can_feedback')::boolean))
 or (p_mode='approve' and (not flags.approve or not g.allow_approval or not g.allow_review or not flags.review or not (c->>'can_feedback')::boolean))
 or (p_mode='pdf' and (not flags.internal_pdf or not g.allow_pdf)) then raise exception 'Internal processing authorization held' using errcode='42501';end if;
 return c||jsonb_build_object('processing_grant',g.sequence,'processing_expires_at',g.expires_at,'client_visible',false,'delivery','held','email','held');
end $$;
-- Operator-only: requires an authenticated founder's NEW storage-purpose acknowledgment and a separately authorized real operator session.
create function private.roadmap_processing_set_grant(p_purpose bigint,p_expires timestamptz,p_operator uuid,p_session uuid,p_authorization text,p_review boolean default false,p_approve boolean default false,p_pdf boolean default false) returns bigint language plpgsql security definer set search_path='' as $$
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
create function private.roadmap_processing_revoke(p_report uuid,p_operator uuid,p_session uuid,p_reference text) returns void language plpgsql security definer set search_path='' as $$
declare g private.roadmap_processing_grants;begin
 perform pg_advisory_xact_lock(18062026);
 if p_reference is null or length(trim(p_reference)) not between 10 and 1000 or not private.staff_has_permission(p_operator,'staff.manage') or not exists(select 1 from public.staff_access where user_id=p_operator and role in ('owner','admin') and status='active' and onboarding_status='complete') or not exists(select 1 from auth.sessions where id=p_session and user_id=p_operator and (not_after is null or not_after>clock_timestamp()))then raise exception 'Unauthorized operator' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_report::text,416));
 select * into g from private.roadmap_processing_grants where report_id=p_report order by sequence desc limit 1;
 if g.sequence is null then raise exception 'Unavailable' using errcode='42501';end if;
 insert into private.roadmap_processing_grants(purpose,report_id,fingerprint,b6_grant,active,expires_at,operator_id,operator_session,authorization_reference)values(g.purpose,g.report_id,g.fingerprint,g.b6_grant,false,g.expires_at,p_operator,p_session,p_reference);
 insert into private.roadmap_processing_audit(report_id,actor_id,session_id,action)values(p_report,p_operator,p_session,'revoke');
end $$;
-- Backend-only seal binds exact computed document to a current founder lease. Service role cannot read sources or create versions.
create function public.roadmap_processing_seal(p_job uuid,p_lease text,p_document jsonb) returns text language plpgsql security definer set search_path='' as $$
declare j private.roadmap_processing_jobs;s text;begin
 select * into j from private.roadmap_processing_jobs where id=p_job for update;
 if j.status is distinct from 'leased' or j.lease_until<=clock_timestamp() or j.lease_hash is distinct from encode(extensions.digest(p_lease,'sha256'),'hex') or not (select process from private.roadmap_processing_controls where singleton)
 or not exists(select 1 from auth.sessions where id=j.session_id and user_id=j.actor_id and (not_after is null or not_after>clock_timestamp()))
 or jsonb_typeof(p_document) is distinct from 'object' or octet_length(p_document::text)>1800000 or p_document->>'version' is distinct from j.pipeline or p_document->>'sourceFingerprint' is distinct from j.fingerprint
 or p_document->'pins' is distinct from private.roadmap_b6_pins() or exists(select 1 from jsonb_each(p_document->'drivers')e where e.value->'score' is distinct from 'null'::jsonb or e.value->'stage' is distinct from 'null'::jsonb) or p_document->'calculation'->>'engine' is distinct from private.roadmap_b6_pins()->>'engine' or jsonb_typeof(p_document->'drivers') is distinct from 'object' or (select count(*) from jsonb_object_keys(p_document->'drivers'))<>12
 or exists(select 1 from jsonb_object_keys(p_document->'drivers')k where not k=any(private.roadmap_b4_driver_keys()))
 or p_document->'calculation'->'completeNumericDrivers' is distinct from '0'::jsonb or p_document->'calculation'->'overall' is distinct from 'null'::jsonb
 or p_document->'review'->'clientVisible' is distinct from 'false'::jsonb then raise exception 'Invalid server document/lease' using errcode='42501';end if;
 s:=encode(extensions.gen_random_bytes(32),'hex');
 update private.roadmap_processing_jobs set document_hash=encode(extensions.digest(p_document::text,'sha256'),'hex'),seal_hash=encode(extensions.digest(s,'sha256'),'hex')where id=j.id;
 insert into private.roadmap_processing_audit(job_id,actor_id,session_id,action)values(j.id,j.actor_id,j.session_id,'seal');return s;
end $$;
create function public.roadmap_processing(p_action text,p_report uuid,p_payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare a uuid:=private.roadmap_b42_actor();sid uuid:=(auth.jwt()->>'session_id')::uuid;c jsonb;j private.roadmap_processing_jobs;v private.roadmap_processing_versions;r private.roadmap_processing_reviews;lease text;n integer;out jsonb;prior_purpose private.roadmap_processing_purposes;proposal_data jsonb;req uuid;hash text;begin
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>1900000 then raise exception 'Invalid request' using errcode='22023';end if;
 if p_action='attest' then
 c:=private.roadmap_b6_context(p_report,false);
 if p_payload is distinct from '{"active":true,"acknowledgment":"private_internal_draft_storage_review_separate_from_read_only_pilot_v1"}'::jsonb and p_payload is distinct from '{"active":false,"acknowledgment":"private_internal_draft_storage_review_separate_from_read_only_pilot_v1"}'::jsonb then raise exception 'New personal purpose required' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_report::text||a::text,763));
 select * into prior_purpose from private.roadmap_processing_purposes where report_id=p_report and actor_id=a order by sequence desc limit 1;
 if prior_purpose.session_id=sid and prior_purpose.fingerprint=c->>'source_fingerprint' and prior_purpose.b6_grant=(c->>'grant_sequence')::bigint and prior_purpose.active=(p_payload->>'active')::boolean then return '{"acknowledged":true,"idempotent":true,"processing":"operator_grant_and_controls_required"}';end if;
 insert into private.roadmap_processing_purposes(report_id,actor_id,session_id,fingerprint,b6_grant,active,acknowledgment)values(p_report,a,sid,c->>'source_fingerprint',(c->>'grant_sequence')::bigint,(p_payload->>'active')::boolean,p_payload->>'acknowledgment');
 insert into private.roadmap_processing_audit(report_id,actor_id,session_id,action)values(p_report,a,sid,'attest');return '{"acknowledged":true,"processing":"operator_grant_and_controls_required"}';end if;
 if p_action is null or p_action not in ('claim','finish','read','review','approve','regenerate','pdf') then raise exception 'Invalid action' using errcode='22023';end if;
 c:=private.roadmap_processing_context(p_report,case when p_action in ('review','approve','pdf')then p_action else 'read' end);
 perform pg_advisory_xact_lock(hashtextextended(p_report::text,761));
 if p_action in ('read','claim','pdf') and p_payload<>'{}'::jsonb then raise exception 'Unexpected payload' using errcode='22023';end if;
 select * into v from private.roadmap_processing_versions where report_id=p_report and fingerprint=c->>'source_fingerprint' order by revision desc limit 1;
 if p_action in ('read','pdf') then
 insert into private.roadmap_processing_audit(report_id,actor_id,session_id,action)values(p_report,a,sid,p_action);
 select coalesce(jsonb_agg(jsonb_build_object('revision',revision,'proposal',proposal,'actor',actor_id,'created_at',created_at)order by revision),'[]') into out from private.roadmap_processing_reviews where version_id=v.id;
 return jsonb_build_object('version_id',v.id,'revision',v.revision,'document',v.document,'reviews',out,'expires_at',c->'processing_expires_at','client_visible',false,'delivery','held','internal_review_approved',exists(select 1 from private.roadmap_processing_approvals where version_id=v.id and review_revision=(select coalesce(max(revision),0)from private.roadmap_processing_reviews where version_id=v.id)),'pdf',case when p_action='pdf'then'internal_render_only'else'held'end);end if;
 if p_action='regenerate' then
 perform private.roadmap_processing_context(p_report,'review');
 if v.id is null or p_payload->>'version_id' is distinct from v.id::text or (select count(*)from jsonb_object_keys(p_payload))<>2 or not p_payload?&array['version_id','request_key'] then raise exception 'Current draft/regeneration key required' using errcode='40001';end if;
 req:=(p_payload->>'request_key')::uuid;
 select * into j from private.roadmap_processing_jobs where regeneration_key=req;
 if j.id is not null then if j.parent_version is distinct from v.id then raise exception 'Changed regeneration retry' using errcode='22023';end if;return '{"queued":true,"idempotent":true}';end if;
 insert into private.roadmap_processing_jobs(draft_id,contact_id,workflow_id,fingerprint,regeneration_key,parent_version,generation)
 select d.id,d.contact_id,d.workflow_id,c->>'source_fingerprint',req,v.id,coalesce((select max(generation)from private.roadmap_processing_jobs where draft_id=d.id and fingerprint=c->>'source_fingerprint'),0)+1 from private.vitality_assessment_drafts d join public.vitality_reports report on report.contact_id=d.contact_id and report.workflow_id=d.workflow_id where report.id=p_report;
 insert into private.roadmap_processing_audit(report_id,actor_id,session_id,action)values(p_report,a,sid,'regenerate');return '{"queued":true,"global_rules_changed":false}';end if;
 if p_action='claim' then
 if (select count(*) from public.vitality_reports where (contact_id,workflow_id)=(select contact_id,workflow_id from public.vitality_reports where id=p_report))<>1 then raise exception 'Ambiguous report' using errcode='42501';end if;
 select jobs.* into j from private.roadmap_processing_jobs jobs join public.vitality_reports report on jobs.contact_id=report.contact_id and jobs.workflow_id=report.workflow_id
 where report.id=p_report and jobs.fingerprint=c->>'source_fingerprint' and jobs.pipeline='roadmap-internal-processing-v1' and jobs.pins=private.roadmap_b6_pins() and jobs.status<>'complete' and jobs.attempts<3 and (jobs.status='pending' or jobs.lease_until<=clock_timestamp())order by jobs.generation for update of jobs skip locked limit 1;
 if j.id is null then return jsonb_build_object('claimed',false,'version_id',v.id);end if;
 lease:=encode(extensions.gen_random_bytes(32),'hex');
 update private.roadmap_processing_jobs set status='leased',attempts=attempts+1,lease_hash=encode(extensions.digest(lease,'sha256'),'hex'),lease_until=clock_timestamp()+interval '90 seconds',actor_id=a,session_id=sid,grant_sequence=(c->>'processing_grant')::bigint,document_hash=null,seal_hash=null where id=j.id;
 insert into private.roadmap_processing_audit(report_id,job_id,actor_id,session_id,action)values(p_report,j.id,a,sid,'claim');
 select coalesce(jsonb_agg(proposal order by revision),'[]')into out from private.roadmap_processing_reviews where version_id=v.id;
 return jsonb_build_object('claimed',true,'job',j.id,'lease',lease,'context',c,'previous_reviews',out);end if;
 if p_action='finish' then
 if (select count(*) from jsonb_object_keys(p_payload))<>4 or not p_payload?&array['job','lease','seal','document'] then raise exception 'Invalid finish' using errcode='22023';end if;
 select * into j from private.roadmap_processing_jobs where id=(p_payload->>'job')::uuid for update;
 if j.id is null or not exists(select 1 from public.vitality_reports where id=p_report and contact_id=j.contact_id and workflow_id=j.workflow_id) or j.fingerprint is distinct from c->>'source_fingerprint' or j.actor_id is distinct from a or j.session_id is distinct from sid or j.grant_sequence is distinct from (c->>'processing_grant')::bigint
 or j.lease_hash is distinct from encode(extensions.digest(p_payload->>'lease','sha256'),'hex') or j.seal_hash is null or j.seal_hash is distinct from encode(extensions.digest(p_payload->>'seal','sha256'),'hex') or j.document_hash is distinct from encode(extensions.digest((p_payload->'document')::text,'sha256'),'hex') then raise exception 'Invalid sealed result' using errcode='42501';end if;
 if j.status='complete' then select * into v from private.roadmap_processing_versions where job_id=j.id;return jsonb_build_object('version_id',v.id,'idempotent',true);end if;
 if j.status<>'leased' or j.lease_until<=clock_timestamp() then raise exception 'Lease expired' using errcode='42501';end if;
 select coalesce(max(revision),0)+1 into n from private.roadmap_processing_versions where report_id=p_report;
 insert into private.roadmap_processing_versions(job_id,report_id,revision,fingerprint,pipeline,document,document_hash,actor_id,session_id,grant_sequence)values(j.id,p_report,n,j.fingerprint,j.pipeline,p_payload->'document',j.document_hash,a,sid,j.grant_sequence)returning * into v;
 update private.roadmap_processing_jobs set status='complete' where id=j.id;
 insert into private.roadmap_processing_audit(report_id,job_id,actor_id,session_id,action)values(p_report,j.id,a,sid,'finish');return jsonb_build_object('version_id',v.id,'revision',n,'client_visible',false);end if;
 if v.id is null or p_payload->>'version_id' is distinct from v.id::text then raise exception 'Stale version' using errcode='40001';end if;
 select coalesce(max(revision),0)into n from private.roadmap_processing_reviews where version_id=v.id;
 if p_action='review' then
 if (select count(*) from jsonb_object_keys(p_payload))<>4 or not p_payload?&array['version_id','expected_revision','request_key','proposal'] then raise exception 'Invalid review' using errcode='22023';end if;
 proposal_data:=p_payload->'proposal';req:=(p_payload->>'request_key')::uuid;hash:=encode(extensions.digest(p_payload::text,'sha256'),'hex');
 if jsonb_typeof(proposal_data) is distinct from 'object' or proposal_data->>'driver' is null or not (proposal_data->>'driver')=any(private.roadmap_b4_driver_keys()) or proposal_data->>'decision' is null or proposal_data->>'decision' not in ('accurate','inaccurate','needs_adjustment','request_inputs') or jsonb_typeof(proposal_data->'rationale') is distinct from 'string' or length(trim(proposal_data->>'rationale')) not between 3 and 2000 or jsonb_typeof(proposal_data->'citations') is distinct from 'array' or jsonb_array_length(proposal_data->'citations')>20
 or exists(select 1 from jsonb_object_keys(proposal_data)k where k not in ('driver','decision','interpretation','rationale','citations','suggestedAdjustment','missingInputRequest'))
 or exists(select 1 from jsonb_each(proposal_data)e where e.key in ('interpretation','suggestedAdjustment','missingInputRequest') and (jsonb_typeof(e.value)<>'string' or length(e.value#>>'{}')>2000))
 or exists(select 1 from jsonb_array_elements(proposal_data->'citations')ref where jsonb_typeof(ref)<>'string' or not exists(select 1 from jsonb_array_elements(v.document->'drivers'->(proposal_data->>'driver')->'evidence')e where e->'field'=ref)) then raise exception 'Invalid cited proposal' using errcode='22023';end if;
 select * into r from private.roadmap_processing_reviews where actor_id=a and request_key=req;
 if r.sequence is not null then if r.request_hash<>hash then raise exception 'Changed retry' using errcode='22023';end if;return jsonb_build_object('revision',r.revision,'idempotent',true);end if;
 if p_payload->'expected_revision' is distinct from to_jsonb(n)then raise exception 'Concurrent review' using errcode='40001';end if;
 insert into private.roadmap_processing_reviews(version_id,revision,actor_id,session_id,request_key,request_hash,proposal)values(v.id,n+1,a,sid,req,hash,proposal_data);
 insert into private.roadmap_processing_audit(report_id,actor_id,session_id,action)values(p_report,a,sid,'review');return jsonb_build_object('revision',n+1,'rules_adopted',false);end if;
 if p_action='approve' then
 if (select count(*)from jsonb_object_keys(p_payload))<>3 or not p_payload?&array['version_id','expected_revision','rationale'] or p_payload->'expected_revision' is distinct from to_jsonb(n) or (select count(*)from(select distinct on(proposal->>'driver') proposal from private.roadmap_processing_reviews where version_id=v.id order by proposal->>'driver',revision desc)x where x.proposal->>'decision'='accurate')<>12 then raise exception 'Reviewed current version required' using errcode='40001';end if;
 insert into private.roadmap_processing_approvals(version_id,review_revision,actor_id,session_id,rationale)values(v.id,n,a,sid,p_payload->>'rationale')on conflict do nothing;
 insert into private.roadmap_processing_audit(report_id,actor_id,session_id,action)values(p_report,a,sid,'approve');return '{"internal_review_approved":true,"client_visible":false,"delivery":"held","email":"held"}';end if;
 raise exception 'Invalid action' using errcode='22023';
exception when others then raise exception 'Internal Roadmap processing unavailable' using errcode=sqlstate;
end $$;
revoke all on function private.roadmap_processing_completion(),private.roadmap_processing_context(uuid,text),private.roadmap_processing_set_grant(bigint,timestamptz,uuid,uuid,text,boolean,boolean,boolean),private.roadmap_processing_revoke(uuid,uuid,uuid,text),public.roadmap_processing_seal(uuid,text,jsonb),public.roadmap_processing(text,uuid,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.roadmap_processing(text,uuid,jsonb) to authenticated;
grant execute on function public.roadmap_processing_seal(uuid,text,jsonb) to service_role;
commit;
