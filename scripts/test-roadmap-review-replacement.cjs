// Local PostgreSQL 17 only. Restores observed baseline + production forward files;
// Never restores staging, the unapplied Health & Hope event backend, or customer/auth records.
const {Client}=require('pg');const fs=require('node:fs');const path=require('node:path');const {spawnSync}=require('node:child_process');
if(process.env.RVA_ROADMAP_B4_LOCAL!=='1')throw Error('Use npm run test:roadmap-b4:database for the explicitly local B4 harness');
(async()=>{
 // Local synthetic-only tests; never build/deploy artifacts or contact hosted services.
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
  const files=[platform,baseline,...fs.readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')&&!f.includes('health_hope_live')).sort().map(f=>path.resolve('supabase/migrations',f))];
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


  // Restore non-personal observed catalog/default metadata for maintained B4/B5 fixtures.
  const catalog=require(path.resolve(process.env.RVA_TEST_BASELINE_ROOT||'../revitalizedacademy','supabase/baselines/2026-09-26/metadata.json'));
  const fixture=new Client({host:'127.0.0.1',port,user:env.PGUSER,database});await fixture.connect();
  try{for(const r of catalog.permission_catalog){const keys=Object.keys(r);await fixture.query('insert into public.staff_permission_catalog('+keys.join(',')+')values('+keys.map((_,i)=>'$'+(i+1)).join(',')+')on conflict do nothing',Object.values(r));}for(const r of catalog.permission_defaults)await fixture.query('insert into public.staff_role_permission_defaults(role,permission_key,allowed)values($1,$2,$3)on conflict do nothing',[r.role,r.permission_key,r.allowed]);}finally{await fixture.end();}
  const tests=['tests/backend/roadmap-saved-review-replacement.test.cjs'];
  if(process.env.RVA_CONTINUITY_FULL==='1')tests.push('tests/backend/vitality-roadmap-b4.test.cjs','tests/backend/vitality-roadmap-b42.test.cjs','tests/backend/vitality-roadmap-b5.test.cjs','tests/backend/vitality-roadmap-b6.test.cjs','tests/backend/roadmap-processing.test.cjs','tests/backend/roadmap-processing-scope.test.cjs','tests/backend/vitality-resume.test.cjs','tests/backend/production-client-lifecycle.test.cjs');
  const result=spawnSync(process.execPath,['--test','--test-concurrency=1',...tests],{env,encoding:'utf8',timeout:120000,maxBuffer:32*1024*1024});
  process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');
  if(result.status!==0)throw Error('Database gate failed');
  for(const name of []){
   if(!fs.existsSync(name))throw Error('Required suite missing: '+name);
   const isolated='rva_gate_'+process.pid+'_'+Date.now();
   await admin.query('create database "'+isolated+'" template "'+database+'"');
   try{const r=spawnSync(process.execPath,[name],{env:{...env,PGDATABASE:isolated,RVA_TEST_DATABASE:isolated},encoding:'utf8',timeout:300000,maxBuffer:16000000});process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');if(r.status!==0)throw Error(name+' failed');}finally{await admin.query('drop database "'+isolated+'" with(force)');}
  }

 }finally{if(created)await admin.query(`drop database "${database}" with (force)`);await admin.end();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
