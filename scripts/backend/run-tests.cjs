// Only creates/drops a newly named database on loopback. Never accepts a remote URL.
const {Client}=require('pg');
const {spawnSync}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
(async()=>{
 const host=process.env.RVA_TEST_PGHOST||'127.0.0.1';
 if(!['127.0.0.1','localhost','/private/tmp','/tmp'].includes(host))throw Error('Local database host required');
 const port=Number(process.env.RVA_TEST_PGPORT||55439);
 const user=process.env.RVA_TEST_PGUSER||'postgres';
 const database='rva_gate_'+process.pid+'_'+Date.now();
 const admin=new Client({host,port,user,database:'postgres'});await admin.connect();
 let created=false;
 try {
  await admin.query(`CREATE DATABASE "${database}"`);created=true;
  const env={...process.env,PGHOST:host,PGPORT:String(port),PGUSER:user,PGDATABASE:database,RVA_TEST_DATABASE:database};
  const files=['tests/backend/platform.sql','supabase/baselines/2026-09-26/schema.sql',...fs.readdirSync(path.join(root,'supabase/migrations')).filter(f=>f.endsWith('.sql')).sort().map(f=>'supabase/migrations/'+f)];
  const restore=spawnSync('psql',['-X','-v','ON_ERROR_STOP=1',...files.flatMap(f=>['-f',f])],{cwd:root,env,encoding:'utf8',maxBuffer:32*1024*1024});
  if(restore.status!==0)throw Error(restore.stderr||restore.stdout);
  console.log('Restored live baseline + forward migrations into an empty local database.');
  const test=spawnSync(process.execPath,['--test','--test-concurrency=1',...fs.readdirSync(path.join(root,'tests/backend')).filter(f=>f.endsWith('.test.cjs')).map(f=>'tests/backend/'+f)],{cwd:root,env,stdio:'inherit'});
  process.exitCode=test.status||0;
 } finally {if(created)await admin.query(`DROP DATABASE "${database}" WITH (FORCE)`);await admin.end();}
})().catch(e=>{console.error(e);process.exitCode=1});
