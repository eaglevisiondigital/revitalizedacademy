// Actual source SQL in a private disposable PG17 cluster; no migration globs or live connection settings.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),owned=path.join(root,'docs/orchestration/issue-54/wave2');
const manifest=require('./source-pins.json');
const bin=process.env.RVA_WAVE2_PG_BIN||'/opt/homebrew/opt/postgresql@17/bin';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function call(exe,args,options={}){const r=spawnSync(exe,args,{encoding:'utf8',maxBuffer:24*1024*1024,timeout:120000,...options});if(r.status!==0)throw Error(`${path.basename(exe)} failed: ${(r.stderr||r.stdout||r.error?.message||'').slice(-3500)}`);return r;}
const receipt={scope:'LOCAL_HISTORICAL_CATALOG_PLUS_EXPLICIT_PRODUCTION_LIFECYCLE_SOURCE',sourceCommit:call('git',['rev-parse','HEAD'],{cwd:root}).stdout.trim(),startedAt:new Date().toISOString(),network:'unix_socket_only; listen_addresses empty',database:'wave2_client',managedAuth:'synthetic auth.uid/auth.jwt scaffolding, not GoTrue',productionCalls:0,sourcePins:manifest.files,fixtureGlobalRoleChanges:'isolated new cluster only',testsRun:false};
let scratch,started=false;
try{
 for(const x of manifest.files){const p=path.resolve(root,x.path);if(hash(fs.readFileSync(p))!==x.sha256)throw Error('Pinned source drift: '+x.path);}
 const version=call(path.join(bin,'postgres'),['--version']).stdout.trim();if(!/PostgreSQL\) 17\./.test(version))throw Error('PG17 required');receipt.postgres=version;
 scratch=fs.mkdtempSync(path.join(os.tmpdir(),'rva-wave2-client-pg-'));const data=path.join(scratch,'data'),sock=path.join(scratch,'socket');fs.mkdirSync(sock);
 call(path.join(bin,'initdb'),['-D',data,'-U','postgres','--auth-local=trust','--auth-host=reject','--no-locale','--encoding=UTF8']);
 const port=String(56000+process.pid%5000);receipt.port=Number(port);
 call(path.join(bin,'pg_ctl'),['-D',data,'-l',path.join(scratch,'postgres.log'),'-o',`-F -k ${sock} -p ${port} -c listen_addresses=''`,'-w','start']);started=true;
 const env={PATH:process.env.PATH,HOME:process.env.HOME,PGHOST:sock,PGPORT:port,PGUSER:'postgres',PGDATABASE:'wave2_client',RVA_WAVE2_SOCKET:sock,RVA_WAVE2_PORT:port,RVA_WAVE2_DATABASE:'wave2_client',RVA_WAVE2_DEPENDENCIES:process.env.RVA_WAVE2_DEPENDENCIES||path.resolve(root,'../revitalizedacademy/node_modules')};
 call(path.join(bin,'createdb'),['wave2_client'],{env});
 receipt.stages=[];let anyFailed=false;
 for(const stage of ['baseline_auth','production_hold']){
  if(stage==='production_hold'){
   call(path.join(bin,'dropdb'),['wave2_client'],{env});call(path.join(bin,'createdb'),['wave2_client'],{env});
   for(const input of manifest.files.filter(x=>x.restore&&(/platform.sql$|schema.sql$/.test(x.path))))call(path.join(bin,'psql'),['-X','-v','ON_ERROR_STOP=1'],{env,input:fs.readFileSync(path.resolve(root,input.path),'utf8')});
   const original=fs.readFileSync(path.resolve(root,manifest.files.find(x=>x.path.includes('authorization_and_enrollment_gate')).path),'utf8');
   const exact=original.slice(original.indexOf('CREATE OR REPLACE FUNCTION private.staff_has_permission'),original.indexOf('-- Retain legacy action-specific'));
   if(!exact.includes('$$;'))throw Error('Expected exact existing staff permission function missing');
   receipt.permissionHelperExcerptSha256=hash(exact);
   call(path.join(bin,'psql'),['-X','-v','ON_ERROR_STOP=1'],{env,input:exact});
  }
  if(stage==='production_hold')call(path.join(bin,'psql'),['-X','-v','ON_ERROR_STOP=1','-c',"insert into public.program_catalog(program_code,name,program_type) values('holistic-foundations','Fictional migration precondition only','membership')"],{env});
  for(const input of manifest.files.filter(x=>x.restore&&x.stage===stage))call(path.join(bin,'psql'),['-X','-v','ON_ERROR_STOP=1'],{env,input:fs.readFileSync(path.resolve(root,input.path),'utf8')});
  const tests=spawnSync(process.execPath,['--test','--test-concurrency=1','--test-reporter=tap',path.join(__dirname,'sql-contracts.test.cjs')],{cwd:root,env:{...env,RVA_WAVE2_SQL_STAGE:stage},encoding:'utf8',maxBuffer:16*1024*1024,timeout:120000});
  const entry={stage,testExitCode:tests.status,result:tests.status===0?'PASS_BOUNDED_SUBTESTS':'FAIL_OR_BLOCKED_REVIEW_REQUIRED'};
  for(const k of ['tests','pass','fail','skipped','todo']){const m=tests.stdout.match(new RegExp('^# '+k+' (\\d+)$','m'));if(m)entry[k]=Number(m[1]);}
  receipt.stages.push(entry);receipt.testsRun=true;anyFailed||=tests.status!==0;
  fs.writeFileSync(path.join(owned,stage+'-tests.tap'),tests.stdout+(tests.stderr||''));process.stdout.write(tests.stdout);process.stderr.write(tests.stderr||'');
 }
 receipt.testResult=anyFailed?'FAIL_OR_BLOCKED_REVIEW_REQUIRED':'PASS_BOUNDED_SUBTESTS';process.exitCode=anyFailed?1:0;
}catch(error){receipt.error=error.message;process.stderr.write(error.message+'\n');process.exitCode=1;}
finally{
 if(started){try{call(path.join(bin,'pg_ctl'),['-D',path.join(scratch,'data'),'-m','immediate','-w','stop']);receipt.clusterStopped=true;}catch(e){receipt.cleanupError=e.message;process.exitCode=1;}}
 if(scratch&&(!started||receipt.clusterStopped)){fs.rmSync(scratch,{recursive:true,force:true});receipt.clusterRemoved=true;}
 receipt.completedAt=new Date().toISOString();fs.mkdirSync(owned,{recursive:true});fs.writeFileSync(path.join(owned,'postgres-receipt.json'),JSON.stringify(receipt,null,2)+'\n');
}
