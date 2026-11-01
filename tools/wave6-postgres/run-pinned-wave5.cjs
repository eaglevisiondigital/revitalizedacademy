'use strict';
// Executes only the accepted Wave5 runner/source; preflight never invokes initdb.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),os=require('node:os');
const {spawnSync}=require('node:child_process');
const {inspect,lease}=require('./resource-gate.cjs');
const BASE='9beae3bb40c154d2bfd623e8d2355b3a6c3cd306',runner='tests/wave5-qa/run-combined-pg.cjs';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function git(root,args){const r=spawnSync('git',args,{cwd:root,encoding:'buffer',timeout:10000});if(r.status!==0)throw Error('LOCAL_GIT_PIN_UNAVAILABLE');return r.stdout;}
function pins(root){
 if(git(root,['rev-parse','HEAD']).toString().trim()!==BASE)throw Error('EXACT_ACCEPTED_HEAD_REQUIRED');
 if(git(root,['status','--porcelain','--untracked-files=no']).length)throw Error('DIRTY_TRACKED_SOURCE');
 const files=git(root,['ls-tree','-r','-z',BASE]).toString().split('\0').filter(Boolean);
 for(const row of files){
  const m=/^(100644|100755|120000) blob ([a-f0-9]{40})\t(.+)$/.exec(row);if(!m)throw Error('UNSUPPORTED_SOURCE_ENTRY');
  const b=m[1]==='120000'?Buffer.from(fs.readlinkSync(path.join(root,m[3]))):fs.readFileSync(path.join(root,m[3]));
  const object=crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
  if(object!==m[2])throw Error('SOURCE_PIN_MISMATCH');
 }
 return {source:BASE,files:files.length,runnerSha256:hash(fs.readFileSync(path.join(root,runner)))};
}
function run(root,output){
 if(!path.isAbsolute(root)||!path.isAbsolute(output))throw Error('ABSOLUTE_SOURCE_AND_OUTPUT_REQUIRED');
 root=path.resolve(root);output=path.resolve(output);
 if(output===root||output.startsWith(root+path.sep))throw Error('OUTPUT_MUST_BE_OUTSIDE_ACCEPTED_SOURCE');
 root=fs.realpathSync(root);
 let ancestor=output,missing=[];
 while(!fs.existsSync(ancestor)){missing.unshift(path.basename(ancestor));const next=path.dirname(ancestor);if(next===ancestor)throw Error('OUTPUT_PARENT_UNAVAILABLE');ancestor=next;}
 output=path.join(fs.realpathSync(ancestor),...missing);
 if(output===root||output.startsWith(root+path.sep))throw Error('OUTPUT_MUST_BE_OUTSIDE_ACCEPTED_SOURCE');
 const receipt={at:new Date().toISOString(),pins:pins(root),productionCalls:0,runnerInvoked:false};
 const lock=path.join(os.tmpdir(),'rva-wave6-disposable-pg-exclusive.lock');
 try{lease(lock,()=>{
  receipt.before=inspect();if(receipt.before.capacity.result!=='READY'){receipt.result=receipt.before.capacity.result;return;}
  receipt.runnerInvoked=true;
  const env={PATH:process.env.PATH,HOME:process.env.HOME,TMPDIR:os.tmpdir(),RVA_WAVE5_QA_OUTPUT:output};
  const child=spawnSync(process.execPath,[path.join(root,runner)],{cwd:root,env,encoding:'utf8',timeout:600000,maxBuffer:1024*1024});
  receipt.runnerExit=child.status;receipt.runnerError=child.error?.code||null;
  receipt.after=inspect();receipt.sourceAfter=pins(root);
  receipt.newSegments=receipt.after.segments.filter(s=>!receipt.before.segments.some(b=>b.id===s.id&&b.key===s.key));
  receipt.result=child.status===0&&receipt.newSegments.length===0?'RUN_COMPLETED_NO_NEW_IPC':'BLOCKED_RUN_OR_TEARDOWN';
 });}catch(e){receipt.result='BLOCKED';receipt.error=e.message;}
 fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'resource-wrapper-receipt.json'),JSON.stringify(receipt,null,2)+'\n');
 return receipt;
}
module.exports={pins,run,BASE};
if(require.main===module){try{const r=run(process.argv[2],process.argv[3]);process.stdout.write(JSON.stringify({result:r.result,runnerInvoked:r.runnerInvoked,source:r.pins.source})+'\n');process.exitCode=r.result==='RUN_COMPLETED_NO_NEW_IPC'?0:2;}catch(e){process.stderr.write(e.message+'\n');process.exitCode=2;}}
