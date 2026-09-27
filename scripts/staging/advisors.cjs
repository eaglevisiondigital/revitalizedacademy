// Local seeded staging equivalent only; never queries a hosted project's customer data.
const {Client}=require('pg'),{spawnSync}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const {prepare}=require('./provision.cjs'),{resolve}=require('../../js/environment.js');
(async()=>{
 const host=process.env.RVA_TEST_PGHOST||'127.0.0.1';if(!['localhost','127.0.0.1'].includes(host))throw Error('Local host required');
 const settings={host,port:Number(process.env.RVA_TEST_PGPORT||55439),user:process.env.RVA_TEST_PGUSER||'postgres'},name='rva_stage_advisor_'+process.pid+'_'+Date.now();
 const admin=new Client({...settings,database:'postgres'});await admin.connect();let created=false,db;
 try{await admin.query('CREATE DATABASE "'+name+'"');created=true;db=new Client({...settings,database:name});await db.connect();await db.query(fs.readFileSync('tests/backend/platform.sql','utf8'));
 const legal=require('../../config/legal-manifest.json').map(({pdf_file,pdf_sha256,...r})=>{const content_text='Synthetic local advisor fixture: '+r.agreement_key;return {...r,content_text,content_hash:createHash('sha256').update(content_text).digest('hex')};});
 const c=resolve({environment:'staging',supabaseUrl:'https://abcdefghijklmnopqrst.supabase.co',supabaseKey:'sb_publishable_synthetic',appOrigin:'https://stage.example.invalid',paymentMode:'synthetic'});await prepare(db,c,legal);
 const output=path.resolve(process.env.RVA_ADVISOR_OUTPUT||'/private/tmp/rva-staging-advisors');fs.mkdirSync(output,{recursive:true});
 for(const type of ['security','performance']){const r=spawnSync(process.env.RVA_SUPABASE_CLI||'supabase',['db','advisors','--db-url',`postgresql://${settings.user}@${host}:${settings.port}/${name}?sslmode=disable`,'--type',type,'--output-format','json'],{encoding:'utf8',maxBuffer:32*1024*1024});if(r.status!==0)throw Error(type+' advisor failed');fs.writeFileSync(path.join(output,type+'.json'),r.stdout);console.log(type+' advisor saved');}
 }finally{if(db)await db.end();if(created)await admin.query('DROP DATABASE "'+name+'" WITH(FORCE)');await admin.end();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
