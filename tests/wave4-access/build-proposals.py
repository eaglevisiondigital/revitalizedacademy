from pathlib import Path
import json,hashlib
root=Path(__file__).resolve().parents[2];out=root/'proposals/issue-61/wave4';out.mkdir(parents=True,exist_ok=True)
meta=json.loads((root/'tests/wave3-allowance/current-subset.json').read_text());rs={(r['schema'],r['name']):r for r in meta['routines']}
original_rpc=(root/'tests/wave3-allowance/corrected-rpc.sql').read_text()[:-2]
original_calc=rs['private','recalculate_coaching_entitlement_used_value']['definition']
lock_sql="""  for v_key in
    select distinct k from unnest(array[
      case when TG_OP<>'INSERT' then OLD.membership_id::text||'/'||OLD.entitlement_key end,
      case when TG_OP<>'DELETE' then NEW.membership_id::text||'/'||NEW.entitlement_key end
    ]) k where k is not null order by k
  loop
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('rva-allowance-v1/'||v_key,0));
  end loop;
"""
def fn(name,args,returns,body,stable=False):
 return f"CREATE FUNCTION private.{name}({args}) RETURNS {returns} LANGUAGE plpgsql {'STABLE 'if stable else ''}SECURITY DEFINER SET search_path='' AS $function$\n{body}\n$function$;\n"
functions={}
functions['wave4_membership_allowed(uuid,text)']=fn('wave4_membership_allowed','p_membership_id uuid,p_permission text','boolean',"""declare v_actor uuid:=auth.uid();
begin
  if p_permission is null or p_permission not in ('coaching.view','coaching.manage') then return false; end if;
  if v_actor is null or not private.active_staff_session()
     or not private.staff_has_permission(v_actor,p_permission) then return false; end if;
  return exists(select 1 from public.client_memberships cm where cm.id=p_membership_id)
    and not exists(
      select 1 from (
        select cm.primary_contact_id as contact_id from public.client_memberships cm where cm.id=p_membership_id
        union select ca.contact_id from public.client_access ca where ca.membership_id=p_membership_id
        union select cs.contact_id from public.coaching_sessions cs where cs.membership_id=p_membership_id
        union select u.contact_id from public.coaching_entitlement_usage u where u.membership_id=p_membership_id
      ) participants
      where not coalesce(private.staff_can_access_contact(v_actor,participants.contact_id),false)
    );
end;""",True)
functions['wave4_usage_before()']=fn('wave4_usage_before','','trigger',"""declare v_key text; s public.coaching_sessions%rowtype;
begin
"""+lock_sql+"""  if TG_OP='DELETE' then return OLD; end if;
  if TG_OP='UPDATE' and (
    NEW.coaching_session_id is distinct from OLD.coaching_session_id
    or NEW.membership_id is distinct from OLD.membership_id
    or NEW.contact_id is distinct from OLD.contact_id
    or NEW.entitlement_key is distinct from OLD.entitlement_key
  ) then raise exception 'Session-backed usage binding cannot be transferred' using errcode='23514'; end if;
  select * into s from public.coaching_sessions where id=NEW.coaching_session_id for share;
  if not found or NEW.contact_id is distinct from s.contact_id
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
end;""")
functions['wave4_usage_after()']=fn('wave4_usage_after','','trigger',"""declare v_membership uuid; v_entitlement text;
begin
  for v_membership,v_entitlement in
    select distinct m,k from (values
      (case when TG_OP<>'INSERT' then OLD.membership_id end,case when TG_OP<>'INSERT' then OLD.entitlement_key end),
      (case when TG_OP<>'DELETE' then NEW.membership_id end,case when TG_OP<>'DELETE' then NEW.entitlement_key end)
    ) pairs(m,k) where m is not null and k is not null order by m,k
  loop
    perform private.recalculate_coaching_entitlement_used_value(v_membership,v_entitlement);
  end loop;
  return null;
end;""")
functions['wave4_entitlement_before()']=fn('wave4_entitlement_before','','trigger',"""declare v_key text; v_total bigint;
begin
  if NEW.entitlement_key is distinct from 'private_coaching' and (TG_OP='INSERT' or OLD.entitlement_key is distinct from 'private_coaching') then return NEW; end if;
"""+lock_sql+"""  if TG_OP='DELETE' then return OLD; end if;
  if TG_OP='UPDATE' and (NEW.membership_id is distinct from OLD.membership_id or NEW.entitlement_key is distinct from OLD.entitlement_key)
     and exists(select 1 from public.coaching_entitlement_usage u where u.entitlement_id=OLD.id
       or (u.membership_id=OLD.membership_id and u.entitlement_key=OLD.entitlement_key)) then
    raise exception 'Referenced allowance binding cannot be transferred' using errcode='23514';
  end if;
  select coalesce(sum(u.usage_units),0) into v_total from public.coaching_entitlement_usage u
    where u.membership_id=NEW.membership_id and u.entitlement_key=NEW.entitlement_key and u.status='consumed';
  if NEW.used_value is distinct from v_total then
    raise exception 'Allowance used_value must match the complete usage ledger' using errcode='23514';
  end if;
  return NEW;
end;""")
functions['wave4_session_binding_before()']=fn('wave4_session_binding_before','','trigger',"""begin
  if NEW.membership_id is not null and not exists(
    select 1 from public.client_memberships cm where cm.id=NEW.membership_id
      and (cm.primary_contact_id=NEW.contact_id or exists(select 1 from public.client_access ca where ca.contact_id=NEW.contact_id and ca.membership_id=cm.id))
  ) then raise exception 'Session contact has no explicit membership relationship' using errcode='23514'; end if;
  if TG_OP='UPDATE' and (NEW.contact_id is distinct from OLD.contact_id or NEW.membership_id is distinct from OLD.membership_id)
     and exists(select 1 from public.coaching_entitlement_usage u where u.coaching_session_id=OLD.id) then
    raise exception 'Existing session usage cannot be transferred' using errcode='23514';
  end if;
  return NEW;
end;""")
calc=original_calc.replace('begin\n  update','declare v_updated integer;\nbegin\n  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(\'rva-allowance-v1/\'||p_membership_id::text||\'/\'||p_entitlement_key,0));\n  update')
calc=calc.replace('end;\n$function$',"""  get diagnostics v_updated = row_count;
  if v_updated is distinct from 1 and exists(select 1 from public.membership_entitlements me where me.membership_id=p_membership_id and me.entitlement_key=p_entitlement_key) then
    raise exception 'Existing allowance was not recalculated' using errcode='42501';
  end if;
end;
$function$""")
rpc=original_rpc.replace('  v_updated integer;\n','')
a=rpc.index('  -- Lock the ledger row first');b=rpc.index('\n  update public.coaching_entitlement_usage',a)
rpc=rpc[:a]+"""  -- Visibility is conservative; no caller-side aggregate or early allowance row lock.
  perform 1 from public.membership_entitlements me
  where me.membership_id=u.membership_id and me.entitlement_key=u.entitlement_key;
  if not found then raise exception 'Coaching allowance is not available' using errcode='42501'; end if;
"""+rpc[b:]
a=rpc.index('  -- Same aggregate');b=rpc.index('\nend;\n$function$',a)
rpc=rpc[:a]+'  -- The guarded private ledger trigger recalculates the complete aggregate.\n'+rpc[b:]
usage_scope="((private.active_staff_session() AND private.staff_action_allowed(auth.uid(),'coaching.view',contact_id)) OR (private.full_member_access() AND EXISTS(SELECT 1 FROM public.client_access ca WHERE ca.user_id=auth.uid() AND ca.contact_id=coaching_entitlement_usage.contact_id)))"
usage_write="(private.active_staff_session() AND private.staff_action_allowed(auth.uid(),'coaching.manage',contact_id) AND EXISTS(SELECT 1 FROM public.coaching_sessions s WHERE s.id=coaching_entitlement_usage.coaching_session_id AND s.contact_id=coaching_entitlement_usage.contact_id AND s.membership_id=coaching_entitlement_usage.membership_id))"
me_read="(private.wave4_membership_allowed(membership_id,'coaching.view') OR (private.full_member_access() AND EXISTS(SELECT 1 FROM public.client_access ca WHERE ca.user_id=auth.uid() AND ca.membership_id=membership_entitlements.membership_id)))"
me_write="private.wave4_membership_allowed(membership_id,'coaching.manage')"
policies=[f"CREATE POLICY wave4_usage_scope_select ON public.coaching_entitlement_usage AS RESTRICTIVE FOR SELECT TO authenticated USING ({usage_scope});",f"CREATE POLICY wave4_usage_scope_insert ON public.coaching_entitlement_usage AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK ({usage_write});",f"CREATE POLICY wave4_usage_scope_update ON public.coaching_entitlement_usage AS RESTRICTIVE FOR UPDATE TO authenticated USING ({usage_write}) WITH CHECK ({usage_write});",f"CREATE POLICY wave4_entitlement_scope_select ON public.membership_entitlements AS RESTRICTIVE FOR SELECT TO authenticated USING (entitlement_key<>'private_coaching' OR {me_read});",f"CREATE POLICY wave4_entitlement_scope_insert ON public.membership_entitlements AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (entitlement_key<>'private_coaching' OR {me_write});",f"CREATE POLICY wave4_entitlement_scope_update ON public.membership_entitlements AS RESTRICTIVE FOR UPDATE TO authenticated USING (entitlement_key<>'private_coaching' OR {me_write}) WITH CHECK (entitlement_key<>'private_coaching' OR {me_write});"]
triggers=[('public.coaching_entitlement_usage','wave4_usage_before','BEFORE INSERT OR UPDATE OR DELETE','wave4_usage_before'),('public.coaching_entitlement_usage','wave4_usage_after','AFTER INSERT OR UPDATE OR DELETE','wave4_usage_after'),('public.membership_entitlements','wave4_entitlement_before','BEFORE INSERT OR UPDATE','wave4_entitlement_before'),('public.coaching_sessions','wave4_session_binding_before','BEFORE INSERT OR UPDATE OF contact_id,membership_id','wave4_session_binding_before')]
oldguard=(root/'proposals/issue-61/correction.sql').read_text();oldguard=oldguard[oldguard.index('DO $guard$'):oldguard.index('END $guard$;')+len('END $guard$;')]
oldguard=oldguard.replace(hashlib.md5(rs['public','resolve_coaching_entitlement_review']['definition'].encode()).hexdigest(),hashlib.md5(original_rpc.encode()).hexdigest())
integrity="""DO $integrity$ BEGIN
 IF EXISTS(SELECT 1 FROM public.coaching_sessions s WHERE s.membership_id IS NOT NULL AND NOT EXISTS(
   SELECT 1 FROM public.client_memberships cm WHERE cm.id=s.membership_id AND (cm.primary_contact_id=s.contact_id OR EXISTS(SELECT 1 FROM public.client_access ca WHERE ca.contact_id=s.contact_id AND ca.membership_id=cm.id))))
 THEN RAISE EXCEPTION 'Preexisting invalid session membership relationship; bounded separate remediation required'; END IF;
 IF EXISTS(SELECT 1 FROM public.coaching_entitlement_usage u LEFT JOIN public.coaching_sessions s ON s.id=u.coaching_session_id
   LEFT JOIN public.membership_entitlements me ON me.id=u.entitlement_id
   WHERE s.id IS NULL OR u.contact_id IS DISTINCT FROM s.contact_id OR u.membership_id IS DISTINCT FROM s.membership_id
     OR u.entitlement_key IS DISTINCT FROM 'private_coaching'
     OR NOT EXISTS(SELECT 1 FROM public.client_memberships cm WHERE cm.id=u.membership_id AND (cm.primary_contact_id=u.contact_id OR EXISTS(SELECT 1 FROM public.client_access ca WHERE ca.contact_id=u.contact_id AND ca.membership_id=cm.id)))
     OR (u.entitlement_id IS NOT NULL AND (me.id IS NULL OR me.membership_id IS DISTINCT FROM u.membership_id OR me.entitlement_key IS DISTINCT FROM u.entitlement_key)))
 THEN RAISE EXCEPTION 'Preexisting malformed usage relationships; bounded separate remediation required'; END IF;
 IF EXISTS(SELECT 1 FROM public.membership_entitlements me WHERE me.entitlement_key='private_coaching' AND me.used_value IS DISTINCT FROM
   (SELECT coalesce(sum(u.usage_units),0) FROM public.coaching_entitlement_usage u WHERE u.membership_id=me.membership_id AND u.entitlement_key=me.entitlement_key AND u.status='consumed'))
 THEN RAISE EXCEPTION 'Preexisting inconsistent allowance cache; bounded separate remediation required'; END IF;
END $integrity$;"""
forward=['-- LOCAL PROPOSAL ONLY; no hosted authority. Baseline includes accepted LOCAL Wave3 RPC proposal.','BEGIN;',"SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='30s';",oldguard,integrity]
for policy in policies:
 name=policy.split()[2];table=policy.split(' ON ')[1].split(' ')[0]
 forward.append(f"DO $x$ BEGIN IF EXISTS(SELECT FROM pg_policy WHERE polrelid='{table}'::regclass AND polname='{name}') THEN RAISE EXCEPTION 'Wave4 policy collision'; END IF; END $x$;")
for table,name,_,_ in triggers:
 forward.append(f"DO $x$ BEGIN IF EXISTS(SELECT FROM pg_trigger WHERE tgrelid='{table}'::regclass AND tgname='{name}') THEN RAISE EXCEPTION 'Wave4 trigger collision'; END IF; END $x$;")
for sig,sql in functions.items():
 forward += [f"DO $x$ BEGIN IF to_regprocedure('private.{sig}') IS NOT NULL THEN RAISE EXCEPTION 'Wave4 object collision'; END IF; END $x$;",sql,f'ALTER FUNCTION private.{sig} OWNER TO postgres;',f'REVOKE ALL ON FUNCTION private.{sig} FROM PUBLIC,anon,authenticated,service_role;',f'GRANT EXECUTE ON FUNCTION private.{sig} TO '+('authenticated,postgres'if sig.startswith('wave4_membership_allowed')else 'postgres')+';']
forward += [calc+';',rpc+';']+policies
for table,name,when,function in triggers:forward.append(f'CREATE TRIGGER {name} {when} ON {table} FOR EACH ROW EXECUTE FUNCTION private.{function}();')
forward+=['COMMIT;'];(out/'correction.sql').write_text('\n'.join(forward)+'\n')
# Revert refuses drift in each new routine body/security and the two changed routine bodies.
revert=['-- LOCAL PROPOSAL REVERT; restores known baseline direct-access defects, not a production rollback recommendation.','BEGIN;',"SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='30s';",'DO $guard$ BEGIN']
for sig,sql in list(functions.items())+ [('recalculate_coaching_entitlement_used_value(uuid,text)',calc),('public.resolve_coaching_entitlement_review(uuid,text,text)',rpc)]:
 full=sig if sig.startswith('public.')else 'private.'+sig;body=sql.split('$function$')[1];md5=hashlib.md5(body.encode()).hexdigest();revert.append(f"IF (SELECT md5(prosrc) FROM pg_proc WHERE oid='{full}'::regprocedure) IS DISTINCT FROM '{md5}' THEN RAISE EXCEPTION 'Wave4 revert source drift: {full}'; END IF;")
 if sig.startswith('wave4_'):
  acl='{postgres=X/postgres,authenticated=X/postgres}'if sig.startswith('wave4_membership_allowed')else '{postgres=X/postgres}'
  revert.append(f"IF (SELECT prosecdef IS DISTINCT FROM true OR pg_get_userbyid(proowner) IS DISTINCT FROM 'postgres' OR proconfig IS DISTINCT FROM ARRAY['search_path=\"\"']::text[] OR proacl::text IS DISTINCT FROM '{acl}' FROM pg_proc WHERE oid='{full}'::regprocedure) THEN RAISE EXCEPTION 'Wave4 revert security drift'; END IF;")
revert += ['END $guard$;']
for table,name,_,_ in triggers:revert.append(f'DROP TRIGGER {name} ON {table};')
for policy in policies:
 name=policy.split()[2];table=policy.split(' ON ')[1].split(' ')[0];revert.append(f'DROP POLICY {name} ON {table};')
revert += [original_calc+';',original_rpc+';']
for sig in reversed(list(functions)):revert.append(f'DROP FUNCTION private.{sig};')
revert+=['COMMIT;'];(out/'revert.sql').write_text('\n'.join(revert)+'\n')
(root/'tests/wave4-access/proposal-contract.json').write_text(json.dumps({'newPrivateFunctions':list(functions),'newTriggers':triggers,'policies':[p.split()[2]for p in policies],'changedFunctions':['public.resolve_coaching_entitlement_review(uuid,text,text)','private.recalculate_coaching_entitlement_used_value(uuid,text)'],'authExecuteOnlyNewPredicate':'private.wave4_membership_allowed(uuid,text)'},indent=2)+'\n')
