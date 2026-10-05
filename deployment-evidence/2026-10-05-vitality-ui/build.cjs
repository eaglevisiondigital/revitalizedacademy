const fs=require('fs'),cp=require('child_process'),assert=require('assert/strict'),crypto=require('crypto');
const raw=fs.readFileSync(__dirname+'/runtime-before.js','utf8'),c=JSON.parse(raw.match(/^window\.RVA_PUBLIC_CONFIG = (.*);\s*$/s)[1]);
assert.equal(c.environment,'staging');assert.equal(c.projectRef,'bvooallokgfktssadsrv');assert.equal(c.appOrigin,'https://revitalizedacademy-staging.netlify.app');assert.equal(cp.execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),'codex/staging');
const site='071b252e-a922-4846-a784-8dca1edad377';
cp.execFileSync('npm',['run','build'],{stdio:'inherit',env:{...process.env,RVA_ENVIRONMENT:c.environment,RVA_SUPABASE_URL:c.supabaseUrl,RVA_SUPABASE_PUBLISHABLE_KEY:c.supabaseKey,RVA_APP_ORIGIN:c.appOrigin,RVA_PAYMENT_MODE:c.paymentMode,NETLIFY:'true',SITE_ID:site,RVA_EXPECTED_NETLIFY_SITE_ID:site,URL:c.appOrigin,CONTEXT:'production',BRANCH:'codex/staging'}});
assert.equal(fs.readFileSync('dist/runtime-config.js','utf8'),raw);
const files=[...require('../../config/public-files.json'),'runtime-config.js'];
fs.writeFileSync(__dirname+'/build.json',JSON.stringify({at:new Date().toISOString(),site,branch:'codex/staging',commit:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),workingTree:cp.execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim()?'modified':'clean',files:files.map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync('dist/'+file)).digest('hex')}))},null,2)+'\n');
