'use strict';
// READ-ONLY, detached synthetic composition. Not an identity join, approval or tracking writer.
const {isPromise}=require('node:util').types;
const VERSION='rva-share-source-review-fixture-v1-20261101';
const fields=['authority_revision','campaign_id','creative_id','campaign_revision','creative_revision','catalog_id','catalog_version','catalog_hash','approval_generation','channel','driver'];
const need=(v,r)=>{if(!v)throw Error(r);};
const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
const result=(status,extra={})=>freeze({version:VERSION,fixtureOnly:true,productionEligible:false,persisted:false,status,...extra});
function snapshot(input){
 need(input&&Object.getPrototypeOf(input)===Object.prototype,'unexpected_fields');
 need(Reflect.ownKeys(input).length===fields.length&&fields.every(k=>Object.hasOwn(input,k)),'unexpected_fields');
 const r={};for(const k of fields){const d=Object.getOwnPropertyDescriptor(input,k);need(d&&'value'in d&&d.enumerable,'unsafe_input');r[k]=d.value;}
 for(const k of ['authority_revision','campaign_revision','creative_revision','approval_generation'])need(Number.isSafeInteger(r[k])&&r[k]>0,'invalid_selector');
 for(const k of ['campaign_id','creative_id','catalog_id','catalog_version','driver'])need(typeof r[k]==='string'&&r[k].length<100&&/^[a-z0-9_-]+$/.test(r[k]),'invalid_selector');
 need(typeof r.catalog_hash==='string'&&/^[a-f0-9]{64}$/.test(r.catalog_hash)&&['email','sms','dm','social'].includes(r.channel),'invalid_selector');return Object.freeze(r);
}
function request(manifest,channel,driver){return {authority_revision:manifest.authority_revision,campaign_id:manifest.share.campaign_id,creative_id:manifest.share.creative_id,campaign_revision:manifest.share.expected_campaign_revision,creative_revision:manifest.share.expected_creative_revision,catalog_id:manifest.education.catalog_id,catalog_version:manifest.education.expected_catalog_version,catalog_hash:manifest.education.expected_catalog_hash,approval_generation:manifest.education.expected_approval_generation,channel,driver};}
function createShareReview(providers){
 need(typeof providers?.manifest==='function'&&typeof providers.shareAdapter?.execute==='function'&&typeof providers.educationAdapter?.execute==='function','fixture_dependencies_required');
 function current(r){const m=providers.manifest();if(isPromise(m)){m.catch(()=>{});throw Error('synchronous_manifest_required');}need(m.fixtureOnly===true&&m.productionEligible===false&&m.drivers.includes(r.driver),'fixture_scope_required');need(JSON.stringify(request(m,r.channel,r.driver))===JSON.stringify(r),'source_version_mismatch');return m;}
 async function execute(input){try{
  const r=snapshot(input);let m=current(r);
  const share=await providers.shareAdapter.execute({...m.share,channel:r.channel});current(r);need(share.status==='ready','share_unavailable');
  const referral=await providers.shareAdapter.execute(m.referral);current(r);need(referral.status==='ready','referral_unavailable');
  const education=await providers.educationAdapter.execute({...m.education,driver:r.driver});m=current(r);need(education.status==='supported_education'&&education.results.length>0,'education_unavailable');
  // All authorization is supplied by existing readers. No event, relationship or private identity is inferred.
  const citations=education.results.map(row=>({text:row.text,citation:row.citation,contentType:row.contentType}));
  return result('ready',{pins:r,copy:share.intent.copy_text,referral:{...referral.referral},education:citations,
   boundaries:{manualShareOnly:true,trackingConsent:m.state==='consent-revoked'?'withdrawn':'separate_explicit_event_only',recordsEvent:false,recordsClick:false,recordsYoutubeView:false,joinsClientIdentity:false,personalizedAdvice:false,financialEffects:false},
   explanation:'Source review only: educational references do not establish a client need, referral conversion, coaching recommendation or completed viewing.'});
 }catch(e){return result('held',{reason:['unexpected_fields','unsafe_input','invalid_selector','synchronous_manifest_required','fixture_scope_required','source_version_mismatch','share_unavailable','referral_unavailable','education_unavailable'].includes(e.message)?e.message:'dependency_unavailable'});}}
 return Object.freeze({execute});
}
module.exports=Object.freeze({VERSION,createShareReview,request});
