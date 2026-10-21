'use strict';
// Offline review artifacts only. No provider calls, database writes or deployment.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),out=__dirname;
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const save=(file,value)=>fs.writeFileSync(path.join(out,file),JSON.stringify(value,null,2)+'\n');
const hash=(bytes,algorithm='sha256')=>crypto.createHash(algorithm).update(bytes).digest('hex');
(async()=>{
 const prior='docs/health-hope-live-hosted-acceptance-2026-10-20/';
 const base=read(prior+'executed-deploy-request.json'),pre=read(path.relative(root,path.join(out,'production-preflight.json')));
 assert(pre.exactCurrentManifest&&pre.functionsAndSchedulesUnchanged);
 const frozen=read('docs/health-hope-live-activation-gate-2026-10-20/release-package.json');
 for(const m of frozen.migrations)assert.equal(hash(fs.readFileSync(path.join(root,'supabase/migrations',m.file))),m.sha256);
 for(const f of frozen.functions.new){
  assert.equal(hash(fs.readFileSync(path.join(root,f.path))),f.sha256);
  for(const input of f.inputs)assert.equal(hash(fs.readFileSync(path.join(root,input.path))),input.sha256);
 }
 const changed=[];
 for(const file of ['/index.html','/health-hope-live.html','/js/health-hope-live.js','/css/health-hope-live.css']){
  assert(Object.hasOwn(base.files,file));
  let bytes=fs.readFileSync(path.join(root,file));
  if(file==='/index.html'||file==='/health-hope-live.html'){
   const attr=file==='/index.html'?'data-hhl-promo':'data-hhl-registration';
   const text=bytes.toString();assert.equal(text.split(attr+'="held"').length,2);
   bytes=Buffer.from(text.replace(attr+'="held"',attr+'="enabled"'));
  }
  const target=path.join(out,'activation-static',file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);
  changed.push({path:file,bytes:bytes.length,previousSha1:base.files[file],sha1:hash(bytes,'sha1'),sha256:hash(bytes)});
 }
 assert.equal(Object.keys(base.files).length,450);assert.equal(Object.keys(base.functions).length,13);
 save('activation-overlay.json',{
  status:'PREPARED_ONLY_NOT_AUTHORIZED_FOR_PUBLICATION',baseline:pre.deployment,baselineSource:pre.source,
  sourceCommit:null,freshProductionReconciliationRequired:true,approvalRequiredAfterHostedAcceptance:true,
  requiredDatabasePreflight:{noSessionsBefore:'2026-10-29',firstRegularDate:'2026-10-29',firstEasternTime:'18:30',firstSessionRequiresNormalStaffPublication:true,hostedAcceptanceAndCleanupRequired:true},
  retainedPaths:446,totalPaths:450,addedPaths:0,removedPaths:0,changed,
  functionsRetainedExactly:base.functions,functionSchedulesRetainedExactly:base.function_schedules,
  functionsConfigurationSha256:hash(JSON.stringify(base.functions_config)),
  frozenMigrationAndFunctionInputsUnchanged:true,
  sourceGatesRemainHeld:true,hostedGatesRemainHeld:true,
  note:'An offline future overlay, not an executable deployment request. Bind a reviewed source commit and reconcile current production before later public activation. Never replay installed migrations.'
 });
 const schedule=read(path.relative(root,path.join(out,'hosted-schedule.json'))),first=schedule.sessions[0];
 assert.equal(first.regular_date,'2026-10-29');assert.equal(first.status,'draft');
 assert.equal(schedule.earlier_sessions,0);assert.equal(schedule.published,0);assert.equal(schedule.registrations,0);assert.equal(schedule.jobs,0);
 assert.equal(schedule.settings.acceptance_case,null);
 const {emailForJob}=await import(path.join(root,'netlify/functions/_shared/health-hope-live.mjs'));
 const {HEALTH_HOPE_MEETING:meeting}=await import(path.join(root,'netlify/functions/_shared/health-hope-live-meeting.mjs'));
 const mail=emailForJob({kind:'confirmation',join_mode:'manual',starts_at:first.starts_at,join_url:meeting.join_url});
 assert(mail.text.includes('Thursday, October 29, 2026 at 6:30 PM EDT'));
 save('confirmation-preview.json',{
  status:'PREVIEW_ONLY_NOT_SENT',from:'ReVitalized Academy <noreply@auth.revitalizedacademy.com>',reply_to:'contact@revitalizedacademy.com',to:['dave@theboss.biz'],...mail,
  candidateSessionId:first.id,sessionPlanningValue:'2026-10-29; existing private draft only. Genuine staff publication, current revision and exact acceptance pins remain required.',
  marketing:false,source:'760ef11 unchanged emailForJob',supersedesPlanningDate:'October 22 in the historical hosted-installation preview; no email was sent'
 });
 console.log(JSON.stringify({offlineArtifactsPrepared:true,changedPaths:changed.length,retainedPaths:446,functionsRetained:13,frozenBackendUnchanged:true,confirmation:'OCTOBER_29_PREVIEW_NOT_SENT',publicActivation:false}));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
