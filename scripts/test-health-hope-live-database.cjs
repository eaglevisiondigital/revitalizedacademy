// Loopback-only disposable database. No hosted URLs, customer records, role
// mutations, primary-workstream test databases, or provider calls are used.
const {Client}=require('pg'),fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
(async()=>{
 const database=`rva_hhl_gate_${process.pid}_${Date.now()}`,user=process.env.RVA_HHL_PGUSER||process.env.USER,port=Number(process.env.RVA_HHL_PGPORT||5432);
 const admin=new Client({host:'127.0.0.1',port,user,database:'postgres'});await admin.connect();let created=false;
 const rolesBefore=(await admin.query('select rolname,rolsuper,rolbypassrls,rolcanlogin from pg_roles order by rolname')).rows;
 try{
  const version=Number((await admin.query('show server_version_num')).rows[0].server_version_num);if(version<170000||version>=180000)throw Error('PostgreSQL 17 required');
  for(const role of ['anon','authenticated','service_role','supabase_admin','supabase_auth_admin','supabase_storage_admin'])if(!rolesBefore.some(r=>r.rolname===role))throw Error('Existing local fixture roles required; this runner will not create global roles');
  await admin.query(`create database "${database}"`);created=true;
  const env={...process.env,PGHOST:'127.0.0.1',PGPORT:String(port),PGUSER:user,PGDATABASE:database,RVA_TEST_DATABASE:database};
  const baseline=path.resolve('../revitalizedacademy/supabase/baselines/2026-09-26/schema.sql'),platform=path.resolve('../revitalizedacademy/tests/backend/platform.sql');
  const migrations=fs.readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort();
  for(const file of [platform,baseline,...migrations.map(f=>path.resolve('supabase/migrations',f))]){
   if(file.endsWith('20261007224150_production_client_lifecycle_v1.sql')){
    const seed=spawnSync('/opt/homebrew/opt/postgresql@17/bin/psql',['-X','-v','ON_ERROR_STOP=1','-c',"insert into public.program_catalog(program_code,name,program_type,default_commitment_months) values('holistic-foundations','Holistic Foundations','membership',6) on conflict do nothing"],{env,encoding:'utf8'});if(seed.status)throw Error(seed.stderr);
   }
   let sql=fs.readFileSync(file,'utf8');
   if(file===baseline&&!rolesBefore.some(r=>r.rolname==='postgres')){const quoted='"'+user.replaceAll('"','""')+'"';sql=sql.replaceAll('TO "postgres";','TO '+quoted+';').replaceAll('FOR ROLE "postgres"','FOR ROLE '+quoted);}
   if(file.endsWith('20261020141529_health_hope_live.sql')){
    const db=new Client({host:'127.0.0.1',port,user,database});await db.connect();
    const existing=(await db.query("select p.oid::regprocedure::text name,md5(pg_get_functiondef(p.oid)) hash from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and p.prokind='f' order by 1")).rows;
    fs.writeFileSync('/private/tmp/rva-hhl-existing-functions.json',JSON.stringify(existing));await db.end();
   }
   const restore=spawnSync('/opt/homebrew/opt/postgresql@17/bin/psql',['-X','-v','ON_ERROR_STOP=1'],{env,input:sql,encoding:'utf8',maxBuffer:64*1024*1024});if(restore.status)throw Error(path.basename(file)+'\n'+restore.stderr.slice(-5000));
  }
  console.log(`PostgreSQL 17: historical schema plus ${migrations.length} production migration files restored in disposable local database.`);
  const run=spawnSync(process.execPath,['--test','--test-concurrency=1','tests/backend/health-hope-live.test.cjs'],{env,encoding:'utf8',maxBuffer:16*1024*1024,timeout:120000});process.stdout.write(run.stdout||'');process.stderr.write(run.stderr||'');if(run.status!==0)throw Error('Event database tests failed');
  const db=new Client({host:'127.0.0.1',port,user,database});await db.connect();
  const existing=JSON.parse(fs.readFileSync('/private/tmp/rva-hhl-existing-functions.json'));
  for(const row of existing){const current=(await db.query('select md5(pg_get_functiondef($1::regprocedure::oid)) hash',[row.name])).rows[0].hash;if(current!==row.hash)throw Error('Unrelated function changed: '+row.name);}
  await db.end();console.log(`Preserved all ${existing.length} pre-existing application function definitions.`);
  const concurrent=spawnSync(process.execPath,['--test','tests/backend/health-hope-live-concurrency.cjs'],{env,encoding:'utf8',maxBuffer:8*1024*1024,timeout:60000});process.stdout.write(concurrent.stdout||'');process.stderr.write(concurrent.stderr||'');if(concurrent.status!==0)throw Error('Event concurrency tests failed');
 }finally{
  if(created)await admin.query(`drop database "${database}" with(force)`);
  const rolesAfter=(await admin.query('select rolname,rolsuper,rolbypassrls,rolcanlogin from pg_roles order by rolname')).rows;await admin.end();
  if(JSON.stringify(rolesBefore)!==JSON.stringify(rolesAfter))throw Error('Local global-role metadata changed');
  console.log('Disposable database removed; existing global roles unchanged.');
 }
})().catch(error=>{console.error(error.message);process.exitCode=1;});
