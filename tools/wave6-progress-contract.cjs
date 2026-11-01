'use strict';
// Detached READ-ONLY FICTIONAL contract. Never production Auth/RLS or allowance authority.
const {isPromise}=require('node:util').types;
const VERSION='rva-progress-read-fixture-v1-20261101';
const id=v=>typeof v==='string'&&/^fictional-[a-z0-9_-]{1,70}$/.test(v);
const fail=reason=>{throw Object.assign(Error(reason),{safeReason:reason});};
const need=(v,r)=>{if(!v)fail(r);};
function copy(v,depth=0,budget={nodes:0}){
 need(++budget.nodes<1200&&depth<10,'invalid_snapshot');
 if(v===null||typeof v==='boolean'||typeof v==='string'){need(typeof v!=='string'||v.length<=512,'invalid_snapshot');return v;}
 if(typeof v==='number'){need(Number.isFinite(v),'invalid_snapshot');return v;}
 need(v&&typeof v==='object','invalid_snapshot');
 const array=Array.isArray(v),proto=Object.getPrototypeOf(v);
 need(array?proto===Array.prototype:proto===Object.prototype||proto===null,'invalid_snapshot');
 const out=array?[]:{};const keys=Reflect.ownKeys(v);
 need(keys.length<=80&&keys.every(k=>typeof k==='string'),'invalid_snapshot');
 for(const k of keys){if(array&&k==='length')continue;need(!['__proto__','constructor','prototype'].includes(k),'invalid_snapshot');const d=Object.getOwnPropertyDescriptor(v,k);need(d&&'value'in d&&d.enumerable,'invalid_snapshot');out[k]=copy(d.value,depth+1,budget);}
 if(array)need(out.length===v.length&&Object.keys(out).length===v.length,'invalid_snapshot');
 return out;
}
const exact=(o,fields)=>{need(o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).sort().join(',')===[...fields].sort().join(','),'unexpected_fields');};
const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
const stable=o=>JSON.stringify(o,(k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
function session(raw){const s=copy(raw);exact(s,['fixtureOnly','authenticated','actor_id','contact_id','role','target_contact_id','assigned','active','authorization_revision','transport_revision']);
 need(s.fixtureOnly===true&&s.authenticated===true&&s.active===true&&id(s.actor_id)&&id(s.contact_id)&&id(s.target_contact_id)&&['client','coach'].includes(s.role)&&typeof s.assigned==='boolean'&&Number.isSafeInteger(s.authorization_revision)&&s.authorization_revision>0&&typeof s.transport_revision==='string','session_denied');
 need(s.role==='client'?s.contact_id===s.target_contact_id:s.assigned===true,'scope_denied');return s;
}
function binding(s){const {transport_revision,...b}=s;return stable(b);}
function validate(raw,actor){const s=copy(raw);exact(s,['fixtureOnly','source_version','contact_id','authorization_revision','habits','goals','weekly','allowance']);
 need(s.fixtureOnly===true&&s.source_version==='fictional-progress-v1'&&s.contact_id===actor.target_contact_id&&s.authorization_revision===actor.authorization_revision,'source_binding_denied');
 const seen=new Set();for(const [kind,fields] of [['habits',['id','title','target','unit','completed_today']],['goals',['id','title','status']]]){
  need(Array.isArray(s[kind])&&s[kind].length<=30,'invalid_snapshot');
  for(const row of s[kind]){exact(row,fields);need(id(row.id)&&!seen.has(row.id)&&typeof row.title==='string'&&row.title.length>0,'invalid_snapshot');seen.add(row.id);
   if(kind==='habits')need((row.target===null||Number.isFinite(row.target)&&row.target>=0)&&typeof row.unit==='string'&&typeof row.completed_today==='boolean','invalid_snapshot');
   else need(['active','paused','completed'].includes(row.status),'invalid_snapshot');
  }
 }
 exact(s.weekly,['habit_days','progress_entries']);for(const v of Object.values(s.weekly))need(v===null||Number.isSafeInteger(v)&&v>=0,'invalid_snapshot');need(s.weekly.habit_days===null||s.weekly.habit_days<=7,'invalid_snapshot');
 exact(s.allowance,['limit','used','unit','status','ends_at']);need(['minutes','sessions'].includes(s.allowance.unit)&&['active','held','expired'].includes(s.allowance.status),'invalid_allowance');
 for(const k of ['limit','used'])need(s.allowance[k]===null||Number.isSafeInteger(s.allowance[k])&&s.allowance[k]>=0,'invalid_allowance');
 need(s.allowance.ends_at===null||typeof s.allowance.ends_at==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(s.allowance.ends_at)&&Number.isFinite(Date.parse(s.allowance.ends_at)),'invalid_allowance');
 return s;
}
function project(s,actor){const a=s.allowance,known=a.limit!==null&&a.used!==null,over=known&&a.used>a.limit;
 return freeze({version:VERSION,fixtureOnly:true,productionEligible:false,persisted:false,status:'ready',view:actor.role,source_version:s.source_version,
  habits:s.habits,goals:s.goals,weekly:s.weekly,
  allowance:{unit:a.unit,status:a.status,limit:a.limit,used:a.used,remaining:known&&!over?a.limit-a.used:null,ends_at:a.ends_at,interpretation:over?'needs_review':known?'known':'unknown'},
  capabilities:{readOnly:true,changeAllowance:false,householdVisibility:false,financialOperations:false,clientAdvice:false}});
}
function createProgressReader(deps){need(deps?.mode==='fictional-preview'&&['getSession','currentAuthority','resolveSnapshot'].every(k=>typeof deps[k]==='function'),'fixture_dependencies_required');
 const held=r=>freeze({version:VERSION,fixtureOnly:true,productionEligible:false,persisted:false,status:'held',reason:r});
 async function execute(input){try{
  const req=copy(input);exact(req,['action']);need(req.action==='read','operation_denied');
  const raw=deps.currentAuthority();if(isPromise(raw)){raw.catch(()=>{});fail('synchronous_authority_required');}const entry=session(raw),bind=binding(entry);
  const fresh=async()=>{const s=session(await deps.getSession());need(binding(s)===bind,'authority_changed');return s;};await fresh();
  const first=validate(await deps.resolveSnapshot({actor:freeze(copy(entry))}),entry);await fresh();
  const second=validate(await deps.resolveSnapshot({actor:freeze(copy(entry))}),entry);await fresh();need(stable(first)===stable(second),'snapshot_changed');
  const finalRaw=deps.currentAuthority();if(isPromise(finalRaw)){finalRaw.catch(()=>{});fail('synchronous_authority_required');}need(binding(session(finalRaw))===bind,'authority_changed');
  return project(second,entry);
 }catch(e){return held(e.safeReason||'dependency_unavailable');}}
 return Object.freeze({execute});
}
// This factory supplies invented demo actors. Persona selectors are visibly synthetic, NOT login.
function createProgressFixtures(getManifest){
 const personas=['client','assigned-coach','unassigned-coach'];
 function reader(persona){need(personas.includes(persona),'invalid_persona');
  function current(){const m=getManifest(),denied=['logout','wrong-account','expired'].includes(m.state);return {fixtureOnly:true,authenticated:!denied,active:!denied,actor_id:'fictional-'+persona,contact_id:persona==='client'?'fictional-client':'fictional-coach',role:persona==='client'?'client':'coach',target_contact_id:'fictional-client',assigned:persona==='assigned-coach',authorization_revision:m.authority_revision,transport_revision:m.state==='renewed'?'renewed':'initial'};}
  return createProgressReader({mode:'fictional-preview',getSession:async()=>current(),currentAuthority:current,resolveSnapshot:async()=>({fixtureOnly:true,source_version:'fictional-progress-v1',contact_id:'fictional-client',authorization_revision:getManifest().authority_revision,
   habits:[{id:'fictional-habit',title:'Fictional daily reflection',target:1,unit:'reflection',completed_today:false}],
   goals:[{id:'fictional-goal',title:'Fictional weekly practice',status:'active'}],weekly:{habit_days:2,progress_entries:null},
   allowance:{limit:60,used:15,unit:'minutes',status:'active',ends_at:null}})});
 }
 return Object.freeze({execute:async(input)=>{try{const r=copy(input);exact(r,['persona']);need(personas.includes(r.persona),'invalid_persona');return reader(r.persona).execute({action:'read'});}catch(e){return freeze({version:VERSION,fixtureOnly:true,productionEligible:false,persisted:false,status:'held',reason:e.safeReason||'dependency_unavailable'});}}});
}
module.exports=Object.freeze({VERSION,createProgressReader,createProgressFixtures});
