-- Synthetic staging acceptance ONLY. Complete rollback; never run on production.
begin;
do $$
declare actor uuid:=gen_random_uuid(); recipient uuid:=gen_random_uuid(); outsider uuid:=gen_random_uuid(); sid uuid:=gen_random_uuid(); cid uuid; wid uuid; rid uuid;
begin
 insert into auth.users(id,email,email_confirmed_at) values(actor,'b1-owner-'||actor||'@example.invalid',now()),(recipient,'b1-recipient-'||recipient||'@example.invalid',now()),(outsider,'b1-outsider-'||outsider||'@example.invalid',now());
 insert into auth.sessions(id,user_id) values(sid,actor),(gen_random_uuid(),recipient),(gen_random_uuid(),outsider);
 insert into public.staff_access(user_id,display_name,role,status,onboarding_status,contact_scope) values(actor,'Synthetic B1 Owner','owner','active','complete','all');
 select id into cid from public.contacts where email='b1-recipient-'||recipient||'@example.invalid';
 insert into public.workflow_records(contact_id,workflow_type,status,current_step,completion_percent,completed_at) values(cid,'vitality_assessment','completed','complete',100,now()) returning id into wid;
 insert into private.vitality_assessment_drafts(contact_id,workflow_id,recipient,identity,snapshot,status,verified_at,session_hash,recovery_hash,completed_at) values(cid,wid,'b1-recipient-'||recipient||'@example.invalid','{}','{"version":1,"pathway":"Adult","fields":{"assessment_for":[{"type":"radio","value":"Myself","checked":true}],"synthetic_question":[{"type":"text","value":"Unknown"}]}}','completed',now(),encode(extensions.gen_random_bytes(32),'hex'),encode(extensions.gen_random_bytes(32),'hex'),now());
 insert into public.vitality_reports(contact_id,workflow_id) values(cid,wid) returning id into rid;
 perform set_config('b1.report',rid::text,true);perform set_config('b1.owner',actor::text,true);perform set_config('b1.recipient',recipient::text,true);perform set_config('b1.outsider',outsider::text,true);perform set_config('b1.sid',sid::text,true);
 perform set_config('request.jwt.claim.sub',actor::text,true);perform set_config('request.jwt.claim.role','authenticated',true);perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated','session_id',sid)::text,true);
end $$;
set local role authenticated;
do $$
declare c jsonb; result jsonb; rid uuid:=current_setting('b1.report')::uuid; request uuid:=gen_random_uuid();
begin
 c:=public.get_vitality_roadmap_preparation(rid);
 if not (c->>'can_edit')::boolean or (c->>'can_approve')::boolean or (c->>'can_release')::boolean then raise exception 'Hosted editor/gate assertion'; end if;
 result:=public.save_vitality_roadmap_draft(rid,0,request,'save','draft','Synthetic hosted acceptance',c->'document');
 if result->>'version'<>'1' then raise exception 'Hosted version assertion'; end if;
 result:=public.save_vitality_roadmap_draft(rid,0,request,'save','draft','Synthetic hosted acceptance',c->'document');
 if not (result->>'idempotent')::boolean then raise exception 'Hosted idempotency assertion'; end if;
 begin perform public.save_vitality_roadmap_draft(rid,0,gen_random_uuid(),'save','draft','Expected conflict',c->'document'); raise exception 'Missing version conflict'; exception when serialization_failure then null; end;
 begin perform public.approve_vitality_roadmap(rid); raise exception 'Missing approver denial'; exception when insufficient_privilege then null; end;
 begin perform 1 from private.vitality_roadmap_versions; raise exception 'Missing table denial'; exception when insufficient_privilege then null; end;
 if public.get_vitality_roadmap_saved_version(rid,1)->'document' is distinct from c->'document' then raise exception 'Historical document mismatch'; end if;
end $$;
reset role;
do $$
declare u uuid:=current_setting('b1.recipient')::uuid; sid uuid;
begin select id into sid from auth.sessions where user_id=u;perform set_config('request.jwt.claim.sub',u::text,true);perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated','session_id',sid)::text,true);end $$;
set local role authenticated;
do $$ begin
 if not (public.claim_my_vitality_roadmap()->>'claimed')::boolean then raise exception 'Claim failed'; end if;
 perform public.claim_my_vitality_roadmap();
 if public.get_my_released_vitality_roadmaps()<>'[]'::jsonb then raise exception 'Draft leaked'; end if;
 begin perform public.get_vitality_roadmap_preparation(current_setting('b1.report')::uuid); raise exception 'Member read not denied'; exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ declare u uuid:=current_setting('b1.outsider')::uuid; sid uuid;
begin select id into sid from auth.sessions where user_id=u;perform set_config('request.jwt.claim.sub',u::text,true);perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated','session_id',sid)::text,true);end $$;
set local role authenticated;
do $$ begin
 begin perform public.claim_my_vitality_roadmap(); raise exception 'Wrong-contact claim not denied'; exception when insufficient_privilege then null; end;
 if public.get_my_released_vitality_roadmaps()<>'[]'::jsonb then raise exception 'Cross-contact leak'; end if;
end $$;
reset role;
delete from auth.sessions where user_id=current_setting('b1.outsider')::uuid;
set local role authenticated;
do $$ begin
 begin perform public.get_my_released_vitality_roadmaps();raise exception 'Revoked session not denied'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role anon;
do $$ begin
 begin perform public.get_my_released_vitality_roadmaps();raise exception 'Anonymous not denied'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'PASS: synthetic staging editor/save/idempotency/conflict/history/claim/draft privacy/cross-contact/revoked/anonymous boundaries; transaction rolled back' as result;
