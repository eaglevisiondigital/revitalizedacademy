begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
do $guard$
begin
 perform pg_advisory_xact_lock(18062026);
 if(select encode(extensions.digest(pg_get_functiondef('public.roadmap_saved_review(text,uuid,jsonb)'::regprocedure),'sha256'),'hex'))is distinct from '1501a1571f87852107920d07a454c29f8bef0c5174556ec7b9f50d3e1e6977cb'then raise exception 'Reviewed saved-review source changed or repair already installed';end if;
 if(select encode(extensions.digest(pg_get_functiondef('private.roadmap_alex_context(text)'::regprocedure),'sha256'),'hex'))is distinct from '09b732a1c2debc38ca70a14a20ef5074a630051c567fecfc752887d3357f3283'then raise exception 'Reviewed saved-review dependency changed';end if;
 if(select encode(extensions.digest(pg_get_functiondef('private.roadmap_saved_review_api(text,uuid,jsonb)'::regprocedure),'sha256'),'hex'))is distinct from '65e17e68bd4a3cb25abea63344954246bf656b43fa33db37e76b909d48c21180'then raise exception 'Reviewed saved-review dependency changed';end if;
 if(select encode(extensions.digest(pg_get_functiondef('private.roadmap_alex_prior_saved_review(text,uuid,jsonb)'::regprocedure),'sha256'),'hex'))is distinct from '8d86c61271b260579aab5334487a497ccb0bfd0b3a008ff40cd5fbc93298be1f'then raise exception 'Reviewed saved-review dependency changed';end if;
end $guard$;
create temporary table rva_saved_review_security_snapshot on commit drop as select jsonb_build_object('owner',proowner,'acl',proacl,'definer',prosecdef,'config',proconfig,'args',proargtypes,'returns',prorettype)as security from pg_proc where oid='public.roadmap_saved_review(text,uuid,jsonb)'::regprocedure;
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
 c:=private.roadmap_alex_context('read');
 select *into v from private.roadmap_processing_versions where job_id=(select(pin->>'job')::uuid from private.roadmap_alex_contract where singleton)and revision=1;
 if v.id is null then raise;end if;
 rows:='[]'::jsonb;
 end;
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
end $function$
;

do $verify$begin
 if(select encode(extensions.digest(pg_get_functiondef('public.roadmap_saved_review(text,uuid,jsonb)'::regprocedure),'sha256'),'hex'))is distinct from '8d516cd8725526dc28fea402ff9b8c0bdf753f4932149dc213d6668e96338bd2'then raise exception 'Saved-review repaired definition mismatch';end if;
 if (select jsonb_build_object('owner',proowner,'acl',proacl,'definer',prosecdef,'config',proconfig,'args',proargtypes,'returns',prorettype)from pg_proc where oid='public.roadmap_saved_review(text,uuid,jsonb)'::regprocedure)is distinct from(select security from pg_temp.rva_saved_review_security_snapshot)then raise exception 'Saved-review security metadata changed';end if;
end $verify$;
commit;
