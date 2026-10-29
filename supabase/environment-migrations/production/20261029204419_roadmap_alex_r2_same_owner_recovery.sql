-- LOCAL ONLY. Exact-hash production approval required. Empty recovery support only.
-- Original authority, original session history, jobs, grants and reports stay immutable.
begin;
select pg_advisory_xact_lock(18062026);
do $guard$ begin
 if to_regclass('private.roadmap_voice_r2_owner_recovery')is not null then raise exception 'Recovery already installed';end if;
 if (select encode(extensions.digest(jsonb_agg(jsonb_build_object('schema',n.nspname,'name',p.proname,'identity',pg_get_function_identity_arguments(p.oid),'body',p.prosrc,'owner',pg_get_userbyid(p.proowner),'definer',p.prosecdef,'config',p.proconfig,'acl',p.proacl::text)order by n.nspname,p.proname,pg_get_function_identity_arguments(p.oid))::text,'sha256'),'hex')from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in('public','private'))is distinct from 'e0786e9009996ebf1dfe26875219daf2ec14ebb4f70532f38832c7fc7e5bcda3'then raise exception 'Unexpected SQL catalog/ACL';end if;
 if (select count(*)from private.roadmap_voice_r2_authority)<>1 or(select count(*)from private.roadmap_voice_r2_audit)<>1 or(select count(*)from private.roadmap_voice_r2_audit where action='issue')<>1 then raise exception 'Exact single unused issuance required';end if;
 if(select encode(extensions.digest(to_jsonb(w)::text,'sha256'),'hex')from private.roadmap_voice_r2_authority w)is distinct from 'a67b1b421505119e78a6f75ece03cdd36fb0eab4cb9f45f544feca1f4999c34b'then raise exception 'Issued authority changed';end if;
 if(select encode(extensions.digest(jsonb_build_object('pin',pin,'parent_version',parent_version,'parent_document_hash',parent_document_hash,'parent_job_hash',parent_job_hash)::text,'sha256'),'hex')from private.roadmap_voice_r2_contract)is distinct from 'f52cd623df2fdd33781eb34233a1c210bca198bc374e7dbbae6098b97ea10159'then raise exception 'Exact source/R1/worker binding required';end if;
 if clock_timestamp()>='2026-10-31T16:00:00Z' or not private.roadmap_voice_r2_lineage() then raise exception 'Expired or changed lineage';end if;
 if exists(select 1 from private.roadmap_voice_r2_authority w join auth.sessions s on s.id=w.operator_session)then raise exception 'Original session is not terminated';end if;
 if(select count(*)from private.roadmap_processing_jobs j join private.roadmap_voice_r2_contract c on c.singleton and j.draft_id=(c.pin->>'draft')::uuid)<>1 or(select count(*)from private.roadmap_processing_versions v join private.roadmap_voice_r2_contract c on c.singleton and v.report_id=(c.pin->>'report')::uuid)<>1 then raise exception 'Authority already consumed';end if;
end $guard$;
create table private.roadmap_voice_r2_owner_recovery(
 authority_id uuid primary key references private.roadmap_voice_r2_authority(id),
 request_id uuid not null unique,
 owner_id uuid not null,
 original_session uuid not null,
 recovered_session uuid not null unique,
 founder_session uuid not null,
 authority_hash text not null check(authority_hash~'^[a-f0-9]{64}$'),
 binding_hash text not null check(binding_hash~'^[a-f0-9]{64}$'),
 expires_at timestamptz not null check(expires_at='2026-10-31T16:00:00Z'),
 created_at timestamptz not null default clock_timestamp(),
 authorization_reference text not null check(length(authorization_reference)between 10 and 1000),
 check(original_session<>recovered_session),check(created_at<expires_at)
);
alter table private.roadmap_voice_r2_owner_recovery enable row level security;
revoke all on private.roadmap_voice_r2_owner_recovery from public,anon,authenticated,service_role;
create trigger roadmap_voice_r2_owner_recovery_immutable before update or delete on private.roadmap_voice_r2_owner_recovery for each row execute function private.roadmap_b4_immutable();
create trigger roadmap_voice_r2_owner_recovery_no_truncate before truncate on private.roadmap_voice_r2_owner_recovery for each statement execute function private.roadmap_b4_immutable();

create function private.roadmap_voice_r2_recovery_binding()returns text language sql stable security definer set search_path=''as $$
 select encode(extensions.digest(jsonb_build_object('pin',pin,'parent_version',parent_version,'parent_document_hash',parent_document_hash,'parent_job_hash',parent_job_hash,'source',source_sha,'worker',worker_sha256,'voice',voice_hash,'ruleset',ruleset_hash,'expires',expires_at)::text,'sha256'),'hex')from private.roadmap_voice_r2_contract where singleton
$$;
create function private.roadmap_voice_r2_recovery_validate(p_mode text)returns void language plpgsql security definer set search_path=''as $$
declare c private.roadmap_voice_r2_contract;w private.roadmap_voice_r2_authority;begin
 if p_mode not in('recover','use')or p_mode is null then raise exception 'Exact mode required'using errcode='42501';end if;
 select *into c from private.roadmap_voice_r2_contract where singleton;select *into w from private.roadmap_voice_r2_authority;
 if w.id is null or clock_timestamp()<w.starts_at or clock_timestamp()>=w.expires_at or w.expires_at<>c.expires_at or c.expires_at<>'2026-10-31T16:00:00Z'
 or c.source_sha<>'19c07b532eb3a91b6d70dae9d9fdc768703408e2'or c.worker_sha256<>'cc623b456d18cad5a94adaef6230a4749565e4948e7a153640ed9f8f115aa0d4'
 or c.voice_hash<>'da9f982e58f7bfc4eab42aacf6812e55862b10fe73bdab12d16098757c7add64'or c.ruleset_hash<>'996554e27739dd90effda72adcec60493d640f086b15c07c0ca2c29fe08e440b'
 or not private.roadmap_voice_r2_lineage()or exists(select 1 from private.roadmap_voice_r2_audit where action='revoke')or exists(select 1 from private.roadmap_alex_audit where action='revoke')
 or not exists(select 1 from private.roadmap_processing_controls where singleton and process and review and not ingest and not approve and not internal_pdf)
 or not exists(select 1 from private.roadmap_voice_r2_audit a where a.action='issue'and a.authority_id=w.id and a.actor_id=w.operator_id and a.session_id=w.operator_session and a.reference=w.authorization_reference)
 then raise exception 'Exact unrevoked authority/binding required'using errcode='42501';end if;
 perform private.roadmap_alex_basis();
 if p_mode='recover'and((select count(*)from private.roadmap_processing_jobs where draft_id=(c.pin->>'draft')::uuid)<>1 or(select count(*)from private.roadmap_processing_versions where report_id=(c.pin->>'report')::uuid)<>1)then raise exception 'Consumed authority cannot recover'using errcode='42501';end if;
end $$;
create function private.roadmap_voice_r2_recovery_check_owner(p_actor uuid,p_session uuid,p_fresh boolean)returns void language plpgsql security definer set search_path=''as $$
declare w private.roadmap_voice_r2_authority;begin
 select *into w from private.roadmap_voice_r2_authority;
 if p_actor is null or p_session is null or p_actor is distinct from w.operator_id
 or not exists(select 1 from public.staff_access a join auth.users u on u.id=a.user_id where a.user_id=p_actor and a.role='owner'and a.status='active'and a.onboarding_status='complete'and a.contact_scope='all'and u.deleted_at is null and(u.banned_until is null or u.banned_until<=clock_timestamp()))then raise exception 'Original issuing Owner only'using errcode='42501';end if;
 perform private.roadmap_processing_scope_operator(p_actor,p_session,'EXISTING_ALEX_R2_OWNER_SESSION_RECOVERY');
 if p_fresh and(p_session=w.operator_session or not exists(select 1 from auth.sessions s where s.id=p_session and s.user_id=p_actor and s.created_at>clock_timestamp()-interval'5 minutes'and s.created_at<=clock_timestamp()and(s.not_after is null or s.not_after>clock_timestamp())))then raise exception 'Fresh same-Owner authentication required'using errcode='42501';end if;
end $$;
create function public.roadmap_voice_r2_owner_recover(p_request uuid,p_confirmation text)returns jsonb language plpgsql security definer set search_path=''as $$
declare a uuid;sid uuid;c private.roadmap_voice_r2_contract;w private.roadmap_voice_r2_authority;fsid uuid;begin
 perform pg_advisory_xact_lock(18062026);
 a:=auth.uid();sid:=(auth.jwt()->>'session_id')::uuid;
 if auth.jwt()->>'iss'is distinct from 'https://voalfpxiyznnqfcqcymd.supabase.co/auth/v1'or auth.jwt()->>'sub'is distinct from a::text or p_request is null or p_confirmation is distinct from 'RECOVER EXISTING ALEX R2 SUPERVISION ONLY'then raise exception 'Exact authenticated recovery request required'using errcode='42501';end if;
 perform private.roadmap_voice_r2_recovery_validate('recover');
 perform private.roadmap_voice_r2_recovery_check_owner(a,sid,true);
 if exists(select 1 from auth.mfa_factors where user_id=a and status='verified')and auth.jwt()->>'aal'is distinct from 'aal2'then raise exception 'Current Owner MFA required'using errcode='42501';end if;
 select *into c from private.roadmap_voice_r2_contract where singleton;select *into w from private.roadmap_voice_r2_authority;
 if exists(select 1 from private.roadmap_voice_r2_owner_recovery)then raise exception 'Recovery consumed; no retry or replacement'using errcode='42501';end if;
 if exists(select 1 from auth.sessions where id=w.operator_session)then raise exception 'Original session not terminated'using errcode='42501';end if;
 select s.session_id into fsid from private.roadmap_alex_session_checks s join auth.sessions t on t.id=s.session_id and t.user_id=s.actor_id where s.actor_id=(c.pin->>'founder')::uuid and s.created_at>clock_timestamp()-interval'15 minutes'and(t.not_after is null or t.not_after>clock_timestamp())order by s.created_at desc limit 1;
 if fsid is null then raise exception 'Current personal founder Calibration check required'using errcode='42501';end if;
 perform private.roadmap_b6_live_session((c.pin->>'founder')::uuid,fsid);
 insert into private.roadmap_voice_r2_owner_recovery(authority_id,request_id,owner_id,original_session,recovered_session,founder_session,authority_hash,binding_hash,expires_at,authorization_reference)
 values(w.id,p_request,a,w.operator_session,sid,fsid,encode(extensions.digest(to_jsonb(w)::text,'sha256'),'hex'),private.roadmap_voice_r2_recovery_binding(),w.expires_at,'OWNER_APPROVED_SAME_OWNER_RECOVERY_EXISTING_ALEX_R2_ONLY');
 return jsonb_build_object('recovered',true,'new_authority',false,'processing',false,'expires_at',w.expires_at,'independent_readback_required',true);
end $$;
create function private.roadmap_voice_r2_require_owner(p_authority uuid)returns void language plpgsql security definer set search_path=''as $$
declare w private.roadmap_voice_r2_authority;r private.roadmap_voice_r2_owner_recovery;begin
 select *into w from private.roadmap_voice_r2_authority where id=p_authority;if w.id is null then raise exception 'Exact authority required'using errcode='42501';end if;
 select *into r from private.roadmap_voice_r2_owner_recovery where authority_id=w.id;
 if r.authority_id is null then perform private.roadmap_processing_scope_operator(w.operator_id,w.operator_session,w.authorization_reference);return;end if;
 perform private.roadmap_voice_r2_recovery_validate('use');
 if r.owner_id<>w.operator_id or r.original_session<>w.operator_session or r.expires_at<>w.expires_at or r.expires_at<=clock_timestamp()
 or r.authority_hash<>encode(extensions.digest(to_jsonb(w)::text,'sha256'),'hex')or r.binding_hash<>private.roadmap_voice_r2_recovery_binding()then raise exception 'Recovery binding changed'using errcode='42501';end if;
 perform private.roadmap_voice_r2_recovery_check_owner(r.owner_id,r.recovered_session,false);
end $$;
create or replace function private.roadmap_voice_r2_context(p_mode text)returns jsonb language plpgsql security definer set search_path=''as $$
declare c private.roadmap_voice_r2_contract;w private.roadmap_voice_r2_authority;ctx jsonb;begin
 ctx:=private.roadmap_alex_context(p_mode);select *into c from private.roadmap_voice_r2_contract where singleton;select *into w from private.roadmap_voice_r2_authority;
 if w.id is null or clock_timestamp()<w.starts_at or clock_timestamp()>=w.expires_at or w.expires_at<>c.expires_at
 or exists(select 1 from private.roadmap_voice_r2_audit where authority_id=w.id and action='revoke')then raise exception 'Independent R2 authority inactive'using errcode='42501';end if;
 perform private.roadmap_voice_r2_require_owner(w.id);
 return ctx||jsonb_build_object('operating_authority',w.id,'processing_expires_at',w.expires_at,'expires_at',w.expires_at,'parent_version',c.parent_version,'parent_document_hash',c.parent_document_hash,'target_revision',2,'worker_sha256',c.worker_sha256,'voice_hash',c.voice_hash);
end $$;
create function public.roadmap_voice_r2_owner_recovery_status()returns jsonb language plpgsql security definer set search_path=''as $$
declare a uuid;sid uuid;c private.roadmap_voice_r2_contract;w private.roadmap_voice_r2_authority;r private.roadmap_voice_r2_owner_recovery;begin
 a:=auth.uid();sid:=(auth.jwt()->>'session_id')::uuid;
 if auth.jwt()->>'iss'is distinct from 'https://voalfpxiyznnqfcqcymd.supabase.co/auth/v1'then raise exception 'Production authentication required'using errcode='42501';end if;
 perform private.roadmap_voice_r2_recovery_check_owner(a,sid,false);
 select *into c from private.roadmap_voice_r2_contract where singleton;select *into w from private.roadmap_voice_r2_authority;select *into r from private.roadmap_voice_r2_owner_recovery where authority_id=w.id;
 return jsonb_build_object('eligible_owner',true,'recovered',r.authority_id is not null,'session_bound',coalesce(r.recovered_session=sid,false),'fresh_auth',exists(select 1 from auth.sessions s where s.id=sid and s.user_id=a and s.created_at>clock_timestamp()-interval'5 minutes'and s.created_at<=clock_timestamp()),'window_active',clock_timestamp()<w.expires_at and not exists(select 1 from private.roadmap_voice_r2_audit where action='revoke'),'expires_at',w.expires_at,'unused',(select count(*)=1 from private.roadmap_processing_jobs where draft_id=(c.pin->>'draft')::uuid),'processing',false);
end $$;
revoke all on function private.roadmap_voice_r2_recovery_binding(),private.roadmap_voice_r2_recovery_validate(text),private.roadmap_voice_r2_recovery_check_owner(uuid,uuid,boolean),private.roadmap_voice_r2_require_owner(uuid),public.roadmap_voice_r2_owner_recover(uuid,text),public.roadmap_voice_r2_owner_recovery_status()from public,anon,authenticated,service_role;
grant execute on function public.roadmap_voice_r2_owner_recover(uuid,text),public.roadmap_voice_r2_owner_recovery_status()to authenticated;
commit;
