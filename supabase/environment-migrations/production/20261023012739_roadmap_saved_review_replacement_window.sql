-- LOCAL REVIEW PACKAGE ONLY. Requires separate exact-hash production approval.
-- No grant is issued by this migration. Historical grants/audits/versions are not rewritten.
begin;
select pg_advisory_xact_lock(18062026);
lock table private.roadmap_saved_review_grants in access exclusive mode;
do $$declare g private.roadmap_saved_review_grants;begin
 if not exists(select 1 from supabase_migrations.schema_migrations where version='20261022144239' and name='roadmap_saved_revision_review_only' and encode(extensions.digest(array_to_string(statements,E'\n'),'sha256'),'hex')='7392a0a80afebac243a32d1234c333c4369c1446b7a02407c5105825a1ccbc0c') then raise exception 'Reviewed installed migration ledger required';end if;
 if clock_timestamp()<'2026-10-22T22:00:00Z'::timestamptz or clock_timestamp()>='2026-10-24T13:00:00Z'::timestamptz
 or to_regprocedure('private.roadmap_saved_review_renew(uuid,timestamptz,uuid,uuid,text)') is not null
 or (select count(*)from private.roadmap_saved_review_grants)<>1 then raise exception 'Exact expired saved-review baseline required';end if;
 if exists(select 1 from (values
 ('private.roadmap_saved_review_basis','acb7c4791a91ec5eb6ff90ca363a2d61ee1fa52ea22980ff0966b0d674be3d42'),
 ('private.roadmap_saved_review_authorize','0f9622f48d1de876793cd8b5a896ce72d695944db903c188be1089d28cbd5a7d'),
 ('private.roadmap_saved_review_revoke','00684f4f877b30ec948fe0df447d6dfc35e430db9f2e1591e65530769f9e67b9'),
 ('private.roadmap_saved_review_context','cc25bf7e4c0390e96dff4ec39b0c08fbaa3c6d4035d30a6549538dc9f1177eae'),
 ('private.roadmap_saved_review_api','91273abca47e7106bc7cb1b1b5175ab41abeb15d1f793f4c5ff2ecaf91ff3275'),
 ('public.roadmap_saved_review','1fe97381b2589f83d4b72db454857a40fde8f4cdf8d87512b316e8d7f2cb6310'))a(name,hash)
 left join pg_proc p on p.oid=to_regproc(a.name)
 where p.oid is null or encode(extensions.digest(p.prosrc,'sha256'),'hex')<>a.hash
 or p.proowner<>to_regrole('postgres') or p.proconfig is distinct from array['search_path=""']) then
 raise exception 'Reviewed saved-review function/security baseline required';end if;
 if exists(select 1 from pg_proc p cross join unnest(array['anon','authenticated','service_role'])r(role_name) where p.oid in('private.roadmap_saved_review_basis(uuid,uuid,uuid,text,text)'::regprocedure,'private.roadmap_saved_review_authorize(uuid,uuid,uuid,uuid,text,text,timestamptz,uuid,uuid,text)'::regprocedure,'private.roadmap_saved_review_revoke(uuid,uuid,uuid,text)'::regprocedure,'private.roadmap_saved_review_context(uuid,boolean)'::regprocedure) and has_function_privilege(r.role_name,p.oid,'EXECUTE'))
 or not has_function_privilege('authenticated','public.roadmap_saved_review(text,uuid,jsonb)','EXECUTE') or has_function_privilege('anon','public.roadmap_saved_review(text,uuid,jsonb)','EXECUTE') or has_function_privilege('service_role','public.roadmap_saved_review(text,uuid,jsonb)','EXECUTE')
 then raise exception 'Reviewed function ACLs required';end if;
 if not (select bool_and(relrowsecurity)from pg_class where oid in('private.roadmap_saved_review_grants'::regclass,'private.roadmap_saved_review_audit'::regclass))
 or exists(select 1 from unnest(array['anon','authenticated','service_role'])r where has_table_privilege(r,'private.roadmap_saved_review_grants','SELECT,INSERT,UPDATE,DELETE,TRUNCATE') or has_table_privilege(r,'private.roadmap_saved_review_audit','SELECT,INSERT,UPDATE,DELETE,TRUNCATE'))
 or exists(select 1 from pg_policy where polrelid in('private.roadmap_saved_review_grants'::regclass,'private.roadmap_saved_review_audit'::regclass))
 or (select count(*)from pg_trigger where tgrelid in('private.roadmap_saved_review_grants'::regclass,'private.roadmap_saved_review_audit'::regclass) and not tgisinternal and tgenabled='O' and tgfoid='private.roadmap_b4_immutable()'::regprocedure)<>4
 then raise exception 'Reviewed private immutable authority required';end if;
 select * into g from private.roadmap_saved_review_grants;
 if g.purpose<>'caroline-r2-justyn-read-cited-feedback-20261022' or g.expires_at<>'2026-10-22T22:00:00Z'::timestamptz
 or exists(select 1 from private.roadmap_saved_review_audit where grant_id=g.id and action='revoke')
 or private.roadmap_saved_review_basis(g.founder_id,g.report_id,g.version_id,g.fingerprint,g.document_hash) is distinct from g.consent_pins
 then raise exception 'Exact historical grant and retained case required';end if;
end $$;

create temporary table rva_review_renewal_preservation on commit drop as
 select (select jsonb_agg(to_jsonb(g) order by id)from private.roadmap_saved_review_grants g) grants,
 (select jsonb_agg(to_jsonb(a)order by sequence)from private.roadmap_saved_review_audit a) audit;

-- Preserve the old row/columns, immutable triggers, RLS and all existing ACLs.
-- Two fixed purposes permit at most the historical grant plus ONE replacement.
alter table private.roadmap_saved_review_grants drop constraint roadmap_saved_review_grants_pkey;
alter table private.roadmap_saved_review_grants add constraint roadmap_saved_review_grants_pkey primary key(id);
alter table private.roadmap_saved_review_grants add constraint roadmap_saved_review_one_per_window unique(purpose);
alter table private.roadmap_saved_review_grants drop constraint roadmap_saved_review_grants_expires_at_check;
alter table private.roadmap_saved_review_grants drop constraint roadmap_saved_review_grants_purpose_check;
alter table private.roadmap_saved_review_grants add constraint roadmap_saved_review_fixed_windows check(
 (purpose='caroline-r2-justyn-read-cited-feedback-20261022' and expires_at<='2026-10-22T22:00:00Z'::timestamptz)
 or (purpose='caroline-r2-justyn-read-cited-feedback-replacement-20261024' and starts_at>='2026-10-22T22:00:00Z'::timestamptz and expires_at<='2026-10-24T13:00:00Z'::timestamptz));

create function private.roadmap_saved_review_renew(p_founder_session uuid,p_expires timestamptz,p_operator uuid,p_operator_session uuid,p_reference text)
returns uuid language plpgsql security definer set search_path='' as $$
declare old private.roadmap_saved_review_grants;fresh private.roadmap_saved_review_grants;pins jsonb;new_id uuid;
begin
 perform pg_advisory_xact_lock(18062026);
 perform private.roadmap_processing_scope_operator(p_operator,p_operator_session,p_reference);
 select * into old from private.roadmap_saved_review_grants where purpose='caroline-r2-justyn-read-cited-feedback-20261022';
 if old.id is null or old.expires_at<>'2026-10-22T22:00:00Z'::timestamptz or old.expires_at>clock_timestamp()
 or p_expires is null or p_expires<=clock_timestamp() or p_expires>'2026-10-24T13:00:00Z'::timestamptz
 or exists(select 1 from private.roadmap_saved_review_audit where grant_id=old.id and action='revoke')
 or exists(select 1 from private.roadmap_processing_pilot_batches where expires_at>clock_timestamp())
 or not exists(select 1 from private.roadmap_processing_controls where singleton and review and not ingest and not approve and not internal_pdf)
 then raise exception 'Independent replacement review window required' using errcode='42501';end if;
 perform private.roadmap_b6_live_session(old.founder_id,p_founder_session);
 pins:=private.roadmap_saved_review_basis(old.founder_id,old.report_id,old.version_id,old.fingerprint,old.document_hash);
 if pins is distinct from old.consent_pins then raise exception 'Historical source and retained consent required' using errcode='42501';end if;
 select * into fresh from private.roadmap_saved_review_grants where purpose='caroline-r2-justyn-read-cited-feedback-replacement-20261024';
 if fresh.id is not null then
  if fresh.founder_id is distinct from old.founder_id or fresh.report_id is distinct from old.report_id or fresh.version_id is distinct from old.version_id
  or fresh.fingerprint is distinct from old.fingerprint or fresh.document_hash is distinct from old.document_hash or fresh.consent_pins is distinct from pins
  or fresh.expires_at is distinct from p_expires or fresh.expires_at<=clock_timestamp() or fresh.founder_session is distinct from p_founder_session
  or fresh.operator_id is distinct from p_operator or fresh.operator_session is distinct from p_operator_session or fresh.authorization_reference is distinct from p_reference
  or exists(select 1 from private.roadmap_saved_review_audit where grant_id=fresh.id and action='revoke') then
   raise exception 'Replacement grant already issued or revoked' using errcode='42501';end if;
  return fresh.id;
 end if;
 if exists(select 1 from private.roadmap_saved_review_grants where expires_at>clock_timestamp()) then
 raise exception 'Overlapping review authorization denied' using errcode='42501';end if;
 -- Recheck actual identities and server time after locks/retained-source verification.
 perform private.roadmap_processing_scope_operator(p_operator,p_operator_session,p_reference);
 perform private.roadmap_b6_live_session(old.founder_id,p_founder_session);
 if p_expires<=clock_timestamp() then raise exception 'Replacement review expired' using errcode='42501';end if;
 insert into private.roadmap_saved_review_grants(founder_id,founder_session,report_id,version_id,fingerprint,document_hash,consent_pins,expires_at,operator_id,operator_session,authorization_reference,purpose)
 values(old.founder_id,p_founder_session,old.report_id,old.version_id,old.fingerprint,old.document_hash,pins,p_expires,p_operator,p_operator_session,p_reference,'caroline-r2-justyn-read-cited-feedback-replacement-20261024')returning id into new_id;
 insert into private.roadmap_saved_review_audit(grant_id,actor_id,session_id,action,authorization_reference)values(new_id,p_operator,p_operator_session,'grant',p_reference);
 return new_id;
end $$;
revoke all on function private.roadmap_saved_review_renew(uuid,timestamptz,uuid,uuid,text) from public,anon,authenticated,service_role;

create or replace function private.roadmap_saved_review_context(p_report uuid,p_write boolean)
returns private.roadmap_saved_review_grants language plpgsql security definer set search_path='' as $$
declare a uuid:=private.roadmap_b42_actor();sid uuid:=(auth.jwt()->>'session_id')::uuid;g private.roadmap_saved_review_grants;
begin
 perform pg_advisory_xact_lock(18062026);
 perform private.roadmap_b6_live_session(a,sid);
 select * into g from private.roadmap_saved_review_grants where report_id=p_report and founder_id=a order by expires_at desc,id desc limit 1;
 if not exists(select 1 from private.roadmap_processing_controls where singleton and review and not ingest and not approve and not internal_pdf)
 or g.id is null or g.starts_at>clock_timestamp() or g.expires_at<=clock_timestamp()
 or exists(select 1 from private.roadmap_saved_review_audit where grant_id=g.id and action='revoke')
 or (p_write and not private.staff_has_permission(a,'health.progress.manage')) then
 raise exception 'Saved report review unavailable' using errcode='42501';end if;
 if private.roadmap_saved_review_basis(a,g.report_id,g.version_id,g.fingerprint,g.document_hash) is distinct from g.consent_pins
 then raise exception 'Saved report consent changed' using errcode='42501';end if;
 -- Recheck server time after any lock wait; no extension from a stale request timestamp.
 if g.expires_at<=clock_timestamp() then raise exception 'Saved report review expired' using errcode='42501';end if;
 return g;
end $$;

create or replace function private.roadmap_saved_review_api(p_action text,p_report uuid,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a uuid:=private.roadmap_b42_actor();sid uuid:=(auth.jwt()->>'session_id')::uuid;g private.roadmap_saved_review_grants;
 v private.roadmap_processing_versions;r private.roadmap_processing_reviews;proposal_data jsonb;req uuid;hash text;n integer;seq bigint;history jsonb;
begin
 perform pg_advisory_xact_lock(18062026);
 if p_action is null or p_action not in ('list','read','review') or p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>20000
 then raise exception 'Invalid saved review request' using errcode='22023';end if;
 if p_action='list' then
 if p_report is not null or p_payload<>'{}'::jsonb then raise exception 'Invalid saved review list' using errcode='22023';end if;
 select * into g from private.roadmap_saved_review_grants where founder_id=a order by expires_at desc,id desc limit 1;
 if g.id is null then return '[]'::jsonb;end if;
 g:=private.roadmap_saved_review_context(g.report_id,false);
 return jsonb_build_array(jsonb_build_object('report_id',g.report_id,'revision',2,'label','Caroline · saved Revision 2','expires_at',g.expires_at,'review_only',true));
 end if;
 g:=private.roadmap_saved_review_context(p_report,p_action='review');
 select * into v from private.roadmap_processing_versions where id=g.version_id;
 if p_action='read' then
 if p_payload<>'{}'::jsonb then raise exception 'Invalid saved review read' using errcode='22023';end if;
 select coalesce(jsonb_agg(jsonb_build_object('revision',revision,'actor',actor_id,'proposal',proposal)order by revision),'[]') into history from private.roadmap_processing_reviews where version_id=v.id;
 insert into private.roadmap_saved_review_audit(grant_id,actor_id,session_id,action)values(g.id,a,sid,'read');
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
 g:=private.roadmap_saved_review_context(p_report,true);
 insert into private.roadmap_processing_reviews(version_id,revision,actor_id,session_id,request_key,request_hash,proposal)
 values(v.id,n+1,a,sid,req,hash,proposal_data) returning sequence into seq;
 insert into private.roadmap_saved_review_audit(grant_id,actor_id,session_id,action,review_sequence)values(g.id,a,sid,'review',seq);
 return jsonb_build_object('revision',n+1,'rules_adopted',false);
exception when others then raise exception 'Saved report review unavailable' using errcode=sqlstate;
end $$;

comment on function public.roadmap_saved_review(text,uuid,jsonb) is 'Justyn/Caroline exact saved Revision2 read and cited feedback only. One separately audited replacement window ends no later than 2026-10-24T13:00Z. No processing authority.';

-- No grant, audit, consent, version, job or control writes occur during installation.
do $$begin
 if clock_timestamp()>='2026-10-24T13:00:00Z'::timestamptz then raise exception 'Replacement review window expired before installation';end if;
 if (select jsonb_agg(to_jsonb(g)order by id)from private.roadmap_saved_review_grants g) is distinct from (select grants from pg_temp.rva_review_renewal_preservation)
 or (select jsonb_agg(to_jsonb(a)order by sequence)from private.roadmap_saved_review_audit a) is distinct from (select audit from pg_temp.rva_review_renewal_preservation)
 then raise exception 'Historical review authority changed during migration';end if;
end $$;
commit;
