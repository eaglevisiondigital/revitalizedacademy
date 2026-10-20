// Library only: no CLI, network client, credential lookup, stdout or automatic execution.
// Future authorized operator supplies a parameter-binding DB client and a protected
// store adapter whose implementations must not log arguments/values. Never use a
// raw-SQL transcript tool or a browser secret field visible to automation for this call.
'use strict';
const {randomUUID,randomBytes}=require('node:crypto');
const site='ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06',project='voalfpxiyznnqfcqcymd',deadline=Date.parse('2026-10-22T13:45:00Z');
async function stageProtectedWorker(client,store,{verifiedProject,operator,session,expires,authorization}){
 if(verifiedProject!==project||!operator||!session||typeof authorization!=='string'||authorization.trim().length<10||!Number.isFinite(Date.parse(expires))||Date.parse(expires)<=Date.now()||Date.parse(expires)>deadline)throw Error('Verified operator, production target and approved deadline required');
 if(typeof store?.assertAbsent!=='function'||typeof store?.setProtected!=='function')throw Error('Protected value-redacting store adapter required');
 const names=['ROADMAP_PROCESSING_SEAL_KEY_ID','ROADMAP_PROCESSING_SEAL_SECRET'];let begun=false;
 try{
 await store.assertAbsent({site,names,context:'production',metadataOnly:true});
 await client.query('begin isolation level serializable');begun=true;
 await client.query("set local statement_timeout='15s'");await client.query("set local lock_timeout='2s'");
 // Fail before generating/transmitting a key if the approved operator cannot prevent SQL parameter logging.
 await client.query('set local log_parameter_max_length=0');await client.query('set local log_parameter_max_length_on_error=0');
 const logging=await client.query("select current_setting('log_parameter_max_length')a,current_setting('log_parameter_max_length_on_error')b,current_setting('pgaudit.log_parameter',true)c");
 if(logging.rows[0]?.a!=='0'||logging.rows[0]?.b!=='0'||!Object.hasOwn(logging.rows[0],'c')||(logging.rows[0].c!==null&&!['off','false','0'].includes(logging.rows[0].c)))throw Error('Safe parameter handling unavailable');
 const flags=await client.query("select ingest,process,review,approve,internal_pdf from private.roadmap_processing_controls where singleton for update");
 if(!flags.rows[0]||Object.values(flags.rows[0]).some(value=>value!==false))throw Error('All controls must be held');
 const id=randomUUID(),secret=randomBytes(32).toString('hex');
 await client.query('select private.roadmap_processing_stage_seal_key($1,$2,$3,$4,$5,$6)',[id,secret,expires,operator,session,authorization]);
 await store.setProtected({site,name:names[0],value:id,scope:'functions',context:'production',containsSecretValues:true});
 await store.setProtected({site,name:names[1],value:secret,scope:'functions',context:'production',containsSecretValues:true});
 await client.query('commit');begun=false;return{keyId:id,staged:true,active:false,deploymentRequired:true};
 }catch{
 if(begun)try{await client.query('rollback');}catch{}
 // Do not emit DB/API errors, argument values or credentials. A partial env write
 // cannot authorize anything without the committed, bound key and all source gates.
 throw Error('Protected staging did not complete; keep all gates held and review configuration metadata privately');
 }
}
module.exports={stageProtectedWorker};
