// Build 78 integrity checks. No external dependencies or network requests.
// Run: node --test tests/family-health78-integrity.cjs
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=n=>fs.readFileSync(path.join(root,n));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const report=JSON.parse(read('BUILD78-CHECKS.json'));
const html=read('families.html').toString();
test('only the authorized card section and CSS include changed',()=>{
 const normalized=html.replace('  <link rel="stylesheet" href="css/family-health78.css?v=78">\n','').replace(/<section class="fh78-generations"[\s\S]*?<\/section>/,'<!-- FAMILY78-CARDS -->');
 assert.equal(sha(Buffer.from(normalized)),report.outside_changed_region_sha256);
});
test('all four titles, descriptions and numbers remain verbatim',()=>{
 const articles=[...html.matchAll(/<article class="fh78-stage [\s\S]*?<\/article>/g)].map(m=>m[0]);
 assert.equal(articles.length,4);
 articles.forEach((a,i)=>{const expected=report.approved_card_copy[i];
  assert.equal(a.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)[1],expected.title);
  assert.equal(a.match(/<p>([\s\S]*?)<\/p>/)[1],expected.body);
  assert.ok(a.includes('>'+expected.number+'</span>'));
 });
});
test('approved hero and all original pillar markup are unchanged',()=>{
 assert.equal(sha(Buffer.from(html.match(/<section class="fh77"[\s\S]*?<\/section>/)[0])),report.hero_markup_sha256);
 assert.equal(sha(Buffer.from(html.match(/<section class="family-matrix-section[\s\S]*?<\/section>/)[0])),report.pillar_markup_sha256);
});
test('footer and assessment destinations are unchanged',()=>{
 assert.equal(sha(Buffer.from(html.match(/<footer\b[\s\S]*?<\/footer>/)[0])),report.footer_sha256);
 assert.deepEqual(html.match(/<a\b[^>]*href="consult.html"[^>]*>/g),report.assessment_links);
});
test('approved build artwork and files match validated output',()=>{
 for(const [file,expected]of Object.entries(report.file_sha256))assert.equal(sha(read(file)),expected,file);
});
test('existing shared resources remain unchanged when present',()=>{
 for(const [file,expected] of Object.entries(report.untouched_existing_files)){
  if(fs.existsSync(path.join(root,file))) assert.equal(sha(read(file)),expected,file);
 }
});
test('new CSS contains no assessment or legal element selectors',()=>{
 const css=read('css/family-health78.css').toString();
 assert.doesNotMatch(css,/\.vitality|\.results-disclaimer|\.legal-|\.footer-|\.site-footer|\.header-cta|\.btn-primary/);
 assert.equal((html.match(/id="family-generations78"/g)||[]).length,1);
 assert.doesNotMatch(html,/class="family-stage-grid /);
});
test('browser results confirm 50% gap reduction and responsive fit',()=>{
 assert.equal(report.viewports.length,27);
 assert.ok(report.viewports.every(v=>v.issues.length===0&&v.portraits&&v.pageWidth<=v.width+1));
 assert.ok(report.gap.every(g=>Math.abs(g.ratio-.5)<.003));
 assert.ok(report.hero_pixels_unchanged&&report.mobile_menu_pass);
 assert.equal(report.js_errors.length,0);
});
