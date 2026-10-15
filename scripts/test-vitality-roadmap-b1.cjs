// Complete local baseline + accepted production migrations + inspected staging foundation.
const {Client}=require('pg'),fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
(async()=>{const database=`rva_gate_${process.pid}_${Date.now()}`,port=Number(process.env.RVA_LOCAL_PGPORT||55449),user=process.env.RVA_LOCAL_PGUSER||'postgres';const admin=new Client({host:'127.0.0.1',port,user,database:'postgres'});await admin.connect();let created=false;
try{const v=Number((await admin.query('show server_version_num')).rows[0].server_version_num);if(v<170000||v>=180000)throw Error('PostgreSQL 17 required');await admin.query(`create database "${database}"`);created=true;const env={...process.env,PGHOST:'127.0.0.1',PGPORT:String(port),PGUSER:user,PGDATABASE:database,RVA_TEST_DATABASE:database};
function run(sql,label){const r=spawnSync('/opt/homebrew/opt/postgresql@17/bin/psql',['-X','-v','ON_ERROR_STOP=1'],{env,input:sql,encoding:'utf8',maxBuffer:64*1024*1024});if(r.status!==0)throw Error(label+'\n'+r.stderr.slice(-5000));}
const files=[path.resolve('../revitalizedacademy/tests/backend/platform.sql'),path.resolve('../revitalizedacademy/supabase/baselines/2026-09-26/schema.sql'),...fs.readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort().map(f=>'supabase/migrations/'+f)];
for(const f of files){if(f.endsWith('20261007224150_production_client_lifecycle_v1.sql'))run("insert into public.program_catalog(program_code,name,program_type,default_commitment_months) values('holistic-foundations','Holistic Foundations','membership',6) on conflict do nothing",'program fixture');run(fs.readFileSync(f,'utf8'),f);}
run("alter table auth.users add column deleted_at timestamptz, add column banned_until timestamptz; create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id),not_after timestamptz);",'platform parity');
run(fs.readFileSync('design/sql/vitality_roadmap_release_foundation_STAGING_ONLY.sql','utf8'),'existing foundation');
// Pre-existing synthetic released versions test readers. No runtime release bypass is added.
run(fs.readFileSync('tests/fixtures/roadmap-released.sql','utf8'),'released fixture');
run(fs.readFileSync('supabase/environment-migrations/beta/20261015124333_vitality_roadmap_b1_review_delivery_staging_only.sql','utf8'),'B1 forward migration');
const legacy=spawnSync(process.execPath,['--test','tests/backend/vitality-assessment-review.test.cjs'],{env,encoding:'utf8',maxBuffer:32000000});process.stdout.write(legacy.stdout);if(legacy.status)throw Error(legacy.stderr);
run(fs.readFileSync('supabase/environment-migrations/beta/20261015134236_vitality_roadmap_b1_staging_source_review_dependency.sql','utf8'),'staging source dependency');
run(fs.readFileSync('supabase/environment-migrations/beta/20261015134650_vitality_roadmap_b1_optional_source_metadata.sql','utf8'),'optional source metadata');
run('alter table public.contacts drop column referral_source cascade,drop column referral_source_other cascade,drop column sales_rep_name cascade;','older beta contact parity');
console.log(`Roadmap restore passed on PostgreSQL 17 (${files.length} files + staging foundation)`);
const tests=spawnSync(process.execPath,['--test','--test-concurrency=1','tests/backend/vitality-roadmap-b1.test.cjs'],{env,encoding:'utf8',maxBuffer:32*1024*1024});process.stdout.write(tests.stdout);process.stderr.write(tests.stderr);process.exitCode=tests.status||0;
}finally{if(created)await admin.query(`drop database "${database}" with (force)`);await admin.end();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
