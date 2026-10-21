// Loopback-only disposable database. No hosted URLs, customer records, role
// mutations, primary-workstream test databases, or provider calls are used.
const {Client}=require('pg'),fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
async function securitySnapshot(db){
 const policies=(await db.query("select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check from pg_policies where schemaname in ('public','private') order by schemaname,tablename,policyname")).rows;
 const tables=(await db.query("select n.nspname,c.relname,c.relowner,c.relacl::text,c.relrowsecurity,c.relforcerowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private') and c.relkind in ('r','p','v','m') and c.relname not like 'hhl_%' order by n.nspname,c.relname")).rows;
 const functions=(await db.query("select p.oid::regprocedure::text name,p.proowner,p.proacl::text from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and p.proname not like 'hhl_%' order by 1")).rows;
 return JSON.stringify({policies,tables,functions});
}
(async()=>{
 const database=`rva_hhl_gate_${process.pid}_${Date.now()}`,user=process.env.RVA_HHL_PGUSER||process.env.USER,port=Number(process.env.RVA_HHL_PGPORT||5432);
 const admin=new Client({host:'127.0.0.1',port,user,database:'postgres'});await admin.connect();let created=false,existingFunctions,existingSecurity,advisorBefore;
 const advisors=stage=>{
  if(!process.env.RVA_HHL_SUPABASE_CLI)return null;
  const uri='postgresql://'+encodeURIComponent(user)+'@127.0.0.1:'+port+'/'+database+'?sslmode=disable';
  const run=spawnSync(process.env.RVA_HHL_SUPABASE_CLI,['db','advisors','--db-url',uri,'--type','security','--level','info','--fail-on','none','--output','json'],{env:{...process.env,PGSSLMODE:'disable'},encoding:'utf8',maxBuffer:16*1024*1024,timeout:60000});
  if(run.status!==0)throw Error('Local advisors failed: '+run.stderr.slice(-1000));
  fs.writeFileSync('/private/tmp/'+database+'-advisors-'+stage+'.json',run.stdout);return JSON.parse(run.stdout);
 };
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
    fs.writeFileSync('/private/tmp/rva-hhl-dependency-functions.json',JSON.stringify(existing.filter(row=>/^(private\.staff_has_permission\(|private\.staff_can_access_contact\(|private\.sync_referral_status_from_contact\(|touch_updated_at\(|public\.touch_updated_at\()/.test(row.name)),null,2));
    existingFunctions=existing;existingSecurity=await securitySnapshot(db);await db.end();advisorBefore=advisors('before');
   }
   if(file.endsWith('20261020193400_health_hope_live_registered_guests.sql')){
    const probe=new Client({host:'127.0.0.1',port,user,database});await probe.connect();
    try{await probe.query('begin');await probe.query('update private.hhl_settings set registration_enabled=true');await probe.query('set local role service_role');
     try{await probe.query("select public.hhl_service_command('register',$1)",[{guest_model_version:'hhl-guest-v1'}]);throw Error('Old schema accepted new guest contract');}catch(error){if(error.code!=='22023'||!/invalid_registration/.test(error.message))throw error;}
    }finally{await probe.query('rollback');await probe.end();}
    console.log('New server guest contract rejected by the original event schema before any participant write.');
   }
   if(file.endsWith('20261020201535_health_hope_live_privacy_retention.sql')){
    const probe=new Client({host:'127.0.0.1',port,user,database});await probe.connect();
    try{await probe.query('begin');await probe.query('update private.hhl_settings set registration_enabled=true');await probe.query('set local role service_role');
     try{await probe.query("select public.hhl_service_command('register',$1)",[{guest_model_version:'hhl-guest-v1',privacy_model_version:'hhl-privacy-v1'}]);throw Error('Guest-only schema accepted the new privacy contract');}catch(error){if(error.code!=='22023'||!/invalid_registration/.test(error.message))throw error;}
    }finally{await probe.query('rollback');await probe.end();}
    console.log('New privacy server contract rejected by guest-only schema before participant writes.');
   }
   const restore=spawnSync('/opt/homebrew/opt/postgresql@17/bin/psql',['-X','-v','ON_ERROR_STOP=1'],{env,input:sql,encoding:'utf8',maxBuffer:64*1024*1024});if(restore.status)throw Error(path.basename(file)+'\n'+restore.stderr.slice(-5000));
  }
  if(advisorBefore){
   const after=advisors('after');const flatten=value=>Array.isArray(value)?value.flatMap(flatten):value&&typeof value==='object'?(typeof value.name==='string'&&typeof value.level==='string'?[value]:Object.values(value).flatMap(flatten)):[];
   const signature=item=>JSON.stringify([item.name,item.level,item.cache_key||null,item.metadata||null]);const prior=new Set(flatten(advisorBefore).map(signature)),current=flatten(after),added=current.filter(item=>!prior.has(signature(item)));
   // These eight private tables intentionally deny direct access: no RLS
   // allow-policy is the security boundary, alongside revoked ACLs and scoped
   // SECURITY DEFINER commands. Do not add permissive policies to silence INFO.
   const names=['hhl_settings','hhl_sessions','hhl_registrations','hhl_requests','hhl_limits','hhl_jobs','hhl_attendance','hhl_audit','hhl_session_totals','hhl_privacy_cases','hhl_privacy_log'];
   const expected=item=>item.name==='rls_enabled_no_policy'&&item.level==='INFO'&&item.metadata?.schema==='private'&&names.includes(item.metadata?.name);
   const acknowledged=added.filter(expected),unexpected=added.filter(item=>!expected(item));
   const receipt={baseline:flatten(advisorBefore).length,after:current.length,acknowledged,unexpected};fs.writeFileSync('/private/tmp/rva-hhl-guests-advisors-summary.json',JSON.stringify(receipt,null,2));if(unexpected.length)throw Error('Unexpected local security advisor findings: '+JSON.stringify(unexpected));console.log('Local Supabase security advisors: '+flatten(advisorBefore).length+' baseline findings retained; '+acknowledged.length+' expected private deny-by-default INFO findings; zero new warnings/errors or unexpected findings.');
  }
  console.log(`PostgreSQL 17: historical schema plus ${migrations.length} production migration files restored in disposable local database.`);
  const launchOnly=process.env.RVA_HHL_LAUNCH_TESTS_ONLY==='1';
  const activationOnly=process.env.RVA_HHL_ACTIVATION_TESTS_ONLY==='1';
  const run=spawnSync(process.execPath,['--test','--test-concurrency=1',...(activationOnly?['--test-name-pattern=^activation acceptance:']:launchOnly?['--test-name-pattern=^launch preparation:']:[]),'tests/backend/health-hope-live.test.cjs'],{env,encoding:'utf8',maxBuffer:16*1024*1024,timeout:120000});process.stdout.write(run.stdout||'');process.stderr.write(run.stderr||'');if(run.status!==0)throw Error('Event database tests failed');
  const db=new Client({host:'127.0.0.1',port,user,database});await db.connect();
  const existing=existingFunctions;
  for(const row of existing){const current=(await db.query('select md5(pg_get_functiondef($1::regprocedure::oid)) hash',[row.name])).rows[0].hash;if(current!==row.hash)throw Error('Unrelated function changed: '+row.name);}
  if(await securitySnapshot(db)!==existingSecurity)throw Error('Existing table RLS, policies, ACLs or function ownership/ACLs changed');
  console.log('Existing table RLS/policies/ACLs and function ownership/ACLs preserved.');
  await db.end();console.log(`Preserved all ${existing.length} pre-existing application function definitions.`);
  if(!launchOnly&&!activationOnly){const concurrent=spawnSync(process.execPath,['--test','tests/backend/health-hope-live-concurrency.cjs'],{env,encoding:'utf8',maxBuffer:8*1024*1024,timeout:60000});process.stdout.write(concurrent.stdout||'');process.stderr.write(concurrent.stderr||'');if(concurrent.status!==0)throw Error('Event concurrency tests failed');}
 }finally{
  if(created)await admin.query(`drop database "${database}" with(force)`);
  const rolesAfter=(await admin.query('select rolname,rolsuper,rolbypassrls,rolcanlogin from pg_roles order by rolname')).rows;await admin.end();
  if(JSON.stringify(rolesBefore)!==JSON.stringify(rolesAfter))throw Error('Local global-role metadata changed');
  console.log('Disposable database removed; existing global roles unchanged.');
 }
})().catch(error=>{console.error(error.message);process.exitCode=1;});
