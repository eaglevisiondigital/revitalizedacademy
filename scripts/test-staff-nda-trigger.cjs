'use strict';
// Native PostgreSQL17, disposable schema and fictional staff ONLY. No hosted connection.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process'),{Client}=require('pg');
if(process.env.RVA_NDA_LOCAL!=='1')throw Error('Explicit local NDA test opt-in required');
(async()=>{const admin=new Client({host:'127.0.0.1',port:Number(process.env.RVA_LOCAL_PGPORT||55541),user:'postgres',database:'postgres'});await admin.connect();let created=false;
 const name=`rva_nda_${process.pid}_${Date.now()}`;
 try{const version=(await admin.query('show server_version')).rows[0].server_version;if(!/^17\./.test(version))throw Error('Native PostgreSQL17 required');
  await admin.query('create database "'+name+'"');created=true;
  const env={...process.env,PGHOST:'127.0.0.1',PGPORT:String(process.env.RVA_LOCAL_PGPORT||55541),PGUSER:'postgres',PGDATABASE:name,RVA_TEST_DATABASE:name};
  const baseline=path.resolve('../revitalizedacademy');
  const files=[baseline+'/tests/backend/platform.sql',baseline+'/supabase/baselines/2026-09-26/schema.sql',...fs.readdirSync('supabase/migrations').filter(x=>x.endsWith('.sql')).sort().map(x=>path.resolve('supabase/migrations',x))];
  for(const file of files){if(file.endsWith('20261007224150_production_client_lifecycle_v1.sql')){const seeded=spawnSync('/opt/homebrew/opt/postgresql@17/bin/psql',['-X','-v','ON_ERROR_STOP=1','-c',"insert into public.program_catalog(program_code,name,program_type,default_commitment_months) values('holistic-foundations','Holistic Foundations','membership',6) on conflict do nothing"],{env,encoding:'utf8'});if(seeded.status)throw Error(seeded.stderr);}
   const r=spawnSync('/opt/homebrew/opt/postgresql@17/bin/psql',['-X','-v','ON_ERROR_STOP=1','-f',file],{env,encoding:'utf8',maxBuffer:64*1024*1024});if(r.status)throw Error('Local schema restore failed: '+path.basename(file)+'\n'+r.stderr.slice(-2000));}
  const parity=spawnSync('/opt/homebrew/opt/postgresql@17/bin/psql',['-X','-v','ON_ERROR_STOP=1','-c','alter table auth.users add column if not exists deleted_at timestamptz, add column if not exists banned_until timestamptz'],{env,encoding:'utf8'});if(parity.status)throw Error(parity.stderr);
  console.log(JSON.stringify({native_postgres:version,disposable_database:true,production_migrations_restored:files.length-2,hosted_connections:0}));
  const r=spawnSync(process.execPath,['--test','--test-concurrency=1','tests/backend/staff-nda-trigger.test.cjs'],{env,encoding:'utf8',timeout:180000,maxBuffer:16*1024*1024});process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');process.exitCode=r.status||0;
  if(r.status===0){const race=spawnSync(process.execPath,['tests/backend/staff-nda-recovery-concurrency.cjs'],{env,encoding:'utf8',timeout:30000,maxBuffer:4000000});process.stdout.write(race.stdout||'');process.stderr.write(race.stderr||'');if(race.status)process.exitCode=1;}
 }finally{if(created)await admin.query('drop database "'+name+'" with(force)');await admin.end();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
