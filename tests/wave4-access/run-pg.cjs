// No connection string is accepted. Every run creates/removes a UNIX-socket-only PG17 cluster.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),output=path.resolve(root,process.env.RVA_WAVE4_A_OUTPUT||'docs/orchestration/issue-61/wave4/receipts');
const bin=process.env.RVA_WAVE4_PG_BIN||'/opt/homebrew/opt/postgresql@17/bin',hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const pins=require('../wave3-allowance/source-pins.json'),baselineOnly=process.env.RVA_WAVE4_BASELINE_ONLY==='1';
function call(exe,args,opts={}){const r=spawnSync(exe,args,{encoding:'utf8',timeout:120000,maxBuffer:24*1024*1024,...opts});if(r.status!==0)throw Error(path.basename(exe)+' failed: '+(r.stderr||r.stdout||r.error?.message||'').slice(-4000));return r;}
let scratch,started=false;
const receipt={startedAt:new Date().toISOString(),runnerSha256:hash(fs.readFileSync(__filename)),scope:'LOCAL_CATALOG_OVERLAY_ON_HISTORICAL_EMPTY_DEPENDENCY_SCAFFOLD',productionCalls:0,connection:'new cluster; listen_addresses empty; socket only; fake managed Auth',sourceCommit:call('git',['rev-parse','HEAD'],{cwd:root}).stdout.trim(),outputDirectory:output,stages:[]};
try{
 receipt.executionInputs=['tests/wave4-access/access.test.cjs','tests/wave4-access/session-entry.test.cjs','tests/wave4-access/fixture.cjs','proposals/issue-61/wave4/correction.sql','proposals/issue-61/wave4/revert.sql'].filter(x=>!baselineOnly||!x.startsWith('proposals/issue-61/wave4/')).map(x=>({path:x,sha256:hash(fs.readFileSync(path.join(root,x)))}));
 for(const x of pins.files)if(hash(fs.readFileSync(path.resolve(root,x.path)))!==x.sha256)throw Error('Pinned source drift: '+x.path);
 const current=require('../wave3-allowance/current-pins.json');
 for(const x of current.files)if(hash(fs.readFileSync(path.resolve(root,x.path)))!==x.sha256)throw Error('Pinned current input drift: '+x.path);
 receipt.currentPins=current;receipt.scaffoldPins=pins;receipt.postgres=call(path.join(bin,'postgres'),['--version']).stdout.trim();if(!/PostgreSQL\) 17\./.test(receipt.postgres))throw Error('PG17 required');
 scratch=fs.mkdtempSync(path.join(os.tmpdir(),'rva-wave4-access-'));const data=path.join(scratch,'data'),sock=path.join(scratch,'socket');fs.mkdirSync(sock);
 call(path.join(bin,'initdb'),['-D',data,'-U','postgres','--auth-local=trust','--auth-host=reject','--no-locale','--encoding=UTF8']);
 const port=String(56000+process.pid%5000);call(path.join(bin,'pg_ctl'),['-D',data,'-l',path.join(scratch,'postgres.log'),'-o',`-F -k ${sock} -p ${port} -c listen_addresses=''`,'-w','start']);started=true;
 const env={PATH:process.env.PATH,HOME:process.env.HOME,PGHOST:sock,PGPORT:port,PGUSER:'postgres',PGDATABASE:'wave4_access',RVA_WAVE4_SOCKET:sock,RVA_WAVE4_PORT:port,RVA_WAVE4_DATABASE:'wave4_access',RVA_WAVE4_OUTPUT:output,RVA_WAVE4_DEPENDENCIES:process.env.RVA_WAVE4_DEPENDENCIES||path.resolve(root,'../revitalizedacademy/node_modules')};
 function restoreFixture(){
 call(path.join(bin,'createdb'),['wave4_access'],{env});
 for(const x of pins.files.filter(x=>/platform.sql$|schema.sql$/.test(x.path)))call(path.join(bin,'psql'),['-X','-v','ON_ERROR_STOP=1'],{env,input:fs.readFileSync(path.resolve(root,x.path),'utf8')});
 call(path.join(bin,'psql'),['-X','-v','ON_ERROR_STOP=1','-c',"insert into public.program_catalog(program_code,name,program_type) values('holistic-foundations','Fictional source prerequisite','membership')"],{env});
 const lifecycle=pins.files.find(x=>x.path.includes('production_client_lifecycle_v1'));
 call(path.join(bin,'psql'),['-X','-v','ON_ERROR_STOP=1'],{env,input:fs.readFileSync(path.resolve(root,lifecycle.path),'utf8')});
 call(path.join(bin,'psql'),['-X','-v','ON_ERROR_STOP=1'],{env,input:fs.readFileSync(path.join(__dirname,'../wave3-allowance/current-overlay.sql'),'utf8')});
 call(path.join(bin,'psql'),['-X','-v','ON_ERROR_STOP=1'],{env,input:fs.readFileSync(path.join(root,'proposals/issue-61/correction.sql'),'utf8')});
 }
 restoreFixture();
 receipt.baseline='Current catalog overlay plus accepted LOCAL Wave3 RPC proposal; NOT installed production state';
 for(const stage of baselineOnly?['baseline']:['baseline','corrected','reverted']){
  if(stage==='corrected'){call(path.join(bin,'dropdb'),['wave4_access'],{env});restoreFixture();receipt.correctedFixtureReset='Fresh pinned schema after baseline intentionally committed defect reproductions; no repair';}
  if(stage!=='baseline')call(path.join(bin,'psql'),['-X','-v','ON_ERROR_STOP=1'],{env,input:fs.readFileSync(path.join(root,'proposals/issue-61/wave4',stage==='corrected'?'correction.sql':'revert.sql'),'utf8')});
  const r=spawnSync(process.execPath,['--test','--test-concurrency=1','--test-reporter=tap',path.join(__dirname,'access.test.cjs')],{cwd:root,env:{...env,RVA_WAVE4_STAGE:stage},encoding:'utf8',timeout:180000,maxBuffer:16*1024*1024});
  const entry={stage,exitCode:r.status};for(const k of ['tests','pass','fail','skipped']){const m=r.stdout.match(new RegExp('^# '+k+' (\\d+)$','m'));if(m)entry[k]=Number(m[1]);}
  fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,stage+'.tap'),r.stdout+(r.stderr||''));receipt.stages.push(entry);process.stdout.write(r.stdout);process.stderr.write(r.stderr||'');
  const extra=spawnSync(process.execPath,['--test','--test-concurrency=1','--test-reporter=tap',path.join(__dirname,'session-entry.test.cjs')],{cwd:root,env:{...env,RVA_WAVE4_STAGE:stage},encoding:'utf8',timeout:120000,maxBuffer:8*1024*1024});
  const extraEntry={stage,exitCode:extra.status};for(const k of ['tests','pass','fail','skipped']){const m=extra.stdout.match(new RegExp('^# '+k+' (\\d+)$','m'));if(m)extraEntry[k]=Number(m[1]);}receipt.sessionEntry??=[];receipt.sessionEntry.push(extraEntry);fs.writeFileSync(path.join(output,stage+'-session-entry.tap'),extra.stdout+(extra.stderr||''));process.stdout.write(extra.stdout);



 }
 for(const x of receipt.executionInputs)if(hash(fs.readFileSync(path.join(root,x.path)))!==x.sha256)throw Error('Execution input changed during run: '+x.path);
 receipt.baselineOnly=baselineOnly;
 receipt.result=receipt.stages[1]?.exitCode===0&&receipt.sessionEntry[1]?.exitCode===0&&receipt.stages[0]?.exitCode!==0&&receipt.stages[2]?.exitCode!==0?'CORRECTION_PASSES_BASELINE_AND_REVERT_FAIL':'REVIEW_REQUIRED';
 receipt.macroAcceptance='PARTIAL_ONLY: unapproved allowance business/family policies and future paid member positives remain held';
 process.exitCode=receipt.result==='CORRECTION_PASSES_BASELINE_AND_REVERT_FAIL'?0:1;
}catch(e){receipt.error=e.message;process.stderr.write(e.message+'\n');process.exitCode=1;}
finally{if(started)try{call(path.join(bin,'pg_ctl'),['-D',path.join(scratch,'data'),'-m','immediate','-w','stop']);receipt.clusterStopped=true;}catch(e){receipt.cleanupError=e.message;process.exitCode=1;}if(scratch&&(!started||receipt.clusterStopped)){fs.rmSync(scratch,{recursive:true,force:true});receipt.clusterRemoved=true;}receipt.completedAt=new Date().toISOString();fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'postgres-receipt.json'),JSON.stringify(receipt,null,2)+'\n');}
