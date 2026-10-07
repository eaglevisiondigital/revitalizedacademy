// Two disposable local PostgreSQL 17 databases prove one-way cross-environment behavior.
const {Client}=require('pg'),fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
(async()=>{
 const port=Number(process.env.RVA_LOCAL_PGPORT||55518),connection={host:'127.0.0.1',port,user:'postgres'};const admin=new Client({...connection,database:'postgres'});await admin.connect();const names=[];
 try{
  if(!/^17\./.test((await admin.query('show server_version')).rows[0].server_version))throw Error('PostgreSQL 17 required');
  for(const kind of ['production','beta']){
   const name='rva_sync_'+kind+'_'+process.pid;await admin.query('create database "'+name+'"');names.push(name);
   const base=kind==='production'?process.cwd():path.resolve('../revitalizedacademy-beta-recipients');
   const files=[path.resolve('../revitalizedacademy/tests/backend/platform.sql'),path.resolve('../revitalizedacademy/supabase/baselines/2026-09-26/schema.sql'),...fs.readdirSync(base+'/supabase/migrations').filter(f=>f.endsWith('.sql')).sort().map(f=>base+'/supabase/migrations/'+f)];
   if(kind==='beta')files.push(path.resolve('supabase/environment-migrations/beta/20261007073534_reusable_content_sync_receive.sql'));
   const restore=spawnSync('/opt/homebrew/opt/postgresql@17/bin/psql',['-X','-v','ON_ERROR_STOP=1',...files.flatMap(f=>['-f',f])],{env:{...process.env,PGHOST:'127.0.0.1',PGPORT:String(port),PGUSER:'postgres',PGDATABASE:name},encoding:'utf8',maxBuffer:64*1024*1024});if(restore.status!==0)throw Error(restore.stderr.slice(-4000));
  }
  const result=spawnSync(process.execPath,['--test','tests/backend/content-sync.test.cjs'],{env:{...process.env,RVA_SYNC_PGPORT:String(port),RVA_SYNC_PRODUCTION_DB:names[0],RVA_SYNC_BETA_DB:names[1]},stdio:'inherit'});process.exitCode=result.status||0;
 }finally{for(const name of names)await admin.query('drop database "'+name+'" with(force)');await admin.end();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
