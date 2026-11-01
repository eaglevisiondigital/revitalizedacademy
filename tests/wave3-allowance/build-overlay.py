from pathlib import Path
import json,hashlib,re
root=Path(__file__).resolve().parents[2];c=json.loads((root/'../deployment-evidence/2026-11-01-wave3/catalog-normalized.json').read_text());s=json.loads((root/'../deployment-evidence/2026-11-01-wave3/catalog-supplement.json').read_text())
selected=['coaching_sessions','coaching_entitlement_usage','membership_entitlements','staff_access','staff_permission_overrides','staff_role_permission_defaults','staff_role_permissions','staff_permission_catalog','contacts','profiles','client_access','client_memberships','client_coach_assignments','follow_up_tasks']
ts=[t for t in c['tables'] if t['name']in selected]
rs={(r['schema'],r['name']):r for r in c['routines']+s['routines']}
needed={('private',n)for n in ['active_staff_session','full_member_access','enrollment_gates_complete','enrollment_payment_satisfied','agreement_signatures_satisfied','production_client_agreement_publication_released','staff_has_permission','staff_can_access_contact','staff_action_allowed','recalculate_coaching_entitlement_used_value','reconcile_membership_entitlements','refresh_client_lifecycle','render_agreement_content']}
needed|={('public','resolve_coaching_entitlement_review'),('public','staff_action_allowed'),('public','member_paid_access_allowed')}
for t in ts:
 for tr in t['triggers']or[]:
  m=re.search(r'EXECUTE FUNCTION (?:(\w+)\.)?(\w+)\(',tr['definition']);needed.add((m.group(1) or 'public',m.group(2)))
missing=needed-set(rs);assert not missing,missing
# Existing platform auth scaffold is intentionally fake; do not replace its UID with hosted config-dependent GoTrue schema.
functions=[rs[k]for k in sorted(needed)]
q=lambda x:'"'+x.replace('"','""')+'"'
out=['-- TEST ONLY: current metadata overlay; dependency schema is separately pinned.','BEGIN;']
for t in c['tables']:
 if t['kind']!='r' or t['name']in selected:continue
 for col in t['columns']:
  out.append('ALTER TABLE '+q(t['schema'])+'.'+q(t['name'])+' ADD COLUMN IF NOT EXISTS '+q(col['name'])+' '+col['type']+(' DEFAULT '+col['default']if col['default']is not None else '')+';')
for r in functions:
 out.append(r['definition']+';')
 sig=r['schema']+'.'+r['name']+'('+','.join(re.findall(r'\bp_\w+\s+(uuid|text|integer|numeric|jsonb)',r['args']))+')' if r['args'].startswith('p_') else r['schema']+'.'+r['name']+'('+('public.journey_enrollment_activations' if r['name']in ['enrollment_gates_complete','enrollment_payment_satisfied'] else ('public.client_agreements' if r['name']=='agreement_signatures_satisfied' else r['args']))+')'
 # Identity argument type extraction handles signature defaults from capture.
 args=r['args']
 if args:
  types=[]
  for a in args.split(', '):
   a=a.split(' DEFAULT ')[0];parts=a.split(' ');types.append(' '.join(parts[1:]))
  sig=r['schema']+'.'+r['name']+'('+','.join(types)+')'
 else:sig=r['schema']+'.'+r['name']+'()'
 out.append('ALTER FUNCTION '+sig+' OWNER TO '+q(r['owner'])+';')
 if r['acl'] is None:continue  # Preserve a source-created NULL/default ACL instead of manufacturing an explicit ACL.
 out.append('REVOKE ALL ON FUNCTION '+sig+' FROM PUBLIC,postgres,anon,authenticated,service_role;')
 for acl in r['acl']:
  role,priv=acl.split('=',1);role='PUBLIC'if not role else q(role)
  if 'X'in priv.split('/')[0]:out.append('GRANT EXECUTE ON FUNCTION '+sig+' TO '+role+';')
for t in ts:
 name=q(t['schema'])+'.'+q(t['name']);out.append('ALTER TABLE '+name+' OWNER TO '+q(t['owner'])+';')
 # The runner verifies the full current column and constraint shape after the overlay; additions are explicit scaffold compatibility only.
 for col in t['columns']:
  out.append('ALTER TABLE '+name+' ADD COLUMN IF NOT EXISTS '+q(col['name'])+' '+col['type']+(' DEFAULT '+col['default']if col['default']is not None else '')+(';'))
 out.append('ALTER TABLE '+name+(' ENABLE'if t['rls']else ' DISABLE')+' ROW LEVEL SECURITY;')
 out.append('ALTER TABLE '+name+(' FORCE'if t['force_rls']else ' NO FORCE')+' ROW LEVEL SECURITY;')
 out.append("DO $x$ DECLARE p record; BEGIN FOR p IN SELECT polname FROM pg_policy WHERE polrelid='"+t['schema']+'.'+t['name']+"'::regclass LOOP EXECUTE format('DROP POLICY %I ON "+name+"',p.polname); END LOOP; END $x$;")
 for pol in t['policies']or[]:
  sql='CREATE POLICY '+q(pol['name'])+' ON '+name+(' AS PERMISSIVE'if pol['permissive']else ' AS RESTRICTIVE')+' FOR '+{'r':'SELECT','a':'INSERT','w':'UPDATE','d':'DELETE','*':'ALL'}[pol['command']]+' TO '+','.join('PUBLIC'if r=='public'else q(r)for r in pol['roles'])
  if pol['using']:sql+=' USING ('+pol['using']+')'
  if pol['check']:sql+=' WITH CHECK ('+pol['check']+')'
  out.append(sql+';')
 out.append("DO $x$ DECLARE t record; BEGIN FOR t IN SELECT tgname FROM pg_trigger WHERE tgrelid='"+t['schema']+'.'+t['name']+"'::regclass AND NOT tgisinternal LOOP EXECUTE format('DROP TRIGGER %I ON "+name+"',t.tgname); END LOOP; END $x$;")
 for tr in t['triggers']or[]:
  out.append(tr['definition']+';')
  out.append('ALTER TABLE '+name+' '+{'O':'ENABLE','D':'DISABLE','R':'ENABLE REPLICA','A':'ENABLE ALWAYS'}[tr['enabled']]+' TRIGGER '+q(tr['name'])+';')
 out.append('REVOKE ALL ON TABLE '+name+' FROM PUBLIC,postgres,anon,authenticated,service_role;')
 for acl in t['acl']or[]:
  role,priv=acl.split('=',1);prs=[v for k,v in {'a':'INSERT','r':'SELECT','w':'UPDATE','d':'DELETE','D':'TRUNCATE','x':'REFERENCES','t':'TRIGGER','m':'MAINTAIN'}.items()if k in priv.split('/')[0]]
  if prs:out.append('GRANT '+','.join(prs)+' ON '+name+' TO '+('PUBLIC'if not role else q(role))+';')
out.append('COMMIT;')
(root/'tests/wave3-allowance/current-overlay.sql').write_text('\n'.join(out)+'\n')
metadata={'observedAt':c['observed_at'],'currentServer':c['server_version'],'tables':ts,'routines':functions,'permissionCatalog':s['permission_catalog'],'permissionDefaults':s['permission_defaults'],'permissionLegacy':s['permission_legacy'],'roles':c['roles'],'roleMemberships':c['role_memberships']}
(root/'tests/wave3-allowance/current-subset.json').write_text(json.dumps(metadata,indent=2)+'\n')
pins={'observedAt':c['observed_at'],'supplementObservedAt':s['observed_at'],'files':[]}
for rel in ['../deployment-evidence/2026-11-01-wave3/current-catalog.json','../deployment-evidence/2026-11-01-wave3/catalog-normalized.json','../deployment-evidence/2026-11-01-wave3/catalog-supplement.json','tests/wave3-allowance/current-overlay.sql','tests/wave3-allowance/current-subset.json']:
 pins['files'].append({'path':rel,'sha256':hashlib.sha256((root/rel).read_bytes()).hexdigest()})
pins['routineHashes']=[{'name':r['schema']+'.'+r['name'],'definitionSha256':hashlib.sha256(r['definition'].encode()).hexdigest(),'securityMetadataSha256':hashlib.sha256(json.dumps({k:v for k,v in r.items()if k!='definition'},sort_keys=True,separators=(',',':')).encode()).hexdigest()}for r in functions]
(root/'tests/wave3-allowance/current-pins.json').write_text(json.dumps(pins,indent=2)+'\n')
print('subset',len(ts),'tables',len(functions),'routines')
