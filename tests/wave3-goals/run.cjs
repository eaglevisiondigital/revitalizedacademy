'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const {inputs,reconstruct,hash}=require('./reconstruct.cjs');
const root=path.resolve(__dirname,'../..'),out=path.resolve(process.env.RVA_WAVE3_GOALS_OUTPUT||path.join(root,'docs/orchestration/issue-60/wave3'));
const pgPath=path.resolve(root,'../revitalizedacademy/node_modules/pg');if(require(path.join(pgPath,'package.json')).version!=='8.16.3')throw Error('Pinned pg8.16.3 required');
const {Client}=require(pgPath),bin=process.env.RVA_WAVE3_PG_BIN||'/opt/homebrew/opt/postgresql@17/bin';
const receipt={scope:'LOCAL_CURRENT_CATALOG_GOALS_EQUIVALENCE_ONLY',startedAt:new Date().toISOString(),productionCalls:0,network:'UNIX_SOCKET_ONLY; listen_addresses empty',tests:[],base:'fad394ef683b711ba34866ec614bed71a26cee93'};
function call(exe,args,options={}){const r=cp.spawnSync(exe,args,{encoding:'utf8',timeout:120000,maxBuffer:24*1024*1024,...options});if(r.status!==0)throw Error(path.basename(exe)+': '+(r.stderr||r.stdout||r.error?.message||'failed').slice(-1800));return r.stdout;}
let scratch,started=false,db;
(async()=>{
 try{
  const input=inputs(root);receipt.pins=input.pins;receipt.postgres=call(path.join(bin,'postgres'),['--version']).trim();if(!/PostgreSQL\) 17\./.test(receipt.postgres))throw Error('PG17 required');
  scratch=fs.mkdtempSync('/private/tmp/rva-wave3-goals-');const data=path.join(scratch,'data'),socket=path.join(scratch,'sock'),port=String(57000+process.pid%5000);fs.mkdirSync(socket,{mode:0o700});
  call(path.join(bin,'initdb'),['-D',data,'-U','fixture_admin','--auth-local=trust','--auth-host=reject','--no-locale','--encoding=UTF8']);
  call(path.join(bin,'pg_ctl'),['-D',data,'-l',path.join(scratch,'server.log'),'-o',`-F -k ${socket} -p ${port} -c listen_addresses='' -c unix_socket_permissions=0700`,'-w','start']);started=true;
  const env={PATH:process.env.PATH,HOME:process.env.HOME,PGHOST:socket,PGPORT:port,PGUSER:'fixture_admin',PGDATABASE:'postgres'};
  call(path.join(bin,'psql'),['-X','-v','ON_ERROR_STOP=1','-c','CREATE ROLE postgres NOLOGIN SUPERUSER','-c','CREATE DATABASE wave3_goals'],{env});
  db=new Client({host:socket,port:Number(port),user:'fixture_admin',database:'wave3_goals'});await db.connect();
  const sources=input.pins.historicalScaffoldOnly;
  for(const p of sources.slice(0,2))await db.query(fs.readFileSync(path.resolve(root,p.path),'utf8'));
  await db.query("insert into public.program_catalog(program_code,name,program_type) values('holistic-foundations','Fictional migration precondition','membership')");
  await db.query(fs.readFileSync(path.resolve(root,sources[2].path),'utf8'));
  receipt.equivalence=await reconstruct(db,input);
  await require('./verify.cjs').run(db,input,receipt,{root,out});
 }catch(error){receipt.blocked=error.message;receipt.errorContext=error.where||null;receipt.errorStack=error.stack;process.exitCode=1;}
 finally{
  await db?.end();
  if(started){try{call(path.join(bin,'pg_ctl'),['-D',path.join(scratch,'data'),'-m','immediate','-w','stop']);receipt.clusterStopped=true;}catch(error){receipt.cleanupError=error.message;process.exitCode=1;}}
  if(scratch&&(!started||receipt.clusterStopped)){fs.rmSync(scratch,{recursive:true,force:true});receipt.clusterRemoved=true;}
  receipt.completedAt=new Date().toISOString();fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'PG_RESULTS.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({blocked:receipt.blocked||null,equivalentTables:receipt.equivalence?.tables.length,stages:receipt.stages?.map(({name,pass,fail,blocked})=>({name,pass,fail,blocked}))||null,clusterStopped:receipt.clusterStopped,clusterRemoved:receipt.clusterRemoved},null,2));
 }
})();
