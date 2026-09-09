// Run from the repository root: node --test tests/webinar81-integrity.cjs
// Read-only checks; no networking, form submissions, or repository changes.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const {createHash}=require('node:crypto');
const root=resolve(__dirname,'..');
const html=readFileSync(resolve(root,'index.html'),'utf8');
const css=readFileSync(resolve(root,'css/webinar81.css'),'utf8');
const hash=s=>createHash('sha256').update(s).digest('hex');
const expected={
  "outsideWebinar": "bdd82ee69de13e2bee2ab3bb3ec01aec074bd02a7851198b31191ab2b65d4124",
  "footer": "3ca6399c79147298b726e73c73872a770c5fb72c928efb669a1a6bc2de4a0b11",
  "popup": "2bf84c4bdbe113fa3d13a483e361d66571016b6d60adb9a2b3ab251d10af8d78",
  "assessmentLinks": "eaaffd1c58164f5ec255d844aef2d108b877e32ee49f4267bc03eb4aa7543a68",
  "normalizedForm": "66dbb29a916dc5b675c5832749ad4cc039f72ec0bcbed7c7da215a628a9a853d",
  "benefits": "672376688f273dc9ffb6084176ba2d07c9814d5a3b469491e0a810e0bdde3b8e",
  "sharedCSS": "b2703c7cd8bf1201cbdf61fc1bce816a314a0720abff6aa0cea7930ff9e51dc9",
  "sharedJS": "21b15805e5cb735950a63d083019d26f568e199acca4262eef4af725f1ddcc78"
};
const section=html.match(/    <section class="webinar60[^"]*" id="founders-webinar">[\s\S]*?<\/section>/)?.[0];
test('only the webinar section and its new stylesheet include changed',()=>{
 assert.ok(section);
 const untouched=html.replace(section,'__WEBINAR_SECTION__').replace('  <link rel="stylesheet" href="css/webinar81.css?v=81">\n','');
 assert.equal(hash(untouched),expected.outsideWebinar);
});
test('existing footer and disclaimer link are unchanged',()=>{
 const footer=html.match(/<footer class="site-footer">[\s\S]*?<\/footer>/)?.[0];
 assert.equal(hash(footer),expected.footer);
});
test('assessment popup and script include are unchanged',()=>{
 const popup=html.match(/<div class="vitality-popup-backdrop">[\s\S]*?<script src="js\/vitality55.js[^"]*"><\/script>/)?.[0];
 assert.equal(hash(popup),expected.popup);
});
test('all assessment buttons preserve their destinations and markup',()=>{
 const links=html.match(/<a\b[^>]*href="(?:consult\.html|\/consult)"[^>]*>[\s\S]*?<\/a>/g)||[];
 assert.ok(links.length>0);
 assert.equal(hash(links.join('\n')),expected.assessmentLinks);
});
test('shared stylesheet, including disclaimer rules, is unchanged',()=>{
 assert.equal(hash(readFileSync(resolve(root,'css/styles.css'))),expected.sharedCSS);
});
test('shared JavaScript is unchanged',()=>{
 assert.equal(hash(readFileSync(resolve(root,'js/app.js'))),expected.sharedJS);
});
test('webinar form fields, validation and Netlify configuration are preserved',()=>{
 const form=section.match(/<form class="webinar60-notify"[\s\S]*?<\/form>/)?.[0];
 assert.equal(hash(form.replace('GET NOTIFIED WHEN<br>REGISTRATION OPENS','GET NOTIFIED WHEN REGISTRATION OPENS')),expected.normalizedForm);
 assert.equal((html.match(/name="founders-webinar-notify"/g)||[]).length,1);
 assert.equal((html.match(/id="webinar-email"/g)||[]).length,1);
});
test('the three existing benefits retain their original wording and icons',()=>{
 const benefits=section.match(/<div class="webinar60-benefits"[\s\S]*?\n          <\/div>/)?.[0];
 assert.equal(hash(benefits),expected.benefits);
});
test('benefits and signup are both in the new conversion row',()=>{
 const start=section.indexOf('<div class="webinar81-conversion">');
 const end=section.indexOf('<div class="webinar60-footer">');
 assert.ok(start>section.indexOf('<div class="webinar60-device"'));
 for(const token of ['class="webinar60-benefits"','class="webinar60-notify"']){
   assert.ok(section.indexOf(token)>start && section.indexOf(token)<end);
 }
 assert.equal((html.match(/id="founders-webinar"/g)||[]).length,1);
});
test('new layout styles are scoped only to this webinar',()=>{
 // Strip comments, then ensure every ordinary selector block starts with this exact section.
 const noComments=css.replace(/\/\*[\s\S]*?\*\//g,'');
 const selectorBlocks=[...noComments.matchAll(/(?:^|[{}])\s*([^{}]+)\{/g)].map(x=>x[1].trim());
 for(const selector of selectorBlocks){
   if(selector.startsWith('@media')) continue;
   assert.ok(selector.startsWith('#founders-webinar.webinar81'),selector);
 }
 assert.doesNotMatch(noComments,/\.vitality|\.results-disclaimer|\.site-header|\.site-footer/);
});
