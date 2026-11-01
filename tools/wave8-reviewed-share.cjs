'use strict';
// Optional fictional manual-share composition. No approval writer, identity join or tracking action.
const {createHash}=require('node:crypto');
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const {createShareReview,request}=require('./wave7-share-review.cjs');
const VERSION='rva-reviewed-share-fixture-v1-20261101';
const frozen=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(frozen);Object.freeze(value);}return value;};
function encode(payload){
 const encoded=spawnSync(process.env.RVA_PREVIEW_PYTHON||'python3',[path.join(__dirname,'affiliate-share-preview/encode.py')],{input:JSON.stringify({payload}),encoding:'utf8',maxBuffer:128*1024,timeout:10000});
 if(encoded.status!==0)throw Error('encoder_unavailable');
 const qr=JSON.parse(encoded.stdout);if(typeof qr.png!=='string'||!Number.isInteger(qr.modules)||qr.quiet_zone_modules!==4)throw Error('encoder_unavailable');
 return {qr_data_url:'data:image/png;base64,'+qr.png,modules:qr.modules,quiet_zone_modules:qr.quiet_zone_modules,error_correction:qr.error_correction};
}
function createReviewedShare({providers,encodeQr=encode}){
 const review=createShareReview(providers);
 const result=(status,extra={})=>frozen({version:VERSION,fixtureOnly:true,productionEligible:false,persisted:false,status,...extra});
 function current(pins){const m=providers.manifest();if(JSON.stringify(request(m,pins.channel,pins.driver))!==JSON.stringify(pins))throw Error('source_version_mismatch');return m;}
 async function execute(input){try{
  // Reuse the existing exact selector validation and all independent source/identity readers.
  const inspected=await review.execute(input);if(inspected.status!=='ready')return result('held',{reason:inspected.reason});
  const pins=inspected.pins;let m=current(pins);
  const shared=await providers.shareAdapter.execute({...m.share,channel:pins.channel});current(pins);
  if(shared.status!=='ready'||shared.intent.copy_text!==inspected.copy)throw Error('share_unavailable');
  const url=shared.intent.referral_url;if(url!==shared.intent.qr_payload)throw Error('share_unavailable');
  const qr=await encodeQr(url);m=current(pins);
  // This digest describes a local composition, never a new founder/staff approval or persisted receipt.
  const composition={pins,copy:inspected.copy,url,referral:inspected.referral,education:inspected.education,boundaries:inspected.boundaries};
  const composition_hash=createHash('sha256').update(JSON.stringify(composition)).digest('hex');
  return result('ready',{...composition,...qr,composition_hash,explanation:'One coherent fictional manual-copy and QR package with separately scoped educational references. Its fingerprint is not an approval, share event, click, conversion or personalized coaching recommendation.'});
 }catch(e){return result('held',{reason:['source_version_mismatch','share_unavailable','encoder_unavailable'].includes(e.message)?e.message:'dependency_unavailable'});}}
 return Object.freeze({execute});
}
module.exports=Object.freeze({VERSION,createReviewedShare});
