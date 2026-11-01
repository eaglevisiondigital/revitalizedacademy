'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const qi=s=>'"'+s.replaceAll('"','""')+'"',lit=s=>"'"+s.replaceAll("'","''")+"'";
const CORE=['client_goals','staff_access','client_access','contacts','client_coach_assignments','follow_up_tasks','profiles','staff_permission_catalog','staff_permission_overrides','staff_role_permission_defaults','staff_role_permissions','client_memberships','journey_enrollment_activations','client_agreements','agreement_acceptances','program_agreement_requirements','agreement_templates','households','household_members','member_sync_events','member_notifications','program_catalog','program_product_plans','program_plan_prices','payment_merchant_routes'];
const privileges={a:'INSERT',r:'SELECT',w:'UPDATE',d:'DELETE',D:'TRUNCATE',x:'REFERENCES',t:'TRIGGER',m:'MAINTAIN',X:'EXECUTE',U:'USAGE',C:'CREATE'};
function inputs(root){
 const pins=require('./source-pins.json');for(const x of [...pins.historicalScaffoldOnly,...pins.catalogs])if(hash(fs.readFileSync(path.resolve(root,x.path)))!==x.sha256)throw Error('Pinned input mismatch: '+x.path);
 const captures=pins.catalogs.map(x=>JSON.parse(fs.readFileSync(path.resolve(root,x.path),'utf8')));
 const tables=new Map(),routines=new Map();for(const c of captures){for(const t of c.tables||[])if(!t.kind||t.kind==='r'||t.kind==='v')tables.set(t.schema+'.'+t.name,t);for(const f of c.routines||[])routines.set(f.schema+'.'+f.name+'('+f.args+')',f);}
 return {pins,captures,tables,routines};
}
async function acl(db,type,target,items,owner){
 const roles=['PUBLIC','anon','authenticated','service_role'];for(const role of roles)await db.query(`REVOKE ALL ON ${type} ${target} FROM ${role}`);
 const effective=items??[`${owner}=X/${owner}`,`=X/${owner}`];
 for(const a of effective){const m=a.match(/^([^=]*)=([^/]*)\//);if(!m)throw Error('Unsupported ACL');const role=m[1]?qi(m[1]):'PUBLIC';const rights=[...m[2].replaceAll('*','')].map(x=>privileges[x]);if(rights.some(x=>!x))throw Error('Unsupported ACL right');if(rights.length)await db.query(`GRANT ${rights.join(',')} ON ${type} ${target} TO ${role}`);}
}
async function reconstruct(db,input){
 const {tables,routines,captures}=input;
 await db.query('SET check_function_bodies=false;SET search_path=public');
 const owners=new Set([...routines.values()].map(x=>x.owner));for(const x of captures[0].schemas||[])owners.add(x.owner);
 for(const x of [...tables.values(),...routines.values(),...captures[0].schemas])for(const a of x.acl||[]){const role=a.split('=')[0];if(role)owners.add(role);}
 for(const x of captures[0].role_memberships||[]){owners.add(x.role);owners.add(x.member);}
 for(const owner of owners)if(!(await db.query('select 1 from pg_roles where rolname=$1',[owner])).rowCount)await db.query('CREATE ROLE '+qi(owner)+' NOLOGIN');
 const selected=CORE.map(name=>{const t=tables.get('public.'+name);if(!t)throw Error('Missing current table metadata: '+name);return t;});
 for(const t of selected){const target=qi(t.schema)+'.'+qi(t.name);if(!(await db.query('select to_regclass($1) present',[target])).rows[0].present){await db.query(`CREATE TABLE ${target} (${t.columns.map(c=>qi(c.name)+' '+c.type).join(',')})`);for(const c of t.constraints||[])if(/^(PRIMARY KEY|UNIQUE)/.test(c.definition))await db.query(`ALTER TABLE ${target} ADD CONSTRAINT ${qi(c.name)} ${c.definition}`);}}
 for(const t of selected){
  const target=qi(t.schema)+'.'+qi(t.name);
  const existing=(await db.query('select attname from pg_attribute where attrelid=$1::regclass and attnum>0 and not attisdropped',[target])).rows.map(x=>x.attname);
  for(const name of existing)if(!t.columns.some(x=>x.name===name))throw Error('Historical extra column requires explicit reconciliation: '+t.name+'.'+name);
  for(const c of t.columns){
   if(!existing.includes(c.name))await db.query(`ALTER TABLE ${target} ADD COLUMN ${qi(c.name)} ${c.type}`);
   const identity=(await db.query('select attidentity from pg_attribute where attrelid=$1::regclass and attname=$2',[target,c.name])).rows[0]?.attidentity;
   if(!identity)await db.query(`ALTER TABLE ${target} ALTER COLUMN ${qi(c.name)} ${c.default===null?'DROP DEFAULT':'SET DEFAULT '+c.default}`);
   await db.query(`ALTER TABLE ${target} ALTER COLUMN ${qi(c.name)} ${c.not_null?'SET':'DROP'} NOT NULL`);
  }
  const oldConstraints=(await db.query('select conname name,pg_get_constraintdef(oid) definition from pg_constraint where conrelid=$1::regclass',[target])).rows;
  for(const c of oldConstraints)if(!(t.constraints||[]).some(x=>x.name===c.name&&x.definition===c.definition)){
   if(/^(PRIMARY KEY|UNIQUE)/.test(c.definition))throw Error('Key constraint requires explicit dependency reconciliation: '+t.name+'.'+c.name);
   await db.query(`ALTER TABLE ${target} DROP CONSTRAINT ${qi(c.name)}`);
  }
  for(const c of t.constraints||[])if(!oldConstraints.some(x=>x.name===c.name&&x.definition===c.definition))await db.query(`ALTER TABLE ${target} ADD CONSTRAINT ${qi(c.name)} ${c.definition}`);
  await db.query(`ALTER TABLE ${target} OWNER TO ${qi(t.owner)}`);
  await db.query(`ALTER TABLE ${target} ${t.rls?'ENABLE':'DISABLE'} ROW LEVEL SECURITY;ALTER TABLE ${target} ${t.force_rls?'FORCE':'NO FORCE'} ROW LEVEL SECURITY`);
  for(const p of (await db.query('select polname from pg_policy where polrelid=$1::regclass',[target])).rows)await db.query(`DROP POLICY ${qi(p.polname)} ON ${target}`);
  for(const p of t.policies||[]){const cmd={r:'SELECT',a:'INSERT',w:'UPDATE',d:'DELETE','*':'ALL'}[p.command];await db.query(`CREATE POLICY ${qi(p.name)} ON ${target} AS ${p.permissive?'PERMISSIVE':'RESTRICTIVE'} FOR ${cmd} TO ${p.roles.map(qi).join(',')}${p.using?' USING ('+p.using+')':''}${p.check?' WITH CHECK ('+p.check+')':''}`);}
  await acl(db,'TABLE',target,t.acl,t.owner);
 }
 for(const f of routines.values()){
  await db.query(f.definition);const target=qi(f.schema)+'.'+qi(f.name)+'('+f.args+')';
  await db.query(`ALTER FUNCTION ${target} OWNER TO ${qi(f.owner)}`);await acl(db,'FUNCTION',target,f.acl,f.owner);
 }
 for(const s of captures[0].schemas){await db.query(`ALTER SCHEMA ${qi(s.name)} OWNER TO ${qi(s.owner)}`);await acl(db,'SCHEMA',qi(s.name),s.acl,s.owner);}
 for(const t of selected){const target=qi(t.schema)+'.'+qi(t.name);for(const r of (await db.query('select tgname from pg_trigger where tgrelid=$1::regclass and not tgisinternal',[target])).rows)await db.query(`DROP TRIGGER ${qi(r.tgname)} ON ${target}`);for(const r of t.triggers||[]){await db.query(r.definition);await db.query(`ALTER TABLE ${target} ${r.enabled==='D'?'DISABLE':r.enabled==='A'?'ENABLE ALWAYS':r.enabled==='R'?'ENABLE REPLICA':'ENABLE'} TRIGGER ${qi(r.name)}`);}}
 const v=tables.get('public.my_goals');await db.query('CREATE OR REPLACE VIEW public.my_goals WITH (security_invoker=true) AS '+v.view_definition);await acl(db,'TABLE','public.my_goals',v.acl,v.owner);
 for(const r of captures[0].roles){try{await db.query(`ALTER ROLE ${qi(r.name)} ${r.superuser?'SUPERUSER':'NOSUPERUSER'} ${r.bypassrls?'BYPASSRLS':'NOBYPASSRLS'} ${r.inherit?'INHERIT':'NOINHERIT'}`);}catch(e){throw Error('Role '+r.name+': '+e.message+' '+(e.detail||''));}}
 for(const m of captures[0].role_memberships||[])await db.query(`GRANT ${qi(m.role)} TO ${qi(m.member)} WITH INHERIT ${m.inherit?'TRUE':'FALSE'}, SET ${m.set?'TRUE':'FALSE'}`);
 await db.query("SET search_path=public");
 const equivalence=[];
 for(const t of selected){
  const target=t.schema+'.'+t.name;
  const columns=(await db.query("select a.attname name,format_type(a.atttypid,a.atttypmod) type,pg_get_expr(d.adbin,d.adrelid) as default,a.attnotnull not_null from pg_attribute a left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum where a.attrelid=$1::regclass and a.attnum>0 and not a.attisdropped order by a.attnum",[target])).rows;
  if(JSON.stringify(columns)!==JSON.stringify(t.columns))throw Error('Current column mismatch: '+target);
  const constraints=(await db.query('select conname name,pg_get_constraintdef(oid) definition from pg_constraint where conrelid=$1::regclass order by conname',[target])).rows;
  if(JSON.stringify(constraints)!==JSON.stringify(t.constraints||[]))throw Error('Current constraint mismatch: '+target+' '+JSON.stringify({actual:constraints,expected:t.constraints}));
  const policies=(await db.query("select polname name,polcmd::text command,polpermissive permissive,array(select case when x=0 then 'public' else pg_get_userbyid(x)::text end from unnest(polroles) x) roles,pg_get_expr(polqual,polrelid) as \"using\",pg_get_expr(polwithcheck,polrelid) as \"check\" from pg_policy where polrelid=$1::regclass order by polname",[target])).rows;
  const normalize=p=>({name:p.name,command:p.command,permissive:p.permissive,roles:p.roles,using:p.using,check:p.check});
  if(JSON.stringify(policies.map(normalize))!==JSON.stringify((t.policies||[]).map(normalize)))throw Error('Current policy mismatch: '+target+' '+JSON.stringify({actual:policies.map(normalize),expected:(t.policies||[]).map(normalize)}));
  const security=(await db.query('select pg_get_userbyid(relowner) owner,relrowsecurity rls,relforcerowsecurity force_rls,relacl::text[] acl from pg_class where oid=$1::regclass',[target])).rows[0];
  for(const key of ['owner','rls','force_rls','acl'])if(JSON.stringify(security[key])!==JSON.stringify(t[key]))throw Error('Current table '+key+' mismatch: '+target);
  const triggers=(await db.query('select tgname name,tgenabled::text enabled,pg_get_triggerdef(oid) definition from pg_trigger where tgrelid=$1::regclass and not tgisinternal order by tgname',[target])).rows;
  if(JSON.stringify(triggers)!==JSON.stringify((t.triggers||[]).map(({name,enabled,definition})=>({name,enabled,definition}))))throw Error('Current trigger mismatch: '+target);
  equivalence.push({table:target,columnCount:columns.length,policyCount:policies.length,triggerCount:triggers.length,allCompared:true});
 }
 for(const f of routines.values()){
  const r=(await db.query('select pg_get_functiondef(p.oid) definition,pg_get_userbyid(proowner) owner,prosecdef security_definer,proconfig config,proacl::text[] acl from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname=$1 and p.proname=$2 and pg_get_function_identity_arguments(p.oid)=$3',[f.schema,f.name,f.args])).rows[0];
  if(!r)throw Error('Missing routine signature: '+f.schema+'.'+f.name);
  for(const key of ['definition','owner','security_definer','config'])if(JSON.stringify(r[key])!==JSON.stringify(f[key]))throw Error('Current routine '+key+' mismatch: '+f.schema+'.'+f.name);
  const canon=items=>(items||[`${f.owner}=X/${f.owner}`,`=X/${f.owner}`]).slice().sort();
  if(JSON.stringify(canon(r.acl))!==JSON.stringify(canon(f.acl)))throw Error('Current routine effective ACL mismatch: '+f.schema+'.'+f.name);
 }
 for(const expected of captures[0].roles){const actual=(await db.query('select rolname name,rolinherit inherit,rolbypassrls bypassrls,rolsuper superuser from pg_roles where rolname=$1',[expected.name])).rows[0];if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error('Role attributes mismatch: '+expected.name);}
 const view=(await db.query("select pg_get_viewdef(oid,true) definition,reloptions from pg_class where oid='public.my_goals'::regclass")).rows[0];if(view.definition!==v.view_definition||!view.reloptions.includes('security_invoker=true'))throw Error('Current my_goals invoker/view mismatch');
 return {tables:equivalence,routinesCompared:routines.size,roleAttributesCompared:captures[0].roles.length,myGoalsInvokerViewCompared:true,managedAuth:'Exact captured auth.uid/auth.jwt bodies; fictional GUC claims and minimal managed platform scaffold, not GoTrue'};
}
module.exports={inputs,reconstruct,hash,qi,lit,CORE};
