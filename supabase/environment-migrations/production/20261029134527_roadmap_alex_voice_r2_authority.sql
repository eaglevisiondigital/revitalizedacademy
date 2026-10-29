-- LOCAL CANDIDATE ONLY. Requires separate exact-hash installation approval.
-- Independent R2 authority; no jobs, grants or reports are created by installation.
begin;
select pg_advisory_xact_lock(18062026);
do $guard$ begin
 if to_regclass('private.roadmap_voice_r2_contract') is not null then raise exception 'Already installed';end if;
 if (select encode(extensions.digest(pg_get_functiondef(p.oid),'sha256'),'hex') from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and p.proname='roadmap_alex_basis') is distinct from 'b7f0d6fe79e1dfa4b6cddc4d4b28ae0b7665141c52aec8a200a734fb3a4812b3' then raise exception 'Unexpected private.roadmap_alex_basis baseline';end if;
 if (select encode(extensions.digest(pg_get_functiondef(p.oid),'sha256'),'hex') from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and p.proname='roadmap_alex_context') is distinct from '09b732a1c2debc38ca70a14a20ef5074a630051c567fecfc752887d3357f3283' then raise exception 'Unexpected private.roadmap_alex_context baseline';end if;
 if (select encode(extensions.digest(pg_get_functiondef(p.oid),'sha256'),'hex') from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and p.proname='roadmap_alex_finish_binding') is distinct from 'e0dee4a8c59266e3f4e7d613daac6c957301d6a8ab56c0ca6ef5b2da89174a5f' then raise exception 'Unexpected private.roadmap_alex_finish_binding baseline';end if;
 if (select encode(extensions.digest(pg_get_functiondef(p.oid),'sha256'),'hex') from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and p.proname='roadmap_processing_context') is distinct from '573a4b878909a32b4f328b26f6bb1e9f468c9de99e32d9da1f744c33a6e56f35' then raise exception 'Unexpected private.roadmap_processing_context baseline';end if;
 if (select encode(extensions.digest(pg_get_functiondef(p.oid),'sha256'),'hex') from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and p.proname='roadmap_processing_seal_challenge_context') is distinct from '35d4dd765f4f785bdbf6a53049f024f80a481867b2452b685e45aac488fa6d2b' then raise exception 'Unexpected private.roadmap_processing_seal_challenge_context baseline';end if;
 if (select encode(extensions.digest(pg_get_functiondef(p.oid),'sha256'),'hex') from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='roadmap_alex_key_preflight') is distinct from '2c93e27bd02c5d477187323451b53c26ec2bccde96c1a6b34dfc5f1f962f9918' then raise exception 'Unexpected public.roadmap_alex_key_preflight baseline';end if;
 if (select encode(extensions.digest(pg_get_functiondef(p.oid),'sha256'),'hex') from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='roadmap_processing') is distinct from '835531e25580669ac92a5f34d56b3021e12fc38e9edff2104d8df2b60e046954' then raise exception 'Unexpected public.roadmap_processing baseline';end if;
 if (select encode(extensions.digest(pg_get_functiondef(p.oid),'sha256'),'hex') from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='roadmap_processing_worker_seal') is distinct from 'b7ab046b667f3892b2d5589114d7fbdea0d1d3380b498e9580584e39ab8b0212' then raise exception 'Unexpected public.roadmap_processing_worker_seal baseline';end if;
 if (select encode(extensions.digest(pg_get_functiondef(p.oid),'sha256'),'hex') from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='roadmap_saved_review') is distinct from '8d516cd8725526dc28fea402ff9b8c0bdf753f4932149dc213d6668e96338bd2' then raise exception 'Unexpected public.roadmap_saved_review baseline';end if;
 if (select encode(extensions.digest(jsonb_agg(jsonb_build_object('schema',n.nspname,'name',p.proname,'identity',pg_get_function_identity_arguments(p.oid),'body',p.prosrc,'owner',pg_get_userbyid(p.proowner),'definer',p.prosecdef,'config',p.proconfig,'acl',p.proacl::text)order by n.nspname,p.proname,pg_get_function_identity_arguments(p.oid))::text,'sha256'),'hex')from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in('public','private') ) is distinct from '6e8c857d1974211d815410bd9e1e0881ebb966535fe8114910365df70f4dcc2b' then raise exception 'SQL catalog or ACL drift';end if;
 if not exists(select 1 from private.roadmap_alex_contract where singleton and expires_at='2026-10-31T16:00:00Z') or clock_timestamp()>='2026-10-31T16:00:00Z' then raise exception 'Pilot ceiling missed';end if;
 if (select count(*) from private.roadmap_alex_windows)<>1 then raise exception 'Initial authority missing or changed';end if;
 perform private.roadmap_alex_basis();
 if(select encode(extensions.digest(jsonb_build_array(pin)::text,'sha256'),'hex')from private.roadmap_alex_contract where singleton)is distinct from 'ee8658a41bf228190c6ebc7f8734fc9976730d4067507b93b859645aebcb8665'then raise exception 'Exact approved source/founder pin changed';end if;
 if not exists(select 1 from private.roadmap_processing_versions v join private.roadmap_alex_contract c on c.singleton and v.report_id=(c.pin->>'report')::uuid where v.revision=1 and v.job_id=(c.pin->>'job')::uuid and v.document_hash='155c3a6aaf5bb6a98addc6e2c55ff50490abed41ea60dfffa0155e31e3067df7' and v.document_hash=encode(extensions.digest(v.document::text,'sha256'),'hex')) then raise exception 'Preserved R1 required';end if;
end $guard$;
create table private.roadmap_voice_r2_contract(
 singleton boolean primary key default true check(singleton),pin jsonb not null,parent_version uuid not null,parent_document_hash text not null,
 parent_job_hash text not null,expires_at timestamptz not null check(expires_at='2026-10-31T16:00:00Z'),
 deploy text not null default '6ae2b355884a94061e2269da',source_sha text not null default '19c07b532eb3a91b6d70dae9d9fdc768703408e2',
 worker_sha256 text not null default 'cc623b456d18cad5a94adaef6230a4749565e4948e7a153640ed9f8f115aa0d4',
 voice_hash text not null default 'da9f982e58f7bfc4eab42aacf6812e55862b10fe73bdab12d16098757c7add64',
 ruleset_hash text not null default '996554e27739dd90effda72adcec60493d640f086b15c07c0ca2c29fe08e440b');
insert into private.roadmap_voice_r2_contract(singleton,pin,parent_version,parent_document_hash,parent_job_hash,expires_at)
select true,c.pin,v.id,v.document_hash,encode(extensions.digest(to_jsonb(j)::text,'sha256'),'hex'),c.expires_at
from private.roadmap_alex_contract c join private.roadmap_processing_versions v on v.job_id=(c.pin->>'job')::uuid and v.revision=1
join private.roadmap_processing_jobs j on j.id=v.job_id;
create table private.roadmap_voice_r2_authority(
 id uuid primary key default extensions.gen_random_uuid(),singleton boolean unique not null default true check(singleton),
 request_key uuid unique not null,founder_session uuid not null,operator_id uuid not null,operator_session uuid not null,
 authorization_reference text not null,starts_at timestamptz not null default clock_timestamp(),expires_at timestamptz not null,
 check(starts_at<expires_at and expires_at='2026-10-31T16:00:00Z'));
create table private.roadmap_voice_r2_audit(
 id bigint generated always as identity primary key,authority_id uuid not null references private.roadmap_voice_r2_authority(id),
 actor_id uuid not null,session_id uuid not null,action text not null check(action in('issue','revoke')),reference text not null,created_at timestamptz not null default clock_timestamp());
alter table private.roadmap_voice_r2_contract enable row level security;
alter table private.roadmap_voice_r2_authority enable row level security;
alter table private.roadmap_voice_r2_audit enable row level security;
revoke all on private.roadmap_voice_r2_contract,private.roadmap_voice_r2_authority,private.roadmap_voice_r2_audit from public,anon,authenticated,service_role;
revoke all on sequence private.roadmap_voice_r2_audit_id_seq from public,anon,authenticated,service_role;
create trigger voice_r2_contract_immutable before update or delete or truncate on private.roadmap_voice_r2_contract for each statement execute function private.roadmap_b4_immutable();
create trigger voice_r2_authority_immutable before update or delete or truncate on private.roadmap_voice_r2_authority for each statement execute function private.roadmap_b4_immutable();
create trigger voice_r2_audit_immutable before update or delete or truncate on private.roadmap_voice_r2_audit for each statement execute function private.roadmap_b4_immutable();
-- Integrity is separate from authorization. Revoked/expired reports remain immutable evidence.
create function private.roadmap_voice_r2_lineage() returns boolean language plpgsql security definer set search_path='' as $$
declare c private.roadmap_voice_r2_contract;p jsonb;begin
 select *into c from private.roadmap_voice_r2_contract where singleton;p:=c.pin;
 return c.singleton is true and p=(select pin from private.roadmap_alex_contract where singleton)
 and (select count(*)from private.roadmap_processing_jobs where draft_id=(p->>'draft')::uuid) between 1 and 2
 and exists(select 1 from private.roadmap_processing_jobs j where j.id=(p->>'job')::uuid and encode(extensions.digest(to_jsonb(j)::text,'sha256'),'hex')=c.parent_job_hash)
 and exists(select 1 from private.roadmap_processing_versions v where v.id=c.parent_version and v.revision=1 and v.job_id=(p->>'job')::uuid and v.report_id=(p->>'report')::uuid and v.fingerprint=p->>'fingerprint' and v.document_hash=c.parent_document_hash and v.document_hash=encode(extensions.digest(v.document::text,'sha256'),'hex'))
 and not exists(select 1 from private.roadmap_processing_jobs j where j.draft_id=(p->>'draft')::uuid and j.id<>(p->>'job')::uuid and
 (j.generation is distinct from 2 or j.parent_version is distinct from c.parent_version or j.fingerprint<>p->>'fingerprint' or j.contact_id<>(p->>'contact')::uuid or j.workflow_id<>(p->>'workflow')::uuid or j.pins<>private.roadmap_b6_pins() or j.pipeline<>'roadmap-internal-processing-v1' or j.attempts>1 or j.status not in('pending','leased','complete') or not exists(select 1 from private.roadmap_voice_r2_authority)))
 and (select count(*)from private.roadmap_processing_versions where report_id=(p->>'report')::uuid) between 1 and 2
 and not exists(select 1 from private.roadmap_processing_versions v where v.report_id=(p->>'report')::uuid and v.id<>c.parent_version and
 (v.revision<>2 or v.fingerprint<>p->>'fingerprint' or v.actor_id<>(p->>'founder')::uuid or v.document_hash<>encode(extensions.digest(v.document::text,'sha256'),'hex') or not exists(select 1 from private.roadmap_processing_jobs j where j.id=v.job_id and j.generation=2 and j.parent_version=c.parent_version and j.draft_id=(p->>'draft')::uuid)));
end $$;
CREATE OR REPLACE FUNCTION private.roadmap_alex_basis()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare p jsonb;c private.roadmap_alex_contract;v private.roadmap_b42_verifications;s private.roadmap_b42_sop_attestations;
 b private.roadmap_b6_purpose_events;st private.roadmap_processing_purposes;j private.roadmap_processing_jobs;m jsonb;begin
 perform pg_advisory_xact_lock(18062026);select *into c from private.roadmap_alex_contract where singleton;
 p:=c.pin;if p is null then raise exception 'Pinned Alex contract unavailable'using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(p->>'report',416));
 if(select jsonb_agg(pin)from private.roadmap_alex_anchor_rows())is distinct from jsonb_build_array(p)
 then raise exception 'Exact source, identity or retained authority changed'using errcode='42501';end if;
 select *into v from private.roadmap_b42_verifications where id=(p->>'verification')::uuid;
 select *into s from private.roadmap_b42_sop_attestations where id=(p->>'sop')::uuid;
 select *into b from private.roadmap_b6_purpose_events where sequence=(p->>'purpose')::bigint;
 select *into st from private.roadmap_processing_purposes where sequence=(p->>'storage')::bigint;
 select *into j from private.roadmap_processing_jobs where id=(p->>'job')::uuid for update;
 if v.decision is distinct from 'confirmed'or not v.eligible_at_confirmation
 or exists(select 1 from private.roadmap_b42_verifications where subject_key=v.subject_key and revision>v.revision)
 or s.sop_version is distinct from 'RVA-B4-PILOT-READONLY-v1-2026-10-16'
 or s.acknowledgments is distinct from '{"internal_only":true,"founders_only":true,"read_only":true,"no_ai_exports":true,"no_scores_emails":true,"manual_revocation_14_days":true,"separate_enrollment":true}'::jsonb
 or not private.roadmap_b4_is_founder(s.revocation_owner)or not private.roadmap_b4_is_founder(s.backup_owner)
 or not private.roadmap_b4_is_founder((p->>'founder')::uuid)
 or not exists(select 1 from private.roadmap_b42_founders f join auth.users u on u.id=f.user_id where f.user_id=(p->>'founder')::uuid and f.verified_email='justyn@revitalizedacademy.com'and lower(trim(u.email))=f.verified_email)
 or not private.staff_has_permission((p->>'founder')::uuid,'health.private.view')or not private.staff_has_permission((p->>'founder')::uuid,'crm.view')or not private.staff_has_permission((p->>'founder')::uuid,'health.progress.manage')
 or not private.staff_can_access_contact((p->>'founder')::uuid,(p->>'contact')::uuid)
 or b.active is distinct from true or b.pins is distinct from private.roadmap_b6_pins()or b.source_fingerprint is distinct from p->>'fingerprint'
 or b.acknowledgments is distinct from '{"experimental_purpose":true,"no_client_scores":true,"immutable_originals":true,"no_external_ai_exports":true,"manual_revocation_14_days":true,"separate_feedback_permission":true,"historical_provenance_limits":true}'::jsonb
 or st.active is distinct from true or st.actor_id is distinct from b.actor_id or st.fingerprint is distinct from p->>'fingerprint'or st.b6_grant is distinct from(p->>'b6')::bigint
 or st.acknowledgment is distinct from 'private_internal_draft_storage_review_separate_from_read_only_pilot_v1'
 or not exists(select 1 from private.roadmap_b4_cohort_events where sequence=(p->>'cohort')::bigint and active and not allow_drafts and source_fingerprint=p->>'fingerprint')
 or not exists(select 1 from private.roadmap_b5_pilot_events where sequence=(p->>'b5')::bigint and active and source_fingerprint=p->>'fingerprint')
 or not exists(select 1 from private.roadmap_b6_grant_events where sequence=(p->>'b6')::bigint and active and purpose_sequence=b.sequence and pins=private.roadmap_b6_pins())
 or j.generation is distinct from 1 or j.parent_version is not null or j.pins is distinct from private.roadmap_b6_pins()or j.fingerprint is distinct from p->>'fingerprint'or j.status not in('pending','leased','complete')
 or private.roadmap_voice_r2_lineage() is distinct from true
 or not exists(select 1 from private.roadmap_processing_seal_keys where id=(p->>'key')::uuid and active and not revoked and secret is not null and octet_length(secret)=32)
 then raise exception 'Current source, consent, SOP or custody basis unavailable'using errcode='42501';end if;
 m:=private.roadmap_b42_descriptor((p->>'contact')::uuid,(p->>'report')::uuid);
 if m->>'eligible' is distinct from 'true'or m->>'_source' is distinct from p->>'fingerprint'or m->>'_fingerprint' is distinct from p->>'metadata_fingerprint'or m->>'_workflow' is distinct from p->>'workflow'
 then raise exception 'Current eligible immutable source required'using errcode='42501';end if;
 -- Historical deadlines are NOT treated as live. Only the new contract/window may authorize below.
 return p;
end $function$
;
create function private.roadmap_voice_r2_issue(p_founder_session uuid,p_operator uuid,p_session uuid,p_request uuid,p_reference text,p_sop text,p_custody text)returns uuid language plpgsql security definer set search_path=''as $$
declare c private.roadmap_voice_r2_contract;w private.roadmap_voice_r2_authority;begin
 perform pg_advisory_xact_lock(18062026);perform private.roadmap_processing_scope_operator(p_operator,p_session,p_reference);
 select *into c from private.roadmap_voice_r2_contract where singleton;
 perform private.roadmap_alex_basis();
 if p_sop is distinct from 'ONE_ALEX_VOICE_REVISION2_SAME_PURPOSE_SOP' or p_custody is distinct from 'ONE_ALEX_VOICE_REVISION2_EXISTING_CUSTODIED_KEY' or p_request is null or length(trim(p_reference))not between 10 and 1000 or p_reference is null
 or not exists(select 1 from public.staff_access where user_id=p_operator and role='owner')
 or clock_timestamp()>=c.expires_at or exists(select 1 from private.roadmap_alex_audit where action='revoke')
 or not exists(select 1 from private.roadmap_alex_windows iw join private.roadmap_processing_grants g on g.sequence=iw.grant_sequence where g.active and g.expires_at=c.expires_at and g.allow_review and not g.allow_approval and not g.allow_pdf and g.fingerprint=c.pin->>'fingerprint')
 or (select sequence from private.roadmap_processing_grants where report_id=(c.pin->>'report')::uuid order by sequence desc limit 1)is distinct from(select grant_sequence from private.roadmap_alex_windows)
 or not exists(select 1 from private.roadmap_processing_controls where singleton and process and review and not ingest and not approve and not internal_pdf)
 then raise exception 'Exact new Owner SOP/custody authority required'using errcode='42501';end if;
 perform private.roadmap_b6_live_session((c.pin->>'founder')::uuid,p_founder_session);
 if not exists(select 1 from private.roadmap_alex_session_checks where actor_id=(c.pin->>'founder')::uuid and session_id=p_founder_session and created_at>clock_timestamp()-interval'15 minutes')then raise exception 'Fresh personal founder session required'using errcode='42501';end if;
 select *into w from private.roadmap_voice_r2_authority;
 if w.id is not null then
 if w.request_key=p_request and w.founder_session=p_founder_session and w.operator_id=p_operator and w.operator_session=p_session and w.authorization_reference=p_reference and not exists(select 1 from private.roadmap_voice_r2_audit where action='revoke')then return w.id;end if;
 raise exception 'Only one unchanged issuance; no replacement or replay'using errcode='42501';end if;
 if(select count(*)from private.roadmap_processing_versions where report_id=(c.pin->>'report')::uuid)<>1 or(select count(*)from private.roadmap_processing_jobs where draft_id=(c.pin->>'draft')::uuid)<>1 then raise exception 'Untouched R1 lineage required';end if;
 insert into private.roadmap_voice_r2_authority(request_key,founder_session,operator_id,operator_session,authorization_reference,expires_at)values(p_request,p_founder_session,p_operator,p_session,p_reference,c.expires_at)returning *into w;
 insert into private.roadmap_voice_r2_audit(authority_id,actor_id,session_id,action,reference)values(w.id,p_operator,p_session,'issue',p_reference);
 return w.id;
end $$;
create function private.roadmap_voice_r2_context(p_mode text)returns jsonb language plpgsql security definer set search_path=''as $$
declare c private.roadmap_voice_r2_contract;w private.roadmap_voice_r2_authority;ctx jsonb;begin
 ctx:=private.roadmap_alex_context(p_mode);select *into c from private.roadmap_voice_r2_contract where singleton;select *into w from private.roadmap_voice_r2_authority;
 if w.id is null or clock_timestamp()<w.starts_at or clock_timestamp()>=w.expires_at or w.expires_at<>c.expires_at
 or exists(select 1 from private.roadmap_voice_r2_audit where authority_id=w.id and action='revoke')then raise exception 'Independent R2 authority inactive'using errcode='42501';end if;
 perform private.roadmap_processing_scope_operator(w.operator_id,w.operator_session,w.authorization_reference);
 return ctx||jsonb_build_object('operating_authority',w.id,'processing_expires_at',w.expires_at,'expires_at',w.expires_at,'parent_version',c.parent_version,'parent_document_hash',c.parent_document_hash,'target_revision',2,'worker_sha256',c.worker_sha256,'voice_hash',c.voice_hash);
end $$;
create function private.roadmap_voice_r2_revoke(p_operator uuid,p_session uuid,p_reference text)returns void language plpgsql security definer set search_path=''as $$
declare w private.roadmap_voice_r2_authority;begin
 perform pg_advisory_xact_lock(18062026);perform private.roadmap_processing_scope_operator(p_operator,p_session,p_reference);select *into w from private.roadmap_voice_r2_authority;
 if w.id is null then raise exception 'No R2 authority';end if;
 if not exists(select 1 from private.roadmap_voice_r2_audit where authority_id=w.id and action='revoke')then insert into private.roadmap_voice_r2_audit(authority_id,actor_id,session_id,action,reference)values(w.id,p_operator,p_session,'revoke',p_reference);end if;
end $$;
create function private.roadmap_voice_r2_document_gate(d jsonb)returns void language plpgsql security definer set search_path=''as $$
declare c private.roadmap_voice_r2_contract;m jsonb;begin
 select *into c from private.roadmap_voice_r2_contract where singleton;
 perform private.roadmap_alex_document_gate(d);
 m:=jsonb_build_object('version','founder-coaching-voice-v1-20261028','hash',c.voice_hash,'methodologyHash',c.ruleset_hash,'optIn',true,'newMethodologyDirections',0);
 if d->'narrative'->'presentation'is distinct from m or d->'roadmap'->'presentation'is distinct from m or d->>'sourceFingerprint'is distinct from c.pin->>'fingerprint' or d->'pins'is distinct from private.roadmap_b6_pins()
 or d->'calculation'->'policyApproved'is distinct from 'false'::jsonb or d->'review'->>'email'is distinct from 'held'
 or d->'calculation'->'overall'is distinct from 'null'::jsonb or d->'calculation'->'spectrum'is distinct from 'null'::jsonb or d->'calculation'->'completeNumericDrivers'is distinct from '0'::jsonb
 or jsonb_typeof(d->'drivers')is distinct from 'object' or(select count(*)from jsonb_object_keys(d->'drivers'))<>12
 or exists(select 1 from unnest(private.roadmap_b4_driver_keys())k where not(d->'drivers'?k)or d->'drivers'->k->'score'is distinct from 'null'::jsonb or d->'drivers'->k->'stage'is distinct from 'null'::jsonb)
 or jsonb_typeof(d->'roadmap'->'phases')is distinct from 'array' or (jsonb_array_length(d->'roadmap'->'phases')<>3 and not(jsonb_array_length(d->'roadmap'->'phases')=0 and jsonb_array_length(d->'roadmap'->'safetyEvidence')>0))
 or d->'review'->'clientVisible'is distinct from 'false'::jsonb or d->'review'->>'export'is distinct from 'held' or d->'review'->>'delivery'is distinct from 'held'
 then raise exception 'Pinned voice, source, 12 Drivers and scoring holds required'using errcode='42501';end if;
end $$;
create or replace function private.roadmap_processing_context(p_report uuid,p_mode text default 'read')returns jsonb language plpgsql security definer set search_path=''as $$
begin
 if exists(select 1 from private.roadmap_voice_r2_contract c where c.pin->>'report'=p_report::text)then
 if exists(select 1 from private.roadmap_voice_r2_authority)then return private.roadmap_voice_r2_context(p_mode);end if;
 return private.roadmap_alex_context(p_mode);end if;return private.roadmap_alex_prior_context(p_report,p_mode);
end $$;
create or replace function public.roadmap_processing(p_action text,p_report uuid,p_payload jsonb default '{}')returns jsonb language plpgsql security definer set search_path=''as $$
declare c private.roadmap_voice_r2_contract;j private.roadmap_processing_jobs;result jsonb;begin
 perform pg_advisory_xact_lock(18062026);select *into c from private.roadmap_voice_r2_contract where pin->>'report'=p_report::text;
 if c.singleton is null then return private.roadmap_alex_prior_processing(p_action,p_report,p_payload);end if;
 if p_action is null or p_action not in('read','review','regenerate','claim','finish')then raise exception 'Only separate R2 generation and saved read/cited feedback'using errcode='42501';end if;
 perform private.roadmap_processing_context(p_report,case when p_action='review'then'review'else'read'end);
 if p_action in('regenerate','claim','finish')then perform private.roadmap_voice_r2_context('review');end if;
 if p_action in('read','claim')and p_payload is distinct from '{}'::jsonb then raise exception 'Unexpected payload'using errcode='22023';end if;
 if p_action='regenerate'then
 if jsonb_typeof(p_payload->'request_key')is distinct from 'string' or (p_payload->>'request_key')!~'^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$' or(select count(*)from jsonb_object_keys(p_payload))<>2 then raise exception 'Exact regeneration idempotency key required'using errcode='22023';end if;
 if p_payload->>'version_id'is distinct from c.parent_version::text then raise exception 'Exact preserved R1 parent required'using errcode='42501';end if;
 select *into j from private.roadmap_processing_jobs where draft_id=(c.pin->>'draft')::uuid and generation=2;
 if j.id is not null then
 if j.regeneration_key::text is not distinct from p_payload->>'request_key' and p_payload=jsonb_build_object('version_id',c.parent_version,'request_key',j.regeneration_key)then return jsonb_build_object('queued',true,'idempotent',true);end if;
 raise exception 'Exactly one R2 job, no changed retry'using errcode='42501';end if;
 end if;
 if p_action='claim'then
 select *into j from private.roadmap_processing_jobs where draft_id=(c.pin->>'draft')::uuid and generation=2;
 if j.id is null then raise exception 'Explicit separate regenerate action required'using errcode='42501';end if;
 if j.attempts>=1 then
 if j.status='complete'then return jsonb_build_object('claimed',false);end if;
 raise exception 'One attempt already used; independent readback, no retry'using errcode='42501';end if;
 end if;
 if p_action='finish'then
 if not exists(select 1 from private.roadmap_processing_jobs where id=(p_payload->>'job')::uuid and generation=2 and parent_version=c.parent_version and draft_id=(c.pin->>'draft')::uuid and attempts=1)then raise exception 'Exact R2 job required'using errcode='42501';end if;
 perform private.roadmap_voice_r2_document_gate(p_payload->'document');end if;
 if p_action='review'and(jsonb_typeof(p_payload->'proposal'->'citations')is distinct from 'array'or jsonb_array_length(p_payload->'proposal'->'citations')not between 1 and 20)then raise exception 'Affirmative cited feedback required'using errcode='22023';end if;
 result:=private.roadmap_alex_prior_processing(p_action,p_report,p_payload);
 if private.roadmap_voice_r2_lineage()is distinct from true then raise exception 'R2 lineage invariant failed'using errcode='42501';end if;
 return result;
end $$;
CREATE OR REPLACE FUNCTION private.roadmap_processing_seal_challenge_context(p_key uuid, p_job uuid, p_lease text, p_document jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare p jsonb;ctx jsonb;c private.roadmap_alex_contract;j private.roadmap_processing_jobs;w private.roadmap_alex_windows;actor uuid;sid uuid;challenge text;begin
 select *into c from private.roadmap_alex_contract where singleton;p:=c.pin;
 if exists(select 1 from private.roadmap_processing_jobs qj where qj.id=p_job and qj.draft_id=(p->>'draft')::uuid and qj.generation=2)then
 ctx:=private.roadmap_voice_r2_context('read');select *into j from private.roadmap_processing_jobs where id=p_job for update;actor:=private.roadmap_b42_actor();sid:=(auth.jwt()->>'session_id')::uuid;
 if p_key is distinct from(p->>'key')::uuid or p_lease is null or p_lease!~'^[a-f0-9]{64}$' or j.parent_version::text is distinct from ctx->>'parent_version' or j.attempts<>1 or j.status<>'leased' or j.lease_until<=clock_timestamp() or j.lease_hash is distinct from encode(extensions.digest(p_lease,'sha256'),'hex') or j.actor_id is distinct from actor or j.session_id is distinct from sid or j.grant_sequence is distinct from(ctx->>'processing_grant')::bigint or octet_length(p_document::text)>1800000 then raise exception 'Exact R2 source/lease/custody required'using errcode='42501';end if;
 perform private.roadmap_voice_r2_document_gate(p_document);
 challenge:=jsonb_build_object('protocol','rva-roadmap-seal-hmac-sha256-v1','scope','alex-founder-voice-revision2','authority',ctx->'operating_authority','key',p_key,'job',j.id,'lease_hash',j.lease_hash,'document_hash',encode(extensions.digest(p_document::text,'sha256'),'hex'),'fingerprint',j.fingerprint,'grant',j.grant_sequence,'actor',actor,'session',sid,'authority_expires_at',ctx->'processing_expires_at','parent_version',ctx->'parent_version','parent_document_hash',ctx->'parent_document_hash','worker_sha256',ctx->'worker_sha256','voice_hash',ctx->'voice_hash','pins',j.pins)::text;
 return jsonb_build_object('protocol','rva-roadmap-seal-hmac-sha256-v1','challenge',challenge);
 end if;
 if p_job is distinct from(p->>'job')::uuid then return private.roadmap_alex_prior_challenge(p_key,p_job,p_lease,p_document);end if;
 ctx:=private.roadmap_alex_context('read');select *into w from private.roadmap_alex_windows;actor:=private.roadmap_b42_actor();sid:=(auth.jwt()->>'session_id')::uuid;
 select *into j from private.roadmap_processing_jobs where id=p_job for update;
 if p_key is distinct from(p->>'key')::uuid or p_lease is null or p_lease!~'^[a-f0-9]{64}$'or jsonb_typeof(p_document)is distinct from 'object'or octet_length(p_document::text)>1800000
 or j.status is distinct from 'leased'or j.lease_until<=clock_timestamp()or j.lease_hash is distinct from encode(extensions.digest(p_lease,'sha256'),'hex')
 or j.actor_id is distinct from actor or j.session_id is distinct from sid or j.grant_sequence is distinct from w.grant_sequence
 or p_document->>'sourceFingerprint'is distinct from p->>'fingerprint'or p_document->'pins'is distinct from private.roadmap_b6_pins()
 or p_document->'narrative'->>'version'is distinct from 'founder-direction-narrative-20261027-v2-local'or p_document->'narrative'->>'ruleHash'is distinct from c.narrative_hash
 then raise exception 'Exact new Alex source/job/lease/narrative sealing authority required'using errcode='42501';end if;
 perform private.roadmap_alex_document_gate(p_document);
 -- NEW authority and deadline, not a revival or extension of the expired original batch/key permission.
 -- Cryptographic material stays in existing custody; its original authority row is never changed.
 challenge:=jsonb_build_object('protocol','rva-roadmap-seal-hmac-sha256-v1','scope','alex-initial-v2-72h','authority',w.id,'key',p_key,'job',j.id,'lease_hash',j.lease_hash,'document_hash',encode(extensions.digest(p_document::text,'sha256'),'hex'),'fingerprint',j.fingerprint,'grant',w.grant_sequence,'actor',actor,'session',sid,'authority_expires_at',c.expires_at,'narrative_hash',c.narrative_hash,'pins',j.pins)::text;
 return jsonb_build_object('protocol','rva-roadmap-seal-hmac-sha256-v1','challenge',challenge);
end $function$
;
CREATE OR REPLACE FUNCTION private.roadmap_alex_finish_binding(p_job uuid, p_key uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare p jsonb;c jsonb;begin
 select pin into p from private.roadmap_alex_contract where singleton;
 if exists(select 1 from private.roadmap_processing_jobs j join private.roadmap_voice_r2_contract rc on rc.singleton where j.id=p_job and j.draft_id=(rc.pin->>'draft')::uuid and j.generation=2 and j.parent_version=rc.parent_version and j.attempts=1)then
 if p_key is distinct from(p->>'key')::uuid then return false;end if;c:=private.roadmap_voice_r2_context('read');return c->>'operating_authority'is not null;end if;
 if p_job is distinct from(p->>'job')::uuid or p_key is distinct from(p->>'key')::uuid then return false;end if;
 c:=private.roadmap_alex_context('read');return c->>'operating_authority'is not null;
end $function$
;
CREATE OR REPLACE FUNCTION public.roadmap_alex_key_preflight(p_key uuid, p_report uuid, p_nonce text, p_proof text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare p jsonb;c jsonb;challenge text;secret bytea;expected bytea;begin
 c:=private.roadmap_processing_context(p_report,'read');select pin into p from private.roadmap_alex_contract where singleton;
 if p_report is distinct from(p->>'report')::uuid or p_key is distinct from(p->>'key')::uuid or p_nonce is null or p_nonce!~'^[a-f0-9]{64}$'then raise exception 'Exact key, source and nonce required'using errcode='42501';end if;
 if c->>'target_revision'='2'then p:=p||jsonb_build_object('job',(select id from private.roadmap_processing_jobs where draft_id=(p->>'draft')::uuid and generation=2));if p->>'job'is null then raise exception 'Explicit R2 action required'using errcode='42501';end if;end if;
 challenge:=jsonb_build_object('protocol','rva-alex-key-possession-v1','authority',c->'operating_authority','report',p_report,'job',p->'job','fingerprint',p->'fingerprint','key',p_key,'actor',auth.uid(),'session',auth.jwt()->>'session_id','expires_at',c->'processing_expires_at','nonce',p_nonce)::text;
 if p_proof is null then return jsonb_build_object('protocol','rva-alex-key-possession-v1','challenge',challenge);end if;
 if p_proof!~'^[a-f0-9]{64}$'then raise exception 'Worker possession proof required'using errcode='42501';end if;
 select k.secret into secret from private.roadmap_processing_seal_keys k where k.id=p_key and k.active and not k.revoked for share;
 expected:=extensions.hmac(convert_to(challenge,'UTF8'),secret,'sha256');
 if not private.roadmap_processing_proof_equal(expected,decode(p_proof,'hex'))then raise exception 'Worker custody not verified; no claim authorized'using errcode='42501';end if;
 return '{"ready":true,"processing":false}'::jsonb;
end $function$
;
CREATE OR REPLACE FUNCTION public.roadmap_saved_review(p_action text, p_report uuid DEFAULT NULL::uuid, p_payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare p jsonb;c jsonb;rows jsonb;v private.roadmap_processing_versions;begin
 perform pg_advisory_xact_lock(18062026);
 if p_action='list'and p_report is null and p_payload='{}'::jsonb then
 begin
 rows:=private.roadmap_alex_prior_saved_review(p_action,p_report,p_payload);
 exception when sqlstate '42501' then
 -- An unrelated expired/denied legacy review must not hide an authorized saved Alex version.
 -- No grant is inferred: the existing Alex source/session/window checks must all pass.
 c:=private.roadmap_processing_context((select(pin->>'report')::uuid from private.roadmap_alex_contract where singleton),'read');
 select *into v from private.roadmap_processing_versions where report_id=(select(pin->>'report')::uuid from private.roadmap_alex_contract where singleton) order by revision desc limit 1;
 if v.id is null then raise;end if;
 rows:='[]'::jsonb;
 end;
 begin c:=private.roadmap_processing_context((select(pin->>'report')::uuid from private.roadmap_alex_contract where singleton),'read');select pin into p from private.roadmap_alex_contract where singleton;
 select *into v from private.roadmap_processing_versions where report_id=(p->>'report')::uuid order by revision desc limit 1;
 if v.id is not null then rows:=rows||jsonb_build_array(jsonb_build_object('report_id',v.report_id,'label',(c->'identity'->>'name')||' · saved Revision '||v.revision::text,'revision',v.revision,'review_only',true,'expires_at',c->'expires_at'));end if;
 exception when sqlstate '42501'or sqlstate '40001'or sqlstate '55000'then null;end;return rows;
 end if;
 if exists(select 1 from private.roadmap_alex_contract where pin->>'report'=p_report::text)then
 if p_action is null or p_action not in('read','review')then raise exception 'Saved Alex read and feedback only'using errcode='42501';end if;
 c:=private.roadmap_processing_context((select(pin->>'report')::uuid from private.roadmap_alex_contract where singleton),case when p_action='review'then'review'else'read'end);select pin into p from private.roadmap_alex_contract where singleton;
 select *into v from private.roadmap_processing_versions where report_id=(p->>'report')::uuid order by revision desc limit 1;
 if v.id is null then raise exception 'No saved initial Alex report; reading never generates'using errcode='42501';end if;
 return public.roadmap_processing(p_action,p_report,p_payload)||jsonb_build_object('review_only',true);
 end if;return private.roadmap_alex_prior_saved_review(p_action,p_report,p_payload);
end $function$
;
do $$declare r record;begin
 for r in select p.oid::regprocedure as identity from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and p.proname like 'roadmap_voice_r2_%'loop execute format('revoke all on function %s from public,anon,authenticated,service_role',r.identity);end loop;
 if(select count(*)from private.roadmap_voice_r2_contract)<>1 or exists(select 1 from private.roadmap_voice_r2_authority)or exists(select 1 from private.roadmap_voice_r2_audit)then raise exception 'Empty installation required';end if;
end $$;
commit;
