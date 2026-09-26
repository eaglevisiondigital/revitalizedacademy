const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {createHash}=require('node:crypto');
const {JSDOM}=require('jsdom');
const read=f=>fs.readFileSync(f,'utf8');
for(const [file,hash] of Object.entries(require('./protected-baseline.json')))test('protected baseline unchanged: '+file,()=>assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash));
test('homepage routes assessment and webinar visitors to existing protected flows',()=>{
 const d=new JSDOM(read('index.html')).window.document;
 assert(d.querySelector('a[href="consult.html"]'));assert(d.querySelector('a[href="webinar.html"]'));
 assert(d.querySelector('script[src^="js/vitality55.js"]'));assert(d.querySelector('link[href^="css/vitality55.css"]'));
 assert(d.querySelector('footer a[href="disclaimer.html"]'));
});
test('priority webinar retains fifty-seat copy, free priority form and required contact/consent',()=>{
 const d=new JSDOM(read('webinar.html')).window.document;
 const f=d.querySelector('form[name="revitalized-founders-webinar-priority"]');assert(f);assert.equal(f.getAttribute('data-netlify'),'true');assert.equal(f.method,'post');assert.equal(f.getAttribute('action'),'/webinar-priority.html');
 for(const n of ['first-name','last-name','email','phone','priority-contact-consent'])assert(f.querySelector(`[name="${n}"]`).required,n);
 assert.equal(f.querySelector('[name="form-name"]').value,f.name);assert.match(d.body.textContent,/Only 50 seats/);assert.match(d.body.textContent,/No payment (?:is required )?today/i);assert.match(d.body.textContent,/does not guarantee a seat/);
});
test('member bootstrap stays v2 while signing submits displayed hash',()=>{const s=read('member/member110.js');assert.match(s,/from\("my_app_bootstrap_v2"\)/);assert.doesNotMatch(s,/from\("my_app_bootstrap_v27"\)/);assert.match(s,/expected_content_hash:activeAgreement\.rendered_content_hash\|\|activeAgreement\.content_hash/);});
test('CSV uses atomic export RPC; independent audit-call race is gone',()=>{const s=read('portal/portal-people-directory.js');const block=s.slice(s.indexOf('  async function exportCsv()'),s.indexOf('  function closeImport()'));assert.match(block,/rpc\("export_people"/);assert.doesNotMatch(block,/from\("admin_people_directory"\)|log_people_export/);assert.match(block,/if\(error\).*return;/);});
test('CSV quoting neutralizes formula prefixes and preserves ordinary names',()=>{
 const vm=require('node:vm');const line=read('portal/portal-people-directory.js').split('\n').find(l=>l.includes('const esc=(v)=>'));
 const escape=vm.runInNewContext(line+';esc');
 for(const value of ['=1+1','+SUM(A1)','-1+2','@SUM(A1)','  =cmd','\tvalue','\rvalue','\nvalue'])assert(escape(value).startsWith('"\''),value);
 assert.equal(escape('test person'),'"test person"');assert.equal(escape('A "quote"'),'"A ""quote"""');
});
