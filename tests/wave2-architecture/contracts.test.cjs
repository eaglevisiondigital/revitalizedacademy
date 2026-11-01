'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const baseline=p=>cp.execFileSync('git',['show','fc6737415da36b4306afa0060a525eca2f1131ca:'+p],{cwd:root,encoding:'utf8'});
test('existing member enrollment route changes only by an explicit dashboard link',()=>{
  assert.equal(read('member/index.html').replace('<p><a href="/member/dashboard.html">Open Member Dashboard</a></p>',''),baseline('member/index.html'));
  assert.equal(read('member/onboarding/index.html'),baseline('member/onboarding/index.html'));
  assert(read('member/index.html').includes('/member/onboarding/onboarding.js?v=100'));
});
test('dashboard supplies every literal rm DOM target required by actual script, with no duplicate IDs',()=>{
  const html=read('member/dashboard.html'),ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length);
  for(const [,id]of read('member/member110.js').matchAll(/\bel\("([^"]+)"\)/g))assert(ids.includes(id),id);
  assert(html.includes('member110.js?v=193'));
  assert(html.includes('member110.css?v=192'));
  assert(html.includes('href="/member/"'));
});
test('canonical existing member CSS and five approved assets remain byte-identical',()=>{
  for(const file of ['member/member110.css','assets/images/justyn-elle-professional-approved-102.png','assets/images/revitalized-logo-dark-approved-v69.png','assets/images/revitalized-logo-light-approved.png','assets/images/revitalized-shield.png','assets/images/revitalized-shield-approved-v69.png']){
    const b=cp.execFileSync('git',['show','fc6737415da36b4306afa0060a525eca2f1131ca:'+file],{cwd:root,maxBuffer:8*1024*1024});assert(b.equals(fs.readFileSync(path.join(root,file))),file);
  }
});
test('build integration stays held rather than silently publishing a new route',()=>{
  assert.equal(read('config/production-public-files.json'),baseline('config/production-public-files.json'));
  assert(!JSON.parse(read('config/production-public-files.json')).includes('member/dashboard.html'));
  for(const file of ['netlify.toml','scripts/build-production-vitality.cjs','portal/portal.js','portal/portal-permissions.js','portal/portal.css'])assert.equal(read(file),baseline(file),file);
});
