// Local PostgreSQL 17 only. Restores observed baseline + production forward files;
// never restores staging forward migrations or customer/auth records.
const {Client}=require('pg');const fs=require('node:fs');const path=require('node:path');const {spawnSync}=require('node:child_process');
(async()=>{
 const database=`rva_gate_${process.pid}_${Date.now()}`;
 const port=Number(process.env.RVA_LOCAL_PGPORT||55449);
 const admin=new Client({host:'127.0.0.1',port,user:process.env.RVA_LOCAL_PGUSER||'postgres',database:'postgres'});
 await admin.connect();let created=false;
 try{
  const v=(await admin.query('show server_version_num')).rows[0].server_version_num;
  if(Number(v)<170000||Number(v)>=180000)throw Error('PostgreSQL 17 required');
  await admin.query(`create database "${database}"`);created=true;
  const env={...process.env,PGHOST:'127.0.0.1',PGPORT:String(port),PGUSER:process.env.RVA_LOCAL_PGUSER||'postgres',PGDATABASE:database,RVA_TEST_DATABASE:database};
  const baseline=path.resolve('../revitalizedacademy/supabase/baselines/2026-09-26/schema.sql');
  const platform=path.resolve('../revitalizedacademy/tests/backend/platform.sql');
  const files=[platform,baseline,...fs.readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort().map(f=>path.resolve('supabase/migrations',f))];
  const restore=spawnSync('/opt/homebrew/opt/postgresql@17/bin/psql',['-X','-v','ON_ERROR_STOP=1',...files.flatMap(f=>['-f',f])],{env,encoding:'utf8',maxBuffer:64*1024*1024});
  if(restore.status!==0)throw Error(restore.stderr.slice(-5000));
  console.log(`Isolated PostgreSQL 17 restore: baseline + ${files.length-2} production migrations; no staging migrations`);
  const result=spawnSync(process.execPath,['--test','--test-concurrency=1','tests/backend/production-durable-content.test.cjs','tests/backend/vitality-assessment-review.test.cjs','tests/backend/vitality-resume.test.cjs'],{env,encoding:'utf8',maxBuffer:32*1024*1024});
  process.stdout.write(result.stdout);process.stderr.write(result.stderr);process.exitCode=result.status||0;
 }finally{if(created)await admin.query(`drop database "${database}" with (force)`);await admin.end();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
