-- LOCAL READINESS SPECIFICATION, NOT A HOSTED MIGRATION. Never apply with db push.
-- Exercises existing B1 persistence with operator-designated fictional fixtures only.
-- No production read route, real scoring switch or participant enrolment is installed.
begin;
create table private.roadmap_b3_fixtures (
 report_id uuid primary key references public.vitality_reports(id) on delete restrict,
 source_fingerprint text not null check(source_fingerprint ~ '^[a-f0-9]{64}$'),
 purpose text not null check(purpose='fictional_local_readiness')
);
create table private.roadmap_b3_version_context (
 version_id uuid primary key references private.vitality_roadmap_versions(id) on delete restrict,
 adapter_version text not null check(adapter_version='b3-source-coverage-20261016-v1'),
 registry_fingerprint text not null check(registry_fingerprint='2f67c193c2e69b54d61a44599bf9308ca27d317f2bdb748adbeaedfdabe92ced'),
 source_fingerprint text not null check(source_fingerprint ~ '^[a-f0-9]{64}$'),
 calculation_state text not null check(calculation_state='unscored'),
 created_at timestamptz not null default now()
);
alter table private.roadmap_b3_fixtures enable row level security;
alter table private.roadmap_b3_version_context enable row level security;
revoke all on private.roadmap_b3_fixtures,private.roadmap_b3_version_context from public,anon,authenticated,service_role;
create trigger roadmap_b3_context_immutable before update or delete on private.roadmap_b3_version_context
 for each row execute function private.roadmap_append_only();

create function private.roadmap_b3_founder() returns uuid
language plpgsql stable security definer set search_path='' as $$
declare actor uuid;
begin
 actor:=private.roadmap_review_guard();
 if not exists(select 1 from private.vitality_roadmap_approvers a join public.staff_access s on s.user_id=a.user_id
   where a.user_id=actor and s.role='owner' and s.status='active' and s.onboarding_status in ('complete','waived')) then
 raise exception 'Verified designated Owner required' using errcode='42501'; end if;
 return actor;
end $$;
create function private.roadmap_b3_fixture_guard(p_report uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare actor uuid; contact uuid; context jsonb; fingerprint text;
begin
 actor:=private.roadmap_b3_founder();
 select r.contact_id,f.source_fingerprint into contact,fingerprint from private.roadmap_b3_fixtures f
 join public.vitality_reports r on r.id=f.report_id where f.report_id=p_report;
 if contact is null then raise exception 'B3 real participant pilot is held' using errcode='42501'; end if;
 perform private.roadmap_review_guard(contact);
 context:=public.get_vitality_roadmap_preparation(p_report);
 if context->'source'->>'pathway' is distinct from 'Adult' or context->'source'->>'assessment_for' is distinct from 'Myself'
 or context->'source'->>'status' is distinct from 'completed'
 or context->>'questionnaire_version' is distinct from 'secure-snapshot-v1'
 or jsonb_typeof(context->'source'->'answers') is distinct from 'object'
 or context->'source'->'answers'='{}'::jsonb then
 raise exception 'Completed explicit Adult/Myself reference source required' using errcode='55000'; end if;
 if encode(extensions.digest((context->'source')::text,'sha256'),'hex')<>fingerprint then
 raise exception 'Fixture source changed; operator provenance review required' using errcode='40001'; end if;
 return context||jsonb_build_object('pilot_execution','held','real_scoring_enabled',false,'fixture_only',true,
 'adapter_version','b3-source-coverage-20261016-v1','registry_fingerprint','2f67c193c2e69b54d61a44599bf9308ca27d317f2bdb748adbeaedfdabe92ced');
end $$;
create function public.get_vitality_roadmap_b3_fixture(p_report_id uuid) returns jsonb
language sql stable security definer set search_path='' as $$ select private.roadmap_b3_fixture_guard(p_report_id); $$;
create function public.list_vitality_roadmap_b3_fixtures() returns setof jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 perform private.roadmap_b3_founder();
 return query select r from public.list_vitality_roadmap_preparation() r
 where exists(select 1 from private.roadmap_b3_fixtures f where f.report_id=(r->>'report_id')::uuid);
end $$;
create function public.save_vitality_roadmap_b3_fixture(p_report_id uuid,p_expected_version integer,p_request_id uuid,p_action text,p_state text,p_reason text,p_document jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare context jsonb; result jsonb; v private.vitality_roadmap_versions;
begin
 context:=private.roadmap_b3_fixture_guard(p_report_id);
 result:=public.save_vitality_roadmap_draft(p_report_id,p_expected_version,p_request_id,p_action,p_state,p_reason,p_document);
 select * into strict v from private.vitality_roadmap_versions where report_id=p_report_id and version=(result->>'version')::integer;
 if v.source_fingerprint<>encode(extensions.digest((context->'source')::text,'sha256'),'hex') then
 raise exception 'Fixture source changed during save' using errcode='40001'; end if;
 insert into private.roadmap_b3_version_context(version_id,adapter_version,registry_fingerprint,source_fingerprint,calculation_state)
 values(v.id,'b3-source-coverage-20261016-v1','2f67c193c2e69b54d61a44599bf9308ca27d317f2bdb748adbeaedfdabe92ced',v.source_fingerprint,'unscored') on conflict do nothing;
 return result||jsonb_build_object('approval','held','release','held','email','held','real_scoring_enabled',false);
end $$;
create function public.get_vitality_roadmap_b3_fixture_version(p_report_id uuid,p_version integer) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare context jsonb; saved jsonb; provenance jsonb;
begin
 context:=private.roadmap_b3_fixture_guard(p_report_id);
 saved:=public.get_vitality_roadmap_saved_version(p_report_id,p_version);
 select jsonb_build_object('adapter_version',c.adapter_version,'registry_fingerprint',c.registry_fingerprint,
 'source_fingerprint',c.source_fingerprint,'calculation_state',c.calculation_state) into provenance
 from private.roadmap_b3_version_context c join private.vitality_roadmap_versions v on v.id=c.version_id
 where v.report_id=p_report_id and v.version=p_version;
 return saved||jsonb_build_object('provenance',provenance,'release','held');
end $$;
revoke all on function private.roadmap_b3_fixture_guard(uuid) from public,anon,authenticated,service_role;
revoke all on function private.roadmap_b3_founder() from public,anon,authenticated,service_role;
revoke all on function public.get_vitality_roadmap_b3_fixture(uuid),public.list_vitality_roadmap_b3_fixtures(),public.save_vitality_roadmap_b3_fixture(uuid,integer,uuid,text,text,text,jsonb),public.get_vitality_roadmap_b3_fixture_version(uuid,integer) from public,anon,authenticated,service_role;
grant execute on function public.get_vitality_roadmap_b3_fixture(uuid),public.list_vitality_roadmap_b3_fixtures(),public.save_vitality_roadmap_b3_fixture(uuid,integer,uuid,text,text,text,jsonb),public.get_vitality_roadmap_b3_fixture_version(uuid,integer) to authenticated;
commit;
