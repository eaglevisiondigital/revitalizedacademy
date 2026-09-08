// BUILD 76 validation. Run from repository root: node --test tests/coaching76-integrity.cjs
// Tests only the website patch and preservation of the assessment-owned shared sections.
// The separately owned tests/assessment-person.cjs remains unmodified.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const digest=x=>crypto.createHash('sha256').update(x).digest('hex');
const expected={
  "outside_coaching_sha256": "d5e2f3fbe887267b1b001dfe5ed46b1eb5db3e477c7adafd14087361f5ea80fc",
  "popup_sha256": "167b20a7ebf4d0c7f9c77dba8ccff8d65e70b3a715cbb56381b54299c96fa23a",
  "footer_sha256": "3ca6399c79147298b726e73c73872a770c5fb72c928efb669a1a6bc2de4a0b11",
  "results_disclaimer_sha256": "a3f40e7e7ef38c771ad47add86dc0ae9e94273def5e1e8b4cd2d75862c5264e4",
  "protected_css_sha256": "a716e205dd740363e680d2f7b404ae0e41d302f9c074d7aad477fdffcc070bf4",
  "assessment_links": [
    "<a class=\"hero54-btn hero54-btn-light vitality-primary-cta\" href=\"consult.html\">",
    "<a class=\"btn btn-primary vitality-primary-cta\" href=\"consult.html\">",
    "<a class=\"btn btn-primary vitality-primary-cta\" href=\"consult.html\">",
    "<a class=\"text-link\" href=\"consult.html\">",
    "<a class=\"text-link\" href=\"consult.html\">",
    "<a class=\"btn btn-secondary btn-large vitality-primary-cta\" href=\"consult.html\">",
    "<a href=\"consult.html\">",
    "<a class=\"vitality-popup-start vitality-primary-cta\" href=\"consult.html\">"
  ],
  "assessment_includes": [
    "<link rel=\"stylesheet\" href=\"css/vitality55.css?v=71\">",
    "<script src=\"js/vitality55.js?v=71\"></script>"
  ],
  "art_sha256": "aa4716501e9050c978a2cad2c451828c72af4b52f860d0973774fe6dd61fce82",
  "app_prefix_sha256": "346c0dcb90ef29aab92d9b477c17d8cf3a8c61d0b486a4bace5e4d71f81755f3"
};
const html=read('index.html');
const app=read('js/app.js');
const capture=(re,text)=>{const m=text.match(re);assert.ok(m);return m[0];};
test('one static Build 76 coaching section replaces both legacy sections',()=>{
 assert.equal((html.match(/id="coaching"/g)||[]).length,1);
 assert.match(html,/data-coaching-build="76"/);
 assert.doesNotMatch(html,/<section[^>]*(?:difference-premium|coaching-premium|coaching73)/);
 assert.doesNotMatch(app,/section\.className\s*=\s*['"]coaching7[234]['"]/);
 assert.equal((html.match(/class="ra76-pillar"/g)||[]).length,6);
});
test('every byte outside the authorized coaching region and its asset includes is unchanged',()=>{
 let x=html.replace('  <link rel="stylesheet" href="css/coaching76.css?v=76">\n','').replace('js/app.js?v=76','js/app.js?v=51');
 const a=x.indexOf('    <!-- BUILD 76 — approved-art coaching component.');
 const b=x.indexOf('    <section class="family-home-section',a);
 assert.ok(a>=0&&b>a);x=x.slice(0,a)+x.slice(b);
 assert.equal(digest(x),expected.outside_coaching_sha256);
});
test('assessment popup is byte-for-byte unchanged',()=>{
 assert.equal(digest(capture(/<div class="vitality-popup-backdrop">[\s\S]*?<\/section><\/div>/,html)),expected.popup_sha256);
});
test('footer and results disclaimer are byte-for-byte unchanged',()=>{
 assert.equal(digest(capture(/<footer class="site-footer">[\s\S]*?<\/footer>/,html)),expected.footer_sha256);
 assert.equal(digest(capture(/<p class="results-disclaimer">[\s\S]*?<\/p>/,html)),expected.results_disclaimer_sha256);
});
test('all assessment routes and includes are preserved',()=>{
 assert.deepEqual(html.match(/<a\b[^>]*href="(?:consult\.html|\/consult)[^"]*"[^>]*>/g)||[],expected.assessment_links);
 assert.deepEqual(html.match(/<(?:link|script)\b[^>]*(?:css\/vitality55\.css|js\/vitality55\.js)[^>]*>(?:<\/script>)?/g)||[],expected.assessment_includes);
});
test('shared health/results disclaimer CSS is unchanged',()=>{
 const x=read('css/styles.css').split('/* =========================================================\n   BUILD 65 — HEALTH, RESULTS & WEBSITE DISCLAIMER')[1];
 assert.ok(x);assert.equal(digest(x),expected.protected_css_sha256);
});
test('original menu, video and Longevity Matrix JS is preserved; replacement JS parses',()=>{
 const at=app.indexOf('// Build 76: old coaching 73/72 reconstruction removed.');assert.ok(at>0);
 assert.equal(digest(app.slice(0,at)),expected.app_prefix_sha256);
 new vm.Script(app);assert.match(app,/Favorite way to be active/);
});
test('approved art, unique asset references and two responsive enrollment links exist',()=>{
 assert.equal(digest(fs.readFileSync(path.join(root,'assets/images/coaching76/approved-desktop.png'))),expected.art_sha256);
 assert.ok(fs.existsSync(path.join(root,'css/coaching76.css')));
 assert.match(html,/css\/coaching76\.css\?v=76/);assert.match(html,/js\/app\.js\?v=76/);
 assert.equal((html.match(/class="ra76-(?:desktop|native)-action" href="enroll\.html"/g)||[]).length,2);
});
