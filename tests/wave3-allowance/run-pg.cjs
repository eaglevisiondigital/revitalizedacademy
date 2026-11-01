// No connection string is accepted. Every run creates/removes a UNIX-socket-only PG17 cluster.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),output=path.resolve(root,process.env.RVA_WAVE3_B_OUTPUT||'docs/orchestration/issue-61/wave3/receipts');
const bin=process.env.RVA_WAVE3_PG_BIN||'/opt/homebrew/opt/postgresql@17/bin',hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const pins=require('./source-pins.json');
function call(exe,args,opts={}){const r=spawnSync(exe,args,{encoding:'utf8',timeout:120000,maxBuffer:24*1024*1024,...opts});if(r.status!==0)throw Error(path.basename(exe)+' failed: '+(r.stderr||r.stdout||r.error?.message||'').slice(-4000));return r;}
let scratch,started=false;
const receipt={startedAt:new Date().toISOString(),runnerSha256:hash(fs.readFileSync(__filename)),scope:'LOCAL_CATALOG_OVERLAY_ON_HISTORICAL_EMPTY_DEPENDENCY_SCAFFOLD',productionCalls:0,connection:'new cluster; listen_addresses empty; socket only; fake managed Auth',sourceCommit:call('git',['rev-parse','HEAD'],{cwd:root}).stdout.trim(),outputDirectory:output,stages:[]};
try{
 receipt.executionInputs=['tests/wave3-allowance/allowance.test.cjs','tests/wave3-allowance/direct-boundaries.test.cjs','tests/wave3-allowance/fixture.cjs','tests/wave3-allowance/current-pins.json','proposals/issue-61/correction.sql','proposals/issue-61/revert.sql'].map(x=>({path:x,sha256:hash(fs.readFileSync(path.join(root,x)))}));
 for(const x of pins.files)if(hash(fs.readFileSync(path.resolve(root,x.path)))!==x.sha256)throw Error('Pinned source drift: '+x.path);
 const current=require('./current-pins.json');
 for(const x of current.files)if(hash(fs.readFileSync(path.resolve(root,x.path)))!==x.sha256)throw Error('Pinned current input drift: '+x.path);
 receipt.currentPins=current;receipt.scaffoldPins=pins;receipt.postgres=call(path.join(bin,'postgres'),['--version']).stdout.trim();if(!/PostgreSQL\) 17\./.test(receipt.postgres))throw Error('PG17 required');
 scratch=fs.mkdtempSync(path.join(os.tmpdir(),'rva-wave3-allowance-'));const data=path.join(scratch,'data'),sock=path.join(scratch,'socket');fs.mkdirSync(sock);
 call(path.join(bin,'initdb'),['-D',data,'-U','postgres','--auth-local=trust','--auth-host=reject','--no-locale','--encoding=UTF8']);
 const port=String(56000+process.pid%5000);call(path.join(bin,'pg_ctl'),['-D',data,'-l',path.join(scratch,'postgres.log'),'-o',`-F -k ${sock} -p ${port} -c listen_addresses=''`,'-w','start']);started=true;
 const env={PATH:process.env.PATH,HOME:process.env.HOME,PGHOST:sock,PGPORT:port,PGUSER:'postgres',PGDATABASE:'wave3_allowance',RVA_WAVE3_SOCKET:sock,RVA_WAVE3_PORT:port,RVA_WAVE3_DATABASE:'wave3_allowance',RVA_WAVE3_OUTPUT:output,RVA_WAVE3_DEPENDENCIES:process.env.RVA_WAVE3_DEPENDENCIES||path.resolve(root,'../revitalizedacademy/node_modules')};
 call(path.join(bin,'createdb'),['wave3_allowance'],{env});
 for(const x of pins.files.filter(x=>/platform.sql$|schema.sql$/.test(x.path)))call(path.join(bin,'psql'),['-X','-v','ON_ERROR_STOP=1'],{env,input:fs.readFileSync(path.resolve(root,x.path),'utf8')});
 call(path.join(bin,'psql'),['-X','-v','ON_ERROR_STOP=1','-c',"insert into public.program_catalog(program_code,name,program_type) values('holistic-foundations','Fictional source prerequisite','membership')"],{env});
 const lifecycle=pins.files.find(x=>x.path.includes('production_client_lifecycle_v1'));
 call(path.join(bin,'psql'),['-X','-v','ON_ERROR_STOP=1'],{env,input:fs.readFileSync(path.resolve(root,lifecycle.path),'utf8')});
 call(path.join(bin,'psql'),['-X','-v','ON_ERROR_STOP=1'],{env,input:fs.readFileSync(path.join(__dirname,'current-overlay.sql'),'utf8')});
 for(const stage of ['original','corrected','reverted']){
  if(stage!=='original')call(path.join(bin,'psql'),['-X','-v','ON_ERROR_STOP=1'],{env,input:fs.readFileSync(path.join(root,'proposals/issue-61',stage==='corrected'?'correction.sql':'revert.sql'),'utf8')});
  const r=spawnSync(process.execPath,['--test','--test-concurrency=1','--test-reporter=tap',path.join(__dirname,'allowance.test.cjs')],{cwd:root,env:{...env,RVA_WAVE3_STAGE:stage},encoding:'utf8',timeout:180000,maxBuffer:16*1024*1024});
  const entry={stage,exitCode:r.status};for(const k of ['tests','pass','fail','skipped']){const m=r.stdout.match(new RegExp('^# '+k+' (\\d+)$','m'));if(m)entry[k]=Number(m[1]);}
  fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,stage+'.tap'),r.stdout+(r.stderr||''));receipt.stages.push(entry);process.stdout.write(r.stdout);process.stderr.write(r.stderr||'');
  if(stage==='corrected'){
   const probe=spawnSync(process.execPath,['--test','--test-concurrency=1','--test-reporter=tap',path.join(__dirname,'direct-boundaries.test.cjs')],{cwd:root,env,encoding:'utf8',timeout:120000,maxBuffer:4*1024*1024});
   const direct={exitCode:probe.status};for(const k of ['tests','pass','fail']){const m=probe.stdout.match(new RegExp('^# '+k+' (\\d+)$','m'));if(m)direct[k]=Number(m[1]);}
   receipt.directBoundaries=direct;fs.writeFileSync(path.join(output,'direct-boundaries.tap'),probe.stdout+(probe.stderr||''));process.stdout.write(probe.stdout);
  }

 }
 for(const x of receipt.executionInputs)if(hash(fs.readFileSync(path.join(root,x.path)))!==x.sha256)throw Error('Execution input changed during run: '+x.path);
 receipt.result=receipt.stages[1]?.exitCode===0&&receipt.stages[0]?.exitCode!==0&&receipt.stages[2]?.exitCode!==0?'CORRECTION_PASSES_ORIGINAL_AND_REVERT_FAIL':'REVIEW_REQUIRED';
 receipt.macroAcceptance='HELD: direct-table scope failures and unapproved allowance business policies';
 process.exitCode=receipt.result==='CORRECTION_PASSES_ORIGINAL_AND_REVERT_FAIL'?0:1;
}catch(e){receipt.error=e.message;process.stderr.write(e.message+'\n');process.exitCode=1;}
finally{if(started)try{call(path.join(bin,'pg_ctl'),['-D',path.join(scratch,'data'),'-m','immediate','-w','stop']);receipt.clusterStopped=true;}catch(e){receipt.cleanupError=e.message;process.exitCode=1;}if(scratch&&(!started||receipt.clusterStopped)){fs.rmSync(scratch,{recursive:true,force:true});receipt.clusterRemoved=true;}receipt.completedAt=new Date().toISOString();fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'postgres-receipt.json'),JSON.stringify(receipt,null,2)+'\n');}
