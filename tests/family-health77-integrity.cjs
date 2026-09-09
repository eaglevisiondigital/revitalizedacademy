// Run: node --test tests/family-health77-integrity.cjs
// No dependencies, no network requests, no writes.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=n=>fs.readFileSync(path.join(root,n));
const report=JSON.parse(read('BUILD77-CHECKS.json'));
const html=read('families.html').toString();
const app=read('js/app.js');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const blob=b=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+b.length),Buffer.from([0]),b])).digest('hex');
test('existing Build76 app prefix is preserved',()=>{
 assert.equal(blob(app.subarray(0,report.base_app_bytes)),report.base_app_git_blob);
 assert.match(app.subarray(report.base_app_bytes).toString(),/rename only navigation links/);
});
test('old family hero is removed and new section is unique',()=>{
 assert.doesNotMatch(html,/<section[^>]*class="family-page-hero/);
 assert.equal((html.match(/id="family-health"/g)||[]).length,1);
 assert.match(html,/<title>Family Health/);
 assert.doesNotMatch(html,/Longevity Blueprint/);
});
test('all four original family cards remain',()=>{
 assert.equal((html.match(/class="family-blueprint-card /g)||[]).length,4);
 for(const name of ['Organized','Energized','Athletic','Refined']) assert.ok(html.includes('<h3>'+name+'</h3>'));
});
test('other family sections and footer are unchanged',()=>{
 for(const [cls,expected] of Object.entries(report.protected_family_sections)){
  const match=html.match(new RegExp('<section class="'+cls+'\\b[\\s\\S]*?</section>'));
  assert.ok(match,cls);assert.equal(sha(Buffer.from(match[0])),expected,cls);
 }
 assert.equal(sha(Buffer.from(html.match(/<footer\b[\s\S]*?<\/footer>/)[0])),report.family_footer_sha256);
});
test('buttons retain real stories and assessment destinations',()=>{
 for(const cls of ['fh77-assessment-hotspot','fh77-native-cta--assessment'])
  assert.match(html,new RegExp('<a[^>]*'+cls+'[^>]*href="consult.html"'));
 for(const cls of ['fh77-stories-hotspot','fh77-native-cta--stories'])
  assert.match(html,new RegExp('<a[^>]*'+cls+'[^>]*href="stories.html"'));
});
test('approved assets, markup and code match the checked package',()=>{
 for(const [file,expected] of Object.entries(report.file_sha256))assert.equal(sha(read(file)),expected,file);
});
test('protected baseline files are untouched when present',()=>{
 for(const [file,expected] of Object.entries(report.untouched_baseline_blobs)){
  if(fs.existsSync(path.join(root,file)))assert.equal(blob(read(file)),expected,file);
 }
});
