'use strict';
// Fixture-only recreation of reviewed, row-free current metadata. Never a migration.
const c=require('./current-operations-catalog.json');
const qi=s=>'"'+s.replaceAll('"','""')+'"',lit=s=>"'"+s.replaceAll("'","''")+"'";
function sql(){let out='SET check_function_bodies=false;\n';
 for(const t of c.tables){const rel='public.'+qi(t.name);for(const col of t.columns)out+=`ALTER TABLE ${rel} ADD COLUMN IF NOT EXISTS ${qi(col.name)} ${col.type};\nALTER TABLE ${rel} ALTER COLUMN ${qi(col.name)} ${col.default===null?'DROP DEFAULT':'SET DEFAULT '+col.default};\nALTER TABLE ${rel} ALTER COLUMN ${qi(col.name)} ${col.notNull?'SET':'DROP'} NOT NULL;\n`;
  out+=`ALTER TABLE ${rel} OWNER TO ${qi(t.owner)};ALTER TABLE ${rel} ${t.rls?'ENABLE':'DISABLE'} ROW LEVEL SECURITY;ALTER TABLE ${rel} ${t.forceRls?'FORCE':'NO FORCE'} ROW LEVEL SECURITY;\n`;
  out+=`DO $x$ DECLARE p record;BEGIN FOR p IN SELECT polname FROM pg_policy WHERE polrelid=${lit('public.'+t.name)}::regclass LOOP EXECUTE format('DROP POLICY %I ON ${rel}',p.polname);END LOOP;END$x$;\n`;
  for(const p of t.policies)out+=`CREATE POLICY ${qi(p.name)} ON ${rel} AS ${p.permissive?'PERMISSIVE':'RESTRICTIVE'} FOR ${{r:'SELECT',a:'INSERT',w:'UPDATE',d:'DELETE','*':'ALL'}[p.command]} TO ${p.roles.map(qi).join(',')}${p.using?' USING ('+p.using+')':''}${p.check?' WITH CHECK ('+p.check+')':''};\n`;
  for(const i of t.indexes)out+=i.replace('CREATE UNIQUE INDEX ','CREATE UNIQUE INDEX IF NOT EXISTS ').replace('CREATE INDEX ','CREATE INDEX IF NOT EXISTS ')+';\n';
  out+=`DO $x$ DECLARE t record;BEGIN FOR t IN SELECT tgname FROM pg_trigger WHERE tgrelid=${lit('public.'+t.name)}::regclass AND NOT tgisinternal LOOP EXECUTE format('DROP TRIGGER %I ON ${rel}',t.tgname);END LOOP;END$x$;\n`;
  for(const tr of t.triggers){out+=tr.functionDefinition+';\n';out+=`ALTER FUNCTION ${tr.function} OWNER TO ${qi(tr.owner)};\n`;out+=tr.definition+';\n';}
 }
 return out;
}
module.exports={sql,catalog:c};if(require.main===module)process.stdout.write(sql());
