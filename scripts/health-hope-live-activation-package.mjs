// Offline release packet only. No network, credentials, migrations or deploy.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const root=process.cwd(),out=path.join(root,'docs/health-hope-live-activation-gate-2026-10-20');
const tool='/Users/davesmacbookpro/.npm/_npx/c893d2f5b0280a78/node_modules/@netlify/zip-it-and-ship-it';
const hash=(b,a='sha256')=>crypto.createHash(a).update(b).digest('hex'),read=f=>JSON.parse(fs.readFileSync(f)),write=(f,x)=>fs.writeFileSync(path.join(out,f),JSON.stringify(x,null,2)+'\n');
assert([22,24].includes(Number(process.versions.node.split('.')[0])));assert.equal(read(tool+'/package.json').version,'16.3.0');fs.mkdirSync(out,{recursive:true});
const live=read('docs/health-hope-live-popup-release-2026-10-20/candidate-request.json');assert.equal(live.commit_ref,'73b29621db5e74e0d9f42caa7555a0933f1c3994');assert.equal(Object.keys(live.files).length,447);assert.equal(Object.keys(live.functions).length,10);
const {zipFunction}=await import(tool+'/dist/main.js'),artifacts=[];
for(const name of ['health-hope-live','health-hope-live-worker','health-hope-live-retention']){
 const results=[];for(const repeat of [false,true]){
  const dir=repeat?fs.mkdtempSync('/private/tmp/rva-hhl-bundle-'):path.join(out,'bundles');fs.mkdirSync(dir,{recursive:true});
  try{const f=await zipFunction('netlify/functions/'+name+'.mjs',dir,{basePath:root,repositoryRoot:root,config:{'*':{nodeBundler:'esbuild',nodeVersion:'22',nodeModuleFormat:'esm'}}});assert.equal(f.name,name);assert.equal(f.runtimeVersion,'nodejs22.x');assert.equal(f.buildData?.runtimeAPIVersion??f.runtimeAPIVersion,2);const bytes=fs.readFileSync(f.path);results.push({name,path:path.relative(root,f.path),sha256:hash(bytes),bytes:bytes.length,runtime:f.runtimeVersion,routes:f.routes||[],schedule:f.schedule||null,buildData:f.buildData,inputs:f.inputs.map(p=>({path:path.relative(root,p),sha256:hash(fs.readFileSync(p))}))});}finally{if(repeat)fs.rmSync(dir,{recursive:true,force:true});}
 }
 assert.equal(results[0].sha256,results[1].sha256,'Function archive must reproduce');artifacts.push(results[0]);
}
const migrations=read('docs/health-hope-live-launch-preparation-2026-10-20/migrations.json');for(const m of migrations)assert.equal(hash(fs.readFileSync('supabase/migrations/'+m.file)),m.sha256);
const held=structuredClone(live),changed=[];
// Retain the exact primary portal, adding only the approved event navigation
// and the six guest-stage display/filter options already reviewed in source.
const portal=fs.readFileSync('production-dist/portal/index.html');let stripped=portal.toString();
for(const [v,label]of [['registered_guest','Registered Guest'],['engaged_guest','Engaged Guest'],['prospective_client','Prospective Client']]){
 for(const fragment of ['                    <option value="'+v+'" disabled>'+label+'</option>\n','<option value="'+v+'">'+label+'</option>']){assert.equal(stripped.split(fragment).length,2);stripped=stripped.replace(fragment,'');}
}
const nav='          <a class="header-link" href="/portal/health-hope-live.html">Health &amp; Hope Live</a>\n';assert.equal(stripped.split(nav).length,2);stripped=stripped.replace(nav,'');
const prior=fs.readFileSync('../deployment-evidence/2026-10-20-b6-continuity-reconciled/static/portal/index.html');assert.equal(hash(prior,'sha1'),live.files['/portal/index.html']);assert.equal(stripped,prior.toString(),'No unrelated primary portal delta');
for(const [file,bytes]of [['portal/index.html',portal],...['portal/health-hope-live.html','portal/health-hope-live.css','portal/health-hope-live.js'].map(f=>[f,fs.readFileSync('production-dist/'+f)])]){
 const target=path.join(out,'held-static',file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);held.files['/'+file]=hash(bytes,'sha1');changed.push({path:'/'+file,sha1:hash(bytes,'sha1'),sha256:hash(bytes),added:!Object.hasOwn(live.files,'/'+file)});
}
for(const f of artifacts){held.functions[f.name]=f.sha256;held.functions_config[f.name]={priority:10,routes:f.routes,excluded_routes:[],...(f.buildData?{build_data:f.buildData}:{})};if(f.schedule)held.function_schedules.push({name:f.name,cron:f.schedule});}
assert.equal(artifacts.filter(f=>f.schedule==='* * * * *').length,2);assert(artifacts.find(f=>f.name==='health-hope-live').routes.length>0);assert.equal(Object.keys(held.functions).length,13);assert.equal(Object.keys(held.files).length,450);for(const [n,d]of Object.entries(live.functions))assert.equal(held.functions[n],d);
assert.equal(held.files['/health-hope-live.html'],live.files['/health-hope-live.html']);assert.equal(held.files['/founders.html'],live.files['/founders.html']);assert.equal(held.files['/runtime-config.js'],live.files['/runtime-config.js']);assert.deepEqual(held.function_schedules.slice(0,live.function_schedules.length),live.function_schedules);
held.draft=true;held.commit_ref=null;held.branch='codex/health-hope-live';held.title='PREPARED ONLY: held HHL backend installation; public registration off';write('held-deploy-request.json',held);
const page=fs.readFileSync('health-hope-live.html','utf8');assert.equal(page.split('data-hhl-registration="held"').length,2);const enabled=page.replace('data-hhl-registration="held"','data-hhl-registration="enabled"');fs.mkdirSync(path.join(out,'activation-static'),{recursive:true});fs.writeFileSync(path.join(out,'activation-static/health-hope-live.html'),enabled);
write('runtime-template.json',{status:'PREPARED_NOT_INSTALLED',flags:{RVA_HHL_REGISTRATION_ENABLED:'false',RVA_HHL_WORKER_ENABLED:'false',RVA_HHL_NOTIFICATIONS_ENABLED:'false',RVA_HHL_ZOOM_ENABLED:'false',RVA_HHL_RETENTION_ENABLED:'false',RVA_HHL_ACCEPTANCE_ENABLED:'false',RVA_HHL_DELIVERY_MODE:'acceptance'},nonSecret:{RVA_HHL_ORIGIN:'https://revitalizedacademy.com',RVA_HHL_SUPABASE_URL:'https://voalfpxiyznnqfcqcymd.supabase.co',RVA_HHL_EMAIL_FROM:'ReVitalized Academy <noreply@auth.revitalizedacademy.com>',RVA_HHL_EMAIL_REPLY_TO:'contact@revitalizedacademy.com'},requiredSecureBindings:['RVA_HHL_SUPABASE_SERVICE_ROLE_KEY','RVA_HHL_SUPABASE_ANON_KEY','RVA_HHL_RATE_SECRET','RVA_HHL_RESEND_API_KEY','RVA_HHL_RESEND_WEBHOOK_SECRET'],secretValuesIncluded:false,doNotInstallFromThisTemplateWithoutSeparateApproval:true});
write('release-package.json',{preparedOnly:true,notAuthorizedForProductionExecution:true,baselineDeploy:'6ad7ed9be0bd165b997e0be1',baselineSource:live.commit_ref,site:'ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06',freshProductionReconciliationRequired:true,migrations,functions:{new:artifacts,existingRetainedExactly:live.functions,existingConfiguration:live.functions_config,existingSchedules:live.function_schedules,retainedArchivesRebuilt:0,reproducible:true},heldStatic:{total:450,changed,existingRetained:446,removed:0,publicRegistration:'held',foundersAndRoadmapPreserved:true,requestSha256:hash(JSON.stringify(held))},laterPublicActivation:{path:'/health-hope-live.html',sha256:hash(enabled),onlyChange:'data-hhl-registration: held → enabled',requiresSeparateApprovalAfterHostedAcceptance:true},hostedAcceptance:{inbox:'dave@theboss.biz',designationOnly:true,maximumConfirmations:1,marketing:false,zoomAutomation:false,maximumMinutes:30,packet:'../health-hope-live-launch-preparation-2026-10-20/acceptance-case.template.json'},productionWrites:0,realEmails:0,zoomSettingChanges:0});
console.log(JSON.stringify({prepared:true,newFunctions:3,retainedFunctions:10,reproducible:true,heldStaticUpdates:1,heldStaticAdditions:3,migrations:4,productionMutations:0}));
