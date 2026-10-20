-- Local candidate only. Installs no scopes, credentials, jobs, grants or activation.
begin;
create table private.roadmap_processing_pilot_batches (
 sequence bigint generated always as identity primary key, id uuid not null unique default gen_random_uuid(),
 sources jsonb not null check(jsonb_typeof(sources)='array' and jsonb_array_length(sources)=3),
 expires_at timestamptz not null, operator_id uuid not null references auth.users(id), operator_session uuid not null,
 authorization_reference text not null check(length(trim(authorization_reference)) between 10 and 1000),
 created_at timestamptz not null default clock_timestamp()
);
create table private.roadmap_processing_seal_keys (
 id uuid primary key, batch_id uuid references private.roadmap_processing_pilot_batches(id),
 secret bytea, secret_hash text not null, active boolean not null default false, revoked boolean not null default false, expires_at timestamptz not null,
 check((revoked and not active and secret is null) or (not revoked and secret is not null and octet_length(secret)=32 and active=(batch_id is not null)))
);
alter table private.roadmap_processing_jobs add column seal_key_id uuid references private.roadmap_processing_seal_keys(id);
create index roadmap_processing_job_seal_identity on private.roadmap_processing_jobs(seal_key_id) where seal_key_id is not null;
create table private.roadmap_processing_scope_audit (
 sequence bigint generated always as identity primary key, batch_id uuid, key_id uuid, report_id uuid, job_id uuid,
 actor_id uuid not null references auth.users(id), session_id uuid not null,
 action text not null check(action in ('batch','key_staged','key_bound','key_revoked','historical_enqueue','activation','deactivation')),
 authorization_reference text not null, created_at timestamptz not null default clock_timestamp()
);
do $$declare t text;begin
 foreach t in array array['pilot_batches','seal_keys','scope_audit'] loop
 execute format('alter table private.roadmap_processing_%I enable row level security',t);
 execute format('revoke all on private.roadmap_processing_%I from public,anon,authenticated,service_role',t);
 if t<>'seal_keys' then
 execute format('create trigger %I before update or delete on private.roadmap_processing_%I for each row execute function private.roadmap_b4_immutable()','roadmap_processing_'||t||'_immutable',t);
 execute format('create trigger %I before truncate on private.roadmap_processing_%I for each statement execute function private.roadmap_b4_immutable()','roadmap_processing_'||t||'_no_truncate',t);
 end if;end loop;
end $$;
revoke all on sequence private.roadmap_processing_pilot_batches_sequence_seq,private.roadmap_processing_scope_audit_sequence_seq from public,anon,authenticated,service_role;

-- No role grants/new Auth identities. The operator capability remains private.
create function private.roadmap_processing_scope_operator(p_actor uuid,p_session uuid,p_reference text) returns void language plpgsql security definer set search_path='' as $$
begin
 if p_reference is null or length(trim(p_reference)) not between 10 and 1000
 or not exists(select 1 from auth.sessions where id=p_session and user_id=p_actor and (not_after is null or not_after>clock_timestamp()))
 or not exists(select 1 from public.staff_access where user_id=p_actor and role in ('owner','admin') and status='active' and onboarding_status='complete' and contact_scope='all')
 or not private.staff_has_permission(p_actor,'staff.manage') then raise exception 'Authorized supervising operator required' using errcode='42501';end if;
 perform 1 from auth.sessions where id=p_session and user_id=p_actor for share;
 perform 1 from public.staff_access where user_id=p_actor for share;
 if not exists(select 1 from auth.sessions where id=p_session and user_id=p_actor and (not_after is null or not_after>clock_timestamp()))
 or not exists(select 1 from public.staff_access where user_id=p_actor and role in ('owner','admin') and status='active' and onboarding_status='complete' and contact_scope='all')
 or not private.staff_has_permission(p_actor,'staff.manage') then raise exception 'Operator session changed' using errcode='42501';end if;
end $$;
create function private.roadmap_processing_check_source_grant(p_report uuid,p_grant bigint,p_fingerprint text,p_operator uuid,p_session uuid,p_reference text) returns jsonb language plpgsql security definer set search_path='' as $$
declare g private.roadmap_processing_grants;d private.vitality_assessment_drafts;plan jsonb;b private.roadmap_b6_grant_events;latest bigint;begin
 perform private.roadmap_processing_scope_operator(p_operator,p_session,p_reference);
 if exists(select 1 from private.roadmap_processing_controls where ingest or approve or internal_pdf) then raise exception 'Held pilot controls required' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_report::text,416));
 select * into g from private.roadmap_processing_grants where report_id=p_report order by sequence desc limit 1;
 if g.sequence is distinct from p_grant or g.active is distinct from true or g.fingerprint is distinct from p_fingerprint
 or g.operator_id is distinct from p_operator or g.operator_session is distinct from p_session
 or g.expires_at<=clock_timestamp() or not g.allow_review or g.allow_approval or g.allow_pdf then raise exception 'Exact active source review grant required' using errcode='42501';end if;
 -- Reuse every existing purpose/B6/B5/identity/SOP eligibility and current issuer check.
 latest:=private.roadmap_processing_set_grant(g.purpose,g.expires_at,g.operator_id,g.operator_session,g.authorization_reference,g.allow_review,g.allow_approval,g.allow_pdf);
 if latest is distinct from g.sequence then raise exception 'Changed source authorization' using errcode='40001';end if;
 select * into b from private.roadmap_b6_grant_events where sequence=g.b6_grant;
 select private.roadmap_b42_operator_plan(verification_id) into plan from private.roadmap_b5_pilot_events where sequence=b.pilot_sequence;
 if plan->>'report_id' is distinct from p_report::text or plan->>'source_fingerprint' is distinct from p_fingerprint then raise exception 'Source identity changed' using errcode='40001';end if;
 select drafts.* into d from private.vitality_assessment_drafts drafts where drafts.contact_id=(plan->>'contact_id')::uuid and drafts.workflow_id=(plan->>'workflow_id')::uuid;
 if d.id is null or (select count(*) from private.vitality_assessment_drafts where contact_id=d.contact_id and workflow_id=d.workflow_id)<>1
 or (select count(*) from public.vitality_reports where contact_id=d.contact_id and workflow_id=d.workflow_id)<>1
 or d.status<>'completed' or d.verified_at is null or d.completed_at is null or d.snapshot->>'pathway' is distinct from 'Adult'
 or not exists(select 1 from jsonb_array_elements(coalesce(d.snapshot->'fields'->'assessment_for','[]'))a where a->>'value'='Myself' and a->'checked'='true')
 or encode(extensions.digest(jsonb_build_object('snapshot',d.snapshot,'final_form',d.final_form)::text,'sha256'),'hex') is distinct from p_fingerprint then raise exception 'Eligible exact detailed source required' using errcode='42501';end if;
 return jsonb_build_object('report',p_report,'grant',g.sequence,'fingerprint',p_fingerprint,'draft',d.id,'contact',d.contact_id,'workflow',d.workflow_id,'expires_at',g.expires_at);
end $$;
create function private.roadmap_processing_authorize_batch(p_sources jsonb,p_expires timestamptz,p_operator uuid,p_session uuid,p_reference text) returns uuid language plpgsql security definer set search_path='' as $$
declare entry jsonb;c jsonb;canonical jsonb:='[]';contacts uuid[]:='{}';first_batch private.roadmap_processing_pilot_batches;old private.roadmap_processing_pilot_batches;id uuid;begin
 perform pg_advisory_xact_lock(18062026);
 perform private.roadmap_processing_scope_operator(p_operator,p_session,p_reference);
 if jsonb_typeof(p_sources) is distinct from 'array' or jsonb_array_length(p_sources)<>3 or octet_length(p_sources::text)>3000
 or p_expires is null or p_expires<=clock_timestamp() then raise exception 'Exact three-source authorization required' using errcode='22023';end if;
 for entry in select value from jsonb_array_elements(p_sources) order by value->>'report' loop
 if jsonb_typeof(entry)<>'object' or (select count(*)from jsonb_object_keys(entry))<>3 or not entry?&array['report','grant','fingerprint']
 or entry->>'fingerprint' !~ '^[a-f0-9]{64}$' then raise exception 'Exact pinned source entry required' using errcode='22023';end if;
 c:=private.roadmap_processing_check_source_grant((entry->>'report')::uuid,(entry->>'grant')::bigint,entry->>'fingerprint',p_operator,p_session,p_reference);
 if (c->>'contact')::uuid=any(contacts) or p_expires>(c->>'expires_at')::timestamptz then raise exception 'Unique identities and inherited expiry required' using errcode='42501';end if;
 contacts:=array_append(contacts,(c->>'contact')::uuid);canonical:=canonical||jsonb_build_array(jsonb_build_object('report',c->'report','grant',c->'grant','fingerprint',c->'fingerprint'));
 end loop;
 select * into first_batch from private.roadmap_processing_pilot_batches order by sequence limit 1;
 if first_batch.id is not null and (p_expires>first_batch.expires_at or
 (select jsonb_agg(value-'grant' order by value->>'report')from jsonb_array_elements(canonical)) is distinct from
 (select jsonb_agg(value-'grant' order by value->>'report')from jsonb_array_elements(first_batch.sources))) then raise exception 'Original three-source scope cannot expand or change' using errcode='42501';end if;
 select * into old from private.roadmap_processing_pilot_batches order by sequence desc limit 1;
 if old.sources=canonical and old.expires_at=p_expires and old.operator_id=p_operator and old.operator_session=p_session and old.authorization_reference=p_reference then return old.id;end if;
 insert into private.roadmap_processing_pilot_batches(sources,expires_at,operator_id,operator_session,authorization_reference)values(canonical,p_expires,p_operator,p_session,p_reference)returning roadmap_processing_pilot_batches.id into id;
 insert into private.roadmap_processing_scope_audit(batch_id,actor_id,session_id,action,authorization_reference)values(id,p_operator,p_session,'batch',p_reference);return id;
end $$;
create function private.roadmap_processing_enqueue_historical(p_batch uuid,p_report uuid,p_fingerprint text,p_grant bigint,p_operator uuid,p_session uuid,p_reference text) returns jsonb language plpgsql security definer set search_path='' as $$
declare b private.roadmap_processing_pilot_batches;c jsonb;j uuid;created boolean;begin
 perform pg_advisory_xact_lock(18062026);
 perform private.roadmap_processing_scope_operator(p_operator,p_session,p_reference);
 select * into b from private.roadmap_processing_pilot_batches order by sequence desc limit 1;
 if b.id is distinct from p_batch or b.expires_at<=clock_timestamp()
 or not exists(select 1 from jsonb_array_elements(b.sources)s where s->>'report'=p_report::text and s->>'grant'=p_grant::text and s->>'fingerprint'=p_fingerprint)
 then raise exception 'Authorized pilot source unavailable' using errcode='42501';end if;
 c:=private.roadmap_processing_check_source_grant(p_report,p_grant,p_fingerprint,p_operator,p_session,p_reference);
 insert into private.roadmap_processing_jobs(draft_id,contact_id,workflow_id,fingerprint)
 values((c->>'draft')::uuid,(c->>'contact')::uuid,(c->>'workflow')::uuid,p_fingerprint)
 on conflict(draft_id,fingerprint,pipeline,generation)do nothing returning id into j;
 created:=j is not null;
 if created then
 insert into private.roadmap_processing_audit(report_id,job_id,actor_id,session_id,action)values(p_report,j,p_operator,p_session,'enqueue');
 insert into private.roadmap_processing_scope_audit(batch_id,report_id,job_id,actor_id,session_id,action,authorization_reference)values(b.id,p_report,j,p_operator,p_session,'historical_enqueue',p_reference);
 else select id into j from private.roadmap_processing_jobs where draft_id=(c->>'draft')::uuid and contact_id=(c->>'contact')::uuid and workflow_id=(c->>'workflow')::uuid and fingerprint=p_fingerprint and pipeline='roadmap-internal-processing-v1' and generation=1 and pins=private.roadmap_b6_pins();
 if j is null then raise exception 'Existing job source or version pins changed' using errcode='40001';end if;end if;
 return jsonb_build_object('queued',true,'created',created,'job',j);
end $$;
create function private.roadmap_processing_stage_seal_key(p_key uuid,p_secret text,p_expires timestamptz,p_operator uuid,p_session uuid,p_reference text) returns void language plpgsql security definer set search_path='' as $$
declare k private.roadmap_processing_seal_keys;begin
 perform pg_advisory_xact_lock(18062026);perform private.roadmap_processing_scope_operator(p_operator,p_session,p_reference);
 if exists(select 1 from private.roadmap_processing_controls where ingest or process or review or approve or internal_pdf)
 or p_key is null or p_secret is null or p_secret !~ '^[a-f0-9]{64}$' or p_expires is null or p_expires<=clock_timestamp() or p_expires>clock_timestamp()+interval '14 days' then raise exception 'Held expiring sealing configuration required' using errcode='42501';end if;
 select * into k from private.roadmap_processing_seal_keys where id=p_key for update;
 if k.id is not null then
 if not k.revoked and k.expires_at=p_expires and k.secret_hash=encode(extensions.digest(decode(p_secret,'hex'),'sha256'),'hex') then return;end if;
 raise exception 'Sealing configuration changed; rotate identity' using errcode='40001';end if;
 insert into private.roadmap_processing_seal_keys(id,secret,secret_hash,expires_at)values(p_key,decode(p_secret,'hex'),encode(extensions.digest(decode(p_secret,'hex'),'sha256'),'hex'),p_expires);
 insert into private.roadmap_processing_scope_audit(key_id,actor_id,session_id,action,authorization_reference)values(p_key,p_operator,p_session,'key_staged',p_reference);
end $$;
create function private.roadmap_processing_bind_seal_key(p_batch uuid,p_key uuid,p_expires timestamptz,p_operator uuid,p_session uuid,p_reference text) returns void language plpgsql security definer set search_path='' as $$
declare b private.roadmap_processing_pilot_batches;k private.roadmap_processing_seal_keys;begin
 perform pg_advisory_xact_lock(18062026);perform private.roadmap_processing_scope_operator(p_operator,p_session,p_reference);
 select * into b from private.roadmap_processing_pilot_batches order by sequence desc limit 1;
 select * into k from private.roadmap_processing_seal_keys where id=p_key for update;
 if b.id is distinct from p_batch or k.id is null or k.revoked or p_expires is null or p_expires<=clock_timestamp() or p_expires>b.expires_at or p_expires>k.expires_at then raise exception 'Current source batch and staged sealing identity required' using errcode='42501';end if;
 if k.active then
 if k.batch_id=p_batch and k.expires_at=p_expires then return;end if;
 raise exception 'Sealing binding changed; rotate identity' using errcode='40001';end if;
 update private.roadmap_processing_seal_keys set batch_id=p_batch,active=true,expires_at=p_expires where id=p_key;
 insert into private.roadmap_processing_scope_audit(batch_id,key_id,actor_id,session_id,action,authorization_reference)values(p_batch,p_key,p_operator,p_session,'key_bound',p_reference);
end $$;
create function private.roadmap_processing_set_seal_key(p_batch uuid,p_key uuid,p_secret text,p_expires timestamptz,p_operator uuid,p_session uuid,p_reference text) returns void language plpgsql security definer set search_path='' as $$
begin
 perform private.roadmap_processing_stage_seal_key(p_key,p_secret,p_expires,p_operator,p_session,p_reference);
 perform private.roadmap_processing_bind_seal_key(p_batch,p_key,p_expires,p_operator,p_session,p_reference);
end $$;
create function private.roadmap_processing_revoke_seal_key(p_key uuid,p_operator uuid,p_session uuid,p_reference text) returns void language plpgsql security definer set search_path='' as $$
declare k private.roadmap_processing_seal_keys;begin
 perform pg_advisory_xact_lock(18062026);perform private.roadmap_processing_scope_operator(p_operator,p_session,p_reference);
 select * into k from private.roadmap_processing_seal_keys where id=p_key for update;
 if k.id is null then raise exception 'Sealing identity unavailable' using errcode='42501';end if;
 if k.revoked then return;end if;
 update private.roadmap_processing_seal_keys set active=false,revoked=true,secret=null where id=p_key;
 update private.roadmap_processing_jobs set seal_hash=null,document_hash=null,seal_key_id=null,lease_until=clock_timestamp() where status='leased' and seal_key_id=p_key;
 insert into private.roadmap_processing_scope_audit(batch_id,key_id,actor_id,session_id,action,authorization_reference)values(k.batch_id,p_key,p_operator,p_session,'key_revoked',p_reference);
end $$;

-- Preserve existing context checks verbatim, adding only the fixed batch boundary.
create or replace function private.roadmap_processing_context(p_report uuid,p_mode text default 'read') returns jsonb language plpgsql security definer set search_path='' as $$
declare c jsonb;p private.roadmap_processing_purposes;g private.roadmap_processing_grants;issuer private.roadmap_processing_purposes;flags private.roadmap_processing_controls;a uuid;batch private.roadmap_processing_pilot_batches;begin
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
 select * into batch from private.roadmap_processing_pilot_batches order by sequence desc limit 1;
 if batch.id is null or batch.expires_at<=clock_timestamp() or not exists(select 1 from jsonb_array_elements(batch.sources)s where s->>'report'=p_report::text and s->>'fingerprint'=g.fingerprint and s->>'grant'=g.sequence::text) then raise exception 'Three-source scope held or changed' using errcode='42501';end if;
 return c||jsonb_build_object('processing_grant',g.sequence,'processing_expires_at',g.expires_at,'client_visible',false,'delivery','held','email','held');
end $$;
-- Fixed-length comparison; no secret-dependent early exit.
create function private.roadmap_processing_proof_equal(p_expected bytea,p_actual bytea) returns boolean language plpgsql immutable set search_path='' as $$
declare difference integer:=0;i integer;begin
 if p_expected is null or p_actual is null or octet_length(p_expected)<>32 or octet_length(p_actual)<>32 then return false;end if;
 for i in 0..31 loop difference:=difference | (get_byte(p_expected,i) # get_byte(p_actual,i));end loop;return difference=0;
end $$;
create function private.roadmap_processing_seal_challenge_context(p_key uuid,p_job uuid,p_lease text,p_document jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare j private.roadmap_processing_jobs;k private.roadmap_processing_seal_keys;b private.roadmap_processing_pilot_batches;c jsonb;r uuid;actor uuid;sid uuid;challenge text;begin
 actor:=private.roadmap_b42_actor();sid:=(auth.jwt()->>'session_id')::uuid;
 perform pg_advisory_xact_lock(18062026);
 if p_lease is null or p_lease !~ '^[a-f0-9]{64}$' or jsonb_typeof(p_document) is distinct from 'object' or octet_length(p_document::text)>1800000 then raise exception 'Bound worker proof required' using errcode='42501';end if;
 select * into j from private.roadmap_processing_jobs where id=p_job;
 select id into r from public.vitality_reports where contact_id=j.contact_id and workflow_id=j.workflow_id;
 if r is null or (select count(*)from public.vitality_reports where contact_id=j.contact_id and workflow_id=j.workflow_id)<>1 then raise exception 'Exact source required' using errcode='42501';end if;
 c:=private.roadmap_processing_context(r,'read');
 select * into j from private.roadmap_processing_jobs where id=p_job for update;
 select * into b from private.roadmap_processing_pilot_batches order by sequence desc limit 1;
 select * into k from private.roadmap_processing_seal_keys where id=p_key for share;
 if j.status is distinct from 'leased' or j.lease_until<=clock_timestamp() or j.lease_hash is distinct from encode(extensions.digest(p_lease,'sha256'),'hex')
 or j.actor_id is distinct from actor or j.session_id is distinct from sid or j.grant_sequence is distinct from (c->>'processing_grant')::bigint
 or j.fingerprint is distinct from c->>'source_fingerprint' or j.pins is distinct from private.roadmap_b6_pins()
 or k.active is distinct from true or k.batch_id is distinct from b.id or k.expires_at<=clock_timestamp() or k.expires_at>b.expires_at
 then raise exception 'Current founder lease and sealing identity required' using errcode='42501';end if;
 challenge:=jsonb_build_object('protocol','rva-roadmap-seal-hmac-sha256-v1','key',k.id,'batch',b.id,'job',j.id,'lease_hash',j.lease_hash,
 'document_hash',encode(extensions.digest(p_document::text,'sha256'),'hex'),'fingerprint',j.fingerprint,'grant',j.grant_sequence,
 'actor',actor,'session',sid,'key_expires_at',k.expires_at,'batch_expires_at',b.expires_at,'pins',j.pins)::text;
 return jsonb_build_object('protocol','rva-roadmap-seal-hmac-sha256-v1','challenge',challenge);
end $$;
create function public.roadmap_processing_seal_challenge(p_key uuid,p_job uuid,p_lease text,p_document jsonb) returns jsonb language sql security definer set search_path='' as $$
 select private.roadmap_processing_seal_challenge_context(p_key,p_job,p_lease,p_document);
$$;
create function public.roadmap_processing_worker_seal(p_key uuid,p_job uuid,p_lease text,p_document jsonb,p_proof text) returns text language plpgsql security definer set search_path='' as $$
declare c jsonb;secret bytea;expected bytea;seal text;j private.roadmap_processing_jobs;begin
 if p_proof is null or p_proof !~ '^[a-f0-9]{64}$' then raise exception 'Worker proof required' using errcode='42501';end if;
 c:=private.roadmap_processing_seal_challenge_context(p_key,p_job,p_lease,p_document);
 select k.secret into secret from private.roadmap_processing_seal_keys k where k.id=p_key and k.active for share;
 expected:=extensions.hmac(convert_to(c->>'challenge','UTF8'),secret,'sha256');
 if not private.roadmap_processing_proof_equal(expected,decode(p_proof,'hex')) then raise exception 'Worker proof unavailable' using errcode='42501';end if;
 -- A stable purpose-separated finish capability makes identical seal retries idempotent.
 seal:=encode(extensions.hmac(convert_to('rva-roadmap-finish-v1:'||(c->>'challenge'),'UTF8'),secret,'sha256'),'hex');
 select * into j from private.roadmap_processing_jobs where id=p_job for update;
 if j.seal_key_id=p_key and j.document_hash=encode(extensions.digest(p_document::text,'sha256'),'hex') and j.seal_hash=encode(extensions.digest(seal,'sha256'),'hex') then return seal;end if;
 -- Retain every existing document/lease/null-score safeguard and its first-seal audit.
 perform public.roadmap_processing_seal(p_job,p_lease,p_document);
 update private.roadmap_processing_jobs set seal_key_id=p_key,seal_hash=encode(extensions.digest(seal,'sha256'),'hex') where id=p_job;
 return seal;
end $$;
-- Preserve the existing RPC, adding serialization and a live sealing-key check before first finish.
create or replace function public.roadmap_processing(p_action text,p_report uuid,p_payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare a uuid:=private.roadmap_b42_actor();sid uuid:=(auth.jwt()->>'session_id')::uuid;c jsonb;j private.roadmap_processing_jobs;v private.roadmap_processing_versions;r private.roadmap_processing_reviews;lease text;n integer;out jsonb;prior_purpose private.roadmap_processing_purposes;proposal_data jsonb;req uuid;hash text;begin
 perform pg_advisory_xact_lock(18062026);
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
 if not exists(select 1 from private.roadmap_processing_seal_keys k join private.roadmap_processing_pilot_batches batch on batch.id=k.batch_id where k.id=j.seal_key_id and k.active and k.expires_at>clock_timestamp() and batch.expires_at>clock_timestamp() and batch.sequence=(select max(sequence)from private.roadmap_processing_pilot_batches)) then raise exception 'Worker sealing identity expired or revoked' using errcode='42501';end if;
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

-- Atomic operator-only activation. No source read, score or draft occurs here.
create function private.roadmap_processing_activate_batch(p_batch uuid,p_key uuid,p_operator uuid,p_session uuid,p_reference text) returns jsonb language plpgsql security definer set search_path='' as $$
declare b private.roadmap_processing_pilot_batches;entry jsonb;flags private.roadmap_processing_controls;begin
 perform pg_advisory_xact_lock(18062026);perform private.roadmap_processing_scope_operator(p_operator,p_session,p_reference);
 select * into flags from private.roadmap_processing_controls where singleton for update;
 select * into b from private.roadmap_processing_pilot_batches order by sequence desc limit 1;
 if b.id is distinct from p_batch or b.expires_at<=clock_timestamp() or flags.ingest or flags.approve or flags.internal_pdf or flags.process is distinct from flags.review then raise exception 'Exact held three-source activation required' using errcode='42501';end if;
 if flags.process and not exists(select 1 from private.roadmap_processing_scope_audit where batch_id=p_batch and key_id=p_key and action='activation' and actor_id=p_operator and session_id=p_session and authorization_reference=p_reference) then raise exception 'Changed activation authorization' using errcode='42501';end if;
 if exists(select 1 from (select distinct on(report_id)*from private.roadmap_processing_grants order by report_id,sequence desc)g where g.active and g.expires_at>clock_timestamp() and not exists(select 1 from jsonb_array_elements(b.sources)s where s->>'report'=g.report_id::text and s->>'grant'=g.sequence::text)) then raise exception 'Unrelated processing authority present' using errcode='42501';end if;
 if exists(select 1 from private.roadmap_processing_jobs j where j.status<>'complete' and not exists(select 1 from public.vitality_reports r,jsonb_array_elements(b.sources)s where r.id=(s->>'report')::uuid and r.contact_id=j.contact_id and r.workflow_id=j.workflow_id and j.fingerprint=s->>'fingerprint')) then raise exception 'Unrelated pending work present' using errcode='42501';end if;
 perform private.roadmap_processing_bind_seal_key(p_batch,p_key,b.expires_at,p_operator,p_session,p_reference);
 for entry in select value from jsonb_array_elements(b.sources) loop
 perform private.roadmap_processing_enqueue_historical(p_batch,(entry->>'report')::uuid,entry->>'fingerprint',(entry->>'grant')::bigint,p_operator,p_session,p_reference);
 end loop;
 if not flags.process then
 update private.roadmap_processing_controls set process=true,review=true where singleton;
 insert into private.roadmap_processing_scope_audit(batch_id,key_id,actor_id,session_id,action,authorization_reference)values(p_batch,p_key,p_operator,p_session,'activation',p_reference);
 end if;
 return jsonb_build_object('active',true,'sources',3,'ingest',false,'approve',false,'internal_pdf',false,'expires_at',b.expires_at);
end $$;
create function private.roadmap_processing_stop_batch(p_batch uuid,p_operator uuid,p_session uuid,p_reference text) returns void language plpgsql security definer set search_path='' as $$
declare b private.roadmap_processing_pilot_batches;s jsonb;k record;g private.roadmap_processing_grants;begin
 perform pg_advisory_xact_lock(18062026);perform private.roadmap_processing_scope_operator(p_operator,p_session,p_reference);
 select * into b from private.roadmap_processing_pilot_batches order by sequence desc limit 1;
 if b.id is distinct from p_batch then raise exception 'Exact current batch required' using errcode='42501';end if;
 update private.roadmap_processing_controls set ingest=false,process=false,review=false,approve=false,internal_pdf=false where singleton;
 for k in select id from private.roadmap_processing_seal_keys where batch_id=p_batch and not revoked loop
 perform private.roadmap_processing_revoke_seal_key(k.id,p_operator,p_session,p_reference);
 end loop;
 for s in select value from jsonb_array_elements(b.sources) loop
 select * into g from private.roadmap_processing_grants where report_id=(s->>'report')::uuid order by sequence desc limit 1;
 if g.active then perform private.roadmap_processing_revoke(g.report_id,p_operator,p_session,p_reference);end if;
 end loop;
 if not exists(select 1 from private.roadmap_processing_scope_audit where batch_id=p_batch and action='deactivation') then
 insert into private.roadmap_processing_scope_audit(batch_id,actor_id,session_id,action,authorization_reference)values(p_batch,p_operator,p_session,'deactivation',p_reference);
 end if;
end $$;

revoke all on function private.roadmap_processing_scope_operator(uuid,uuid,text),private.roadmap_processing_check_source_grant(uuid,bigint,text,uuid,uuid,text),private.roadmap_processing_authorize_batch(jsonb,timestamptz,uuid,uuid,text),private.roadmap_processing_enqueue_historical(uuid,uuid,text,bigint,uuid,uuid,text),private.roadmap_processing_set_seal_key(uuid,uuid,text,timestamptz,uuid,uuid,text),private.roadmap_processing_stage_seal_key(uuid,text,timestamptz,uuid,uuid,text),private.roadmap_processing_bind_seal_key(uuid,uuid,timestamptz,uuid,uuid,text),private.roadmap_processing_activate_batch(uuid,uuid,uuid,uuid,text),private.roadmap_processing_stop_batch(uuid,uuid,uuid,text),private.roadmap_processing_revoke_seal_key(uuid,uuid,uuid,text),private.roadmap_processing_proof_equal(bytea,bytea),private.roadmap_processing_seal_challenge_context(uuid,uuid,text,jsonb),public.roadmap_processing_seal_challenge(uuid,uuid,text,jsonb),public.roadmap_processing_worker_seal(uuid,uuid,text,jsonb,text) from public,anon,authenticated,service_role;
grant execute on function public.roadmap_processing_seal_challenge(uuid,uuid,text,jsonb),public.roadmap_processing_worker_seal(uuid,uuid,text,jsonb,text) to authenticated;
-- The narrower protocol has no broad-credential fallback.
revoke execute on function public.roadmap_processing_seal(uuid,text,jsonb) from service_role;
commit;
