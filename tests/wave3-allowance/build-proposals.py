from pathlib import Path
import json,hashlib
root=Path(__file__).resolve().parents[2];meta=json.loads((root/'tests/wave3-allowance/current-subset.json').read_text());rs={(x['schema'],x['name']):x for x in meta['routines']};orig=rs['public','resolve_coaching_entitlement_review']['definition']
fixed=orig.replace('  u public.coaching_entitlement_usage%rowtype;','  u public.coaching_entitlement_usage%rowtype;\n  v_updated integer;')
fixed=fixed.replace('  select * into u from public.coaching_entitlement_usage where id=p_usage_id;','  select * into u from public.coaching_entitlement_usage where id=p_usage_id for update;')
fixed=fixed.replace('  update public.coaching_entitlement_usage\n', '''  -- Existing contact authority is evaluated against the server-selected ledger row.
  if not private.staff_action_allowed((select auth.uid()),'coaching.manage',u.contact_id) then
    raise exception 'Coaching contact access required' using errcode='42501';
  end if;
  -- A partial ledger view must never produce a partial allowance total.
  if not private.staff_has_permission((select auth.uid()),'coaching.view') then
    raise exception 'Complete coaching usage visibility required' using errcode='42501';
  end if;
  -- Lock the ledger row first, then its allowance before the mutation and fresh SUM.
  perform 1 from public.membership_entitlements me
  where me.membership_id=u.membership_id and me.entitlement_key=u.entitlement_key
  for update;
  if not found then
    raise exception 'Coaching allowance is not available' using errcode='42501';
  end if;

  update public.coaching_entitlement_usage
''')
fixed=fixed.replace('  perform private.recalculate_coaching_entitlement_used_value(u.membership_id,u.entitlement_key);','''  -- Same aggregate as the existing private helper, evaluated under caller RLS.
  update public.membership_entitlements me
  set used_value=coalesce((
        select sum(ceu.usage_units)
        from public.coaching_entitlement_usage ceu
        where ceu.membership_id=u.membership_id
          and ceu.entitlement_key=u.entitlement_key
          and ceu.status='consumed'
      ),0),
      updated_at=now()
  where me.membership_id=u.membership_id
    and me.entitlement_key=u.entitlement_key;
  get diagnostics v_updated = row_count;
  if v_updated is distinct from 1 then
    raise exception 'Coaching allowance update was not authorized' using errcode='42501';
  end if;''')
def guard(source):
 out=['DO $guard$','DECLARE p oid;', 'BEGIN']
 for r in [rs['public','resolve_coaching_entitlement_review']]+[rs['private',n]for n in ['recalculate_coaching_entitlement_used_value','staff_action_allowed','staff_has_permission','staff_can_access_contact','active_staff_session','full_member_access','sync_coaching_session_entitlement','sync_coaching_session_status','create_coaching_session_prep_task']]:
  sig=r['schema']+'.'+r['name']+'('+','.join(a.split(' DEFAULT ')[0].split(' ',1)[1] for a in r['args'].split(', ') if a)+')'
  body=source if r['name']=='resolve_coaching_entitlement_review'else r['definition'];md5=hashlib.md5(body.encode()).hexdigest()
  acl='{'+','.join(r['acl'])+'}' if r['acl']else None
  config='ARRAY['+','.join("'"+a.replace("'","''")+"'"for a in r['config'])+']::text[]'if r['config']else 'NULL::text[]'
  out+= [" p := '"+sig+"'::regprocedure;", " IF md5(pg_get_functiondef(p)) IS DISTINCT FROM '"+md5+"' THEN RAISE EXCEPTION 'Issue61 routine definition drift: "+sig+"'; END IF;", " IF (SELECT prosecdef IS DISTINCT FROM "+str(r['security_definer']).lower()+" OR pg_get_userbyid(proowner) IS DISTINCT FROM '"+r['owner']+"' OR proconfig IS DISTINCT FROM "+config+" OR proacl::text IS DISTINCT FROM '"+acl+"' FROM pg_proc WHERE oid=p) THEN RAISE EXCEPTION 'Issue61 security metadata drift: "+sig+"'; END IF;"]
 out += [" IF EXISTS(SELECT FROM pg_trigger WHERE tgrelid IN ('public.coaching_entitlement_usage'::regclass,'public.membership_entitlements'::regclass) AND NOT tgisinternal) THEN RAISE EXCEPTION 'Issue61 usage/entitlement trigger drift'; END IF;"]
 for name in ['coaching_entitlement_usage','membership_entitlements','coaching_sessions']:
  t=next(t for t in meta['tables']if t['name']==name)
  acl='{'+','.join(t['acl'])+'}'
  out += [" IF (SELECT relrowsecurity IS DISTINCT FROM true OR relforcerowsecurity IS DISTINCT FROM false OR pg_get_userbyid(relowner) IS DISTINCT FROM 'postgres' OR relacl::text IS DISTINCT FROM '"+acl+"' FROM pg_class WHERE oid='public."+name+"'::regclass) THEN RAISE EXCEPTION 'Issue61 table security drift: "+name+"'; END IF;"]
  expected=[{k:p[k]for k in ['name','check','roles','using','command','permissive']}for p in t['policies']]
  literal=json.dumps(expected,separators=(',',':')).replace("'","''")
  out += [" IF (SELECT jsonb_agg(jsonb_build_object('name',polname,'check',pg_get_expr(polwithcheck,polrelid),'roles',ARRAY(SELECT rolname FROM pg_roles WHERE oid=ANY(polroles) ORDER BY rolname),'using',pg_get_expr(polqual,polrelid),'command',polcmd::text,'permissive',polpermissive) ORDER BY polname) FROM pg_policy WHERE polrelid='public."+name+"'::regclass) IS DISTINCT FROM '"+literal+"'::jsonb THEN RAISE EXCEPTION 'Issue61 policy drift: "+name+"'; END IF;"]
 out += [" IF EXISTS(SELECT FROM pg_roles WHERE rolname IN ('authenticated','anon') AND (rolsuper OR rolbypassrls)) THEN RAISE EXCEPTION 'Issue61 caller role boundary drift'; END IF;"]
 out+=['END $guard$;'];return '\n'.join(out)+'\n'
for name,old,new in [('correction',orig,fixed),('revert',fixed,orig)]:
 (root/'proposals/issue-61'/f'{name}.sql').write_text('-- PROPOSAL ONLY. Local disposable execution authorized; production requires separate exact approval.\nBEGIN;\n'+guard(old)+new+';\nCOMMIT;\n')
(root/'tests/wave3-allowance/original-rpc.sql').write_text(orig+';\n');(root/'tests/wave3-allowance/corrected-rpc.sql').write_text(fixed+';\n')
