"""Build a local layered lock-order proposal; never connects to any database."""
from pathlib import Path
import hashlib,re,json
ROOT=Path(__file__).resolve().parents[2]
src=(ROOT/'proposals/issue-61/wave4/correction.sql').read_text()
def fn(name):
 m=re.search(r'CREATE FUNCTION private\.'+name+r'\(\) RETURNS trigger.*?\$function\$(.*?)\$function\$;',src,re.S)
 if not m: raise RuntimeError(name)
 return m.group(0),m.group(1)
original,body=fn('wave4_usage_before')
needle="begin\n  for v_key in"
replacement="""begin
  -- New rows lock the authoritative session before the shared allowance key.
  -- An existing row already holds its usage lock. Its tuple is immutable and
  -- the session-binding guard forbids transfers while that row exists; taking
  -- a session SHARE lock again would invert the session sync/upsert lock order.
  if TG_OP='INSERT' then
    select * into s from public.coaching_sessions where id=NEW.coaching_session_id for share;
  elsif TG_OP='UPDATE' then
    select * into s from public.coaching_sessions where id=NEW.coaching_session_id;
  end if;
  for v_key in"""
assert body.count(needle)==1
newbody=body.replace(needle,replacement).replace("  select * into s from public.coaching_sessions where id=NEW.coaching_session_id for share;\n  if not found or NEW.contact_id", "  if s.id is null or NEW.contact_id")
newbody=newbody.replace("  for v_key in\n", "  -- INSERT ON CONFLICT must not hold the allowance key while waiting on an existing usage row.\n  -- Successful inserts are serialized by the unchanged AFTER aggregation trigger.\n  if TG_OP<>'INSERT' then\n  for v_key in\n",1).replace("  end loop;\n  if TG_OP='DELETE'", "  end loop;\n  end if;\n  if TG_OP='DELETE'",1)
assert newbody!=body
_,sessionbody=fn('wave4_session_binding_before')
def md5(s):return hashlib.md5(s.encode()).hexdigest()
def guard(expected, marker):
 return f"""DO $guard$
BEGIN
 IF (SELECT md5(prosrc) FROM pg_proc WHERE oid='private.wave4_usage_before()'::regprocedure) IS DISTINCT FROM '{md5(expected)}' THEN RAISE EXCEPTION '{marker} usage routine drift'; END IF;
 IF (SELECT md5(prosrc) FROM pg_proc WHERE oid='private.wave4_session_binding_before()'::regprocedure) IS DISTINCT FROM '{md5(sessionbody)}' THEN RAISE EXCEPTION '{marker} immutable session guard drift'; END IF;
 IF (SELECT prosecdef IS DISTINCT FROM true OR pg_get_userbyid(proowner) IS DISTINCT FROM 'postgres' OR proconfig IS DISTINCT FROM ARRAY['search_path=\"\"']::text[] OR proacl::text IS DISTINCT FROM '{{postgres=X/postgres}}' FROM pg_proc WHERE oid='private.wave4_usage_before()'::regprocedure) THEN RAISE EXCEPTION '{marker} usage security metadata drift'; END IF;
 IF (SELECT prosecdef IS DISTINCT FROM true OR pg_get_userbyid(proowner) IS DISTINCT FROM 'postgres' OR proconfig IS DISTINCT FROM ARRAY['search_path=\"\"']::text[] OR proacl::text IS DISTINCT FROM '{{postgres=X/postgres}}' FROM pg_proc WHERE oid='private.wave4_session_binding_before()'::regprocedure) THEN RAISE EXCEPTION '{marker} immutable session guard security metadata drift'; END IF;
 IF NOT EXISTS(SELECT FROM pg_trigger WHERE tgrelid='public.coaching_entitlement_usage'::regclass AND tgname='wave4_usage_before' AND NOT tgisinternal AND tgenabled='O' AND tgtype=31 AND tgattr::text='' AND tgfoid='private.wave4_usage_before()'::regprocedure) THEN RAISE EXCEPTION '{marker} usage trigger drift'; END IF;
 IF NOT EXISTS(SELECT FROM pg_trigger WHERE tgrelid='public.coaching_sessions'::regclass AND tgname='wave4_session_binding_before' AND NOT tgisinternal AND tgenabled='O' AND tgtype=23 AND tgattr::text=(SELECT string_agg(attnum::text,' ' ORDER BY CASE attname WHEN 'contact_id' THEN 1 ELSE 2 END) FROM pg_attribute WHERE attrelid='public.coaching_sessions'::regclass AND attname IN ('contact_id','membership_id')) AND tgfoid='private.wave4_session_binding_before()'::regprocedure) THEN RAISE EXCEPTION '{marker} session trigger drift'; END IF;
 IF EXISTS(SELECT FROM pg_roles WHERE rolname IN ('authenticated','anon') AND (rolsuper OR rolbypassrls)) THEN RAISE EXCEPTION '{marker} caller privilege drift'; END IF;
END $guard$;
"""
for name,before,after in [('correction',body,newbody),('revert',newbody,body)]:
 sql="-- LOCAL LAYERED PROPOSAL ONLY. Requires the separately reviewed local Wave4 predecessor.\nBEGIN;\nSET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='30s';\n"+guard(before,'Wave5 '+name)+original.replace('CREATE FUNCTION','CREATE OR REPLACE FUNCTION',1).replace(body,after)+'\nCOMMIT;\n'
 (ROOT/'proposals/wave5-operations'/f'{name}.sql').write_text(sql)
manifest={'base':'024b1c20c802ce6a9470fc46fabdd3bae75ed980','scope':'one existing private trigger function body; no ACL/schema/policy/data changes','function':'private.wave4_usage_before()','originalProsrcMd5':md5(body),'correctedProsrcMd5':md5(newbody),'sessionGuardProsrcMd5':md5(sessionbody),'files':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in (ROOT/'proposals/wave5-operations').glob('*.sql')}}
(ROOT/'tests/wave5-operations/proposal-contract.json').write_text(json.dumps(manifest,indent=2)+'\n')
