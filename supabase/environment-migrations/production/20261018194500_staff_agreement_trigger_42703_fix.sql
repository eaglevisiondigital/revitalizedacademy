-- ReVitalized Academy NDA trigger repair candidate ONLY. No signature/state changes.
-- Supersedes the fragile SQL CASE expression that dereferenced a column absent on staff_agreements.
-- Explicit operator approval and synthetic PostgreSQL 17 acceptance are required before applying.
begin;
do $preflight$
declare attached integer;
begin
 if to_regprocedure('private.sync_staff_onboarding_from_agreements()') is null then
  raise exception 'Expected agreement onboarding trigger function missing';
 end if;
 select count(*) into attached
 from pg_trigger t
 join pg_class c on c.oid=t.tgrelid
 join pg_namespace n on n.oid=c.relnamespace
 join pg_proc p on p.oid=t.tgfoid
 where not t.tgisinternal and n.nspname='public'
   and c.relname in ('staff_agreements','staff_agreement_acceptances')
   and p.oid='private.sync_staff_onboarding_from_agreements()'::regprocedure;
 if attached<>2 then
  raise exception 'Expected exactly two agreement onboarding triggers; found %',attached;
 end if;
end;
$preflight$;

create or replace function private.sync_staff_onboarding_from_agreements()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'private'
as $fn$
declare
 v_staff_user_id uuid;
 v_required integer;
 v_incomplete integer;
 v_declined integer;
begin
 -- Separate PL/pgSQL statements prevent Postgres from resolving table-incompatible
 -- NEW/OLD fields in both arms of a single SQL CASE expression.
 if tg_table_schema <> 'public' then
  raise exception 'Unexpected onboarding trigger schema' using errcode='42501';
 end if;
 if tg_table_name = 'staff_agreements' then
  if tg_op = 'DELETE' then
   v_staff_user_id := old.staff_user_id;
  else
   v_staff_user_id := new.staff_user_id;
  end if;
 elsif tg_table_name = 'staff_agreement_acceptances' then
  if tg_op = 'DELETE' then
   select a.staff_user_id into v_staff_user_id
   from public.staff_agreements a
   where a.id = old.staff_agreement_id;
  else
   select a.staff_user_id into v_staff_user_id
   from public.staff_agreements a
   where a.id = new.staff_agreement_id;
  end if;
 else
  raise exception 'Unexpected onboarding trigger relation' using errcode='42501';
 end if;
 if v_staff_user_id is not null then
  select count(*) filter (where a.required)::integer,
         count(*) filter (where a.required and a.status not in ('signed','waived'))::integer,
         count(*) filter (where a.required and a.status='declined')::integer
   into v_required,v_incomplete,v_declined
   from public.staff_agreements a
  where a.staff_user_id=v_staff_user_id;

  update public.staff_access
     set onboarding_status=case
      when status <> 'active' then onboarding_status
      when coalesce(v_declined,0)>0 then 'blocked'
      when coalesce(v_required,0)=0 then 'complete'
      when coalesce(v_incomplete,0)=0 then 'complete'
      else 'pending'
     end,
     updated_at=now()
   where user_id=v_staff_user_id;
 end if;
 if tg_op='DELETE' then return old; end if;
 return new;
end;
$fn$;
commit;
