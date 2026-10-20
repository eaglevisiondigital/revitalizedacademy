'use strict';
const {createHmac}=require('node:crypto');
const protocol='rva-roadmap-seal-hmac-sha256-v1';
function workerIdentity(env=process.env){
 const id=env.ROADMAP_PROCESSING_SEAL_KEY_ID,secret=env.ROADMAP_PROCESSING_SEAL_SECRET;
 if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id||'')||!/^[a-f0-9]{64}$/.test(secret||''))return null;
 return{id,secret};
}
async function sealWithIdentity(call,identity,job,lease,document){
 const args={p_key:identity.id,p_job:job,p_lease:lease,p_document:document};
 const challenge=await call('roadmap_processing_seal_challenge',args);
 if(challenge?.protocol!==protocol||typeof challenge.challenge!=='string'||challenge.challenge.length>6000)throw Error('Worker seal unavailable');
 const proof=createHmac('sha256',Buffer.from(identity.secret,'hex')).update(challenge.challenge,'utf8').digest('hex');
 return call('roadmap_processing_worker_seal',{...args,p_proof:proof});
}
module.exports={workerIdentity,sealWithIdentity,protocol};
