-- LOCAL ONLY. Exact Alex-only proposal. Installs no grants, keys, jobs or reports.
begin;
do $$begin
if(select encode(extensions.digest(pg_get_functiondef(p.oid),'sha256'),'hex')from pg_proc p where p.oid='private.roadmap_processing_context(uuid, text)'::regprocedure)is distinct from 'aa892bd4bb27e9a591d8c3660743bf16497d72afbff5b6cf0e35705ec2d9eed8'then raise exception 'Reviewed dependency changed: private.roadmap_processing_context';end if;
if(select encode(extensions.digest(pg_get_functiondef(p.oid),'sha256'),'hex')from pg_proc p where p.oid='private.roadmap_processing_seal_challenge_context(uuid, uuid, text, jsonb)'::regprocedure)is distinct from 'fec3a5576dba3f85f80ecc0d7c99a52b2169293ee1ff5176b83c7556755c8704'then raise exception 'Reviewed dependency changed: private.roadmap_processing_seal_challenge_context';end if;
if(select encode(extensions.digest(pg_get_functiondef(p.oid),'sha256'),'hex')from pg_proc p where p.oid='public.roadmap_b6(text, uuid, jsonb)'::regprocedure)is distinct from '0109232b78ed1a40c1902d8a2335603f97d2e6fb25b87de033453d1611ca1b66'then raise exception 'Reviewed dependency changed: public.roadmap_b6';end if;
if(select encode(extensions.digest(pg_get_functiondef(p.oid),'sha256'),'hex')from pg_proc p where p.oid='public.roadmap_processing(text, uuid, jsonb)'::regprocedure)is distinct from '3029f310d80dfca3dfe6330813363eb372e6942dd9b978a11527136aba627e73'then raise exception 'Reviewed dependency changed: public.roadmap_processing';end if;
if(select encode(extensions.digest(pg_get_functiondef(p.oid),'sha256'),'hex')from pg_proc p where p.oid='public.roadmap_processing_worker_seal(uuid, uuid, text, jsonb, text)'::regprocedure)is distinct from 'b7ab046b667f3892b2d5589114d7fbdea0d1d3380b498e9580584e39ab8b0212'then raise exception 'Reviewed dependency changed: public.roadmap_processing_worker_seal';end if;
if(select encode(extensions.digest(pg_get_functiondef(p.oid),'sha256'),'hex')from pg_proc p where p.oid='public.roadmap_saved_review(text, uuid, jsonb)'::regprocedure)is distinct from 'faa173a4644ac6f5dd966a0cfa691dfda405ba8c29574f902a1b70ecdba022a3'then raise exception 'Reviewed dependency changed: public.roadmap_saved_review';end if;
if to_regclass('private.roadmap_alex_contract')is not null then raise exception 'Alex contract already installed; inspect ledger, never replay';end if;
end $$;
create function private.roadmap_alex_anchor_rows()returns table(pin jsonb)language sql stable security definer set search_path='' as $anchor$
select jsonb_build_object('report',r.id,'contact',r.contact_id,'workflow',r.workflow_id,'draft',d.id,'job',j.id,'fingerprint',j.fingerprint,'verification',v.id,'metadata_fingerprint',v.metadata_fingerprint,'sop',v.sop_id,'sop_version',s.sop_version,'founder',p.actor_id,'cohort',co.sequence,'b5',b5.sequence,'b6',b6.sequence,'purpose',p.sequence,'storage',st.sequence,'prior_processing_grant',g.sequence,'key',k.id,'pins',private.roadmap_b6_pins()) pin
from public.vitality_reports r join public.contacts c on c.id=r.contact_id
join private.vitality_assessment_drafts d on d.contact_id=r.contact_id and d.workflow_id=r.workflow_id
join private.roadmap_processing_jobs j on j.draft_id=d.id and j.generation=1 and j.fingerprint=(select source_fingerprint from private.roadmap_b5_pilot_events where report_id=r.id order by sequence desc limit 1)
join lateral(select *from private.roadmap_b4_cohort_events where report_id=r.id order by sequence desc limit 1)co on true
join lateral(select *from private.roadmap_b5_pilot_events where report_id=r.id order by sequence desc limit 1)b5 on true
join private.roadmap_b42_verifications v on v.id=b5.verification_id join private.roadmap_b42_sop_attestations s on s.id=v.sop_id
join lateral(select *from private.roadmap_b6_grant_events where report_id=r.id order by sequence desc limit 1)b6 on true
join lateral(select p.*from private.roadmap_b6_purpose_events p join private.roadmap_b42_founders f on f.user_id=p.actor_id where p.report_id=r.id and f.verified_email='justyn@revitalizedacademy.com'order by p.sequence desc limit 1)p on true
join lateral(select *from private.roadmap_processing_purposes where report_id=r.id and actor_id=p.actor_id order by sequence desc limit 1)st on true
join lateral(select *from private.roadmap_processing_grants where report_id=r.id order by sequence limit 1)g on true
join private.roadmap_processing_seal_keys k on k.active and not k.revoked
join private.roadmap_processing_pilot_batches b on b.id=k.batch_id and exists(select 1 from jsonb_array_elements(b.sources)x where x->>'report'=r.id::text and x->>'fingerprint'=j.fingerprint)
where lower(trim(c.first_name))='alex'and lower(trim(c.last_name))='walker'

$anchor$;
do $$begin if(select encode(extensions.digest(jsonb_agg(pin)::text,'sha256'),'hex')from private.roadmap_alex_anchor_rows())is distinct from 'ee8658a41bf228190c6ebc7f8734fc9976730d4067507b93b859645aebcb8665'then raise exception 'Exact reviewed Alex identity/source/job/consent anchor required';end if;end $$;
-- LOCAL PROPOSAL: no grant is inserted by installation.
create table private.roadmap_alex_contract(singleton boolean primary key default true check(singleton), pin jsonb not null,
 starts_at timestamptz not null,expires_at timestamptz not null, narrative_hash text not null,
 check(expires_at=starts_at+interval '72 hours'));
create table private.roadmap_alex_windows(id uuid primary key default gen_random_uuid(),singleton boolean unique not null default true check(singleton),
 grant_sequence bigint unique not null references private.roadmap_processing_grants(sequence),founder_session uuid not null,
 operator_id uuid not null references auth.users(id),operator_session uuid not null,request_key uuid unique not null,
 authorization_reference text not null,created_at timestamptz not null default clock_timestamp());
create table private.roadmap_alex_session_checks(id bigint generated always as identity primary key,actor_id uuid not null references auth.users(id),session_id uuid not null,
 created_at timestamptz not null default clock_timestamp());
create table private.roadmap_alex_audit(id bigint generated always as identity primary key,window_id uuid references private.roadmap_alex_windows(id),
 actor_id uuid not null references auth.users(id),session_id uuid not null,action text not null check(action in('issue','revoke')),reference text not null,created_at timestamptz not null default clock_timestamp());
do $$declare t text;begin foreach t in array array['contract','windows','session_checks','audit']loop
 execute format('alter table private.roadmap_alex_%I enable row level security',t);
 execute format('revoke all on private.roadmap_alex_%I from public,anon,authenticated,service_role',t);
 execute format('create trigger %I before update or delete on private.roadmap_alex_%I for each row execute function private.roadmap_b4_immutable()','roadmap_alex_'||t||'_immutable',t);
 execute format('create trigger %I before truncate on private.roadmap_alex_%I for each statement execute function private.roadmap_b4_immutable()','roadmap_alex_'||t||'_truncate',t);
 end loop;end $$;
revoke all on sequence private.roadmap_alex_session_checks_id_seq,private.roadmap_alex_audit_id_seq from public,anon,authenticated,service_role;

create function private.roadmap_alex_basis()returns jsonb language plpgsql security definer set search_path='' as $$
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
 or(select count(*)from private.roadmap_processing_jobs where draft_id=j.draft_id)<>1
 or(select count(*)from private.roadmap_processing_versions where report_id=(p->>'report')::uuid)>1
 or exists(select 1 from private.roadmap_processing_versions where report_id=(p->>'report')::uuid and(job_id<>j.id or revision<>1 or fingerprint<>j.fingerprint or document_hash<>encode(extensions.digest(document::text,'sha256'),'hex')))
 or not exists(select 1 from private.roadmap_processing_seal_keys where id=(p->>'key')::uuid and active and not revoked and secret is not null and octet_length(secret)=32)
 then raise exception 'Current source, consent, SOP or custody basis unavailable'using errcode='42501';end if;
 m:=private.roadmap_b42_descriptor((p->>'contact')::uuid,(p->>'report')::uuid);
 if m->>'eligible' is distinct from 'true'or m->>'_source' is distinct from p->>'fingerprint'or m->>'_fingerprint' is distinct from p->>'metadata_fingerprint'or m->>'_workflow' is distinct from p->>'workflow'
 then raise exception 'Current eligible immutable source required'using errcode='42501';end if;
 -- Historical deadlines are NOT treated as live. Only the new contract/window may authorize below.
 return p;
end $$;
create function private.roadmap_alex_confirm()returns jsonb language plpgsql security definer set search_path='' as $$
declare p jsonb;a uuid;sid uuid;begin
 a:=private.roadmap_b42_actor();sid:=(auth.jwt()->>'session_id')::uuid;p:=private.roadmap_alex_basis();
 if a is distinct from(p->>'founder')::uuid then raise exception 'Exact founder required'using errcode='42501';end if;
 perform private.roadmap_b6_live_session(a,sid);
 if not exists(select 1 from private.roadmap_alex_session_checks where actor_id=a and session_id=sid and created_at>clock_timestamp()-interval '1 minute')then
 insert into private.roadmap_alex_session_checks(actor_id,session_id)values(a,sid);end if;
 return p;
end $$;
create function private.roadmap_alex_issue(p_founder_session uuid,p_operator uuid,p_session uuid,p_request uuid,p_reference text,p_sop_confirmation text,p_custody_confirmation text)returns uuid language plpgsql security definer set search_path='' as $$
declare p jsonb;c private.roadmap_alex_contract;w private.roadmap_alex_windows;g bigint;begin
 perform pg_advisory_xact_lock(18062026);perform private.roadmap_processing_scope_operator(p_operator,p_session,p_reference);
 if not exists(select 1 from public.staff_access where user_id=p_operator and role='owner')or p_request is null
 or p_reference is null or length(trim(p_reference))not between 10 and 1000
 or p_sop_confirmation is distinct from 'ALEX_ONLY_72H_SAME_PURPOSE_SOP'
 or p_custody_confirmation is distinct from 'NEW_ALEX_ONLY_SEAL_AUTHORITY_EXISTING_CUSTODIED_KEY'
 then raise exception 'Explicit independent Owner SOP and sealing approval required'using errcode='42501';end if;
 p:=private.roadmap_alex_basis();select *into c from private.roadmap_alex_contract where singleton;
 select *into w from private.roadmap_alex_windows;
 if w.id is not null then
 if w.request_key=p_request and w.founder_session=p_founder_session and w.operator_id=p_operator and w.operator_session=p_session and w.authorization_reference=p_reference
 and not exists(select 1 from private.roadmap_alex_audit where window_id=w.id and action='revoke')then return w.id;end if;
 raise exception 'Only one exact issuance; no second window or changed retry'using errcode='42501';end if;
 if clock_timestamp()>=c.starts_at then raise exception 'Proposed activation time missed; no backdating or automatic extension'using errcode='42501';end if;
 if not exists(select 1 from private.roadmap_alex_session_checks where actor_id=(p->>'founder')::uuid and session_id=p_founder_session and created_at>clock_timestamp()-interval '15 minutes')then raise exception 'Personal authenticated founder confirmation required'using errcode='42501';end if;
 perform private.roadmap_b6_live_session((p->>'founder')::uuid,p_founder_session);
 if not exists(select 1 from private.roadmap_processing_controls where singleton and process and review and not ingest and not approve and not internal_pdf)
 or exists(select 1 from private.roadmap_processing_pilot_batches where expires_at>clock_timestamp())
 or exists(select 1 from(select distinct on(report_id)*from private.roadmap_processing_grants order by report_id,sequence desc)g where active and expires_at>clock_timestamp())
 or exists(select 1 from private.roadmap_processing_versions where report_id=(p->>'report')::uuid)
 or not exists(select 1 from private.roadmap_processing_jobs where id=(p->>'job')::uuid and status='pending'and attempts=0)
 then raise exception 'Held original authorities and one untouched initial job required'using errcode='42501';end if;
 insert into private.roadmap_processing_grants(purpose,report_id,fingerprint,b6_grant,active,expires_at,allow_review,allow_approval,allow_pdf,operator_id,operator_session,authorization_reference)
 values((p->>'storage')::bigint,(p->>'report')::uuid,p->>'fingerprint',(p->>'b6')::bigint,true,c.expires_at,true,false,false,p_operator,p_session,p_reference)returning sequence into g;
 insert into private.roadmap_alex_windows(grant_sequence,founder_session,operator_id,operator_session,request_key,authorization_reference)values(g,p_founder_session,p_operator,p_session,p_request,p_reference)returning *into w;
 insert into private.roadmap_alex_audit(window_id,actor_id,session_id,action,reference)values(w.id,p_operator,p_session,'issue',p_reference);
 perform private.roadmap_processing_scope_operator(p_operator,p_session,p_reference);perform private.roadmap_b6_live_session((p->>'founder')::uuid,p_founder_session);
 return w.id;
end $$;
create function private.roadmap_alex_revoke(p_operator uuid,p_session uuid,p_reference text)returns void language plpgsql security definer set search_path='' as $$
declare w private.roadmap_alex_windows;begin
 perform pg_advisory_xact_lock(18062026);perform private.roadmap_processing_scope_operator(p_operator,p_session,p_reference);select *into w from private.roadmap_alex_windows;
 if w.id is null then raise exception 'No Alex authority'using errcode='42501';end if;
 if not exists(select 1 from private.roadmap_alex_audit where window_id=w.id and action='revoke')then insert into private.roadmap_alex_audit(window_id,actor_id,session_id,action,reference)values(w.id,p_operator,p_session,'revoke',p_reference);end if;
end $$;
create function private.roadmap_alex_context(p_mode text)returns jsonb language plpgsql security definer set search_path='' as $$
declare p jsonb;a uuid;sid uuid;c private.roadmap_alex_contract;w private.roadmap_alex_windows;g private.roadmap_processing_grants;ctx jsonb;begin
 a:=private.roadmap_b42_actor();sid:=(auth.jwt()->>'session_id')::uuid;p:=private.roadmap_alex_basis();select *into c from private.roadmap_alex_contract where singleton;select *into w from private.roadmap_alex_windows;
 if a is distinct from(p->>'founder')::uuid or p_mode is null or p_mode not in('read','review')or w.id is null or clock_timestamp()<c.starts_at or clock_timestamp()>=c.expires_at
 or exists(select 1 from private.roadmap_alex_audit where window_id=w.id and action='revoke')
 or not exists(select 1 from private.roadmap_processing_controls where singleton and process and review and not ingest and not approve and not internal_pdf)
 then raise exception 'New Alex-only window not active'using errcode='42501';end if;
 perform private.roadmap_b6_live_session(a,sid);
 select *into g from private.roadmap_processing_grants where report_id=(p->>'report')::uuid order by sequence desc limit 1;
 if g.sequence is distinct from w.grant_sequence or g.active is distinct from true or g.fingerprint is distinct from p->>'fingerprint'or g.purpose is distinct from(p->>'storage')::bigint
 or g.expires_at is distinct from c.expires_at or not g.allow_review or g.allow_approval or g.allow_pdf
 or not exists(select 1 from public.staff_access where user_id=w.operator_id and role='owner'and status='active'and onboarding_status='complete'and contact_scope='all')
 or not private.staff_has_permission(w.operator_id,'staff.manage')
 then raise exception 'Source operating grant changed or revoked'using errcode='42501';end if;
 ctx:=private.roadmap_b4_context((p->>'report')::uuid,false);
 if ctx->>'source_fingerprint' is distinct from p->>'fingerprint'then raise exception 'Source changed'using errcode='42501';end if;
 return ctx||jsonb_build_object('grant_sequence',(p->>'b6')::bigint,'purpose_sequence',(p->>'purpose')::bigint,'processing_grant',g.sequence,'operating_authority',w.id,
 'processing_expires_at',c.expires_at,'expires_at',c.expires_at,'can_feedback',true,'can_edit',false,'pins',private.roadmap_b6_pins(),'identity',private.roadmap_b42_public_metadata(private.roadmap_b42_descriptor((p->>'contact')::uuid,(p->>'report')::uuid)),'client_visible',false,'delivery','held','email','held');
end $$;
create function private.roadmap_alex_finish_binding(p_job uuid,p_key uuid)returns boolean language plpgsql security definer set search_path='' as $$
declare p jsonb;c jsonb;begin
 select pin into p from private.roadmap_alex_contract where singleton;if p_job is distinct from(p->>'job')::uuid or p_key is distinct from(p->>'key')::uuid then return false;end if;
 c:=private.roadmap_alex_context('read');return c->>'operating_authority'is not null;
end $$;
insert into private.roadmap_alex_contract(singleton,pin,starts_at,expires_at,narrative_hash)select true,pin,'2026-10-27T19:00:00Z','2026-10-30T19:00:00Z','996554e27739dd90effda72adcec60493d640f086b15c07c0ca2c29fe08e440b'from private.roadmap_alex_anchor_rows();
CREATE OR REPLACE FUNCTION private.roadmap_alex_prior_context(p_report uuid, p_mode text DEFAULT 'read'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
end $function$
;
CREATE OR REPLACE FUNCTION private.roadmap_alex_prior_challenge(p_key uuid, p_job uuid, p_lease text, p_document jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
end $function$
;
CREATE OR REPLACE FUNCTION private.roadmap_alex_prior_processing(p_action text, p_report uuid, p_payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
 if not (private.roadmap_alex_finish_binding(j.id,j.seal_key_id)or exists(select 1 from private.roadmap_processing_seal_keys k join private.roadmap_processing_pilot_batches batch on batch.id=k.batch_id where k.id=j.seal_key_id and k.active and k.expires_at>clock_timestamp() and batch.expires_at>clock_timestamp() and batch.sequence=(select max(sequence)from private.roadmap_processing_pilot_batches))) then raise exception 'Worker sealing identity expired or revoked' using errcode='42501';end if;
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
end $function$
;
CREATE OR REPLACE FUNCTION private.roadmap_alex_prior_b6(p_action text, p_report uuid DEFAULT NULL::uuid, p_payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare actor uuid:=private.roadmap_b42_actor();sid uuid:=(auth.jwt()->>'session_id')::uuid;c jsonb;p jsonb;g private.roadmap_b6_grant_events;entry record;available jsonb:='[]';seq bigint;current_revision integer;old private.roadmap_b6_feedback;key uuid;pin text;ref jsonb;ack jsonb;ready boolean;identity_meta jsonb;purpose_acknowledged boolean;existing_purpose private.roadmap_b6_purpose_events;purpose_retry boolean:=false;
begin
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>20000 then raise exception 'Invalid request' using errcode='22023'; end if;
 if p_action='authorize' and p_report is null and p_payload='{}'::jsonb then return jsonb_build_object('authorized',true,'pins',private.roadmap_b6_pins(),'cohort','operator_only','drafts','held','release','held'); end if;
 if p_action='list' and p_report is null and p_payload='{}'::jsonb then
 for entry in select e.* from (select distinct on(report_id) * from private.roadmap_b5_pilot_events order by report_id,sequence desc)e where e.active and e.expires_at>clock_timestamp() loop
 begin
 c:=private.roadmap_b6_basis(entry.report_id);ready:=false;begin perform private.roadmap_b6_context(entry.report_id,false);ready:=true;exception when sqlstate '42501' or sqlstate '40001' or sqlstate '55000' then null;end;select * into g from private.roadmap_b6_grant_events where report_id=entry.report_id order by sequence desc limit 1;
 identity_meta:=private.roadmap_b42_public_metadata(private.roadmap_b42_descriptor((select contact_id from public.vitality_reports where id=entry.report_id),entry.report_id));
 purpose_acknowledged:=false;begin purpose_acknowledged:=private.roadmap_b6_confirm_session(entry.report_id);exception when sqlstate '42501' or sqlstate '40001' or sqlstate '55000' then null;end;
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
 if existing_purpose.sequence is not null and existing_purpose.source_fingerprint=c->>'source_fingerprint'
 and existing_purpose.pilot_sequence=(c->>'pilot_sequence')::bigint and existing_purpose.active=(p_payload->>'active')::boolean
 and existing_purpose.acknowledgments=ack and existing_purpose.pins=private.roadmap_b6_pins() then
 purpose_retry:=true;seq:=existing_purpose.sequence;
 else
 insert into private.roadmap_b6_purpose_events(report_id,actor_id,session_id,source_fingerprint,pilot_sequence,active,acknowledgments,pins)values(p_report,actor,sid,c->>'source_fingerprint',(c->>'pilot_sequence')::bigint,(p_payload->>'active')::boolean,ack,private.roadmap_b6_pins())returning sequence into seq;
 end if;
 if (p_payload->>'active')::boolean then perform private.roadmap_b6_confirm_session(p_report);end if;
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
end $function$
;
CREATE OR REPLACE FUNCTION private.roadmap_alex_prior_saved_review(p_action text, p_report uuid DEFAULT NULL::uuid, p_payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE sql
 SET search_path TO ''
AS $function$
 select private.roadmap_saved_review_api(p_action,p_report,p_payload);
$function$
;
-- In addition to private server verification, reject an inferior document before seal or finish.
create function private.roadmap_alex_document_gate(d jsonb)returns void language plpgsql security definer set search_path=''as $$
declare p jsonb;c private.roadmap_alex_contract;begin
 select *into c from private.roadmap_alex_contract where singleton;p:=c.pin;
 if d->'narrative'->'generationGate'is distinct from jsonb_build_object('engine','roadmap-founder-methodology-v2-20261027','narrativeVersion','founder-direction-narrative-20261027-v2-local','rulesetHash',c.narrative_hash,'loadedDirections',45,'coveredDrivers',12)
 or d->'roadmap'->'founderComparison'->>'sourceFingerprint'is distinct from p->>'fingerprint'
 or d->'roadmap'->'founderComparison'->>'rulesetHash'is distinct from c.narrative_hash
 or d->'roadmap'->'founderComparison'->'founderOnly'is distinct from 'true'::jsonb
 or jsonb_typeof(d->'roadmap'->'founderComparison'->'rows')is distinct from 'array'
 or jsonb_array_length(d->'roadmap'->'founderComparison'->'rows')is distinct from 12
 then raise exception 'Complete pinned founder V2 attestation and comparison required'using errcode='42501';end if;
end $$;
create or replace function private.roadmap_processing_context(p_report uuid,p_mode text default 'read')returns jsonb language plpgsql security definer set search_path=''as $$
begin if exists(select 1 from private.roadmap_alex_contract where pin->>'report'=p_report::text)then return private.roadmap_alex_context(p_mode);end if;return private.roadmap_alex_prior_context(p_report,p_mode);end $$;
create or replace function public.roadmap_processing(p_action text,p_report uuid,p_payload jsonb default '{}')returns jsonb language plpgsql security definer set search_path=''as $$
declare p jsonb;begin
 perform pg_advisory_xact_lock(18062026);
 if exists(select 1 from private.roadmap_alex_contract where pin->>'report'=p_report::text)then
 if p_action is null or p_action not in('read','claim','finish','review')then raise exception 'Only initial generation, read and cited feedback authorized'using errcode='42501';end if;
 perform private.roadmap_alex_context(case when p_action='review'then'review'else'read'end);
 if p_action='finish'then perform private.roadmap_alex_document_gate(p_payload->'document');end if;
 -- At least one affirmative source citation; no empty feedback is silently accepted.
 if p_action='review'and(jsonb_typeof(p_payload->'proposal'->'citations')is distinct from 'array'or jsonb_array_length(p_payload->'proposal'->'citations')not between 1 and 20)then raise exception 'Source-cited proposal required'using errcode='22023';end if;
 end if;
 return private.roadmap_alex_prior_processing(p_action,p_report,p_payload);
end $$;
create or replace function public.roadmap_b6(p_action text,p_report uuid default null,p_payload jsonb default '{}')returns jsonb language plpgsql security definer set search_path=''as $$
declare p jsonb;c jsonb;rows jsonb;ready boolean:=false;begin
 perform pg_advisory_xact_lock(18062026);
 if p_action='list'and p_report is null and p_payload='{}'::jsonb then
 rows:=private.roadmap_alex_prior_b6(p_action,p_report,p_payload);
 begin p:=private.roadmap_alex_confirm();begin c:=private.roadmap_alex_context('read');ready:=true;exception when sqlstate '42501'then null;end;
 rows:=(select coalesce(jsonb_agg(x),'[]')from jsonb_array_elements(rows)x where x->>'report_id'<>p->>'report');
 return rows||jsonb_build_array(jsonb_build_object('report_id',p->'report','label','Individually authorized source','identity',private.roadmap_b42_public_metadata(private.roadmap_b42_descriptor((p->>'contact')::uuid,(p->>'report')::uuid)),'ready',ready,'operator_grant',ready,'purpose_acknowledged',true,'session_confirmed',true,'can_feedback',ready));
 exception when sqlstate '42501'or sqlstate '40001'or sqlstate '55000'then return rows;end;
 end if;
 if exists(select 1 from private.roadmap_alex_contract where pin->>'report'=p_report::text)then
 if p_action is null or p_action not in('check','read')or p_payload is distinct from '{}'::jsonb then raise exception 'Retained consent; no new manual scoring or purpose writes authorized'using errcode='42501';end if;
 c:=private.roadmap_alex_context('read');if p_action='check'then return jsonb_build_object('authorized',true,'grant_sequence',c->'grant_sequence','purpose_sequence',c->'purpose_sequence','can_feedback',c->'can_feedback','expires_at',c->'expires_at','pins',c->'pins');end if;
 return c||jsonb_build_object('revision',0,'actual_score',null,'actual_stage',null);
 end if;return private.roadmap_alex_prior_b6(p_action,p_report,p_payload);
end $$;
create or replace function private.roadmap_processing_seal_challenge_context(p_key uuid,p_job uuid,p_lease text,p_document jsonb)returns jsonb language plpgsql security definer set search_path=''as $$
declare p jsonb;ctx jsonb;c private.roadmap_alex_contract;j private.roadmap_processing_jobs;w private.roadmap_alex_windows;actor uuid;sid uuid;challenge text;begin
 select *into c from private.roadmap_alex_contract where singleton;p:=c.pin;
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
end $$;

create or replace function public.roadmap_saved_review(p_action text,p_report uuid default null,p_payload jsonb default '{}')returns jsonb language plpgsql security definer set search_path=''as $$
declare p jsonb;c jsonb;rows jsonb;v private.roadmap_processing_versions;begin
 perform pg_advisory_xact_lock(18062026);
 if p_action='list'and p_report is null and p_payload='{}'::jsonb then
 rows:=private.roadmap_alex_prior_saved_review(p_action,p_report,p_payload);
 begin c:=private.roadmap_alex_context('read');select pin into p from private.roadmap_alex_contract where singleton;
 select *into v from private.roadmap_processing_versions where job_id=(p->>'job')::uuid and revision=1;
 if v.id is not null then rows:=rows||jsonb_build_array(jsonb_build_object('report_id',v.report_id,'label',(c->'identity'->>'name')||' · saved Revision 1','revision',1,'review_only',true,'expires_at',c->'expires_at'));end if;
 exception when sqlstate '42501'or sqlstate '40001'or sqlstate '55000'then null;end;return rows;
 end if;
 if exists(select 1 from private.roadmap_alex_contract where pin->>'report'=p_report::text)then
 if p_action is null or p_action not in('read','review')then raise exception 'Saved Alex read and feedback only'using errcode='42501';end if;
 c:=private.roadmap_alex_context(case when p_action='review'then'review'else'read'end);select pin into p from private.roadmap_alex_contract where singleton;
 select *into v from private.roadmap_processing_versions where job_id=(p->>'job')::uuid and revision=1;
 if v.id is null then raise exception 'No saved initial Alex report; reading never generates'using errcode='42501';end if;
 return public.roadmap_processing(p_action,p_report,p_payload)||jsonb_build_object('review_only',true);
 end if;return private.roadmap_alex_prior_saved_review(p_action,p_report,p_payload);
end $$;
-- Source/session/window-bound proof of the worker's existing private key custody.
-- Both phases are read-only: no lease, job, document, consent or grant mutation.
create function public.roadmap_alex_key_preflight(p_key uuid,p_report uuid,p_nonce text,p_proof text default null)returns jsonb language plpgsql security definer set search_path=''as $$
declare p jsonb;c jsonb;challenge text;secret bytea;expected bytea;begin
 c:=private.roadmap_alex_context('read');select pin into p from private.roadmap_alex_contract where singleton;
 if p_report is distinct from(p->>'report')::uuid or p_key is distinct from(p->>'key')::uuid or p_nonce is null or p_nonce!~'^[a-f0-9]{64}$'then raise exception 'Exact key, source and nonce required'using errcode='42501';end if;
 challenge:=jsonb_build_object('protocol','rva-alex-key-possession-v1','authority',c->'operating_authority','report',p_report,'job',p->'job','fingerprint',p->'fingerprint','key',p_key,'actor',auth.uid(),'session',auth.jwt()->>'session_id','expires_at',c->'processing_expires_at','nonce',p_nonce)::text;
 if p_proof is null then return jsonb_build_object('protocol','rva-alex-key-possession-v1','challenge',challenge);end if;
 if p_proof!~'^[a-f0-9]{64}$'then raise exception 'Worker possession proof required'using errcode='42501';end if;
 select k.secret into secret from private.roadmap_processing_seal_keys k where k.id=p_key and k.active and not k.revoked for share;
 expected:=extensions.hmac(convert_to(challenge,'UTF8'),secret,'sha256');
 if not private.roadmap_processing_proof_equal(expected,decode(p_proof,'hex'))then raise exception 'Worker custody not verified; no claim authorized'using errcode='42501';end if;
 return '{"ready":true,"processing":false}'::jsonb;
end $$;
revoke all on function public.roadmap_alex_key_preflight(uuid,uuid,text,text)from public,anon,service_role;
grant execute on function public.roadmap_alex_key_preflight(uuid,uuid,text,text)to authenticated;
do $$declare r record;begin for r in select p.oid::regprocedure as identity from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private'and p.proname like 'roadmap_alex_%'loop execute format('revoke all on function %s from public,anon,authenticated,service_role',r.identity);end loop;end $$;
do $$begin if(select count(*)from private.roadmap_alex_contract)<>1 or exists(select 1 from private.roadmap_alex_windows)or exists(select 1 from private.roadmap_alex_audit)then raise exception 'Empty inactive authority installation required';end if;end $$;
commit;
