// Prints a staging-only deployment plan. Execution needs --apply and explicit project acknowledgement.
const {spawnSync}=require('node:child_process');const {config}=require('./config.cjs');
const c=config();
if(c.environment!=='staging'||process.env.RVA_STAGING_PROJECT_REF!==c.projectRef)throw Error('Explicit non-production staging project required');
const inventory=require('../../config/edge-functions.json');
const functions=process.argv.includes('--include-optional')?[...inventory.required,...inventory.optional]:inventory.required;
if(!process.argv.includes('--apply')){console.log('Staging project '+c.projectRef+'; deploy in order: '+functions.join(', '));process.exit(0);}
if(process.env.RVA_CONFIRM_NEW_PROJECT!==c.projectRef)throw Error('Staging acknowledgement required');
for(const name of functions){const r=spawnSync(process.env.RVA_SUPABASE_CLI||'supabase',['functions','deploy',name,'--project-ref',c.projectRef,'--use-api','--no-verify-jwt'],{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
