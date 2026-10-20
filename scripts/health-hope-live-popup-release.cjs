'use strict';
// Publish only the three reviewed static popup assets over the exact current
// locked release. Never reads/writes runtime secrets, SQL, email or Zoom APIs.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'docs/health-hope-live-popup-release-2026-10-20');
const {api}=require('./health-hope-live-release.cjs'),{normalize}=require('./health-hope-live-integrity.cjs');
const C=require(path.join(ROOT,'../deployment-evidence/2026-10-20-three-source-publication/contract.cjs'));
const SITE='ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06',BASE='6ad7cd0111dae0b60c7d9656',BASE_SOURCE='fa1f490012507319bb93cca64d6cbaf039ceaec3',ORIGIN='https://revitalizedacademy.com';
const hash=(x,a='sha256')=>crypto.createHash(a).update(x).digest('hex'),read=f=>JSON.parse(fs.readFileSync(path.join(OUT,f),'utf8')),save=(f,x)=>fs.writeFileSync(path.join(OUT,f),JSON.stringify(x,null,2)+'\n');
const git=(...args)=>execFileSync('/Library/Developer/CommandLineTools/usr/bin/git',args,{cwd:ROOT}),source=()=>git('rev-parse','73b2962').toString().trim();
const settings=s=>Object.fromEntries(Object.keys(C.R.C.settings.build_settings).map(k=>[k,s.build_settings[k]??null]));
function checkFunctions(d,body){assert.deepEqual(d.available_functions.map(f=>f.n).sort(),Object.keys(body.functions).sort());for(const f of d.available_functions){assert.equal(f.d,body.functions[f.n]);assert.equal(f.r,'nodejs22.x');}assert.deepEqual(d.function_schedules,body.function_schedules);if(d.functions_config)assert.deepEqual(d.functions_config,body.functions_config);}
async function metadata(expected,owned){
 const [site,files,beta,queue]=await Promise.all([api('/sites/'+SITE),api('/sites/'+SITE+'/files'),api('/sites/'+C.BETA),api('/sites/'+SITE+'/deploys?per_page=100&page=1')]);
 assert.equal(site.id,SITE);assert.equal(site.ssl_url,ORIGIN);assert.equal(site.published_deploy.id,expected,'Production changed; reconcile before publication');assert.equal(site.published_deploy.locked,true,'Publication lock must remain enabled');
 const body=read(expected===BASE?'baseline-request.json':'candidate-request.json'),pin=read('baseline.json');assert.deepEqual(settings(site),pin.settings);assert.equal(beta.published_deploy.id,pin.betaDeploy);assert.deepEqual(settings(beta),pin.betaSettings);
 assert.deepEqual(Object.fromEntries(files.map(f=>['/'+f.path.replace(/^\//,''),f.sha])),body.files,'Published manifest drift');
 assert.deepEqual(queue.filter(d=>d.id!==owned&&!['ready','error','rejected'].includes(d.state)).map(d=>({id:d.id,state:d.state})),[],'Another release is active');
 const deploy=await api('/deploys/'+expected);checkFunctions(deploy,body);assert.equal(deploy.commit_ref,expected===BASE?BASE_SOURCE:source());return {site,deploy};
}
async function prepare(){
 assert.equal(git('branch','--show-current').toString().trim(),'codex/health-hope-live');
 const body=JSON.parse(fs.readFileSync(path.join(ROOT,'../deployment-evidence/2026-10-20-b6-continuity-reconciled/candidate-request.LOCAL-ONLY.json'),'utf8'));
 assert.equal(body.commit_ref,BASE_SOURCE);assert.equal(Object.keys(body.files).length,447);assert.equal(Object.keys(body.functions).length,10);
 const [site,beta]=await Promise.all([api('/sites/'+SITE),api('/sites/'+C.BETA)]);assert.equal(site.published_deploy.id,BASE);assert.equal(site.published_deploy.locked,true);
 save('baseline-request.json',body);save('baseline.json',{at:new Date().toISOString(),site:SITE,deploy:BASE,source:BASE_SOURCE,locked:true,settings:settings(site),betaDeploy:beta.published_deploy.id,betaSettings:settings(beta)});
 await metadata(BASE);
 const pins=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/health-hope-live-popup-refinement-2026-10-20/source-changes.json'),'utf8'));
 assert.deepEqual(pins.files.map(x=>x.file).sort(),['css/health-hope-live.css','index.html','js/vitality-report-preview.js']);
 const next=structuredClone(body),changed=[];for(const pin of pins.files){const bytes=git('show',source()+':'+pin.file),before=git('show',pins.base+':'+pin.file);assert.equal(hash(before),pin.before);assert.equal(hash(bytes),pin.after);assert.equal(hash(fs.readFileSync(path.join(ROOT,pin.file))),pin.after);assert.equal(body.files['/'+pin.file],hash(before,'sha1'),'Reviewed patch base differs from current publication');next.files['/'+pin.file]=hash(bytes,'sha1');const target=path.join(OUT,'static',pin.file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);changed.push({path:'/'+pin.file,sha1:hash(bytes,'sha1'),sha256:hash(bytes),bytes:bytes.length});}
 assert.deepEqual(Object.keys(next.files).filter(p=>next.files[p]!==body.files[p]).sort(),changed.map(x=>x.path).sort());assert.equal(Object.keys(next.files).length,447);
 const landing=await fetch(ORIGIN+'/health-hope-live',{signal:AbortSignal.timeout(20000)});assert.equal(landing.status,200);assert.match(await landing.text(),/data-hhl-registration="held"/);
 next.commit_ref=source();next.branch='codex/health-hope-live';next.title='Approved popup only; current primary preserved; registration held';next.draft=false;
 save('candidate-request.json',next);save('release-package.json',{at:new Date().toISOString(),site:SITE,baseline:BASE,baselineSource:BASE_SOURCE,popupSource:source(),changed,files:447,retained:444,added:0,removed:0,functions:10,functionsConfigAndSchedulePreserved:true,heldBackendExcluded:true,registration:'held',zoomEmail:'unchanged',sqlWrites:0,bodySha256:hash(JSON.stringify(next))});
 console.log(JSON.stringify({prepared:true,baseline:BASE,updates:3,retained:444,functions:10,registration:'held'}));
}
function local(){const body=read('candidate-request.json'),pkg=read('release-package.json');assert.equal(hash(JSON.stringify(body)),pkg.bodySha256);assert.equal(body.commit_ref,source());for(const p of pkg.changed)assert.equal(hash(fs.readFileSync(path.join(OUT,'static',p.path.slice(1)))),p.sha256);return {body,pkg};}
async function create(){
 const {body,pkg}=local();await metadata(BASE);const file=path.join(OUT,'operation-journal.json'),j={startedAt:new Date().toISOString(),baseline:BASE,source:source(),candidateCreations:1,uploads:[],publishRequests:0,published:false};fs.writeFileSync(file,JSON.stringify(j,null,2)+'\n',{flag:'wx'});
 try{
  let d=await api('/sites/'+SITE+'/deploys?title='+encodeURIComponent(body.title),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({draft:false})});assert(d.id);j.id=d.id;save('operation-journal.json',j);assert.equal(d.published_at??null,null);await metadata(BASE,d.id);
  const {NetlifyAPI}=await import('/Users/davesmacbookpro/.npm/_npx/c893d2f5b0280a78/node_modules/@netlify/api/lib/index.js'),sdk=new NetlifyAPI(C.token);
  d=await sdk.updateSiteDeploy({siteId:SITE,deployId:d.id,commitRef:source(),body},{signal:AbortSignal.timeout(45000)});j.digestFinalized=true;save('operation-journal.json',j);
  for(let n=0;n<60&&['preparing','processing'].includes(d.state);n++){await new Promise(r=>setTimeout(r,500));d=await api('/deploys/'+j.id);assert.equal(d.published_at??null,null);}
  assert((d.required||[]).every(v=>pkg.changed.some(p=>p.sha1===v)));assert((d.required_functions||[]).every(v=>Object.values(body.functions).includes(v)));
  // A cache miss may request an existing archive. Its bytes must match the
  // current manifest; this never rebuilds or introduces a Function.
  for(const f of C.R.pins)if((d.required_functions||[]).includes(f.sha256)){const archive=C.R.archives[f.name];assert.equal(hash(fs.readFileSync(archive)),body.functions[f.name]);await sdk.uploadDeployFunction({deployId:j.id,name:f.name,runtime:'nodejs22.x',invocationMode:'stream',body:()=>fs.createReadStream(archive)},{signal:AbortSignal.timeout(45000)});j.uploads.push({function:f.name,retainedArchive:true,sha256:f.sha256});save('operation-journal.json',j);}
  for(const p of pkg.changed)if((d.required||[]).includes(p.sha1)){await sdk.uploadDeployFile({deployId:j.id,path:p.path.slice(1),body:()=>fs.createReadStream(path.join(OUT,'static',p.path.slice(1)))},{signal:AbortSignal.timeout(45000)});j.uploads.push(p);save('operation-journal.json',j);}
  for(let n=0;n<120;n++){d=await api('/deploys/'+j.id);assert.equal(d.published_at??null,null);assert.notEqual(d.state,'error');if(d.state==='ready')break;await new Promise(r=>setTimeout(r,500));}
  assert.equal(d.state,'ready');assert.equal(d.context,'production');assert.equal(d.commit_ref,source());checkFunctions(d,body);await metadata(BASE,j.id);j.origin=new URL(d.deploy_ssl_url||d.deploy_url).origin;j.state='ready';save('operation-journal.json',j);console.log(JSON.stringify({candidate:j.id,origin:j.origin,published:false}));
 }catch{j.stopped=true;save('operation-journal.json',j);throw Error('Candidate stopped; inspect actual state and journal before continuing. No automatic retry.');}
}
async function bytesAt(origin,p){const r=await fetch(origin+p,{headers:{'Accept-Encoding':'identity'},redirect:'manual',signal:AbortSignal.timeout(25000)});assert.equal(r.status,200,p);return Buffer.from(await r.arrayBuffer());}
async function verify(live=false){
 const {body,pkg}=local(),j=read('operation-journal.json'),origin=live?ORIGIN:j.origin;await metadata(live?j.id:BASE,j.id);const proof={at:new Date().toISOString(),id:j.id,origin,changed:[],protected:[],passed:false};
 for(const p of pkg.changed){const bytes=await bytesAt(origin,p.path),local=fs.readFileSync(path.join(OUT,'static',p.path.slice(1)));if(p.path.endsWith('.html'))assert.equal(normalize(bytes.toString()),normalize(local.toString()));else assert.equal(hash(bytes),p.sha256);if(live)assert.equal(hash(bytes),read('unpublished-verification.json').changed.find(x=>x.path===p.path).sha256);proof.changed.push({path:p.path,sha256:hash(bytes),match:true});}
 const paths=Object.keys(body.files).filter(p=>/^(?:\/(?:js|portal|member)\/.+\.(?:js|css|html)|\/(?:consult|health-profile|vitality-next|health-hope-live)\.html)$/.test(p)&&!pkg.changed.some(x=>x.path===p));
 let i=0;await Promise.all(Array.from({length:6},async()=>{while(i<paths.length){const p=paths[i++],bytes=await bytesAt(origin,p),expected=live?read('unpublished-verification.json').protected.find(x=>x.path===p).sha256:hash(await bytesAt(ORIGIN,p));assert.equal(hash(bytes),expected,p+' preserved served bytes');proof.protected.push({path:p,sha256:expected,match:true});}}));proof.protected.sort((a,b)=>a.path.localeCompare(b.path));
 assert.equal(body.files['/runtime-config.js'],read('baseline-request.json').files['/runtime-config.js']);assert(!Object.keys(body.functions).some(n=>/health-hope-live/.test(n)));checkFunctions(await api('/deploys/'+j.id),body);proof.functions=10;proof.registration='held';proof.passed=true;save(live?'canonical-verification.json':'unpublished-verification.json',proof);console.log(JSON.stringify({verified:origin,protected:proof.protected.length,functions:10,passed:true}));
}
async function publish(){
 const {body}=local(),j=read('operation-journal.json'),v=read('unpublished-verification.json'),b=read('unpublished-browser.json');assert(!j.published&&!j.stopped);assert.equal(j.publishRequests,0);assert(v.passed&&b.passed);assert.equal(v.id,j.id);assert.equal(b.id,j.id);assert.equal(b.origin,j.origin);let d=await api('/deploys/'+j.id);assert.equal(d.state,'ready');assert.equal(d.published_at??null,null);assert.equal(d.commit_ref,source());checkFunctions(d,body);await metadata(BASE,j.id);
 j.publishRequests=1;j.toolCommit=git('rev-parse','HEAD').toString().trim();j.toolSha256=hash(fs.readFileSync(__filename));save('operation-journal.json',j);
 try{
  // First publication of this newly created, verified candidate. This is not
  // a rollback or restoration of any previously published deployment.
  await api('/sites/'+SITE+'/deploys/'+j.id+'/restore',{method:'POST'});let s;
  for(let n=0;n<30;n++){s=await api('/sites/'+SITE);if(s.published_deploy.id===j.id)break;await new Promise(r=>setTimeout(r,500));}assert.equal(s.published_deploy.id,j.id);
  if(s.published_deploy.locked!==true){await api('/deploys/'+j.id+'/lock',{method:'POST'});j.lockRequests=1;}
  await metadata(j.id,j.id);j.published=true;j.finishedAt=new Date().toISOString();save('operation-journal.json',j);console.log(JSON.stringify({published:j.id,url:ORIGIN,locked:true,registration:'held',functionsRetained:10}));
 }catch{j.publicationNeedsInspection=true;save('operation-journal.json',j);throw Error('Publication needs read-only inspection; never blindly retry or restore an older release.');}
}
async function main(){fs.mkdirSync(OUT,{recursive:true});const action=process.argv[2];if(action==='prepare')return prepare();if(action==='create')return create();if(action==='verify')return verify();if(action==='publish')return publish();if(action==='verify-live')return verify(true);throw Error('Expected prepare/create/verify/publish/verify-live');}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1});
module.exports={OUT,ORIGIN,BASE,SITE,source};
