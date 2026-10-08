-- Repair only the BEFORE-row return contract; preserve INSERT/UPDATE and browser guards.
-- Existing RepDB migrations are already applied. No policy, ACL, FK or trigger changes.
do $preflight$
begin
 if not exists (
  select 1 from pg_catalog.pg_trigger
  where tgrelid='public.exercise_catalog'::regclass
    and tgname='exercise_source_guard'
    and tgfoid='private.guard_exercise_source()'::regprocedure
    and tgtype=31 and tgenabled='O'
 ) then
  raise exception 'Expected enabled BEFORE ROW INSERT/UPDATE/DELETE exercise_source_guard';
 end if;
end;
$preflight$;

CREATE OR REPLACE FUNCTION private.guard_exercise_source()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
 if current_user in ('authenticated','anon') then
  if tg_op='DELETE' then
   if old.exercise_provider is not null and not private.can_manage_exercise_library(auth.uid()) then raise exception 'Owner/Admin required' using errcode='42501';end if;return old;
  end if;
  if tg_op='INSERT' then
   if new.exercise_provider is not null or new.exercise_source<>'{}' or new.exercise_imported_at is not null then raise exception 'Use protected exercise import' using errcode='42501';end if;
  else
   if row(new.exercise_provider,new.provider_exercise_id,new.exercise_source_version,new.exercise_source,new.exercise_imported_at) is distinct from row(old.exercise_provider,old.provider_exercise_id,old.exercise_source_version,old.exercise_source,old.exercise_imported_at) then raise exception 'Use protected exercise refresh' using errcode='42501';end if;
   if old.exercise_provider is not null and not private.can_manage_exercise_library(auth.uid()) then raise exception 'Owner/Admin required' using errcode='42501';end if;
  end if;
  if new.revitalized_approved and (tg_op='INSERT' or new.revitalized_approved is distinct from old.revitalized_approved) and not private.can_manage_exercise_library(auth.uid()) then raise exception 'Owner/Admin required for approval' using errcode='42501';end if;
  if tg_op='UPDATE' and old.revitalized_approved is distinct from new.revitalized_approved and not private.can_manage_exercise_library(auth.uid()) then raise exception 'Owner/Admin required for approval' using errcode='42501';end if;
 end if;
 -- BEFORE DELETE must return OLD even for trusted database/server callers.
 if tg_op='DELETE' then return old;end if;
 return new;
end; $function$
