/* NEW staging only. No migration repair, historical replay, production or customer data. */
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto'),{Client}=require('pg');
const {config}=require('./config.cjs');
const root=path.resolve(__dirname,'../..');
const hash=value=>createHash('sha256').update(value).digest('hex');
const sourceFiles=['supabase/baselines/2026-09-26/schema.sql','supabase/migrations/20260926212638_authorization_and_enrollment_gate.sql','supabase/migrations/20260927020040_client_access_lifecycle.sql'];
function validateTarget(env,c){
 if(c.environment!=='staging')throw Error('Provisioning requires staging configuration');
 if(env.RVA_STAGING_PROJECT_REF!==c.projectRef)throw Error('Explicit staging ref must match browser/Edge project');
 const u=new URL(env.RVA_STAGING_DATABASE_URL||'');
 if(u.href.includes('voalfpxiyznnqfcqcymd'))throw Error('Production database refused');
 if(!['postgres:','postgresql:'].includes(u.protocol))throw Error('PostgreSQL URL required');
 const direct=u.hostname==='db.'+c.projectRef+'.supabase.co'&&u.username==='postgres';
 const pooler=u.hostname.endsWith('.pooler.supabase.com')&&u.username==='postgres.'+c.projectRef&&u.port==='5432';
 if(!direct&&!pooler)throw Error('Target must be the staging project direct connection or session pooler');
 if(u.searchParams.get('sslmode')!=='verify-full')throw Error('Verified TLS (sslmode=verify-full) required');
 return u.href;
}
function legalInputs(directory){
 const rows=JSON.parse(fs.readFileSync(path.join(directory,'templates.json'),'utf8'));
 const manifest=require('../../config/legal-manifest.json');
 if(rows.length!==manifest.length)throw Error('Expected exactly MK7 and MK.1 legal templates');
 for(const expected of manifest){
  const row=rows.find(r=>r.agreement_key===expected.agreement_key&&r.version===expected.version);
  if(!row||hash(row.content_text)!==expected.content_hash||row.content_hash!==expected.content_hash)throw Error('Approved legal content hash mismatch');
  for(const k of ['name','audience','document_type','source_filename'])if(row[k]!==expected[k])throw Error('Legal metadata mismatch: '+k);
  if(JSON.stringify(row.merge_schema)!==JSON.stringify(expected.merge_schema))throw Error('Legal merge schema mismatch');
  if(hash(fs.readFileSync(path.join(directory,expected.pdf_file)))!==expected.pdf_sha256)throw Error('Original PDF hash mismatch');
 }
 return rows;
}
async function insert(db,table,row){
 const keys=Object.keys(row); // Called only with tracked configuration fields, never request-supplied identifiers.
 return db.query(`INSERT INTO public.${table}(${keys.join(',')}) VALUES(${keys.map((_,i)=>'$'+(i+1)).join(',')}) RETURNING *`,Object.values(row));
}
async function prepare(db,c,legal){
 const existing=await db.query("SELECT tablename FROM pg_tables WHERE schemaname='public'");
 if(existing.rows.length)throw Error('New empty application schema required; existing tables are never overwritten');
 const managed=await db.query("SELECT to_regclass('auth.users') auth,to_regclass('storage.objects') storage");
 if(!managed.rows[0].auth||!managed.rows[0].storage)throw Error('Supabase managed Auth/Storage must exist; never upload test platform fixtures');
 const users=await db.query('SELECT EXISTS(SELECT 1 FROM auth.users) present');if(users.rows[0].present)throw Error('Fresh project with no Auth users required');
 await db.query('BEGIN');
 try {
  for(const file of sourceFiles)await db.query(fs.readFileSync(path.join(root,file),'utf8'));
  const metadata=require('../../supabase/baselines/2026-09-26/metadata.json');
  for(const row of metadata.permission_catalog)await insert(db,'staff_permission_catalog',row);
  for(const [table,rows]of [['staff_role_permission_defaults',metadata.permission_defaults],['staff_role_permissions',metadata.legacy_permissions]])for(const row of rows)await insert(db,table,row);
  const catalog=require('../../supabase/baselines/2026-09-26/catalog.json');
  for(const b of catalog.buckets)await db.query('INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES($1,$1,false,$2,$3)',[b.id,b.file_size_limit,b.allowed_mime_types]);
  const seeds=require('../../config/staging-seeds.json');
  for(const row of seeds.programs)await insert(db,'program_catalog',{...row,pricing:{},metadata:{staging_synthetic:true}});
  for(const row of seeds.journeys)await insert(db,'journey_definitions',row);
  for(const row of seeds.steps)await insert(db,'journey_step_definitions',row);
  await insert(db,'webinar_events',{slug:'founders-webinar-2026',title:'Synthetic staging webinar',capacity:50,reservation_amount_cents:5000,registration_open:true});
  for(const row of legal){
   const result=await insert(db,'agreement_templates',{...row,status:'published',published_at:new Date().toISOString()});
   if(result.rows[0].content_hash!==row.content_hash)throw Error('Database legal hash differs from approved input');
   if(row.document_type==='client_contract')await insert(db,'program_agreement_requirements',{program_code:'holistic-foundations',agreement_template_id:result.rows[0].id,required:true,active:true});
  }
  await db.query("UPDATE public.app_runtime_config SET active=true,config_value=jsonb_build_object('origin',$1::text) WHERE config_key='client_onboarding'",[c.appOrigin]);
  await insert(db,'app_runtime_config',{config_key:'deployment_environment',config_value:{environment:'staging',origin:c.appOrigin,supabase_ref:c.projectRef,payment_mode:'synthetic'},description:'Isolated staging identity; recreate to change origin',member_visible:false,active:true});
  await db.query("INSERT INTO public.app_runtime_config(config_key,config_value,description,member_visible,active) VALUES('feature_member_home_vnext','false'::jsonb,'Feature flag for additive Home / Today vNext member integration',true,true) ON CONFLICT(config_key) DO UPDATE SET config_value='false'::jsonb,member_visible=true,active=true,updated_at=now()");
  await db.query("INSERT INTO public.app_runtime_config(config_key,config_value,description,member_visible,active) VALUES('feature_member_progress_vnext','false'::jsonb,'Feature flag for additive Progress vNext member integration',true,true) ON CONFLICT(config_key) DO UPDATE SET config_value='false'::jsonb,member_visible=true,active=true,updated_at=now()");
  await db.query("INSERT INTO public.app_runtime_config(config_key,config_value,description,member_visible,active) VALUES('feature_member_coaching_vnext','false'::jsonb,'Feature flag for additive Coaching Hub vNext member integration',true,true) ON CONFLICT(config_key) DO UPDATE SET config_value='false'::jsonb,member_visible=true,active=true,updated_at=now()");
  // Stage-only safeguards, never part of the production migration ledger.
  const lit="'"+c.appOrigin.replaceAll("'","''")+"'";
  await db.query(`ALTER TABLE public.app_runtime_config ADD CONSTRAINT staging_onboarding_origin CHECK (config_key<>'client_onboarding' OR (active AND config_value->>'origin'=${lit}));
   ALTER TABLE public.journey_enrollment_activations ADD CONSTRAINT staging_no_payment_endpoint CHECK(payment_url IS NULL);
   CREATE TABLE private.staging_release_components(path text PRIMARY KEY, sha256 text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now());
   REVOKE ALL ON private.staging_release_components FROM PUBLIC,anon,authenticated;`);
  // The recovered referral view contains exactly two legacy production URL literals.
  const view=(await db.query("SELECT pg_get_viewdef('public.my_ambassador_center'::regclass,true) definition")).rows[0].definition;
  if(view.split('https://revitalizedacademy.com').length!==3)throw Error('Referral view provenance drift');
  await db.query('CREATE OR REPLACE VIEW public.my_ambassador_center WITH(security_invoker=true) AS '+view.replaceAll('https://revitalizedacademy.com',c.publicSiteOrigin));
  for(const file of [...sourceFiles,'scripts/staging/provision.cjs','config/staging-seeds.json','config/legal-manifest.json'])await db.query('INSERT INTO private.staging_release_components(path,sha256) VALUES($1,$2)',[file,hash(fs.readFileSync(path.join(root,file)))]);
  await db.query('COMMIT');
 }catch(error){await db.query('ROLLBACK');throw error;}
}
module.exports={validateTarget,legalInputs,prepare,sourceFiles};
if(require.main===module)(async()=>{
 const c=config();const target=validateTarget(process.env,c);const legal=legalInputs(process.env.RVA_LEGAL_SEED_DIR||path.join(root,'.staging-private/legal'));
 if(!process.argv.includes('--apply')){console.log('Validated staging target and legal inputs. Plan: baseline → security → lifecycle → private buckets/config/legal seeds. No connection made.');return;}
 if(process.env.RVA_CONFIRM_NEW_PROJECT!==c.projectRef)throw Error('New staging project confirmation must match explicit ref');
 const db=new Client({connectionString:target});await db.connect();try{await prepare(db,c,legal);console.log('New staging application schema prepared. Hosted Auth/Edge/SMTP/Netlify acceptance remains required.');}finally{await db.end();}
})().catch(()=>{console.error('Staging preparation failed. Inspect privately; connection details and legal text are intentionally not logged. No automatic retry.');process.exitCode=1;});
