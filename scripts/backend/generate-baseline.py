"""Render the read-only catalog into schema-only SQL, outside migrations.
Requires an empty Supabase-compatible database; never run on existing production.
"""
import json, pathlib
root=pathlib.Path(__file__).resolve().parents[2]
p=root/'supabase/baselines/2026-09-26'
x=json.loads((p/'catalog.json').read_text()); m=json.loads((p/'metadata.json').read_text())
q=lambda s:'"'+s.replace('"','""')+'"'
lit=lambda s:"'"+s.replace("'","''")+"'"
fq=lambda a,b:q(a)+'.'+q(b)
out=['-- OBSERVED LIVE BASELINE, NOT A MIGRATION. Empty isolated database only.', '-- No customer/auth/storage data or fabricated migration history.', 'SET check_function_bodies = false;', 'SET search_path = public, extensions;', 'CREATE SCHEMA IF NOT EXISTS private;', 'CREATE SCHEMA IF NOT EXISTS extensions;', 'CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;', 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;', 'CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;']
for s in []: # all observed sequences are identity-owned
 out.append(f"CREATE SEQUENCE {fq(s['schemaname'],s['sequencename'])} AS {s['data_type']} START {s['start_value']} INCREMENT {s['increment_by']} MINVALUE {s['min_value']} MAXVALUE {s['max_value']} CACHE {s['cache_size']};")
for t in x['tables']:
 cols=[]
 for c in t['columns']:
  z=q(c['name'])+' '+c['type']
  if c['identity']:
   seq=next(v for v in json.loads((p/'sequences.json').read_text()) if v['table_name']==t['name'] and v['column_name']==c['name'])
   z+=' GENERATED '+('ALWAYS' if c['identity']=='a' else 'BY DEFAULT')+' AS IDENTITY (SEQUENCE NAME '+fq(seq['schema'],seq['name'])+' START WITH '+str(seq['seqstart'])+' INCREMENT BY '+str(seq['seqincrement'])+' MINVALUE '+str(seq['seqmin'])+' MAXVALUE '+str(seq['seqmax'])+' CACHE '+str(seq['seqcache'])+')'
  if c['generated']:z+=' GENERATED ALWAYS AS ('+c['default']+') STORED'
  elif c['default']:z+=' DEFAULT '+c['default']
  if c['not_null']:z+=' NOT NULL'
  cols.append(z)
 out.append('CREATE TABLE '+fq(t['schema'],t['name'])+' (\n  '+',\n  '.join(cols)+'\n);')
# Unique keys precede foreign keys. Check expressions may call functions.
for f in x['functions']:out.append(f['definition']+';')
for c in sorted([c for c in x['constraints'] if c['type']!='t'],key=lambda c:{'p':0,'u':1,'c':2,'f':3}.get(c['type'],4)):
 out.append('ALTER TABLE '+fq(c['schema'],c['table'])+' ADD CONSTRAINT '+q(c['name'])+' '+c['definition']+';')
constraint_names={c['name'] for c in x['constraints'] if c['type'] in ('p','u','x')}
for i in x['indexes']:
 if i['name'] not in constraint_names:out.append(i['definition']+';')
remaining={v['name']:v for v in x['views']};done=set();names=set(remaining)
while remaining:
 ready=[name for name in remaining if all(d['depends_on'] in done or d['depends_on'] not in names for d in m['view_dependencies'] if d['view']==name)]
 if not ready:raise ValueError('View dependency cycle: '+str(list(remaining)))
 for name in sorted(ready):
  v=remaining.pop(name);opts=' WITH ('+', '.join(v['options'])+')' if v['options'] else ''
  out.append('CREATE VIEW '+fq(v['schema'],name)+opts+' AS\n'+v['definition']);done.add(name)
for t in x['triggers']:
 out.append(t['definition']+';')
 if t['enabled']=='D':out.append('ALTER TABLE '+fq(t['schema'],t['table'])+' DISABLE TRIGGER '+q(t['name'])+';')
for t in x['tables']:
 if t['rls']:out.append('ALTER TABLE '+fq(t['schema'],t['name'])+' ENABLE ROW LEVEL SECURITY;')
 if t['force_rls']:out.append('ALTER TABLE '+fq(t['schema'],t['name'])+' FORCE ROW LEVEL SECURITY;')
for v in x['policies']:
 s='CREATE POLICY '+q(v['policyname'])+' ON '+fq(v['schemaname'],v['tablename'])+' AS '+v['permissive']+' FOR '+v['cmd']+' TO '+', '.join(q(r) if r!='public' else 'PUBLIC' for r in v['roles'])
 if v['qual']:s+=' USING ('+v['qual']+')'
 if v['with_check']:s+=' WITH CHECK ('+v['with_check']+')'
 out.append(s+';')
# Explicitly restore effective object ACLs (new functions otherwise grant PUBLIC execute).
priv={'r':'SELECT','a':'INSERT','w':'UPDATE','d':'DELETE','D':'TRUNCATE','x':'REFERENCES','t':'TRIGGER','m':'MAINTAIN','X':'EXECUTE','U':'USAGE','C':'CREATE'}
def acl(kind,ident,items,defaults):
 out.append('REVOKE ALL ON '+kind+' '+ident+' FROM PUBLIC;')
 for item in items if items is not None else defaults:
  grantee,rights=item.split('=',1);rights=rights.split('/')[0];role=q(grantee) if grantee else 'PUBLIC'
  for i,c in enumerate(rights):
   if c=='*':continue
   grant=' WITH GRANT OPTION' if i+1<len(rights) and rights[i+1]=='*' else ''
   out.append('GRANT '+priv[c]+' ON '+kind+' '+ident+' TO '+role+grant+';')
for f in x['functions']:acl('FUNCTION',fq(f['schema'],f['name'])+'('+f['args']+')',f['acl'],['=X/postgres','postgres=X/postgres'])
for t in x['tables']+x['views']:acl('TABLE',fq(t['schema'],t['name']),t['acl'],[])
for s in x['schema_acl']:acl('SCHEMA',q(s['schema']),s['acl'],[])
for seq in json.loads((p/'sequences.json').read_text()):acl('SEQUENCE',fq(seq['schema'],seq['name']),seq['acl'].strip('{}').split(','),[])
# Extension internals, managed schemas and project configuration are not recreated here.
# Preserve application-schema default ACLs so new-migration grants are tested realistically.
for d in x['defaults']:
 if d['schema'] not in ('public','private'):continue
 kind={'r':'TABLES','f':'FUNCTIONS','S':'SEQUENCES'}[d['type']]
 prefix='ALTER DEFAULT PRIVILEGES FOR ROLE '+q(d['role'])+' IN SCHEMA '+q(d['schema'])
 for item in d['acl']:
  role,rights=item.split('=',1);rights=rights.split('/')[0]
  out.append(prefix+' GRANT '+', '.join(priv[c] for c in rights if c!='*')+' ON '+kind+' TO '+(q(role) if role else 'PUBLIC')+';')
(p/'schema.sql').write_text('\n\n'.join(out)+'\n')
print('Rendered',len(out),'DDL statements to',p/'schema.sql')
