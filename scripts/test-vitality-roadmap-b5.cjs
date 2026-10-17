// Local PostgreSQL 17 only. Restores observed baseline + production forward files;
// never restores staging forward migrations or customer/auth records.
const {Client}=require('pg');const fs=require('node:fs');const path=require('node:path');const {spawnSync}=require('node:child_process');
if(process.env.RVA_ROADMAP_B4_LOCAL!=='1')throw Error('Use npm run test:roadmap-b4:database for the explicitly local B4 harness');
(async()=>{
 // Always test the exact current build, never a stale production-dist directory.
 fs.rmSync('production-dist',{recursive:true,force:true,maxRetries:5,retryDelay:200});
 const built=spawnSync(process.execPath,['scripts/build-production-vitality.cjs'],{stdio:'inherit'});
 if(built.status!==0)throw Error('Current production build required');
 const database=`rva_gate_${process.pid}_${Date.now()}`;
 const port=Number(process.env.RVA_LOCAL_PGPORT||55449);
 const admin=new Client({host:'127.0.0.1',port,user:process.env.RVA_LOCAL_PGUSER||'postgres',database:'postgres'});
 await admin.connect();let created=false;
 try{
  const v=(await admin.query('show server_version_num')).rows[0].server_version_num;
  if(Number(v)<170000||Number(v)>=180000)throw Error('PostgreSQL 17 required');
  await admin.query(`create database "${database}"`);created=true;
  const env={...process.env,PGHOST:'127.0.0.1',PGPORT:String(port),PGUSER:process.env.RVA_LOCAL_PGUSER||'postgres',PGDATABASE:database,RVA_TEST_DATABASE:database};
  const baseline=path.resolve(process.env.RVA_TEST_BASELINE_ROOT||'../revitalizedacademy','supabase/baselines/2026-09-26/schema.sql');
  const platform=path.resolve(process.env.RVA_TEST_BASELINE_ROOT||'../revitalizedacademy','tests/backend/platform.sql');
  const files=[platform,baseline,...fs.readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort().map(f=>path.resolve('supabase/migrations',f))];
  // A developer-owned PG17 cluster may use a differently named superuser.
  // Remap only baseline grants in this disposable database; never create global roles.
  const hasPostgres=(await admin.query("select exists(select 1 from pg_roles where rolname='postgres') ok")).rows[0].ok;
  const quotedAdmin='\"'+env.PGUSER.replaceAll('\"','\"\"')+'\"';
  for(const file of files){
   if(file.endsWith('20261007224150_production_client_lifecycle_v1.sql')){
    const seed=spawnSync('/opt/homebrew/opt/postgresql@17/bin/psql',['-X','-v','ON_ERROR_STOP=1','-c',"insert into public.program_catalog(program_code,name,program_type,default_commitment_months) values('holistic-foundations','Holistic Foundations','membership',6) on conflict do nothing"],{env,encoding:'utf8'});
    if(seed.status!==0)throw Error(seed.stderr);
   }
   let sql=fs.readFileSync(file,'utf8');
   if(file===baseline&&!hasPostgres)sql=sql.replaceAll('TO "postgres";', 'TO '+quotedAdmin+';').replaceAll('FOR ROLE "postgres"','FOR ROLE '+quotedAdmin);
   const restore=spawnSync('/opt/homebrew/opt/postgresql@17/bin/psql',['-X','-v','ON_ERROR_STOP=1'],{env,input:sql,encoding:'utf8',maxBuffer:64*1024*1024});
   if(restore.status!==0)throw Error(file+'\n'+restore.stderr.slice(-5000));
  }
  if(process.env.RVA_ROADMAP_B4_LOCAL==='1'){
   const parity="alter table auth.users add column if not exists deleted_at timestamptz, add column if not exists banned_until timestamptz; create table if not exists auth.sessions(id uuid primary key,user_id uuid references auth.users(id),not_after timestamptz);";
   const migration=fs.readFileSync('supabase/environment-migrations/production/20261016062751_vitality_roadmap_b4_founder_workspace.sql','utf8');
   const applied=spawnSync('/opt/homebrew/opt/postgresql@17/bin/psql',['-X','-v','ON_ERROR_STOP=1'],{env,input:parity+migration,encoding:'utf8',maxBuffer:8000000});
   if(applied.status)throw Error(applied.stderr);
  }
  console.log(`Isolated PostgreSQL 17 restore: baseline + ${files.length-2} production migrations; no staging migrations`);
  const result=spawnSync(process.execPath,['--test','--test-concurrency=1','tests/backend/production-durable-content.test.cjs','tests/backend/vitality-assessment-review.test.cjs','tests/backend/vitality-resume.test.cjs','tests/backend/fooddata.test.cjs','tests/backend/repdb-exercise.test.cjs','tests/backend/vitality-reliability.test.cjs','tests/backend/production-client-lifecycle.test.cjs',...(process.env.RVA_ROADMAP_B4_LOCAL==='1'?['tests/backend/vitality-roadmap-b4.test.cjs','tests/backend/vitality-roadmap-b42.test.cjs','tests/backend/vitality-roadmap-b5.test.cjs']:[])],{env,encoding:'utf8',maxBuffer:32*1024*1024});
  process.stdout.write(result.stdout);process.stderr.write(result.stderr);process.exitCode=result.status||0;
  if(process.env.RVA_ROADMAP_B4_LOCAL==='1' && process.env.RVA_B42_DATABASE_ONLY!=='1'){const browser=(process.env.RVA_B42_FAST==='1'||process.env.RVA_B42_ONLY==='1')?{status:0}:spawnSync(process.execPath,['tests/vitality-roadmap-b4-browser.cjs'],{env,stdio:'inherit',timeout:180000});if(browser.status!==0){process.exitCode=browser.status||1;if(browser.error)console.error(browser.error.message);}
    const b5=spawnSync(process.execPath,['tests/vitality-roadmap-b5-browser.cjs'],{env,stdio:'inherit',timeout:300000});if(b5.status!==0)process.exitCode=1;
    const b42=spawnSync(process.execPath,['tests/vitality-roadmap-b42-browser.cjs'],{env,stdio:'inherit',timeout:240000});if(b42.status!==0)process.exitCode=b42.status||1;}
  if(result.status===0 && process.env.RVA_B42_DATABASE_ONLY!=='1' && process.env.RVA_B42_FAST!=='1'){
   for(const raceFile of ['tests/backend/vitality-roadmap-b5-concurrency.cjs','tests/backend/vitality-roadmap-b42-concurrency.cjs']){
   const raceDatabase=`rva_gate_${process.pid}_${Date.now()}`;
   await admin.query(`create database "${raceDatabase}" template "${database}"`);
   try{const race=spawnSync(process.execPath,['--test',raceFile],{env:{...env,PGDATABASE:raceDatabase,RVA_TEST_DATABASE:raceDatabase},encoding:'utf8',timeout:60000,maxBuffer:8000000});process.stdout.write(race.stdout||'');process.stderr.write(race.stderr||'');if(race.status!==0)process.exitCode=1;}finally{await admin.query(`drop database "${raceDatabase}" with(force)`);}
   }
   for(const test of (process.env.RVA_B42_ONLY==='1'?[]:['tests/backend/vitality-reliability-concurrency.test.cjs','tests/backend/production-client-lifecycle-concurrency.test.cjs','tests/backend/vitality-roadmap-b4-concurrency.cjs'])){
    const races=spawnSync(process.execPath,['--test',test],{env,encoding:'utf8',timeout:60000,maxBuffer:8*1024*1024});
    process.stdout.write(races.stdout);process.stderr.write(races.stderr);
    if(races.status!==0){process.exitCode=races.status||1;break;}
   }
  }
 }finally{if(created)await admin.query(`drop database "${database}" with (force)`);await admin.end();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
