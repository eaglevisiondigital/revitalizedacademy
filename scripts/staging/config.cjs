const {resolve}=require('../../js/environment.js');
function config(env=process.env){
 const environment=env.RVA_ENVIRONMENT;
 if(environment==='production')return resolve(require('../../config/production.json'));
 return resolve({environment,supabaseUrl:env.RVA_SUPABASE_URL,supabaseKey:env.RVA_SUPABASE_PUBLISHABLE_KEY,appOrigin:env.RVA_APP_ORIGIN,paymentMode:env.RVA_PAYMENT_MODE});
}
function deploymentGuard(c,env=process.env){
 if(!env.NETLIFY)return;
 if(!env.SITE_ID||env.SITE_ID!==env.RVA_EXPECTED_NETLIFY_SITE_ID)throw Error('Netlify site identity not explicitly approved');
 if(env.URL!==c.appOrigin)throw Error('Netlify primary URL must match configured application origin');
 if(env.CONTEXT!=='production')throw Error('Preview/branch deploys are disabled; use the separate staging site production context');
 if(env.BRANCH!==(c.environment==='staging'?'codex/staging':'main'))throw Error('Netlify branch does not match environment');
 if(c.environment==='local')throw Error('Local builds cannot deploy to Netlify');
}
module.exports={config,deploymentGuard};
