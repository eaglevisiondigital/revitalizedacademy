'use strict';

// Detached FICTIONAL server adapter only. No HTTP registration, real Auth/RLS,
// authenticated approval receipts, persistence, messaging or financial actions.
const { shareIntent, projectReferral, recordTouchpoint, VERSION } = require('../../js/rva-affiliate-share-contract.cjs');
const {isPromise}=require('node:util').types;
const ADAPTER_VERSION = 'rva-fictional-share-adapter-v1';
const ACTIONS = ['share','referral','touchpoint'];
const EVENTS = ['share.created','share.clicked','appointment.booked'];
class Denied extends Error { constructor(code) { super(code); this.code=code; } }
const need=(yes,code)=>{if(!yes)throw new Denied(code);};
const token=value=>typeof value==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/.test(value);
const fictional=value=>typeof value==='string'&&/^(fictional|synthetic)-[A-Za-z0-9_-]{1,80}$/.test(value);
function freeze(value){if(value&&typeof value==='object'){for(const v of Object.values(value))freeze(v);Object.freeze(value);}return value;}
// Copy only JSON data descriptors. Never execute getters/toJSON or preserve prototypes.
function copy(input,maxBytes=65536){
 let nodes=0,bytes=0;const seen=new Set();
 function walk(value,depth){
  need(++nodes<=4000&&depth<=10,'unsafe_input');
  if(value===null||typeof value==='boolean')return value;
  if(typeof value==='number'){need(Number.isFinite(value),'unsafe_input');return value;}
  if(typeof value==='string'){bytes+=Buffer.byteLength(value);need(bytes<=maxBytes,'input_limit');return value;}
  need(value&&typeof value==='object'&&!seen.has(value),'unsafe_input');seen.add(value);
  const array=Array.isArray(value),proto=Object.getPrototypeOf(value);
  need(array?proto===Array.prototype:proto===Object.prototype||proto===null,'unsafe_input');
  const keys=Reflect.ownKeys(value);need(keys.every(k=>typeof k==='string'),'unsafe_input');
  if(array){need(value.length<=1000&&keys.length===value.length+1,'unsafe_input');const out=[];
   for(let i=0;i<value.length;i++){const d=Object.getOwnPropertyDescriptor(value,String(i));need(d&&'value'in d&&d.enumerable,'unsafe_input');out.push(walk(d.value,depth+1));}seen.delete(value);return out;}
  need(keys.length<=32,'unsafe_input');const out={};
  for(const k of keys){need(!['__proto__','constructor','prototype'].includes(k),'unsafe_input');const d=Object.getOwnPropertyDescriptor(value,k);need(d&&'value'in d&&d.enumerable,'unsafe_input');bytes+=Buffer.byteLength(k);need(bytes<=maxBytes,'input_limit');out[k]=walk(d.value,depth+1);}
  seen.delete(value);return out;
 }
 return walk(input,0);
}
function fields(o,required,optional=[]){need(o&&typeof o==='object'&&!Array.isArray(o),'invalid_snapshot');const keys=Object.keys(o);need(required.every(k=>Object.hasOwn(o,k))&&keys.every(k=>[...required,...optional].includes(k)),'unexpected_fields');}
function list(value,allowed){need(Array.isArray(value)&&value.length>0&&new Set(value).size===value.length&&value.every(x=>allowed.includes(x)),'invalid_snapshot');}
function shapeProfile(p){fields(p,['user_id','contact_id','referral_profile_status','referral_code','share_url']);}
function shapeSession(s,action){
 fields(s,['fixtureOnly','authenticated','scope_id','user_id','contact_id','market','role','allowed_actions','authorization_epoch','authority_revision'],['transport_revision']);
 need(s.fixtureOnly===true&&s.authenticated===true,'session_denied');
 need([s.scope_id,s.user_id,s.contact_id].every(fictional)&&token(s.authorization_epoch),'session_denied');
 need(Number.isSafeInteger(s.authority_revision)&&s.authority_revision>0,'session_denied');
 need(['owner','affiliate'].includes(s.role)&&typeof s.market==='string'&&/^[A-Z]{2}$/.test(s.market),'session_denied');
 list(s.allowed_actions,ACTIONS);need(s.allowed_actions.includes(action),'operation_denied');return freeze(s);
}
function canonical(v){return Array.isArray(v)?'['+v.map(canonical).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);}
function binding(s){return JSON.stringify([s.scope_id,s.user_id,s.contact_id,s.market,s.role,s.authorization_epoch,s.authority_revision,[...s.allowed_actions].sort()]);}
function invalidURL(value){let u;try{u=new URL(value);}catch{return false;}return u.protocol==='https:'&&u.hostname.endsWith('.invalid')&&!u.username&&!u.password;}
function shapeShare(snapshot,actor){
 fields(snapshot,['fixtureOnly','authority_revision','scope_id','profile','policy','campaign','creative'],['trackingConsent']);
 need(snapshot.fixtureOnly===true&&snapshot.authority_revision===actor.authority_revision&&snapshot.scope_id===actor.scope_id,'source_version_mismatch');
 shapeProfile(snapshot.profile);fields(snapshot.policy,['destination_urls','asset_origins']);
 for(const k of ['destination_urls','asset_origins'])need(Array.isArray(snapshot.policy[k])&&snapshot.policy[k].length>0&&snapshot.policy[k].length<=8&&snapshot.policy[k].every(invalidURL),'fictional_url_required');
 const c=snapshot.campaign,x=snapshot.creative;
 fields(c,['id','status','revision','approved_revision','starts_at','expires_at','revoked_at','channels','markets','destination_url','disclosure']);
 fields(x,['id','campaign_id','campaign_revision','status','revision','approved_revision','starts_at','expires_at','revoked_at','channels','markets','media_type','asset_url','copy']);
 need(invalidURL(snapshot.profile.share_url)&&invalidURL(c.destination_url)&&invalidURL(x.asset_url),'fictional_url_required');
 need(fictional(c.id)&&fictional(x.id),'fictional_source_required');
 fields(x.copy,[],['email','sms','dm','social']);for(const v of Object.values(x.copy))fields(v,['approved_revision','text']);
 if(snapshot.trackingConsent){fields(snapshot.trackingConsent,['approved','scope_id','user_id','revoked_at','starts_at','expires_at']);}
 return freeze(snapshot);
}
function shapeReferral(snapshot,actor){
 fields(snapshot,['fixtureOnly','authority_revision','scope_id','profile','referral','disclosure']);
 need(snapshot.fixtureOnly===true&&snapshot.authority_revision===actor.authority_revision&&snapshot.scope_id===actor.scope_id,'source_version_mismatch');
 shapeProfile(snapshot.profile);
 fields(snapshot.referral,['referral_id','referrer_contact_id','status']);
 fields(snapshot.disclosure,['approved','viewer_user_id','viewer_contact_id','referral_id','revoked_at','starts_at','expires_at','statuses']);
 need(invalidURL(snapshot.profile.share_url),'fictional_url_required');return freeze(snapshot);
}
function requestShape(input){
 const r=copy(input,2048);need(ACTIONS.includes(r?.action),'unsupported_operation');
 if(r.action==='referral'){fields(r,['action','referral_id']);need(fictional(r.referral_id),'invalid_selector');}
 else{
  const keys=['action','campaign_id','creative_id','expected_campaign_revision','expected_creative_revision','channel'];
  fields(r,r.action==='touchpoint'?[...keys,'event_id','event_type']:keys);
  need(fictional(r.campaign_id)&&fictional(r.creative_id)&&['email','sms','dm','social'].includes(r.channel),'invalid_selector');
  need([r.expected_campaign_revision,r.expected_creative_revision].every(x=>Number.isSafeInteger(x)&&x>0),'invalid_selector');
  if(r.action==='touchpoint')need(fictional(r.event_id)&&EVENTS.includes(r.event_type),'unsupported_event');
 }
 return freeze(r);
}
const HELPER_CODES=new Set(['wrong_affiliate','inactive_affiliate','not_current','unapproved_campaign','unapproved_creative','stale_creative','unapproved_copy','channel_or_market_denied','invalid_text','unsafe_url','unapproved_destination','unapproved_asset','invalid_referral_code','wrong_referral_link','disclosure_denied','tracking_denied','invalid_time','event_conflict','capacity_reached','future_event']);
function helper(fn,args){try{return fn(args);}catch(error){throw new Denied(HELPER_CODES.has(error.message)?error.message:'projection_denied');}}
function result(status,extra={}){return freeze({adapterVersion:ADAPTER_VERSION,fixtureOnly:true,productionEligible:false,persisted:false,status,...extra});}
function createFixtureAdapter(deps){
 need(deps?.mode==='fictional-preview'&&['getSession','currentAuthority','resolveShare','resolveReferral','clock'].every(k=>typeof deps[k]==='function'),'fixture_dependencies_required');
 const journals=new Map();let tail=Promise.resolve(),pending=0;
 async function call(name,...args){try{return copy(await deps[name](...args));}catch(error){if(error instanceof Denied)throw error;throw new Denied('dependency_unavailable');}}
 async function session(action){return shapeSession(await call('getSession'),action);}
 async function unchanged(actor,action){const current=await session(action);need(binding(current)===binding(actor),'authority_changed');return current;}
 function sync(name){let value;try{value=deps[name]();}catch{throw new Denied('dependency_unavailable');}if(isPromise(value)){Promise.prototype.then.call(value,()=>{},()=>{});throw new Denied('synchronous_dependency_required');}return value;}
 function authority(action){return shapeSession(copy(sync('currentAuthority')),action);}
 function clock(){const now=sync('clock');need(typeof now==='string'&&Number.isFinite(Date.parse(now)),'clock_unavailable');return now;}
 async function resources(r,entry,finalize){
  const actor=await session(r.action);need(binding(actor)===binding(entry),'authority_changed');
  const args=freeze({actor,selectors:r});
  const name=r.action==='referral'?'resolveReferral':'resolveShare',shape=r.action==='referral'?shapeReferral:shapeShare;
  const first=shape(await call(name,args),actor);await unchanged(actor,r.action);
  const current=shape(await call(name,args),actor);await unchanged(actor,r.action);
  need(canonical(first)===canonical(current),'source_changed');
  const context=freeze({enabled:true,authenticated:true,scope_id:actor.scope_id,user_id:actor.user_id,contact_id:actor.contact_id,market:actor.market,now:clock()});
  const live=authority(r.action);
  need(binding(live)===binding(actor),'authority_changed');
  if(r.action==='referral'){
   need(current.referral.referral_id===r.referral_id,'source_version_mismatch');
   return finalize({actor,context,snapshot:current,projection:helper(projectReferral,{context,...current})});
  }
  need(current.campaign.id===r.campaign_id&&current.creative.id===r.creative_id&&current.campaign.revision===r.expected_campaign_revision&&current.creative.revision===r.expected_creative_revision,'source_version_mismatch');
  const intent=helper(shareIntent,{context,...current,channel:r.channel});
  return finalize({actor,context,snapshot:current,intent});
 }
 function run(r,entry){
  return resources(r,entry,loaded=>{ // No await between synchronous current-authority check and commit.
  if(r.action==='share')return result('ready',{intent:loaded.intent});
  if(r.action==='referral')return result('ready',{referral:loaded.projection});
  const {actor,context,snapshot}=loaded,key=JSON.stringify([actor.scope_id,actor.user_id,actor.contact_id]);
  need(journals.has(key)||journals.size<32,'journal_capacity');
  const previous=journals.get(key)||{state:freeze({version:VERSION,scope_id:actor.scope_id,user_id:actor.user_id,contact_id:actor.contact_id,events:[]}),pins:new Map()};
  const eventKey=JSON.stringify([r.event_id,r.event_type]);
  const pin=JSON.stringify([r.campaign_id,r.creative_id,r.expected_campaign_revision,r.expected_creative_revision,r.channel]);
  if(previous.pins.has(eventKey))need(previous.pins.get(eventKey)===pin,'event_conflict');
  const old=previous.state.events.find(e=>e.event_id===r.event_id&&e.event_type===r.event_type);
  const event={event_id:r.event_id,producer:'fictional-server-adapter',event_type:r.event_type,campaign_id:r.campaign_id,creative_id:r.creative_id,referrer_contact_id:actor.contact_id,occurred_at:old?.occurred_at||context.now};
  const reduced=helper(recordTouchpoint,{context,profile:snapshot.profile,state:previous.state,event,trackingConsent:snapshot.trackingConsent});
  const pins=new Map(previous.pins);pins.set(eventKey,pin);journals.set(key,{state:reduced.state,pins});
  return result('recorded',{event_id:r.event_id,event_type:r.event_type,duplicate:reduced.duplicate,event_count:reduced.state.events.length});
  });
 }
 async function safe(r,entry){try{return await run(r,entry);}catch(error){return result('held',{reason:error instanceof Denied?error.code:'adapter_unavailable'});}}
 function execute(input){
  let r,entry;try{r=requestShape(input);entry=authority(r.action);}catch(error){return Promise.resolve(result('held',{reason:error instanceof Denied?error.code:'invalid_request'}));}
  if(r.action!=='touchpoint')return safe(r,entry);
  if(pending>=128)return Promise.resolve(result('held',{reason:'queue_capacity'}));
  pending++;const task=tail.then(()=>safe(r,entry));tail=task.then(()=>{},()=>{});
  return task.finally(()=>{pending--;});
 }
 return Object.freeze({execute});
}
module.exports=Object.freeze({createFixtureAdapter,ADAPTER_VERSION});
