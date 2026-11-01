from pathlib import Path
import json,hashlib,re
root=Path(__file__).resolve().parents[2]; out=root/'proposals/wave5-security';out.mkdir(parents=True,exist_ok=True)
m=json.loads((root/'tests/wave3-allowance/current-subset.json').read_text())
def lit(x): return "'"+x.replace("'","''")+"'"
def js(x): return lit(json.dumps(x,separators=(',',':')))+'::jsonb'
def scope(permission,col):return f"(private.active_staff_session() AND private.staff_action_allowed(auth.uid(),'{permission}',{col}))"
member_read=f"({scope('crm.view','primary_contact_id')} OR id IN(SELECT ca.membership_id FROM public.client_access ca WHERE ca.user_id=auth.uid()))"
member_write=scope('crm.manage','primary_contact_id')
access_read=f"({scope('crm.view','contact_id')} OR user_id=auth.uid())"
access_write=f"({scope('crm.manage','contact_id')} AND (membership_id IS NULL OR private.wave4_membership_allowed(membership_id,'coaching.manage')))"
policies=[]
for table,read,write in [('client_memberships',member_read,member_write),('client_access',access_read,access_write)]:
 for command,using,check in [('SELECT',read,None),('INSERT',None,write),('UPDATE',write,write)]:
  name=f'wave5_{table}_scope_{command.lower()}'
  sql=f'CREATE POLICY {name} ON public.{table} AS RESTRICTIVE FOR {command} TO authenticated'+(f' USING ({using})'if using else '')+(f' WITH CHECK ({check})'if check else '')+';'
  policies.append(dict(table=table,name=name,sql=sql))
pre="-- LOCAL ONLY: six additive relationship policies, not a production migration.\nBEGIN;\nSET LOCAL lock_timeout='5s';\nSET LOCAL statement_timeout='30s';\nDO $guard$ DECLARE p regprocedure; BEGIN\n"
for name in ['client_access','client_memberships','coaching_entitlement_usage','membership_entitlements']:
 t=next(t for t in m['tables'] if t['name']==name)
 pre+=f" IF (SELECT relrowsecurity IS DISTINCT FROM true OR relforcerowsecurity IS DISTINCT FROM false OR pg_get_userbyid(relowner) IS DISTINCT FROM 'postgres' OR relacl::text IS DISTINCT FROM {lit('{'+','.join(t['acl'])+'}')} FROM pg_class WHERE oid='public.{name}'::regclass) THEN RAISE EXCEPTION 'Wave5 table security drift: {name}'; END IF;\n"
 if name in ['client_access','client_memberships']: pre+=f" IF (SELECT jsonb_agg(jsonb_build_object('name',polname,'check',pg_get_expr(polwithcheck,polrelid),'roles',ARRAY(SELECT rolname FROM pg_roles WHERE oid=ANY(polroles) ORDER BY rolname),'using',pg_get_expr(polqual,polrelid),'command',polcmd::text,'permissive',polpermissive) ORDER BY polname) FROM pg_policy WHERE polrelid='public.{name}'::regclass) IS DISTINCT FROM {js(sorted(t['policies'],key=lambda p:p['name']))} THEN RAISE EXCEPTION 'Wave5 original policy drift: {name}'; END IF;\n"
for name in ['active_staff_session','staff_can_access_contact','staff_has_permission','staff_action_allowed','full_member_access']:
 r=next(r for r in m['routines']if r['schema']=='private' and r['name']==name)
 sig=f"private.{name}({r['args']})"
 # regprocedure accepts argument names in args only pg_get_function_identity_arguments output? use known types.
 sig={'staff_can_access_contact':'private.staff_can_access_contact(uuid,uuid)','staff_has_permission':'private.staff_has_permission(uuid,text)','staff_action_allowed':'private.staff_action_allowed(uuid,text,uuid)'}.get(name,f'private.{name}()')
 pre+=f" p:={lit(sig)}::regprocedure; IF md5(pg_get_functiondef(p)) IS DISTINCT FROM {lit(hashlib.md5(r['definition'].encode()).hexdigest())} THEN RAISE EXCEPTION 'Wave5 authorization dependency drift: {name}'; END IF;\n"
wave4=(root/'proposals/issue-61/wave4/correction.sql').read_text()
body=re.search(r'CREATE FUNCTION private\.wave4_membership_allowed\(.*?AS \$function\$(.*?)\$function\$;',wave4,re.S).group(1)
pre+=f" p:='private.wave4_membership_allowed(uuid,text)'::regprocedure; IF (SELECT md5(prosrc) IS DISTINCT FROM {lit(hashlib.md5(body.encode()).hexdigest())} OR prosecdef IS DISTINCT FROM true OR pg_get_userbyid(proowner) IS DISTINCT FROM 'postgres' OR proconfig IS DISTINCT FROM ARRAY['search_path=\"\"']::text[] OR proacl::text IS DISTINCT FROM '{{postgres=X/postgres,authenticated=X/postgres}}' FROM pg_proc WHERE oid=p) THEN RAISE EXCEPTION 'Wave5 accepted boolean dependency drift'; END IF;\n"
pre+=" IF EXISTS(SELECT FROM pg_roles WHERE rolname IN('authenticated','anon') AND (rolsuper OR rolbypassrls)) THEN RAISE EXCEPTION 'Wave5 caller-role drift'; END IF;\nEND $guard$;\n"
for p in policies:pre+=f"DO $collision$ BEGIN IF EXISTS(SELECT FROM pg_policy WHERE polrelid='public.{p['table']}'::regclass AND polname='{p['name']}') THEN RAISE EXCEPTION 'Wave5 policy collision'; END IF; END $collision$;\n"
targets=['coaching_entitlement_usage','membership_entitlements','client_memberships','client_access']
forward=pre+'\n'.join(p['sql']for p in policies)+'\n'+''.join(f'REVOKE TRUNCATE ON TABLE public.{t} FROM authenticated;\n'for t in targets)+'COMMIT;\n'
(out/'correction.sql').write_text(forward)
revert="-- LOCAL regression proof only; dropping these policies restores known exposure.\nBEGIN;\nSET LOCAL lock_timeout='5s';\nSET LOCAL statement_timeout='30s';\n"+'\n'.join(f"DROP POLICY {p['name']} ON public.{p['table']};"for p in reversed(policies))+'\n'+''.join(f'GRANT TRUNCATE ON TABLE public.{t} TO authenticated;\n'for t in targets)+'COMMIT;\n'
(out/'revert.sql').write_text(revert)
manifest={'base':'024b1c20c802ce6a9470fc46fabdd3bae75ed980','scope':'LOCAL_NONPRODUCTION_ONLY','objects':[{k:p[k]for k in ['table','name']}for p in policies],'newFunctions':[],'changedFunctions':[],'grants':[],'revokes':[{'table':t,'role':'authenticated','privilege':'TRUNCATE'}for t in targets],'files':[{ 'path':str(p.relative_to(root)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}for p in [out/'correction.sql',out/'revert.sql']]}
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
