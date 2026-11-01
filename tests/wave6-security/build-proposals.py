from pathlib import Path
import json,hashlib,re
root=Path(__file__).resolve().parents[2]; out=root/'proposals/wave6-security';out.mkdir(parents=True,exist_ok=True)
catalog=json.loads((root/'tests/wave5-operations/current-operations-catalog.json').read_text());deps=json.loads((root/'tests/wave3-allowance/current-subset.json').read_text())
def lit(x):return "'"+x.replace("'","''")+"'"
def js(x):return lit(json.dumps(x,separators=(',',':')))+'::jsonb'
def staff(permission,col='contact_id'):return f"(private.active_staff_session() AND private.staff_action_allowed(auth.uid(),'{permission}',{col}))"
def member(col='contact_id'):return f"({col} IN (SELECT ca.contact_id FROM public.client_access ca WHERE ca.user_id=auth.uid() AND ca.status='active' AND NOT ca.needs_onboarding_claim))"
def tuple_match(table):return f"({table}.membership_id IS NULL OR EXISTS(SELECT FROM public.client_memberships cm WHERE cm.id={table}.membership_id AND cm.status='active' AND (cm.primary_contact_id={table}.contact_id OR EXISTS(SELECT FROM public.client_access ca WHERE ca.membership_id=cm.id AND ca.contact_id={table}.contact_id AND ca.status IN('active','ready')))))"
policies=[]
for t in ['client_checkins','client_assignments']:
 for cmd in ['SELECT','INSERT','UPDATE']:
  permission='coaching.view'if cmd=='SELECT'else'coaching.manage'
  scope=staff(permission)
  if cmd in ['SELECT','INSERT']:scope=f"({scope} OR {member()})"if t=='client_checkins' or cmd=='SELECT'else scope
  # Existing member INSERT is retained only where an original permissive policy already permits it.
  if cmd!='SELECT':scope=f"({scope} AND {tuple_match(t)})"
  policies.append(dict(table=t,name=f'wave6_{t}_scope_{cmd.lower()}',command=cmd,using=scope if cmd!='INSERT'else None,check=scope if cmd!='SELECT'else None))
# No implied family sharing: existing broad client household branch narrows to own contact.
for cmd in ['SELECT','INSERT','UPDATE']:
 s=staff('crm.view'if cmd=='SELECT'else'crm.manage')
 if cmd=='SELECT':s=f"({s} OR {member()})"
 if cmd=='INSERT':s+= " AND EXISTS(SELECT FROM public.households h WHERE h.id=household_members.household_id AND private.staff_action_allowed(auth.uid(),'crm.manage',h.primary_contact_id)) AND (guardian_contact_id IS NULL OR private.staff_action_allowed(auth.uid(),'crm.manage',guardian_contact_id))"
 policies.append(dict(table='household_members',name='wave6_household_members_scope_'+cmd.lower(),command=cmd,using=s if cmd!='INSERT'else None,check=s if cmd!='SELECT'else None))
pre="-- LOCAL ONLY. Additive restriction; never run against production under development approval.\nBEGIN;\nSET LOCAL lock_timeout='5s';\nSET LOCAL statement_timeout='30s';\nLOCK TABLE public.client_checkins,public.client_assignments,public.household_members IN ACCESS EXCLUSIVE MODE;\nDO $guard$ DECLARE p regprocedure; BEGIN\n"
for t in catalog['tables']:
 name=t['name'];pre+=f" IF (SELECT relrowsecurity IS DISTINCT FROM true OR relforcerowsecurity IS DISTINCT FROM false OR pg_get_userbyid(relowner) IS DISTINCT FROM 'postgres' OR relacl::text IS DISTINCT FROM {lit(t['acl'])} FROM pg_class WHERE oid='public.{name}'::regclass) THEN RAISE EXCEPTION 'Wave6 table security drift: {name}'; END IF;\n"
 pre+=f" IF (SELECT jsonb_agg(jsonb_build_object('name',polname,'check',pg_get_expr(polwithcheck,polrelid),'roles',ARRAY(SELECT rolname FROM pg_roles WHERE oid=ANY(polroles) ORDER BY rolname),'using',pg_get_expr(polqual,polrelid),'command',polcmd::text,'permissive',polpermissive) ORDER BY polname) FROM pg_policy WHERE polrelid='public.{name}'::regclass) IS DISTINCT FROM {js(sorted(t['policies'],key=lambda p:p['name']))} THEN RAISE EXCEPTION 'Wave6 policy drift: {name}'; END IF;\n"
 pre+=f" IF (SELECT jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod),'default',pg_get_expr(d.adbin,d.adrelid),'notNull',a.attnotnull) ORDER BY a.attnum) FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum WHERE a.attrelid='public.{name}'::regclass AND a.attnum>0 AND NOT a.attisdropped) IS DISTINCT FROM {js(t['columns'])} THEN RAISE EXCEPTION 'Wave6 column drift: {name}'; END IF;\n"
 pre+=f" IF (SELECT jsonb_agg(pg_get_indexdef(indexrelid) ORDER BY pg_get_indexdef(indexrelid)) FROM pg_index WHERE indrelid='public.{name}'::regclass) IS DISTINCT FROM {js(sorted(t['indexes']))} THEN RAISE EXCEPTION 'Wave6 index drift: {name}'; END IF;\n"
 for tr in t['triggers']:
  pre+=f" p:={lit(tr['function'])}::regprocedure; IF md5(pg_get_functiondef(p)) IS DISTINCT FROM {lit(hashlib.md5(tr['functionDefinition'].encode()).hexdigest())} THEN RAISE EXCEPTION 'Wave6 original trigger dependency drift: {tr['name']}'; END IF;\n"
  pre+=f" IF (SELECT pg_get_userbyid(proowner) IS DISTINCT FROM {lit(tr['owner'])} OR prosecdef IS DISTINCT FROM {'true'if tr['securityDefiner']else'false'} OR proconfig IS DISTINCT FROM ARRAY[{','.join(lit(x)for x in tr['config'])}]::text[] OR proacl::text IS DISTINCT FROM {lit(tr['acl'])if tr['acl']is not None else'NULL'} FROM pg_proc WHERE oid=p) THEN RAISE EXCEPTION 'Wave6 original trigger security drift: {tr['name']}'; END IF;\n"
for name in ['active_staff_session','staff_action_allowed','staff_can_access_contact','staff_has_permission','full_member_access']:
 r=next(r for r in deps['routines']if r['schema']=='private'and r['name']==name);sig={'staff_action_allowed':'private.staff_action_allowed(uuid,text,uuid)','staff_can_access_contact':'private.staff_can_access_contact(uuid,uuid)','staff_has_permission':'private.staff_has_permission(uuid,text)'}.get(name,f'private.{name}()')
 pre+=f" p:={lit(sig)}::regprocedure; IF md5(pg_get_functiondef(p)) IS DISTINCT FROM {lit(hashlib.md5(r['definition'].encode()).hexdigest())} THEN RAISE EXCEPTION 'Wave6 authorization dependency drift: {name}'; END IF;\n"
pre+=" IF EXISTS(SELECT FROM pg_roles WHERE rolname IN('authenticated','anon') AND (rolsuper OR rolbypassrls)) THEN RAISE EXCEPTION 'Wave6 caller-role drift'; END IF;\n IF to_regprocedure('private.wave6_operation_tuple_before()') IS NOT NULL THEN RAISE EXCEPTION 'Wave6 function collision'; END IF;\nEND $guard$;\n"
fn="""CREATE FUNCTION private.wave6_operation_tuple_before() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $function$
BEGIN
 -- Trusted existing postgres/service-role workflows remain untouched; no caller receives those roles here.
 IF current_user NOT IN ('authenticated','anon') THEN RETURN NEW; END IF;
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authenticated actor required' USING ERRCODE='42501'; END IF;
 IF TG_TABLE_NAME='client_checkins' THEN
  IF TG_OP='INSERT' AND NEW.created_by IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Check-in actor mismatch' USING ERRCODE='42501'; END IF;
  IF TG_OP='UPDATE' AND ROW(NEW.contact_id,NEW.membership_id,NEW.template_id,NEW.period_start,NEW.period_end,NEW.created_by,NEW.responses) IS DISTINCT FROM ROW(OLD.contact_id,OLD.membership_id,OLD.template_id,OLD.period_start,OLD.period_end,OLD.created_by,OLD.responses) THEN RAISE EXCEPTION 'Check-in source tuple is immutable' USING ERRCODE='42501'; END IF;
  IF NEW.reviewed_by IS NOT NULL AND (TG_OP='INSERT' OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by) AND NEW.reviewed_by IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Reviewer actor mismatch' USING ERRCODE='42501'; END IF;
 ELSIF TG_TABLE_NAME='client_assignments' THEN
  IF TG_OP='INSERT' AND NEW.assigned_by IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Assignment actor mismatch' USING ERRCODE='42501'; END IF;
  IF TG_OP='UPDATE' AND ROW(NEW.contact_id,NEW.membership_id,NEW.assigned_by) IS DISTINCT FROM ROW(OLD.contact_id,OLD.membership_id,OLD.assigned_by) THEN RAISE EXCEPTION 'Assignment source tuple is immutable' USING ERRCODE='42501'; END IF;
 ELSIF TG_TABLE_NAME='household_members' THEN
  IF TG_OP='UPDATE' AND ROW(NEW.household_id,NEW.contact_id,NEW.relationship_type,NEW.sex,NEW.is_primary,NEW.date_of_birth,NEW.guardian_contact_id) IS DISTINCT FROM ROW(OLD.household_id,OLD.contact_id,OLD.relationship_type,OLD.sex,OLD.is_primary,OLD.date_of_birth,OLD.guardian_contact_id) THEN RAISE EXCEPTION 'Household identity change requires separately reviewed workflow' USING ERRCODE='42501'; END IF;
  IF TG_OP='INSERT' AND NEW.guardian_contact_id IS NOT NULL THEN RAISE EXCEPTION 'New guardian binding requires separately reviewed workflow' USING ERRCODE='42501'; END IF;
 END IF;
 RETURN NEW;
END;
$function$;
ALTER FUNCTION private.wave6_operation_tuple_before() OWNER TO postgres;
REVOKE ALL ON FUNCTION private.wave6_operation_tuple_before() FROM PUBLIC,anon,authenticated,service_role;
"""
forward=pre+fn
for p in policies:
 forward+=f"CREATE POLICY {p['name']} ON public.{p['table']} AS RESTRICTIVE FOR {p['command']} TO authenticated"+(f" USING ({p['using']})"if p['using']else'')+(f" WITH CHECK ({p['check']})"if p['check']else'')+';\n'
for t in ['client_checkins','client_assignments','household_members']:
 forward+=f"CREATE TRIGGER a_wave6_operation_tuple_before BEFORE INSERT OR UPDATE ON public.{t} FOR EACH ROW EXECUTE FUNCTION private.wave6_operation_tuple_before();\nREVOKE TRUNCATE ON TABLE public.{t} FROM authenticated;\n"
forward+='COMMIT;\n';(out/'correction.sql').write_text(forward)
revert="-- LOCAL regression only: restores demonstrated exposure. Not a recommended production rollback.\nBEGIN;\nSET LOCAL lock_timeout='5s';\n"
revert+="DO $guard$ BEGIN\n IF (SELECT md5(prosrc) IS DISTINCT FROM "+lit(hashlib.md5(fn.split('$function$')[1].encode()).hexdigest())+" OR prosecdef IS DISTINCT FROM false OR proconfig IS DISTINCT FROM ARRAY['search_path=\"\"']::text[] OR pg_get_userbyid(proowner) IS DISTINCT FROM 'postgres' OR proacl::text IS DISTINCT FROM '{postgres=X/postgres}' FROM pg_proc WHERE oid='private.wave6_operation_tuple_before()'::regprocedure) THEN RAISE EXCEPTION 'Wave6 revert function drift'; END IF;\n"
for p in policies:
 revert+=f" IF NOT EXISTS(SELECT FROM pg_policy WHERE polrelid='public.{p['table']}'::regclass AND polname='{p['name']}' AND polpermissive=false AND polroles=ARRAY['authenticated'::regrole]::oid[] AND polcmd='{dict(SELECT='r',INSERT='a',UPDATE='w')[p['command']]}') THEN RAISE EXCEPTION 'Wave6 revert policy drift'; END IF;\n"
revert+="END $guard$;\n"
for t in ['client_checkins','client_assignments','household_members']:revert+=f'DROP TRIGGER a_wave6_operation_tuple_before ON public.{t};\nGRANT TRUNCATE ON TABLE public.{t} TO authenticated;\n'
for p in reversed(policies):revert+=f"DROP POLICY {p['name']} ON public.{p['table']};\n"
revert+='DROP FUNCTION private.wave6_operation_tuple_before();\nCOMMIT;\n';(out/'revert.sql').write_text(revert)
manifest={'base':'9beae3bb40c154d2bfd623e8d2355b3a6c3cd306','scope':'LOCAL_NONPRODUCTION_ONLY','policies':policies,'newFunctions':[{'signature':'private.wave6_operation_tuple_before()','definer':False,'grantedExecute':[]}],'newTriggers':[{'table':t,'name':'a_wave6_operation_tuple_before'}for t in ['client_checkins','client_assignments','household_members']],'privilegeChanges':[{'table':t,'role':'authenticated','revoke':'TRUNCATE'}for t in ['client_checkins','client_assignments','household_members']],'files':[{'path':str(p.relative_to(root)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}for p in [out/'correction.sql',out/'revert.sql']]}
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
