-- LOCAL LAYERED PROPOSAL ONLY. Requires the separately reviewed local Wave4 predecessor.
BEGIN;
SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='30s';
DO $guard$
BEGIN
 IF (SELECT md5(prosrc) FROM pg_proc WHERE oid='private.wave4_usage_before()'::regprocedure) IS DISTINCT FROM 'af337b7d4c7afccddf3a63ce6308297f' THEN RAISE EXCEPTION 'Wave5 correction usage routine drift'; END IF;
 IF (SELECT md5(prosrc) FROM pg_proc WHERE oid='private.wave4_session_binding_before()'::regprocedure) IS DISTINCT FROM '80325a9c1722e12cfc78705092928f0d' THEN RAISE EXCEPTION 'Wave5 correction immutable session guard drift'; END IF;
 IF (SELECT prosecdef IS DISTINCT FROM true OR pg_get_userbyid(proowner) IS DISTINCT FROM 'postgres' OR proconfig IS DISTINCT FROM ARRAY['search_path=""']::text[] OR proacl::text IS DISTINCT FROM '{postgres=X/postgres}' FROM pg_proc WHERE oid='private.wave4_usage_before()'::regprocedure) THEN RAISE EXCEPTION 'Wave5 correction usage security metadata drift'; END IF;
 IF (SELECT prosecdef IS DISTINCT FROM true OR pg_get_userbyid(proowner) IS DISTINCT FROM 'postgres' OR proconfig IS DISTINCT FROM ARRAY['search_path=""']::text[] OR proacl::text IS DISTINCT FROM '{postgres=X/postgres}' FROM pg_proc WHERE oid='private.wave4_session_binding_before()'::regprocedure) THEN RAISE EXCEPTION 'Wave5 correction immutable session guard security metadata drift'; END IF;
 IF NOT EXISTS(SELECT FROM pg_trigger WHERE tgrelid='public.coaching_entitlement_usage'::regclass AND tgname='wave4_usage_before' AND NOT tgisinternal AND tgenabled='O' AND tgtype=31 AND tgattr::text='' AND tgfoid='private.wave4_usage_before()'::regprocedure) THEN RAISE EXCEPTION 'Wave5 correction usage trigger drift'; END IF;
 IF NOT EXISTS(SELECT FROM pg_trigger WHERE tgrelid='public.coaching_sessions'::regclass AND tgname='wave4_session_binding_before' AND NOT tgisinternal AND tgenabled='O' AND tgtype=23 AND tgattr::text=(SELECT string_agg(attnum::text,' ' ORDER BY CASE attname WHEN 'contact_id' THEN 1 ELSE 2 END) FROM pg_attribute WHERE attrelid='public.coaching_sessions'::regclass AND attname IN ('contact_id','membership_id')) AND tgfoid='private.wave4_session_binding_before()'::regprocedure) THEN RAISE EXCEPTION 'Wave5 correction session trigger drift'; END IF;
 IF EXISTS(SELECT FROM pg_roles WHERE rolname IN ('authenticated','anon') AND (rolsuper OR rolbypassrls)) THEN RAISE EXCEPTION 'Wave5 correction caller privilege drift'; END IF;
END $guard$;
CREATE OR REPLACE FUNCTION private.wave4_usage_before() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $function$
declare v_key text; s public.coaching_sessions%rowtype;
begin
  -- New rows lock the authoritative session before the shared allowance key.
  -- An existing row already holds its usage lock. Its tuple is immutable and
  -- the session-binding guard forbids transfers while that row exists; taking
  -- a session SHARE lock again would invert the session sync/upsert lock order.
  if TG_OP='INSERT' then
    select * into s from public.coaching_sessions where id=NEW.coaching_session_id for share;
  elsif TG_OP='UPDATE' then
    select * into s from public.coaching_sessions where id=NEW.coaching_session_id;
  end if;
  -- INSERT ON CONFLICT must not hold the allowance key while waiting on an existing usage row.
  -- Successful inserts are serialized by the unchanged AFTER aggregation trigger.
  if TG_OP<>'INSERT' then
  for v_key in
    select distinct k from unnest(array[
      case when TG_OP<>'INSERT' then OLD.membership_id::text||'/'||OLD.entitlement_key end,
      case when TG_OP<>'DELETE' then NEW.membership_id::text||'/'||NEW.entitlement_key end
    ]) k where k is not null order by k
  loop
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('rva-allowance-v1/'||v_key,0));
  end loop;
  end if;
  if TG_OP='DELETE' then return OLD; end if;
  if TG_OP='UPDATE' and (
    NEW.coaching_session_id is distinct from OLD.coaching_session_id
    or NEW.membership_id is distinct from OLD.membership_id
    or NEW.contact_id is distinct from OLD.contact_id
    or NEW.entitlement_key is distinct from OLD.entitlement_key
  ) then raise exception 'Session-backed usage binding cannot be transferred' using errcode='23514'; end if;
  if s.id is null or NEW.contact_id is distinct from s.contact_id
     or NEW.membership_id is distinct from s.membership_id
     or NEW.entitlement_key is distinct from 'private_coaching' then
    raise exception 'Invalid session-backed usage relationship' using errcode='23514';
  end if;
  if not exists(select 1 from public.client_memberships cm where cm.id=NEW.membership_id
    and (cm.primary_contact_id=NEW.contact_id or exists(select 1 from public.client_access ca where ca.contact_id=NEW.contact_id and ca.membership_id=cm.id))) then
    raise exception 'Session contact has no explicit membership relationship' using errcode='23514';
  end if;
  if NEW.entitlement_id is not null and not exists(
    select 1 from public.membership_entitlements me where me.id=NEW.entitlement_id
      and me.membership_id=NEW.membership_id and me.entitlement_key=NEW.entitlement_key
  ) then raise exception 'Invalid session-backed entitlement relationship' using errcode='23514'; end if;
  if auth.uid() is not null then NEW.updated_by:=auth.uid(); end if;
  return NEW;
end;
$function$;
COMMIT;
