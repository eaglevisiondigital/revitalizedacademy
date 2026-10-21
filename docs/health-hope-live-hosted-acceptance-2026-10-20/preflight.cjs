'use strict';
// Read-only operator preflight. No deployment, SQL, configuration or email writes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),original=path.join(root,'docs/health-hope-live-activation-gate-2026-10-20');
const p=JSON.parse(fs.readFileSync(path.join(original,'release-package.json'))),request=JSON.parse(fs.readFileSync(path.join(original,'held-deploy-request.json')));
const {api}=require(path.join(root,'scripts/health-hope-live-release.cjs'));
const C=require(path.join(root,'../deployment-evidence/2026-10-20-three-source-publication/contract.cjs'));
const git=(...args)=>execFileSync('/Library/Developer/CommandLineTools/usr/bin/git',args,{cwd:root,encoding:'utf8'}).trim(),hash=(b,a='sha256')=>crypto.createHash(a).update(b).digest('hex');
async function main(){
 const commit=git('rev-parse','760ef11');assert.equal(git('rev-parse','HEAD'),commit);assert.equal(git('branch','--show-current'),'codex/health-hope-live');assert.equal(git('diff','--name-only','HEAD'),'');
 for(const m of p.migrations){const b=fs.readFileSync(path.join(root,'supabase/migrations',m.file));assert.equal(b.length,m.bytes);assert.equal(hash(b),m.sha256);}
 for(const f of p.functions.new){const b=fs.readFileSync(path.join(root,f.path));assert.equal(b.length,f.bytes);assert.equal(hash(b),f.sha256);for(const i of f.inputs)assert.equal(hash(fs.readFileSync(path.join(root,i.path))),i.sha256);}
 for(const s of p.heldStatic.changed)assert.equal(hash(fs.readFileSync(path.join(original,'held-static'+s.path))),s.sha256);
 // The reviewed packager hashes compact JSON, not its pretty-printed transport.
 assert.equal(hash(JSON.stringify(request)),p.heldStatic.requestSha256);
 const [site,files,beta,queue]=await Promise.all([api('/sites/'+p.site),api('/sites/'+p.site+'/files'),api('/sites/'+C.BETA),api('/sites/'+p.site+'/deploys?per_page=100&page=1')]);
 assert.equal(site.ssl_url,'https://revitalizedacademy.com');assert.equal(site.published_deploy.id,p.baselineDeploy);assert.equal(site.published_deploy.locked,true);assert.equal(beta.published_deploy.id,C.pre.beta_deploy);C.idleQueue(queue);
 assert.deepEqual(Object.fromEntries(Object.keys(C.R.C.settings.build_settings).map(k=>[k,site.build_settings[k]??null])),C.R.C.settings.build_settings);
 const d=await api('/deploys/'+p.baselineDeploy);assert.equal(d.commit_ref,p.baselineSource);
 const base=JSON.parse(fs.readFileSync(path.join(root,'docs/health-hope-live-popup-release-2026-10-20/candidate-request.json')));
 assert.deepEqual(Object.fromEntries(files.map(f=>['/'+f.path.replace(/^\//,''),f.sha])),base.files);
 assert.deepEqual(Object.fromEntries(d.available_functions.map(f=>[f.n,f.d])),p.functions.existingRetainedExactly);assert(d.available_functions.every(f=>f.r==='nodejs22.x'));
 assert.deepEqual(d.function_schedules,p.functions.existingSchedules);
 // Netlify omits functions_config in GET deploy responses. Preserve the exact
 // immutable, already-accepted deployment's recorded request configuration.
 assert.deepEqual(base.functions_config,p.functions.existingConfiguration);
 if(d.functions_config)assert.deepEqual(d.functions_config,p.functions.existingConfiguration);
 assert.deepEqual(base.function_schedules,p.functions.existingSchedules);
 const changes=Object.keys(request.files).filter(k=>base.files[k]!==request.files[k]);assert.deepEqual(changes.sort(),p.heldStatic.changed.map(x=>x.path).sort());
 assert(Object.keys(base.files).every(k=>Object.hasOwn(request.files,k)));assert.equal(Object.keys(request.files).length,450);
 for(const [n,h] of Object.entries(base.functions))assert.equal(request.functions[n],h);
 assert.deepEqual(Object.keys(request.functions).filter(n=>!Object.hasOwn(base.functions,n)).sort(),p.functions.new.map(x=>x.name).sort());
 for(const [n,v] of Object.entries(base.functions_config))assert.deepEqual(request.functions_config[n],v);
 assert.deepEqual(request.function_schedules,[...base.function_schedules,...p.functions.new.filter(x=>x.schedule).map(x=>({name:x.name,cron:x.schedule}))]);
 assert.equal(request.draft,true);assert.equal(request.commit_ref,null);assert(!fs.readFileSync(path.join(root,'health-hope-live.html'),'utf8').includes('data-hhl-registration="enabled"'));
 const result={at:new Date().toISOString(),commit,branch:'codex/health-hope-live',migrations:p.migrations.map(({file,sha256})=>({file,sha256})),newFunctions:p.functions.new.map(({name,sha256})=>({name,sha256})),staffChanges:p.heldStatic.changed,baselineDeploy:d.id,baselineSource:d.commit_ref,publishedPaths:files.length,retainedFunctions:d.available_functions.length,functionsConfigurationEvidence:d.functions_config?'provider and accepted request':'immutable accepted deployment request; provider GET omits field',settingsUnchanged:true,betaUnchanged:true,locked:true,activeDeploys:0,requestCanonicalSha256:p.heldStatic.requestSha256,sourceFingerprint:hash(JSON.stringify(p.functions.new.map(x=>({name:x.name,inputs:x.inputs})))),preflight:'PASS',productionWrites:0};
 fs.writeFileSync(path.join(__dirname,'production-preflight.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({preflight:'PASS',commit,baseline:d.id,migrations:4,newFunctions:3,staffChanges:4,retainedFunctions:10,paths:files.length,productionWrites:0}));
}
main().catch(e=>{console.error('Preflight stopped: '+e.message);process.exitCode=1;});
