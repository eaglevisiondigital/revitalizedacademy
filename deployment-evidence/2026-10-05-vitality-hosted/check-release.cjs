const fs = require('node:fs');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const cli = '/Users/davesmacbookpro/.npm/_npx/da5c1b6ea715e8b4/node_modules/.bin/netlify';
const baseline = require('../2026-10-05-vitality-resume/deployment-before.json');
const released = require('../2026-10-05-vitality-resume/deployment-after.json');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function site(id) {
  const s = JSON.parse(cp.execFileSync(cli, ['api', 'getSite', '--data', JSON.stringify({site_id:id})], {encoding:'utf8', maxBuffer:8e6}));
  return {id:s.id, deploy:s.published_deploy?.id, name:s.name};
}
async function fingerprint(base, path) {
  const r = await fetch(base+path, {headers:{'Cache-Control':'no-cache'}, signal:AbortSignal.timeout(30000)});
  return {path, status:r.status, sha256:hash(Buffer.from(await r.arrayBuffer()))};
}
(async () => {
  const staging=site('071b252e-a922-4846-a784-8dca1edad377');
  const production=site('ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06');
  assert.equal(staging.deploy, '6ac38599ba35bc77a266d41c');
  assert.equal(production.deploy, baseline.production.deploy);
  const productionFiles=await Promise.all(baseline.productionFiles.map(f=>fingerprint('https://revitalizedacademy.com',f.path)));
  assert.deepEqual(productionFiles,baseline.productionFiles);
  const stagingAssets=await Promise.all(released.assets.map(f=>fingerprint('https://revitalizedacademy-staging.netlify.app',f.path)));
  for (let i=0;i<stagingAssets.length;i++) {
    assert.equal(stagingAssets[i].status,200);
    assert.equal(stagingAssets[i].sha256,released.assets[i].sha256);
  }
  const receipt={checkedAt:new Date().toISOString(),staging,production,productionUnchanged:true,stagingReleaseUnchanged:true,productionFiles,stagingAssets};
  fs.writeFileSync(__dirname+'/release-receipt.json',JSON.stringify(receipt,null,2)+'\n');
  console.log(JSON.stringify({stagingDeploy:staging.deploy,productionDeploy:production.deploy,stagingAssets:stagingAssets.length,productionFingerprints:productionFiles.length,unchanged:true}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
