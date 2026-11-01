-- LOCAL REVIEW CANDIDATE. Installs EMPTY authority; no grant, processing or date edit.
begin;
select pg_advisory_xact_lock(18062026);
do $guard$begin
 if to_regclass('private.roadmap_alex_continuation')is not null then raise exception 'Continuation already installed';end if;
 if(select encode(extensions.digest(jsonb_agg(jsonb_build_object('schema',n.nspname,'name',p.proname,'identity',pg_get_function_identity_arguments(p.oid),'body',p.prosrc,'owner',pg_get_userbyid(p.proowner),'definer',p.prosecdef,'config',p.proconfig,'acl',p.proacl::text)order by n.nspname,p.proname,pg_get_function_identity_arguments(p.oid))::text,'sha256'),'hex')from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in('public','private'))is distinct from '342b0ff660b565ff2ec715f7611c286660a0cd5d00970722914e332b5cf02174'then raise exception 'Unexpected SQL/security catalog';end if;
 if(select count(*)from private.roadmap_voice_r2_authority)<>1 or(select count(*)from private.roadmap_voice_r2_owner_recovery)<>1
 or(select encode(extensions.digest(to_jsonb(w)::text,'sha256'),'hex')from private.roadmap_voice_r2_authority w)is distinct from 'a67b1b421505119e78a6f75ece03cdd36fb0eab4cb9f45f544feca1f4999c34b'
 or(select encode(extensions.digest(to_jsonb(r)::text,'sha256'),'hex')from private.roadmap_voice_r2_owner_recovery r)is distinct from '0c6b8bebe8a9da6c05d8fb4c3d11c302999490727f2c8c64822df9d7c9a513af'
 or(select encode(extensions.digest(jsonb_build_object('pin',pin,'parent_version',parent_version,'parent_document_hash',parent_document_hash,'parent_job_hash',parent_job_hash)::text,'sha256'),'hex')from private.roadmap_voice_r2_contract)is distinct from 'f52cd623df2fdd33781eb34233a1c210bca198bc374e7dbbae6098b97ea10159'
 then raise exception 'Original authority/recovery/source changed';end if;
 if exists(select 1 from private.roadmap_saved_review_grants g join private.roadmap_voice_r2_contract c on c.singleton and g.report_id=(c.pin->>'report')::uuid)or exists(select 1 from private.roadmap_voice_r2_authority where expires_at>clock_timestamp())or clock_timestamp()>='2026-11-03T23:00:00Z'
 or(select count(*)from private.roadmap_processing_jobs j join private.roadmap_voice_r2_contract c on c.singleton and j.draft_id=(c.pin->>'draft')::uuid)<>1
 or(select count(*)from private.roadmap_processing_versions v join private.roadmap_voice_r2_contract c on c.singleton and v.report_id=(c.pin->>'report')::uuid)<>1
 or not private.roadmap_voice_r2_lineage()then raise exception 'Expired predecessor and untouched R1 required';end if;
end $guard$;
create table private.roadmap_alex_continuation(
 singleton boolean primary key default true check(singleton),id uuid not null unique default gen_random_uuid(),
 request_id uuid not null unique,owner_id uuid not null references auth.users(id),owner_session uuid not null,founder_session uuid not null,
 binding_hash text not null,starts_at timestamptz not null default clock_timestamp(),
 expires_at timestamptz not null check(expires_at='2026-11-03T23:00:00Z'),
 sop text not null check(sop='ONE_ALEX_R2_CONTINUATION_SAME_PURPOSE'),custody text not null check(custody='EXISTING_RESTRICTED_KEY_PRIVATE_CUSTODY'),
 check(starts_at>='2026-10-31T16:00:00Z'and starts_at<expires_at)
);
create table private.roadmap_alex_continuation_audit(
 sequence bigint generated always as identity primary key,authority_id uuid not null references private.roadmap_alex_continuation(id),
 actor_id uuid not null,session_id uuid not null,action text not null check(action in('issue','revoke')),created_at timestamptz not null default clock_timestamp()
);
create table private.roadmap_alex_review_grants(
 id uuid primary key default gen_random_uuid(),bundle_request uuid not null,founder_id uuid not null references auth.users(id),
 report_id uuid not null references public.vitality_reports(id),version_id uuid not null references private.roadmap_processing_versions(id),
 fingerprint text not null,document_hash text not null,source_basis_hash text not null,
 starts_at timestamptz not null default clock_timestamp(),expires_at timestamptz not null check(expires_at='2026-11-13T23:00:00Z'),
 operator_id uuid not null,operator_session uuid not null,unique(founder_id,version_id),check(starts_at<expires_at)
);
create table private.roadmap_alex_review_audit(
 sequence bigint generated always as identity primary key,grant_id uuid not null references private.roadmap_alex_review_grants(id),
 actor_id uuid not null,session_id uuid not null,action text not null check(action in('issue','purpose','read','review','revoke')),
 review_sequence bigint references private.roadmap_processing_reviews(sequence),created_at timestamptz not null default clock_timestamp()
);
do $tables$declare t text;begin
 foreach t in array array['roadmap_alex_continuation','roadmap_alex_continuation_audit','roadmap_alex_review_grants','roadmap_alex_review_audit']loop
 execute format('alter table private.%I enable row level security',t);
 execute format('revoke all on private.%I from public,anon,authenticated,service_role',t);
 execute format('create trigger %I before update or delete on private.%I for each row execute function private.roadmap_b4_immutable()',t||'_immutable',t);
 execute format('create trigger %I before truncate on private.%I for each statement execute function private.roadmap_b4_immutable()',t||'_no_truncate',t);
 end loop;
end $tables$;
revoke all on sequence private.roadmap_alex_continuation_audit_sequence_seq,private.roadmap_alex_review_audit_sequence_seq from public,anon,authenticated,service_role;
-- Snapshot only the exact replaced routines for append-only-compatible rollback.
create table private.roadmap_alex_continuation_baseline(name text primary key,definition text not null,definition_hash text not null);
insert into private.roadmap_alex_continuation_baseline select proname,pg_get_functiondef(oid),encode(extensions.digest(pg_get_functiondef(oid),'sha256'),'hex')from pg_proc where oid in('private.roadmap_alex_context(text)'::regprocedure,'private.roadmap_voice_r2_context(text)'::regprocedure,'public.roadmap_saved_review(text,uuid,jsonb)'::regprocedure);
alter table private.roadmap_alex_continuation_baseline enable row level security;
revoke all on private.roadmap_alex_continuation_baseline from public,anon,authenticated,service_role;
create trigger roadmap_alex_continuation_baseline_immutable before update or delete on private.roadmap_alex_continuation_baseline for each row execute function private.roadmap_b4_immutable();
create trigger roadmap_alex_continuation_baseline_no_truncate before truncate on private.roadmap_alex_continuation_baseline for each statement execute function private.roadmap_b4_immutable();

create function private.roadmap_alex_continuation_binding()returns text language sql stable security definer set search_path=''as $$
 select encode(extensions.digest(jsonb_build_object('pin',pin,'parent',parent_version,'parent_hash',parent_document_hash,'worker',worker_sha256,'voice',voice_hash,'ruleset',ruleset_hash,'source',source_sha)::text,'sha256'),'hex')from private.roadmap_voice_r2_contract where singleton
$$;
create function private.roadmap_alex_continuation_owner(p_fresh boolean)returns jsonb language plpgsql security definer set search_path=''as $$
declare a uuid:=auth.uid();sid uuid:=(auth.jwt()->>'session_id')::uuid;w private.roadmap_voice_r2_authority;begin
 select *into w from private.roadmap_voice_r2_authority;
 if a is null or sid is null or a is distinct from w.operator_id or auth.jwt()->>'iss'is distinct from 'https://voalfpxiyznnqfcqcymd.supabase.co/auth/v1'
 or auth.jwt()->>'sub'is distinct from a::text then raise exception 'Original authenticated issuing Owner required'using errcode='42501';end if;
 perform private.roadmap_voice_r2_recovery_check_owner(a,sid,p_fresh);
 if not exists(select 1 from public.staff_access where user_id=a and role='owner'and status='active')then raise exception 'Original Owner role changed while authenticating'using errcode='42501';end if;
 if exists(select 1 from auth.mfa_factors where user_id=a and status='verified')and auth.jwt()->>'aal'is distinct from 'aal2'then raise exception 'Configured Owner MFA required'using errcode='42501';end if;
 return jsonb_build_object('actor',a,'session',sid);
end $$;
create function public.roadmap_alex_continuation_issue(p_request uuid,p_sop text,p_custody text)returns jsonb language plpgsql security definer set search_path=''as $$
declare o jsonb;c private.roadmap_voice_r2_contract;fs uuid;w uuid;begin
 perform pg_advisory_xact_lock(18062026);o:=private.roadmap_alex_continuation_owner(true);
 select *into c from private.roadmap_voice_r2_contract where singleton;
 if p_request is null or p_sop is distinct from 'ONE_ALEX_R2_CONTINUATION_SAME_PURPOSE'or p_custody is distinct from 'EXISTING_RESTRICTED_KEY_PRIVATE_CUSTODY'
 or clock_timestamp()<'2026-10-31T16:00:00Z'or clock_timestamp()>='2026-11-03T23:00:00Z'
 or exists(select 1 from private.roadmap_voice_r2_authority where expires_at>clock_timestamp())
 or exists(select 1 from private.roadmap_voice_r2_audit where action='revoke')or exists(select 1 from private.roadmap_alex_audit where action='revoke')
 or exists(select 1 from private.roadmap_alex_continuation)
 or(select count(*)from private.roadmap_processing_jobs where draft_id=(c.pin->>'draft')::uuid)<>1
 or(select count(*)from private.roadmap_processing_versions where report_id=(c.pin->>'report')::uuid)<>1
 then raise exception 'Single untouched prospective continuation required'using errcode='42501';end if;
 perform private.roadmap_alex_basis();
 select x.session_id into fs from private.roadmap_alex_session_checks x join auth.sessions s on s.id=x.session_id and s.user_id=x.actor_id where x.actor_id=(c.pin->>'founder')::uuid and x.created_at>clock_timestamp()-interval'15 minutes'and(s.not_after is null or s.not_after>clock_timestamp())order by x.created_at desc limit 1;
 if fs is null then raise exception 'Fresh personal founder Calibration check required'using errcode='42501';end if;
 perform private.roadmap_b6_live_session((c.pin->>'founder')::uuid,fs);
 if not exists(select 1 from private.roadmap_processing_controls where singleton and process and review and not ingest and not approve and not internal_pdf)then raise exception 'Restricted controls required'using errcode='42501';end if;
 perform private.roadmap_alex_continuation_owner(true);
 insert into private.roadmap_alex_continuation(request_id,owner_id,owner_session,founder_session,binding_hash,expires_at,sop,custody)
 values(p_request,(o->>'actor')::uuid,(o->>'session')::uuid,fs,private.roadmap_alex_continuation_binding(),'2026-11-03T23:00:00Z',p_sop,p_custody)returning id into w;
 insert into private.roadmap_alex_continuation_audit(authority_id,actor_id,session_id,action)values(w,(o->>'actor')::uuid,(o->>'session')::uuid,'issue');
 return jsonb_build_object('issued',true,'processing',false,'expires_at','2026-11-03T23:00:00Z','independent_readback_required',true);
end $$;
create function private.roadmap_alex_continuation_context(p_mode text)returns jsonb language plpgsql security definer set search_path=''as $$
declare p jsonb;c private.roadmap_voice_r2_contract;w private.roadmap_alex_continuation;ctx jsonb;a uuid;sid uuid;begin
 a:=private.roadmap_b42_actor();sid:=(auth.jwt()->>'session_id')::uuid;perform 1 from private.roadmap_processing_controls where singleton for share;p:=private.roadmap_alex_basis();select *into c from private.roadmap_voice_r2_contract where singleton;select *into w from private.roadmap_alex_continuation;
 if a is distinct from(p->>'founder')::uuid or p_mode is null or p_mode not in('read','review')or w.id is null or w.starts_at>clock_timestamp()or w.expires_at<=clock_timestamp()
 or w.binding_hash is distinct from private.roadmap_alex_continuation_binding()
 or exists(select 1 from private.roadmap_alex_continuation_audit where authority_id=w.id and action='revoke')
 or exists(select 1 from private.roadmap_voice_r2_audit where action='revoke')or exists(select 1 from private.roadmap_alex_audit where action='revoke')
 or not exists(select 1 from private.roadmap_processing_controls where singleton and process and review and not ingest and not approve and not internal_pdf)
 then raise exception 'Prospective Alex continuation unavailable'using errcode='42501';end if;
 perform private.roadmap_b6_live_session(a,sid);
 perform private.roadmap_voice_r2_recovery_check_owner(w.owner_id,w.owner_session,false);
 if not exists(select 1 from public.staff_access where user_id=w.owner_id and role='owner'and status='active')then raise exception 'Supervising Owner role changed'using errcode='42501';end if;
 ctx:=private.roadmap_b4_context((p->>'report')::uuid,false);
 if ctx->>'source_fingerprint'is distinct from p->>'fingerprint'then raise exception 'Pinned source changed'using errcode='42501';end if;
 ctx:=ctx||jsonb_build_object('grant_sequence',(p->>'b6')::bigint,'purpose_sequence',(p->>'purpose')::bigint,'processing_grant',(select grant_sequence from private.roadmap_alex_windows),'operating_authority',w.id,'processing_expires_at',w.expires_at,'expires_at',w.expires_at,'can_feedback',true,'can_edit',false,'pins',private.roadmap_b6_pins(),'identity',private.roadmap_b42_public_metadata(private.roadmap_b42_descriptor((p->>'contact')::uuid,(p->>'report')::uuid)),'client_visible',false,'delivery','held','email','held','parent_version',c.parent_version,'parent_document_hash',c.parent_document_hash,'target_revision',2,'worker_sha256',c.worker_sha256,'voice_hash',c.voice_hash);
 if w.expires_at<=clock_timestamp()then raise exception 'Continuation expired during validation'using errcode='42501';end if;return ctx;
end $$;
-- Preserve old implementations verbatim; empty installation delegates to them unchanged.
do $copy$declare n text;body text;begin
 foreach n in array array['roadmap_alex_context','roadmap_voice_r2_context']loop
 select definition into body from private.roadmap_alex_continuation_baseline where name=n;
 execute replace(body,'FUNCTION private.'||n||'(','FUNCTION private.'||n||'_pre_continuation(');
 end loop;
 select definition into body from private.roadmap_alex_continuation_baseline where name='roadmap_saved_review';
 execute replace(body,'FUNCTION public.roadmap_saved_review(','FUNCTION private.roadmap_alex_pre_saved_review(');
end $copy$;
create or replace function private.roadmap_alex_context(p_mode text)returns jsonb language plpgsql security definer set search_path=''as $$begin
 if exists(select 1 from private.roadmap_alex_continuation)then return private.roadmap_alex_continuation_context(p_mode);end if;
 return private.roadmap_alex_context_pre_continuation(p_mode);
end $$;
create or replace function private.roadmap_voice_r2_context(p_mode text)returns jsonb language plpgsql security definer set search_path=''as $$begin
 if exists(select 1 from private.roadmap_alex_continuation)then return private.roadmap_alex_continuation_context(p_mode);end if;
 return private.roadmap_voice_r2_context_pre_continuation(p_mode);
end $$;

-- Review validates retained SOURCE consent, not generation/key/Owner-session lifetimes.
create function private.roadmap_alex_review_basis(p_founder uuid,p_version uuid)returns text language plpgsql security definer set search_path=''as $$
declare c private.roadmap_voice_r2_contract;p jsonb;v private.roadmap_processing_versions;m jsonb;s private.roadmap_b42_sop_attestations;b private.roadmap_b6_purpose_events;st private.roadmap_processing_purposes;begin
 select *into c from private.roadmap_voice_r2_contract where singleton;p:=c.pin;
 select *into s from private.roadmap_b42_sop_attestations where id=(p->>'sop')::uuid;
 select *into b from private.roadmap_b6_purpose_events where sequence=(p->>'purpose')::bigint;
 select *into st from private.roadmap_processing_purposes where sequence=(p->>'storage')::bigint;
 select *into v from private.roadmap_processing_versions where id=p_version and report_id=(p->>'report')::uuid;
 if s.id is null or s.revocation_owner is null or s.backup_owner is null or b.sequence is null or st.sequence is null or p_founder is null or p_founder not in(s.revocation_owner,s.backup_owner)or s.revocation_owner=s.backup_owner
 or not private.roadmap_b4_is_founder(p_founder)
 or not exists(select 1 from public.staff_access a join auth.users u on u.id=a.user_id where a.user_id=p_founder and a.role='owner'and a.status='active'and a.onboarding_status='complete'and u.deleted_at is null and(u.banned_until is null or u.banned_until<=clock_timestamp()))
 or not private.staff_has_permission(p_founder,'health.private.view')or not private.staff_has_permission(p_founder,'crm.view')or not private.staff_can_access_contact(p_founder,(p->>'contact')::uuid)
 or b.active is distinct from true or b.source_fingerprint is distinct from p->>'fingerprint'or b.pins is distinct from private.roadmap_b6_pins()
 or s.acknowledgments is distinct from '{"internal_only":true,"founders_only":true,"read_only":true,"no_ai_exports":true,"no_scores_emails":true,"manual_revocation_14_days":true,"separate_enrollment":true}'::jsonb
 or b.acknowledgments is distinct from '{"experimental_purpose":true,"no_client_scores":true,"immutable_originals":true,"no_external_ai_exports":true,"manual_revocation_14_days":true,"separate_feedback_permission":true,"historical_provenance_limits":true}'::jsonb
 or st.acknowledgment is distinct from 'private_internal_draft_storage_review_separate_from_read_only_pilot_v1'
 or st.active is distinct from true or st.fingerprint is distinct from p->>'fingerprint'or st.b6_grant is distinct from(p->>'b6')::bigint
 or s.sop_version is distinct from 'RVA-B4-PILOT-READONLY-v1-2026-10-16' or s.revocation_owner is distinct from(p->>'founder')::uuid
 or b.actor_id is distinct from(p->>'founder')::uuid or st.actor_id is distinct from b.actor_id
 or b.sequence is distinct from(select max(sequence)from private.roadmap_b6_purpose_events where report_id=(p->>'report')::uuid and actor_id=(p->>'founder')::uuid)
 or st.sequence is distinct from(select max(sequence)from private.roadmap_processing_purposes where report_id=(p->>'report')::uuid and actor_id=(p->>'founder')::uuid)
 or(p->>'b6')::bigint is distinct from(select max(sequence)from private.roadmap_b6_grant_events where report_id=(p->>'report')::uuid)
 or(p->>'b5')::bigint is distinct from(select max(sequence)from private.roadmap_b5_pilot_events where report_id=(p->>'report')::uuid)
 or(p->>'cohort')::bigint is distinct from(select max(sequence)from private.roadmap_b4_cohort_events where report_id=(p->>'report')::uuid)
 or not exists(select 1 from private.roadmap_b5_pilot_events where sequence=(p->>'b5')::bigint and active and source_fingerprint=p->>'fingerprint')
 or not exists(select 1 from private.roadmap_b6_grant_events where sequence=(p->>'b6')::bigint and active and allow_feedback and purpose_sequence=b.sequence and source_fingerprint=p->>'fingerprint')
 or not exists(select 1 from private.roadmap_b4_cohort_events where sequence=(p->>'cohort')::bigint and active and not allow_drafts and source_fingerprint=p->>'fingerprint')
 or not exists(select 1 from private.roadmap_b42_verifications x where x.id=(p->>'verification')::uuid and x.decision='confirmed'and x.eligible_at_confirmation and not exists(select 1 from private.roadmap_b42_verifications y where y.subject_key=x.subject_key and y.revision>x.revision))
 or v.id is null or v.fingerprint is distinct from p->>'fingerprint'or v.document_hash is distinct from encode(extensions.digest(v.document::text,'sha256'),'hex')
 or(v.revision=1 and(v.id<>c.parent_version or v.document_hash<>c.parent_document_hash))
 or(v.revision=2 and(v.actor_id<>(p->>'founder')::uuid or not exists(select 1 from private.roadmap_processing_jobs j where j.id=v.job_id and j.generation=2 and j.parent_version=c.parent_version and j.status='complete'and j.attempts=1)))
 or v.revision not in(1,2)
 then raise exception 'Exact founder/document/source consent required'using errcode='42501';end if;
 m:=private.roadmap_b42_descriptor((p->>'contact')::uuid,(p->>'report')::uuid);
 if m->>'eligible'is distinct from 'true'or m->>'_source'is distinct from p->>'fingerprint'or m->>'_fingerprint'is distinct from p->>'metadata_fingerprint' then raise exception 'Current immutable source unavailable'using errcode='42501';end if;
 if v.revision=2 then perform private.roadmap_voice_r2_document_gate(v.document);end if;
 return encode(extensions.digest(jsonb_build_object('source',p->>'fingerprint','verification',(p->>'verification'),'sop',s.acknowledgments,'b6purpose',b.acknowledgments,'storage',st.acknowledgment,'parent',c.parent_version,'parent_hash',c.parent_document_hash)::text,'sha256'),'hex');
end $$;
create function private.roadmap_alex_review_binding()returns text language sql stable security definer set search_path=''as $$
 select encode(extensions.digest(jsonb_agg(jsonb_build_object('version',v.id,'revision',v.revision,'hash',v.document_hash,'source',v.fingerprint)order by v.revision)::text,'sha256'),'hex')from private.roadmap_processing_versions v join private.roadmap_voice_r2_contract c on c.singleton and v.report_id=(c.pin->>'report')::uuid where v.revision in(1,2)
$$;
create function public.roadmap_alex_review_issue(p_request uuid,p_binding text)returns jsonb language plpgsql security definer set search_path=''as $$
declare o jsonb;c private.roadmap_voice_r2_contract;s private.roadmap_b42_sop_attestations;f uuid;v private.roadmap_processing_versions;g uuid;basis text;begin
 perform pg_advisory_xact_lock(18062026);o:=private.roadmap_alex_continuation_owner(true);select *into c from private.roadmap_voice_r2_contract where singleton;
 if p_request is null or p_binding is null or p_binding is distinct from private.roadmap_alex_review_binding()or clock_timestamp()>='2026-11-13T23:00:00Z'
 or exists(select 1 from private.roadmap_alex_review_grants)
 or(select count(*)from private.roadmap_processing_versions where report_id=(c.pin->>'report')::uuid)<>2
 then raise exception 'Exact independently verified R1/R2 review binding required'using errcode='42501';end if;
 select *into s from private.roadmap_b42_sop_attestations where id=(c.pin->>'sop')::uuid;
 foreach f in array array[s.revocation_owner,s.backup_owner]loop
 for v in select *from private.roadmap_processing_versions where report_id=(c.pin->>'report')::uuid order by revision loop
 basis:=private.roadmap_alex_review_basis(f,v.id);
 insert into private.roadmap_alex_review_grants(bundle_request,founder_id,report_id,version_id,fingerprint,document_hash,source_basis_hash,expires_at,operator_id,operator_session)
 values(p_request,f,v.report_id,v.id,v.fingerprint,v.document_hash,basis,'2026-11-13T23:00:00Z',(o->>'actor')::uuid,(o->>'session')::uuid)returning id into g;
 insert into private.roadmap_alex_review_audit(grant_id,actor_id,session_id,action)values(g,(o->>'actor')::uuid,(o->>'session')::uuid,'issue');
 end loop;end loop;
 perform private.roadmap_alex_continuation_owner(true);
 if clock_timestamp()>='2026-11-13T23:00:00Z'then raise exception 'Review issuance deadline passed'using errcode='42501';end if;
 return jsonb_build_object('issued',true,'grants',4,'processing',false,'expires_at','2026-11-13T23:00:00Z','independent_readback_required',true);
end $$;
create function private.roadmap_alex_review_context(p_report uuid,p_version uuid,p_write boolean,p_ack boolean default false)returns private.roadmap_alex_review_grants language plpgsql security definer set search_path=''as $$
declare a uuid:=private.roadmap_b42_actor();sid uuid:=(auth.jwt()->>'session_id')::uuid;g private.roadmap_alex_review_grants;c private.roadmap_voice_r2_contract;begin
 perform pg_advisory_xact_lock(18062026);perform private.roadmap_b6_live_session(a,sid);perform 1 from private.roadmap_processing_controls where singleton for share;select *into c from private.roadmap_voice_r2_contract where singleton;
 select *into g from private.roadmap_alex_review_grants where founder_id=a and report_id=p_report and version_id=p_version;
 if g.id is null or g.starts_at>clock_timestamp()or g.expires_at<=clock_timestamp()
 or exists(select 1 from private.roadmap_alex_review_audit where grant_id=g.id and action='revoke')
 or not exists(select 1 from private.roadmap_processing_controls where singleton and review and not ingest and not approve and not internal_pdf)
 or(p_write and not private.staff_has_permission(a,'health.progress.manage'))
 or g.source_basis_hash is distinct from private.roadmap_alex_review_basis(a,g.version_id)
 or not exists(select 1 from private.roadmap_processing_versions v where v.id=g.version_id and v.document_hash=g.document_hash and v.fingerprint=g.fingerprint)
 then raise exception 'Independent exact-document review denied'using errcode='42501';end if;
 if g.expires_at<=clock_timestamp()then raise exception 'Review expired during validation'using errcode='42501';end if;
 if not p_ack and a<>(c.pin->>'founder')::uuid and not exists(select 1 from private.roadmap_alex_review_audit where grant_id=g.id and actor_id=a and action='purpose')then raise exception 'Own review-only purpose acknowledgment required'using errcode='42501';end if;
 return g;
end $$;

create function private.roadmap_alex_review_api(p_action text,p_report uuid,p_payload jsonb)returns jsonb language plpgsql security definer set search_path=''as $$
declare a uuid:=private.roadmap_b42_actor();sid uuid:=(auth.jwt()->>'session_id')::uuid;g private.roadmap_alex_review_grants;
 v private.roadmap_processing_versions;r private.roadmap_processing_reviews;gg private.roadmap_alex_review_grants;proposal_data jsonb;req uuid;hash text;n integer;seq bigint;history jsonb;rows jsonb:='[]';c private.roadmap_voice_r2_contract;begin
 perform pg_advisory_xact_lock(18062026);perform private.roadmap_b6_live_session(a,sid);perform 1 from private.roadmap_processing_controls where singleton for share;select *into c from private.roadmap_voice_r2_contract where singleton;
 if p_action is null or p_action not in('list','read','review','purpose')or p_payload is null or jsonb_typeof(p_payload)<>'object'or octet_length(p_payload::text)>20000 then raise exception 'Invalid exact-version review request'using errcode='22023';end if;
 if p_action='list'then
 if p_report is not null or p_payload<>'{}'::jsonb then raise exception 'Invalid review list'using errcode='22023';end if;
 for g in select *from private.roadmap_alex_review_grants where founder_id=a order by version_id loop
 begin
 g:=private.roadmap_alex_review_context(g.report_id,g.version_id,false,true);
 select *into v from private.roadmap_processing_versions where id=g.version_id;
 rows:=rows||jsonb_build_array(jsonb_build_object('report_id',v.report_id,'version_id',v.id,'revision',v.revision,'label','Alex · saved Revision '||v.revision,'document_hash',g.document_hash,'review_only',true,'expires_at',g.expires_at,'purpose_required',a<>(c.pin->>'founder')::uuid and not exists(select 1 from private.roadmap_alex_review_audit where grant_id=g.id and actor_id=a and action='purpose')));
 exception when sqlstate '42501'or sqlstate '40001'or sqlstate '55000'then null;end;
 end loop;return rows;
 end if;
 g:=private.roadmap_alex_review_context(p_report,(p_payload->>'version_id')::uuid,p_action='review',p_action='purpose');
 select *into v from private.roadmap_processing_versions where id=g.version_id;
 if p_action='purpose'then
 if p_payload is distinct from jsonb_build_object('version_id',v.id,'acknowledgment','ALEX_SAVED_DOCUMENT_READ_CITED_FEEDBACK_ONLY')then raise exception 'Own exact review-purpose acknowledgment required'using errcode='22023';end if;
 for gg in select *from private.roadmap_alex_review_grants where founder_id=a and report_id=p_report and bundle_request=g.bundle_request loop
 gg:=private.roadmap_alex_review_context(p_report,gg.version_id,false,true);
 if not exists(select 1 from private.roadmap_alex_review_audit where grant_id=gg.id and actor_id=a and action='purpose')then
 insert into private.roadmap_alex_review_audit(grant_id,actor_id,session_id,action)values(gg.id,a,sid,'purpose');end if;
 end loop;
 return jsonb_build_object('acknowledged',true,'processing',false);
 end if;
 if p_action='read'then
 if p_payload is distinct from jsonb_build_object('version_id',v.id)then raise exception 'Exact version read required'using errcode='22023';end if;
 select coalesce(jsonb_agg(jsonb_build_object('revision',revision,'actor',actor_id,'proposal',proposal)order by revision),'[]')into history from private.roadmap_processing_reviews where version_id=v.id;
 insert into private.roadmap_alex_review_audit(grant_id,actor_id,session_id,action)values(g.id,a,sid,'read');
 return jsonb_build_object('version_id',v.id,'revision',v.revision,'document',v.document,'reviews',history,'expires_at',g.expires_at,'review_only',true,'client_visible',false,'delivery','held','email','held');
 end if;
 if (select count(*)from jsonb_object_keys(p_payload))<>4 or not p_payload?&array['version_id','expected_revision','request_key','proposal']
 or p_payload->>'version_id' is distinct from v.id::text then raise exception 'Exact saved version required' using errcode='22023';end if;
 proposal_data:=p_payload->'proposal';req:=(p_payload->>'request_key')::uuid;hash:=encode(extensions.digest(p_payload::text,'sha256'),'hex');
 if req is null or jsonb_typeof(proposal_data) is distinct from 'object' then raise exception 'Invalid cited proposal' using errcode='22023';end if;
 if proposal_data->>'driver' is null or not (proposal_data->>'driver')=any(private.roadmap_b4_driver_keys())
 or proposal_data->>'decision' is null or proposal_data->>'decision' not in ('accurate','inaccurate','needs_adjustment','request_inputs')
 or jsonb_typeof(proposal_data->'rationale') is distinct from 'string' or length(trim(proposal_data->>'rationale')) not between 3 and 2000
 or jsonb_typeof(proposal_data->'citations') is distinct from 'array' then raise exception 'Cited feedback required' using errcode='22023';end if;
 if jsonb_array_length(proposal_data->'citations') not between 1 and 20
 or exists(select 1 from jsonb_object_keys(proposal_data)k where k not in ('driver','decision','interpretation','rationale','citations','suggestedAdjustment','missingInputRequest'))
 or exists(select 1 from jsonb_each(proposal_data)e where e.key in ('interpretation','suggestedAdjustment','missingInputRequest') and (jsonb_typeof(e.value)<>'string' or length(e.value#>>'{}')>2000))
 or exists(select 1 from jsonb_array_elements(proposal_data->'citations')ref where jsonb_typeof(ref)<>'string' or not exists(select 1 from jsonb_array_elements(v.document->'drivers'->(proposal_data->>'driver')->'evidence')e where e->'field'=ref)) then raise exception 'Invalid source citation' using errcode='22023';end if;
 select * into r from private.roadmap_processing_reviews where actor_id=a and request_key=req;
 if r.sequence is not null then
 if r.version_id<>v.id or r.request_hash<>hash then raise exception 'Changed retry' using errcode='22023';end if;
 return jsonb_build_object('revision',r.revision,'idempotent',true,'rules_adopted',false);end if;
 select coalesce(max(revision),0)into n from private.roadmap_processing_reviews where version_id=v.id;
 if p_payload->'expected_revision' is distinct from to_jsonb(n) then raise exception 'Concurrent review' using errcode='40001';end if;
 -- Recheck current session and expiry immediately before appending feedback.
 g:=private.roadmap_alex_review_context(p_report,v.id,true);
 insert into private.roadmap_processing_reviews(version_id,revision,actor_id,session_id,request_key,request_hash,proposal)
 values(v.id,n+1,a,sid,req,hash,proposal_data) returning sequence into seq;
 insert into private.roadmap_alex_review_audit(grant_id,actor_id,session_id,action,review_sequence)values(g.id,a,sid,'review',seq);
 return jsonb_build_object('revision',n+1,'rules_adopted',false);
exception when others then raise exception 'Saved report review unavailable' using errcode=sqlstate;
end $$;

create or replace function public.roadmap_saved_review(p_action text,p_report uuid default null,p_payload jsonb default '{}')returns jsonb language plpgsql security definer set search_path=''as $$
declare rows jsonb;extra jsonb;begin
 if p_action='list'and p_report is null then
 begin rows:=private.roadmap_alex_pre_saved_review(p_action,p_report,p_payload);exception when sqlstate '42501'or sqlstate '40001'or sqlstate '55000'then rows:='[]';end;
 extra:=private.roadmap_alex_review_api(p_action,p_report,p_payload);
 if exists(select 1 from private.roadmap_alex_review_grants where founder_id=auth.uid())then
 rows:=(select coalesce(jsonb_agg(x),'[]')from jsonb_array_elements(rows)x where not exists(select 1 from private.roadmap_voice_r2_contract c where c.pin->>'report'=x->>'report_id'));end if;
 return rows||extra;
 end if;
 if exists(select 1 from private.roadmap_voice_r2_contract c where c.pin->>'report'=p_report::text)and exists(select 1 from private.roadmap_alex_review_grants where founder_id=auth.uid())then return private.roadmap_alex_review_api(p_action,p_report,p_payload);end if;
 return private.roadmap_alex_pre_saved_review(p_action,p_report,p_payload);
end $$;
create function public.roadmap_alex_continuation_status()returns jsonb language plpgsql security definer set search_path=''as $$
declare o jsonb;rows jsonb;begin
 o:=private.roadmap_alex_continuation_owner(false);
 return jsonb_build_object('eligible_owner',true,'fresh_auth',exists(select 1 from auth.sessions where id=(o->>'session')::uuid and created_at>clock_timestamp()-interval'5 minutes'),'founder_fresh',exists(select 1 from private.roadmap_alex_session_checks x join private.roadmap_voice_r2_contract c on c.singleton and x.actor_id=(c.pin->>'founder')::uuid join auth.sessions ss on ss.id=x.session_id and ss.user_id=x.actor_id where x.created_at>clock_timestamp()-interval'15 minutes'and(ss.not_after is null or ss.not_after>clock_timestamp())),'generation_issued',exists(select 1 from private.roadmap_alex_continuation),'generation_available',clock_timestamp()<'2026-11-03T23:00:00Z'and not exists(select 1 from private.roadmap_alex_continuation),'review_issued',exists(select 1 from private.roadmap_alex_review_grants),'saved_revisions',(select count(*)from private.roadmap_processing_versions v join private.roadmap_voice_r2_contract c on c.singleton and v.report_id=(c.pin->>'report')::uuid),'review_binding',private.roadmap_alex_review_binding(),'generation_expires_at','2026-11-03T23:00:00Z','review_expires_at','2026-11-13T23:00:00Z','processing',false);
end $$;
create function private.roadmap_alex_continuation_revoke(p_kind text,p_id uuid)returns void language plpgsql security definer set search_path=''as $$
declare o jsonb;begin
 perform pg_advisory_xact_lock(18062026);o:=private.roadmap_alex_continuation_owner(false);
 if p_kind='generation'then
 insert into private.roadmap_alex_continuation_audit(authority_id,actor_id,session_id,action)select p_id,(o->>'actor')::uuid,(o->>'session')::uuid,'revoke'where not exists(select 1 from private.roadmap_alex_continuation_audit where authority_id=p_id and action='revoke');
 elsif p_kind='review'then
 insert into private.roadmap_alex_review_audit(grant_id,actor_id,session_id,action)select p_id,(o->>'actor')::uuid,(o->>'session')::uuid,'revoke'where not exists(select 1 from private.roadmap_alex_review_audit where grant_id=p_id and action='revoke');
 else raise exception 'Exact revocation scope required'using errcode='42501';end if;
end $$;
-- Explicit per-object ACLs; no browser or service-role access to helpers/tables.
do $acl$declare f record;begin
 for f in select n.nspname,p.proname,pg_get_function_identity_arguments(p.oid)args from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in('private','public')and(p.proname like 'roadmap_alex_continuation%'or p.proname like 'roadmap_alex_review%'or p.proname in('roadmap_alex_context_pre_continuation','roadmap_voice_r2_context_pre_continuation','roadmap_alex_pre_saved_review'))loop
 execute format('revoke all on function %I.%I(%s)from public,anon,authenticated,service_role',f.nspname,f.proname,f.args);
 if f.nspname='public'then execute format('grant execute on function %I.%I(%s)to authenticated',f.nspname,f.proname,f.args);end if;
 end loop;
end $acl$;
commit;
