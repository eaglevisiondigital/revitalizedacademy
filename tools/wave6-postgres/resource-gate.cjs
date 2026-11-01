'use strict';
// Resource metadata only. No process termination, IPC removal or database calls.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawnSync}=require('node:child_process');
function parseIpcs(text){
 const rows=[];
 for(const line of text.split('\n')){
  const p=line.trim().split(/\s+/); if(p[0]!=='m')continue;
  if(p.length<12||!/^\d+$/.test(p[1])||!/^0x[0-9a-f]+$/i.test(p[2]))throw Error('UNPARSEABLE_IPC_METADATA');
  rows.push({id:Number(p[1]),key:p[2],owner:p[4],creator:p[6],attachments:Number(p[8]),bytes:Number(p[9]),creatorPid:Number(p[10]),lastPid:Number(p[11])});
 }
 if(!/Shared Memory:/.test(text)||/Operation not permitted|sysctlbyname:/.test(text))throw Error('IPC_INVENTORY_UNAVAILABLE');
 if(rows.some(r=>Object.values(r).some(v=>typeof v==='number'&&!Number.isSafeInteger(v))))throw Error('UNPARSEABLE_IPC_METADATA');
 return rows;
}
function capacity(segments,limit,reserve=2){
 if(!Number.isSafeInteger(limit)||limit<1||!Number.isSafeInteger(reserve)||reserve<2)throw Error('INVALID_CAPACITY_BOUND');
 return {limit,occupied:segments.length,available:limit-segments.length,reserve,result:limit-segments.length>=reserve?'READY':'BLOCKED_SYSV_CAPACITY'};
}
function call(command,args){const r=spawnSync(command,args,{encoding:'utf8',timeout:10000});if(r.status!==0)throw Error(path.basename(command)+' metadata unavailable');return r.stdout;}
function inspect(){
 const segments=parseIpcs(call('/usr/bin/ipcs',['-m','-a']));
 const limits={};for(const name of ['shmmni','shmseg','shmmax'])limits[name]=Number(call('/usr/sbin/sysctl',['-n','kern.sysv.'+name]).trim());
 return {at:new Date().toISOString(),platform:os.platform(),scope:'LOCAL_RESOURCE_METADATA_ONLY',productionCalls:0,mutations:0,limits,segments,capacity:capacity(segments,limits.shmmni),cleanupAuthorized:[],note:'Same UID, zero attachments, small size or dead creator do not establish RVA ownership. Unknown segments are never removed.'};
}
function lease(directory,fn){
 if(!path.isAbsolute(directory))throw Error('ABSOLUTE_LEASE_PATH_REQUIRED');
 let held=false;
 try{fs.mkdirSync(directory,{mode:0o700});held=true;fs.writeFileSync(path.join(directory,'lease.json'),JSON.stringify({pid:process.pid,at:new Date().toISOString(),scope:'RVA_DISPOSABLE_PG_TESTS_ONLY'}),{mode:0o600});return fn();}
 finally{if(held){fs.unlinkSync(path.join(directory,'lease.json'));fs.rmdirSync(directory);}}
}
module.exports={parseIpcs,capacity,inspect,lease};
if(require.main===module){try{const r=inspect();process.stdout.write(JSON.stringify(r,null,2)+'\n');process.exitCode=r.capacity.result==='READY'?0:2;}catch(e){process.stdout.write(JSON.stringify({result:'BLOCKED_METADATA',error:e.message,mutations:0,productionCalls:0})+'\n');process.exitCode=2;}}
