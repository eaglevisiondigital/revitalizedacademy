// Offline release review only. Never creates, uploads or publishes a deploy.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const [liveFile,baselineFile,out]=process.argv.slice(2);if(!out)throw Error('Usage: node scripts/review-roadmap-b53-release.cjs live-inventory.json baseline-release-review.json output.json');
const live=JSON.parse(fs.readFileSync(liveFile)),baseline=JSON.parse(fs.readFileSync(baselineFile)).body;
assert.equal(live.production_deploy,'6ad2acb16d6d38c15ce3e489');assert.equal(live.beta_deploy,'6acc33161511aa93c289bbcc');assert.deepEqual(live.live_files,baseline.files);assert.equal(live.functions.length,9);assert.deepEqual(Object.fromEntries(live.functions.map(f=>[f.n,f.d])),baseline.functions);assert.deepEqual(live.function_schedules,baseline.function_schedules);
const changes=['/portal/index.html','/portal/portal-roadmap-scoring-lab.js','/portal/portal-roadmap-scoring-lab.css','/portal/portal-roadmap-scoring-lab-reference.js','/portal/portal-roadmap-scoring-lab-view.js'];
const hash=(bytes,algorithm='sha256')=>crypto.createHash(algorithm).update(bytes).digest('hex');
const source=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:16000000}).trim();
assert.equal(source('merge-base','HEAD','e142c394750720a8c39dffc62db31a7726c7b225'),'e142c394750720a8c39dffc62db31a7726c7b225');
assert.equal(source('diff','--name-only','e142c394750720a8c39dffc62db31a7726c7b225','--','js','netlify','supabase','netlify.toml','config/production.json'),'');
const publicFiles=[...require('../config/production-public-files.json'),'runtime-config.js'];assert.equal(publicFiles.length,436);
const artifacts=Object.fromEntries(publicFiles.map(f=>{const bytes=fs.readFileSync(path.join('production-dist',f));return['/'+f.toLowerCase(),{sha1:hash(bytes,'sha1'),sha256:hash(bytes),size:bytes.length}];}));
assert.equal(Object.keys(artifacts).length,436,'Case-normalized path collision');
const delta=Object.keys(artifacts).filter(f=>artifacts[f].sha1!==baseline.files[f]&&f!=='/netlify.toml').sort();assert.deepEqual(delta,changes.sort());
const body=structuredClone(baseline);for(const f of changes)body.files[f]=artifacts[f].sha1;
for(const f of Object.keys(baseline.files).filter(f=>!changes.includes(f)))assert.equal(body.files[f],baseline.files[f]);assert.deepEqual(body.functions,baseline.functions);assert.deepEqual(body.functions_config,baseline.functions_config);assert.deepEqual(body.function_schedules,baseline.function_schedules);
const result={NOT_EXECUTED:true,source_sha:source('rev-parse','HEAD'),base_pr42:'e142c394750720a8c39dffc62db31a7726c7b225',baseline_source:'e02f35267de3159d7b3b2a5e989ccb8edb7e9f7d',production_site:live.site_id,expected_deploy:live.production_deploy,beta_deploy:live.beta_deploy,public_files:436,changed_or_added_public_paths:changes.length,unchanged_live_paths:431,artifacts:Object.fromEntries(changes.map(f=>[f,artifacts[f]])),function_uploads_allowed:0,functions_preserved:9,opaque_legacy_path_preserved:'/netlify.toml',body,rollback_body:baseline,rollback:'Separate authorized static-only forward revert of the three changed paths; remove the two new paths; retain all exact Function digests/config/schedule. No SQL rollback.',real_data_operations:0};
fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({staticPaths:5,publicFiles:436,unchangedLivePaths:431,functionsPreserved:9,executed:false}));
