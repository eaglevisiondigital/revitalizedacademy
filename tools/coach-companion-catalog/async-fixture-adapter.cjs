'use strict';
// Additive fictional snapshot adapter. Injected receipts are NOT production approvals.
const Catalog=require('./index.cjs'),{isPromise}=require('node:util').types;
const VERSION='coach-companion-async-fictional-v1';
class Held extends Error{constructor(code){super(code);this.code=code;}}
const need=(v,c)=>{if(!v)throw new Held(c);};
const fixtureId=v=>typeof v==='string'&&/^fictional-[a-z0-9][a-z0-9_-]{0,69}$/.test(v);
const hex=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
function freeze(v){if(v&&typeof v==='object'){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;}
function copy(input,max=262144){let nodes=0,bytes=0;const seen=new Set();function walk(v,depth){
 need(++nodes<=7000&&depth<=12,'unsafe_input');if(v===null||typeof v==='boolean')return v;if(typeof v==='number'){need(Number.isSafeInteger(v),'unsafe_input');return v;}
 if(typeof v==='string'){bytes+=Buffer.byteLength(v);need(bytes<=max&&v.length<=4096,'input_limit');return v;}
 need(v&&typeof v==='object'&&!seen.has(v),'unsafe_input');const array=Array.isArray(v),proto=Object.getPrototypeOf(v);need(array?proto===Array.prototype:proto===Object.prototype||proto===null,'unsafe_input');seen.add(v);
 const keys=Reflect.ownKeys(v);need(keys.every(k=>typeof k==='string'),'unsafe_input');
 if(array){need(v.length<=256&&keys.length===v.length+1,'unsafe_input');const a=[];for(let i=0;i<v.length;i++){const d=Object.getOwnPropertyDescriptor(v,String(i));need(d&&'value'in d&&d.enumerable,'unsafe_input');a.push(walk(d.value,depth+1));}seen.delete(v);return a;}
 need(keys.length<=32,'unsafe_input');const o={};for(const k of keys){need(!['constructor','prototype','__proto__'].includes(k),'unsafe_input');const d=Object.getOwnPropertyDescriptor(v,k);need(d&&'value'in d&&d.enumerable,'unsafe_input');bytes+=Buffer.byteLength(k);need(bytes<=max,'input_limit');o[k]=walk(d.value,depth+1);}seen.delete(v);return o;
 }return walk(input,0);}
function fields(o,required,optional=[]){need(o&&typeof o==='object'&&!Array.isArray(o),'invalid_snapshot');need(required.every(k=>Object.hasOwn(o,k))&&Object.keys(o).every(k=>[...required,...optional].includes(k)),'unexpected_fields');}
function canonical(v){return Array.isArray(v)?'['+v.map(canonical).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);}
function session(s){fields(s,['fixtureOnly','principal_ref','authorization_epoch','authority_revision','audience','approval_generation','educationAllowed'],['transport_revision']);need(s.fixtureOnly===true&&fixtureId(s.principal_ref)&&fixtureId(s.authorization_epoch)&&s.educationAllowed===true,'session_denied');need(s.audience==='fictional_reviewer','audience_denied');need([s.authority_revision,s.approval_generation].every(n=>Number.isSafeInteger(n)&&n>0),'session_denied');return freeze(s);}
function binding(s){return canonical(Object.fromEntries(Object.entries(s).filter(([k])=>k!=='transport_revision')));}
function request(raw){const r=copy(raw,4096);fields(r,['catalog_id','expected_catalog_version','expected_catalog_hash','expected_approval_generation','driver','topic','limit']);need(fixtureId(r.catalog_id)&&fixtureId(r.expected_catalog_version)&&hex(r.expected_catalog_hash)&&Number.isSafeInteger(r.expected_approval_generation)&&r.expected_approval_generation>0,'invalid_selector');need(typeof r.driver==='string'&&typeof r.topic==='string'&&/^[a-z][a-z0-9_-]{0,79}$/.test(r.topic)&&Number.isSafeInteger(r.limit)&&r.limit>0&&r.limit<=Catalog.LIMITS.results,'invalid_selector');return freeze(r);}
function catalogSnapshot(x,s,r){fields(x,['fixtureOnly','authority_revision','audience','approval_generation','catalog_id','catalog']);need(x.fixtureOnly===true&&x.authority_revision===s.authority_revision&&x.audience===s.audience&&x.approval_generation===s.approval_generation&&x.catalog_id===r.catalog_id,'source_version_mismatch');const c=x.catalog;need(c?.dataClass==='fictional'&&c.version===r.expected_catalog_version&&c.sha256===r.expected_catalog_hash&&c.approvalGeneration===r.expected_approval_generation&&c.approvalGeneration===s.approval_generation,'catalog_pin_mismatch');return freeze(x);}
function receiptSnapshot(x,s){fields(x,['fixtureOnly','authority_revision','audience','approval_generation','records']);need(x.fixtureOnly===true&&x.authority_revision===s.authority_revision&&x.audience===s.audience&&x.approval_generation===s.approval_generation,'receipt_snapshot_mismatch');need(Array.isArray(x.records)&&x.records.length<=160,'invalid_receipts');const keys=new Set();for(const r of x.records){fields(r,['kind','id','verdict','targetHash','receiptHash','generation']);need(['source','claim'].includes(r.kind)&&fixtureId(r.id)&&['approved','rejected','revoked','superseded'].includes(r.verdict)&&hex(r.targetHash)&&hex(r.receiptHash)&&r.generation===s.approval_generation,'invalid_receipts');const k=r.kind+':'+r.id;need(!keys.has(k),'duplicate_receipt');keys.add(k);}return freeze(x);}
function hold(code){return freeze({asyncAdapterVersion:VERSION,fixtureOnly:true,productionEligible:false,persisted:false,issued:false,status:'held_for_review',reasons:[code],results:[]});}
function createFictionalLookupAdapter(deps){
 need(deps?.mode==='fictional-preview'&&['getSession','currentAuthority','resolveCatalog','resolveReceipts'].every(k=>typeof deps[k]==='function'),'fixture_dependencies_required');
 async function call(name,args){try{return copy(await deps[name](args));}catch(e){if(e instanceof Held)throw e;throw new Held('dependency_unavailable');}}
 function current(){let value;try{value=deps.currentAuthority();}catch{throw new Held('dependency_unavailable');}if(isPromise(value)){Promise.prototype.then.call(value,()=>{},()=>{});throw new Held('synchronous_dependency_required');}return session(copy(value));}
 async function same(actor){const next=session(await call('getSession'));need(binding(next)===binding(actor),'authority_changed');}
 async function perform(r,entry){
  const actor=session(await call('getSession'));need(binding(actor)===binding(entry),'authority_changed');const args=freeze({principal:actor,selectors:r});
  const first=catalogSnapshot(await call('resolveCatalog',args),actor,r);await same(actor);
  const receiptArgs=freeze({principal:actor,catalog_id:r.catalog_id,catalog_version:r.expected_catalog_version,catalog_hash:r.expected_catalog_hash,approval_generation:r.expected_approval_generation});
  const receipts=receiptSnapshot(await call('resolveReceipts',receiptArgs),actor);await same(actor);
  const fresh=catalogSnapshot(await call('resolveCatalog',args),actor,r);await same(actor);
  const freshReceipts=receiptSnapshot(await call('resolveReceipts',receiptArgs),actor);await same(actor);
  need(canonical(first)===canonical(fresh),'catalog_changed');need(canonical(receipts)===canonical(freshReceipts),'receipts_changed');
  need(binding(current())===binding(actor),'authority_changed'); // Synchronous projection after all awaits.
  const map=new Map(freshReceipts.records.map(row=>[row.kind+':'+row.id,row]));
  const options={mode:'fictional-preview',fixtureVerifier:e=>{const row=map.get(e.kind+':'+e.id);return {fixtureOnly:true,verdict:row?.verdict||'rejected',targetHash:row?.targetHash||'0'.repeat(64),receiptHash:row?.receiptHash||'0'.repeat(64),generation:row?.generation||actor.approval_generation};}};
  const validated=Catalog.validateCatalog(fresh.catalog,options);if(validated.status!=='valid_catalog')return hold('catalog_or_receipt_held');
  const lookup=Catalog.lookupEducational(fresh.catalog,{schemaVersion:Catalog.REQUEST_SCHEMA,dataClass:'fictional',operation:'educational_lookup',catalogVersion:r.expected_catalog_version,catalogHash:r.expected_catalog_hash,approvalGeneration:r.expected_approval_generation,audience:actor.audience,driver:r.driver,topic:r.topic,intent:'education',safetyHold:false,limit:r.limit},options);
  return freeze({...lookup,asyncAdapterVersion:VERSION});
 }
 async function execute(raw){try{const r=request(raw),entry=current();return await perform(r,entry);}catch(e){return hold(e instanceof Held?e.code:'adapter_unavailable');}}
 return Object.freeze({execute});
}
module.exports=Object.freeze({createFictionalLookupAdapter,VERSION});
