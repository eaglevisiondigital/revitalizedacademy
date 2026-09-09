// Build 79 integrity tests. No external dependencies, network calls or lead submissions.
// Run: node --test tests/family-health79-integrity.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const read = n => fs.readFileSync(path.join(root, n));
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const report = JSON.parse(read('BUILD79-CHECKS.json'));
const html = read('families.html').toString();

test('removing only Build 79 additions restores byte-identical current-main source', () => {
 let restored = html
  .replace('  <link rel="stylesheet" href="css/family-health79.css?v=79">\n','')
  .replace('  <script src="js/family-health79.js?v=79" defer></script>\n','')
  .replace(/\n      <!-- BUILD 79: Existing client videos,[\s\S]*?<!-- END BUILD 79 family stories -->\n/,'')
  .replace('<section class="family-hub-section section-border fh79-hub" id="family-hub-vision">','<section class="family-hub-section section-border">')
  .replace('<section class="family-story-callout section-border fh79-callout" id="family-client-stories">','<section class="family-story-callout section-border">')
  .replace(/<a class="btn family-btn fh79-stories-button"[\s\S]*?<\/a>/,'<a class="btn family-btn" href="stories.html">Explore Client Stories</a>');
 assert.equal(sha(Buffer.from(restored)),report.source_families_sha256);
 const b=Buffer.from(restored);
 assert.equal(crypto.createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${b.length}\0`),b])).digest('hex'),report.source_families_git_blob);
});
test('all four age-group cards and their wording are unchanged',()=>{
 const cards=[...html.matchAll(/<article class="fh78-stage [\s\S]*?<\/article>/g)].map(m=>sha(Buffer.from(m[0])));
 assert.deepEqual(cards,report.card_markup_sha256);
 assert.equal(cards.length,4);
});
test('header, approved hero, pillar cards, footer and final CTA remain identical',()=>{
 for(const [name,spec] of Object.entries(report.preserved_markup)){
  const match=html.match(new RegExp(spec.regex));assert.ok(match,name);
  assert.equal(sha(Buffer.from(match[0])),spec.sha256,name);
 }
});
test('assessment destinations and their existing attributes are unchanged',()=>{
 assert.deepEqual(html.match(/<a\b[^>]*href="consult.html"[^>]*>/g),report.assessment_destinations);
 assert.ok(html.includes('href="disclaimer.html"'));
});
test('real family story IDs are used; unverified mockup quote is absent',()=>{
 assert.ok(html.includes('data-fh79-video="9gDp42pU5S8"'));
 assert.ok(html.includes('data-fh79-video="OQdXdxuHjJU"'));
 assert.ok(html.includes('<figcaption>Illustrative image</figcaption>'));
 assert.doesNotMatch(html,/Johnson Family|helped our family create habits that stick/);
 assert.ok(html.indexOf('data-fh79-story') > html.indexOf('fh78-grandparents-title'));
 assert.ok(html.indexOf('data-fh79-story') < html.indexOf('id="family-hub-vision"'));
});
test('new CSS and JS do not select assessment or footer components',()=>{
 const css=read('css/family-health79.css').toString(),js=read('js/family-health79.js').toString();
 assert.doesNotMatch(css,/\.vitality|\.results-disclaimer|\.legal-|\.footer-|\.site-footer|\.header-cta|\.btn-primary/);
 assert.doesNotMatch(js,/localStorage|sessionStorage|setInterval\(|fetch\(|data-assessment/);
});
test('all packaged runtime files have the expected hashes',()=>{
 for(const [file,expected] of Object.entries(report.file_sha256))assert.equal(sha(read(file)),expected,file);
 assert.deepEqual(report.existing_files_changed,['families.html']);
 for(const file of report.protected_files_excluded)assert.ok(!Object.hasOwn(report.file_sha256,file),file);
});
test('shared resources are unchanged when checked in the installed site',()=>{
 for(const [file,expected] of Object.entries(report.untouched_resources)){
  if(fs.existsSync(path.join(root,file)))assert.equal(sha(read(file)),expected,file);
 }
});
test('saved browser checks show responsive fit and working controls',()=>{
 assert.equal(report.viewports.length,24);
 assert.ok(report.viewports.every(v=>v.pageWidth<=v.width+1&&v.issues.length===0&&v.ctaLines===1&&v.storySlides===1));
 assert.ok(Object.values(report.checks).every(Boolean));
 assert.equal(report.js_errors.length,0);
 assert.equal(report.published,false);
});
