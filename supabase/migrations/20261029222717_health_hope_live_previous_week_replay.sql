-- LOCAL ONLY. Additive previous-week replay; no published sessions or messages.
begin;
set local lock_timeout='5s';set local statement_timeout='30s';
select pg_advisory_xact_lock(hashtextextended('hhl-privacy',0));
do $$begin
 if to_regclass('private.hhl_replay_versions')is not null then raise exception 'Replay already installed';end if;
 if encode(extensions.digest(pg_get_functiondef('private.hhl_service(text,jsonb)'::regprocedure),'sha256'),'hex')<>'18f081c926a3bc7193d04aa4503c372e98c0ef0acd1d4b84ab0fdbc6eea12a8f'or encode(extensions.digest(pg_get_functiondef('private.hhl_staff(text,jsonb)'::regprocedure),'sha256'),'hex')<>'d585f375a77eb95f16e7a385ff2ca0108de4789ddb68734a8723148666f0684d'or encode(extensions.digest(pg_get_functiondef('private.hhl_staff_allowed(boolean,uuid)'::regprocedure),'sha256'),'hex')<>'d705d09fc3be332627855cd642096d9b7ea49cf873462f8734c7127ab23f4a10'then raise exception 'HHL dependency drift';end if;
 if to_regclass('private.hhl_live_registrations')is null or to_regprocedure('private.hhl_staff_allowed(boolean,uuid)')is null then raise exception 'Existing HHL privacy/permission dependencies required';end if;
end $$;
create table private.hhl_replay_versions(
 session_id uuid not null references private.hhl_sessions(id),revision integer not null check(revision>0),
 available boolean not null,url text,approved_by uuid not null references auth.users(id),created_at timestamptz not null default clock_timestamp(),reason text not null check(length(reason)between 5 and 500),
 primary key(session_id,revision),check((available and url~'^https://www[.]youtube[.]com/watch[?]v=[A-Za-z0-9_-]{11}$')or(not available and url is null))
);
create table private.hhl_replay_notices(
 id uuid primary key default gen_random_uuid(),registration_id uuid not null references private.hhl_registrations(id)on delete cascade,
 source_session_id uuid not null,source_revision integer not null,upcoming_revision integer not null,
 state text not null default'pending'check(state in('pending','leased','done','cancelled','review')),
 approved_by uuid not null references auth.users(id),approval_reference text not null check(length(approval_reference)between 10 and 500),
 created_at timestamptz not null default clock_timestamp(),run_after timestamptz not null default now(),attempts integer not null default 0,
 first_attempt_at timestamptz,lease uuid,leased_at timestamptz,provider_id text,last_error text,
 delivery_status text check(delivery_status in('delivered','bounced','complained','failed','suppressed')),
 unique(registration_id,source_session_id),foreign key(source_session_id,source_revision)references private.hhl_replay_versions(session_id,revision)
);
create trigger hhl_replay_cleanup_invalidated after insert or update of provider_id on private.hhl_replay_notices for each row execute function private.hhl_mail_cleanup_invalidated();
create index hhl_replay_notices_due on private.hhl_replay_notices(run_after)where state in('pending','leased');
alter table private.hhl_settings add column replay_followups_enabled boolean not null default false;
alter table private.hhl_registrations add column replay_updates boolean not null default false,add column referral_source text check(length(referral_source)<=160 and referral_source!~'[[:cntrl:]]');
alter table private.hhl_jobs add column replay_session_id uuid,add column replay_revision integer,add column replay_decided boolean not null default false,
 add constraint hhl_job_replay_binding foreign key(replay_session_id,replay_revision)references private.hhl_replay_versions(session_id,revision)on delete set null;
alter table private.hhl_replay_versions enable row level security;alter table private.hhl_replay_notices enable row level security;
revoke all on private.hhl_replay_versions,private.hhl_replay_notices from public,anon,authenticated,service_role;
create function private.hhl_replay_immutable()returns trigger language plpgsql set search_path=''as $$begin raise exception 'Append a replay revision; do not overwrite approval history';end$$;
create trigger hhl_replay_immutable before update on private.hhl_replay_versions for each row execute function private.hhl_replay_immutable();
create function private.hhl_previous_replay(p_upcoming uuid)returns jsonb language sql stable security definer set search_path=''as $$
 select jsonb_build_object('url',v.url,'source_date',s.regular_date,'upcoming_date',u.regular_date,'source_session_id',v.session_id,'revision',v.revision)
 from private.hhl_sessions u join private.hhl_sessions s on s.regular_date=u.regular_date-7
 join lateral(select *from private.hhl_replay_versions x where x.session_id=s.id order by revision desc limit 1)v on v.available
 where u.id=p_upcoming and u.status='published'and u.starts_at>now()and u.expired_at is null
 and s.status='published'and s.expired_at is null and s.starts_at+interval'30 minutes'<=now()and private.hhl_expires_at(s.starts_at)>now()
$$;
create function private.hhl_replay_notice_eligible(p_notice uuid)returns boolean language sql stable security definer set search_path=''as $$
 select coalesce(bool_and(r.state='confirmed'and r.event_notifications and exists(select 1 from private.hhl_registrations opt where opt.id=r.id and opt.replay_updates) and not r.privacy_hold and not r.delivery_blocked and r.contact_id is not null
 and s.status='published'and s.starts_at>now()and s.closes_at>now()and s.revision=n.upcoming_revision
 and (private.hhl_previous_replay(s.id)->>'source_session_id')::uuid=n.source_session_id
 and (private.hhl_previous_replay(s.id)->>'revision')::integer=n.source_revision
 and cfg.notifications_enabled and cfg.replay_followups_enabled and cfg.retention_enabled and cfg.provider_retention_ready and cfg.retention_healthy_at>now()-interval'5 minutes'),false)
 from private.hhl_replay_notices n join private.hhl_live_registrations r on r.id=n.registration_id join private.hhl_sessions s on s.id=r.session_id cross join private.hhl_settings cfg where n.id=p_notice
$$;
alter function private.hhl_service(text,jsonb)rename to hhl_service_before_replay;
alter function private.hhl_staff(text,jsonb)rename to hhl_staff_before_replay;
create function private.hhl_service(p_action text,p_data jsonb default'{}')returns jsonb language plpgsql security definer set search_path=''as $$
declare result jsonb;rp jsonb;r private.hhl_registrations;j private.hhl_jobs;n private.hhl_replay_notices;s private.hhl_sessions;inserted boolean;ref text;sid uuid;key text;status text;begin
 if p_action like'replay-%'then perform pg_advisory_xact_lock(hashtextextended('hhl-privacy',0));end if;
 if p_action='replay-verify'then
  if not exists(select 1 from public.staff_access a where a.user_id=(p_data->>'actor_id')::uuid and a.status='active'and a.onboarding_status in('complete','waived')and a.role in('owner','admin')and private.staff_has_permission(a.user_id,'crm.manage'))or coalesce(p_data->>'url','')!~'^https://www[.]youtube[.]com/watch[?]v=[A-Za-z0-9_-]{11}$'then raise exception 'verified_staff_required'using errcode='42501';end if;
  insert into private.hhl_audit(actor_id,action,subject_id,reason)values((p_data->>'actor_id')::uuid,'replay_availability_verified',(p_data->>'session_id')::uuid,jsonb_build_object('url',p_data->>'url','revision',(p_data->>'expected_revision')::integer,'expires_at',clock_timestamp()+interval'5 minutes')::text)returning id into sid;
  return jsonb_build_object('ticket',sid);
 elsif p_action='register'then
  ref:=nullif(trim(p_data->>'referral_source'),'');if length(ref)>160 or ref~'[[:cntrl:]]'then raise exception 'invalid_referral_source';end if;
  result:=private.hhl_service_before_replay(p_action,p_data-'referral_source'-'replay_updates');
  select reg.*into r from private.hhl_requests req join private.hhl_registrations reg on reg.id=req.registration_id where req.request_id=(p_data->>'request_id')::uuid;
  -- Only a newly created registration can receive initial guest-supplied source;
  -- duplicate/idempotent registrations never replace identity or referral data.
  if ref is not null and r.registered_at=now()and r.referral_source is null then update private.hhl_registrations set referral_source=ref where id=r.id and referral_source is null;end if;
  if p_data->'replay_updates'='true'::jsonb and r.registered_at=now()and not r.replay_updates then
   update private.hhl_registrations set replay_updates=true where id=r.id;
   insert into private.hhl_audit(action,subject_id,reason)values('replay_updates_opted_in',r.id,'Guest selected optional replay-availability email permission; hhl-replay-updates-v1');
  end if;
  rp:=private.hhl_previous_replay(r.session_id);return result||jsonb_build_object('replay',case when rp is null then null else rp-'source_session_id'-'revision'end);
 elsif p_action='job'then
  result:=private.hhl_service_before_replay(p_action,p_data);
  select *into j from private.hhl_jobs where id=(p_data->>'id')::uuid;
  if j.kind='confirmation'and p_data->>'replay_version'='hhl-previous-week-replay-v1'then
   select session_id into sid from private.hhl_registrations where id=j.registration_id;
   if not j.replay_decided then
    -- A pre-release uncertain send must be reconciled, never resent with new bytes.
    if j.attempts>1 then raise exception 'legacy_confirmation_requires_reconciliation';end if;
    rp:=private.hhl_previous_replay(sid);
    update private.hhl_jobs set replay_decided=true,replay_session_id=(rp->>'source_session_id')::uuid,replay_revision=(rp->>'revision')::integer where id=j.id and lease=(p_data->>'lease')::uuid;
   elsif j.replay_session_id is not null then
    rp:=private.hhl_previous_replay(sid);
    if rp is null or (rp->>'source_session_id')::uuid is distinct from j.replay_session_id or (rp->>'revision')::integer is distinct from j.replay_revision then raise exception 'confirmation_replay_requires_reconciliation';end if;
   end if;
   -- A frozen no-replay decision stays absent even when a video arrives later.
   return result||jsonb_build_object('replay',rp);
  end if;return result;
 elsif p_action='replay-claim'then
  if p_data->'allow_replay'is distinct from'true'::jsonb or not exists(select 1 from private.hhl_settings where singleton and replay_followups_enabled and notifications_enabled)then return'null'::jsonb;end if;
  update private.hhl_replay_notices set state='cancelled',lease=null where state in('pending','leased')and not private.hhl_replay_notice_eligible(id);
  update private.hhl_replay_notices set state='review',lease=null,last_error='notification_retry_window_expired'where state in('pending','leased')and(attempts>=5 or first_attempt_at<now()-interval'23 hours');
  select *into n from private.hhl_replay_notices q where q.run_after<=now()and(q.state='pending'or q.state='leased'and q.leased_at<now()-interval'3 minutes')and q.attempts<5 and private.hhl_replay_notice_eligible(q.id)order by q.run_after,q.id for update skip locked limit 1;
  if n.id is null then return'null'::jsonb;end if;
  update private.hhl_replay_notices set state='leased',lease=gen_random_uuid(),leased_at=now(),attempts=attempts+1,first_attempt_at=coalesce(first_attempt_at,now())where id=n.id returning *into n;
  return jsonb_build_object('id',n.id,'lease',n.lease,'queue','replay');
 elsif p_action='replay-job'then
  select *into n from private.hhl_replay_notices where id=(p_data->>'id')::uuid and lease=(p_data->>'lease')::uuid and state='leased'and leased_at>now()-interval'3 minutes';
  if n.id is null or not private.hhl_replay_notice_eligible(n.id)then raise exception 'replay_notice_unavailable';end if;
  select *into r from private.hhl_registrations where id=n.registration_id;select *into s from private.hhl_sessions where id=r.session_id;
  return jsonb_build_object('id',n.id,'kind','replay','email',r.email,'first_name',r.first_name,'last_name',r.last_name,'session_id',s.id,'starts_at',s.starts_at,'first_attempt_at',n.first_attempt_at,'expires_at',private.hhl_expires_at(s.starts_at),'join_mode',s.join_mode,'join_url',case when s.join_mode='manual'then s.manual_join_url else r.zoom_join_url end,'replay',private.hhl_previous_replay(s.id));
 elsif p_action='replay-finish'then
  select *into n from private.hhl_replay_notices where id=(p_data->>'id')::uuid and lease=(p_data->>'lease')::uuid and state='leased'and leased_at>now()-interval'3 minutes'for update;
  if n.id is null or coalesce(p_data->>'state','')not in('done','pending','review')or length(p_data->>'provider_id')>200 or length(p_data->>'error')>80 then raise exception 'replay_notice_unavailable';end if;
  update private.hhl_replay_notices set state=p_data->>'state',provider_id=p_data->>'provider_id',last_error=p_data->>'error',run_after=now()+interval'2 minutes',lease=null,leased_at=null where id=n.id;return'{"saved":true}'::jsonb;
 elsif p_action='replay-mail-status'or p_action='replay-click'then
  key:=p_data->>'event_key';if key!~'^[a-f0-9]{64}$'or key is null then raise exception 'invalid_mail_event';end if;
  if p_action='replay-mail-status'or coalesce((p_data->>'notice')::boolean,false)then
   select *into n from private.hhl_replay_notices where id=(p_data->>'job_id')::uuid and(provider_id is null or provider_id=p_data->>'provider_id');
   if n.id is null then return'{"received":true}'::jsonb;end if;
   select *into r from private.hhl_registrations where id=n.registration_id;select url into ref from private.hhl_replay_versions where session_id=n.source_session_id and revision=n.source_revision;
  else
   select *into j from private.hhl_jobs where id=(p_data->>'job_id')::uuid and provider_id=p_data->>'provider_id'and kind='confirmation';
   if j.id is null or j.replay_session_id is null then return'{"received":true}'::jsonb;end if;
   select *into r from private.hhl_registrations where id=j.registration_id;select url into ref from private.hhl_replay_versions where session_id=j.replay_session_id and revision=j.replay_revision;
  end if;
  if p_action='replay-click'then
   if ref is null or ref is distinct from p_data->>'url'then return'{"received":true}'::jsonb;end if;
   insert into private.hhl_audit(action,subject_id,provider_event_key)values('replay_link_clicked',r.id,key)on conflict(provider_event_key)do nothing;return'{"received":true}'::jsonb;
  end if;
  status:=p_data->>'status';if status is null or status not in('delivered','bounced','complained','failed','suppressed')then raise exception 'invalid_mail_event';end if;
  insert into private.hhl_audit(action,subject_id,provider_event_key)values('replay_email_'||status,r.id,key)on conflict(provider_event_key)do nothing;inserted:=found;
  if inserted then
   update private.hhl_replay_notices set provider_id=coalesce(provider_id,p_data->>'provider_id'),delivery_status=status where id=n.id and(delivery_status is null or delivery_status='delivered');
   if status in('bounced','complained','suppressed')then update private.hhl_registrations set delivery_blocked=true where email=r.email;update private.hhl_replay_notices q set state='cancelled',lease=null where q.state in('pending','leased')and exists(select 1 from private.hhl_registrations x where x.id=q.registration_id and x.email=r.email);end if;
  end if;return'{"received":true}'::jsonb;
 end if;
 result:=private.hhl_service_before_replay(p_action,p_data);
 if p_action='privacy-maintain'and coalesce((result->>'held')::boolean,false)=false then delete from private.hhl_replay_versions v using private.hhl_sessions s where s.id=v.session_id and s.expired_at is not null and not exists(select 1 from private.hhl_replay_notices n where n.source_session_id=v.session_id and n.source_revision=v.revision)and not exists(select 1 from private.hhl_jobs j where j.replay_session_id=v.session_id and j.replay_revision=v.revision);end if;
 return result;
end $$;
create function private.hhl_staff(p_action text,p_data jsonb default'{}')returns jsonb language plpgsql security definer set search_path=''as $$
declare s private.hhl_sessions;u private.hhl_sessions;rp jsonb;v integer;n integer;result jsonb;cid uuid;snapshot jsonb;drain timestamptz;begin
 if p_action in('replay-overview','replay-save','replay-preflight','replay-queue','replay-control')then
  if not private.hhl_staff_allowed(true)then raise exception 'event_management_denied'using errcode='42501';end if;
  perform pg_advisory_xact_lock_shared(hashtextextended('hhl-privacy',0));
  if p_action='replay-overview'then
   return jsonb_build_object('followups_enabled',(select replay_followups_enabled from private.hhl_settings where singleton),'upcoming',(select coalesce(jsonb_agg(jsonb_build_object('session_id',u.id,'date',u.regular_date,'revision',u.revision,'replay_revision',(private.hhl_previous_replay(u.id)->>'revision')::integer)),'[]')from private.hhl_sessions u where private.hhl_previous_replay(u.id)is not null),'sessions',(select coalesce(jsonb_agg(jsonb_build_object('session_id',s.id,'date',s.regular_date,'status',s.status,'eligible_recording',s.status='published'and s.starts_at+interval'30 minutes'<=now()and s.expired_at is null,'revision',coalesce(v.revision,0),'available',coalesce(v.available,false),'url',v.url)order by s.regular_date desc),'[]')from private.hhl_sessions s left join lateral(select *from private.hhl_replay_versions x where x.session_id=s.id order by revision desc limit 1)v on true where s.expired_at is null));
  end if;
  if p_action='replay-preflight'then
   select *into s from private.hhl_sessions where id=(p_data->>'session_id')::uuid;
   select coalesce(max(revision),0)into v from private.hhl_replay_versions where session_id=s.id;
   if s.id is null or s.status<>'published'or s.expired_at is not null or s.starts_at+interval'30 minutes'>now()or v is distinct from(p_data->>'expected_revision')::integer then raise exception 'completed_current_source_required';end if;
   return jsonb_build_object('actor_id',auth.uid(),'session_id',s.id,'expected_revision',v);
  end if;
  if length(trim(p_data->>'reason'))not between 5 and 500 or p_data->>'reason'is null then raise exception 'review_reason_required';end if;
  if p_action='replay-control'then
   if not exists(select 1 from public.staff_access where user_id=auth.uid()and role='owner'and contact_scope='all')or jsonb_typeof(p_data->'enabled')is distinct from'boolean'then raise exception 'owner_control_required'using errcode='42501';end if;
   update private.hhl_settings set replay_followups_enabled=(p_data->>'enabled')::boolean where singleton;
   insert into private.hhl_audit(actor_id,action,reason)values(auth.uid(),p_action,p_data->>'reason');return'{"saved":true}'::jsonb;
  end if;
  if p_action='replay-save'then
   select *into s from private.hhl_sessions where id=(p_data->>'session_id')::uuid for update;
   if s.id is null or s.status<>'published'or s.expired_at is not null or s.starts_at+interval'30 minutes'>now()then raise exception 'completed_session_required';end if;
   select coalesce(max(revision),0)into v from private.hhl_replay_versions where session_id=s.id;
   if v is distinct from(p_data->>'expected_revision')::integer then raise exception 'replay_revision_conflict';end if;
   if jsonb_typeof(p_data->'available')is distinct from'boolean'or((p_data->>'available')::boolean and(p_data->'sharing_approved'is distinct from'true'::jsonb or coalesce(p_data->>'url','')!~'^https://www[.]youtube[.]com/watch[?]v=[A-Za-z0-9_-]{11}$'))then raise exception 'approved_youtube_recording_required';end if;
   if(p_data->>'available')::boolean and not exists(select 1 from private.hhl_audit a where a.id=(p_data->>'availability_ticket')::uuid and a.action='replay_availability_verified'and a.actor_id=auth.uid()and a.subject_id=s.id and(a.reason::jsonb->>'url')=p_data->>'url'and(a.reason::jsonb->>'revision')::integer=v and(a.reason::jsonb->>'expires_at')::timestamptz>clock_timestamp())then raise exception 'server_verified_availability_required'using errcode='42501';end if;
   insert into private.hhl_replay_versions(session_id,revision,available,url,approved_by,reason)values(s.id,v+1,(p_data->>'available')::boolean,case when(p_data->>'available')::boolean then p_data->>'url'end,auth.uid(),p_data->>'reason');
   insert into private.hhl_audit(actor_id,action,subject_id,reason)values(auth.uid(),p_action,s.id,p_data->>'reason');return jsonb_build_object('saved',true,'revision',v+1,'messages_queued',0);
  end if;
  -- A separate explicit approval queues notices. Saving a video never does.
  if not exists(select 1 from public.staff_access where user_id=auth.uid()and contact_scope='all')or not exists(select 1 from private.hhl_settings where singleton and replay_followups_enabled)or p_data->'confirm_send'is distinct from'true'::jsonb or coalesce(length(p_data->>'approval_reference'),0)not between 10 and 500 then raise exception 'separate_replay_send_approval_required'using errcode='42501';end if;
  select *into u from private.hhl_sessions where id=(p_data->>'upcoming_session_id')::uuid for update;rp:=private.hhl_previous_replay(u.id);
  if rp is null or u.starts_at<=now()or u.revision is distinct from(p_data->>'upcoming_revision')::integer or(rp->>'revision')::integer is distinct from(p_data->>'replay_revision')::integer then raise exception 'current_previous_week_replay_required';end if;
  insert into private.hhl_replay_notices(registration_id,source_session_id,source_revision,upcoming_revision,approved_by,approval_reference)
  select r.id,(rp->>'source_session_id')::uuid,(rp->>'revision')::integer,u.revision,auth.uid(),p_data->>'approval_reference'from private.hhl_deliverable_registrations r
  where r.session_id=u.id and r.state='confirmed'and r.event_notifications and exists(select 1 from private.hhl_registrations opt where opt.id=r.id and opt.replay_updates) and private.staff_can_access_contact(auth.uid(),r.contact_id)and exists(select 1 from private.hhl_jobs j where j.registration_id=r.id and j.kind='confirmation'and j.state='done'and j.provider_id is not null)and not exists(select 1 from private.hhl_jobs j where j.registration_id=r.id and j.kind='confirmation'and j.provider_id is not null and j.replay_session_id=(rp->>'source_session_id')::uuid)
  on conflict(registration_id,source_session_id)do nothing;get diagnostics n=row_count;
  insert into private.hhl_audit(actor_id,action,subject_id,reason)values(auth.uid(),p_action,u.id,p_data->>'reason');return jsonb_build_object('queued',n);
 end if;
 if p_action='privacy-open'and p_data->>'kind'='delete'then
  select max(q.leased_at)+interval'3 minutes'into drain from private.hhl_replay_notices q join private.hhl_registrations r on r.id=q.registration_id where r.contact_id=(p_data->>'contact_id')::uuid and q.state='leased';
 elsif p_action='privacy-delete'then
  select contact_id into cid from private.hhl_privacy_cases where id=(p_data->>'case_id')::uuid and actor_id=auth.uid();
  if p_data->'provider_cleanup_confirmed'is distinct from'true'::jsonb and exists(select 1 from private.hhl_replay_notices q join private.hhl_registrations r on r.id=q.registration_id where r.contact_id=cid and(q.provider_id is not null or q.attempts>0))then raise exception 'provider_cleanup_required';end if;
 end if;
 if p_action='privacy-export'then
  select contact_id into cid from private.hhl_privacy_cases where id=(p_data->>'case_id')::uuid and actor_id=auth.uid();
  select jsonb_build_object('referral_sources',(select coalesce(jsonb_agg(jsonb_build_object('registration_id',id,'guest_supplied_source',referral_source,'replay_updates',replay_updates)),'[]')from private.hhl_registrations where contact_id=cid),'replay_notices',(select coalesce(jsonb_agg(jsonb_build_object('created_at',q.created_at,'state',q.state,'delivery_status',q.delivery_status)),'[]')from private.hhl_replay_notices q join private.hhl_registrations r on r.id=q.registration_id where r.contact_id=cid))into snapshot;
 end if;
 result:=private.hhl_staff_before_replay(p_action,p_data);
 if p_action='privacy-open'and p_data->>'kind'='delete'then
  update private.hhl_replay_notices q set state='cancelled',lease=null where q.state in('pending','leased')and exists(select 1 from private.hhl_registrations r where r.id=q.registration_id and r.contact_id=(p_data->>'contact_id')::uuid);
  update private.hhl_privacy_cases set safe_after=greatest(safe_after,coalesce(drain,now()))where id=(result->>'case_id')::uuid;
  select result||jsonb_build_object('safe_after',safe_after)into result from private.hhl_privacy_cases where id=(result->>'case_id')::uuid;
 elsif p_action='privacy-provider-manifest'then
  select result||jsonb_build_object('mail_ids',(result->'mail_ids')||coalesce(jsonb_agg(q.provider_id)filter(where q.provider_id is not null),'[]'))into result from private.hhl_replay_notices q join private.hhl_registrations r on r.id=q.registration_id where r.session_id=(p_data->>'session_id')::uuid;
 elsif p_action='history'then select coalesce(jsonb_agg(x||jsonb_build_object('referral_source',(select referral_source from private.hhl_registrations where id=(x->>'registration_id')::uuid),'replay_updates',(select replay_updates from private.hhl_registrations where id=(x->>'registration_id')::uuid),'replay_notices',(select coalesce(jsonb_agg(jsonb_build_object('state',n.state,'provider_accepted',n.provider_id is not null,'delivery_status',n.delivery_status)),'[]')from private.hhl_replay_notices n where n.registration_id=(x->>'registration_id')::uuid),'replay_link_clicks',(select count(*)from private.hhl_audit a where a.subject_id=(x->>'registration_id')::uuid and a.action='replay_link_clicked'))),'[]')into result from jsonb_array_elements(result)x;
 elsif p_action='privacy-export'then result:=result||jsonb_build_object('replay_and_referral',snapshot);end if;
 return result;
end $$;
-- Explicitly rebind existing API wrappers to new guarded functions.
create or replace function public.hhl_service_command(p_action text,p_data jsonb default'{}')returns jsonb language sql security invoker set search_path=''as $$select private.hhl_service(p_action,p_data);$$;
create or replace function public.hhl_staff_command(p_action text,p_data jsonb default'{}')returns jsonb language sql security invoker set search_path=''as $$select private.hhl_staff(p_action,p_data);$$;
revoke all on function private.hhl_replay_immutable(),private.hhl_previous_replay(uuid),private.hhl_replay_notice_eligible(uuid),private.hhl_service_before_replay(text,jsonb),private.hhl_staff_before_replay(text,jsonb),private.hhl_service(text,jsonb),private.hhl_staff(text,jsonb)from public,anon,authenticated,service_role;
grant execute on function private.hhl_service(text,jsonb)to service_role;
grant execute on function private.hhl_staff(text,jsonb)to authenticated;
commit;
