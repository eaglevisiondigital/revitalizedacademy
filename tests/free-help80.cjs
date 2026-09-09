// Build 80 Free Help integrity. Run: node --test tests/free-help80.cjs
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {resolve}=require('node:path');
const {createHash}=require('node:crypto');
const root=resolve(__dirname,'..');
const html=readFileSync(resolve(root,'free-help.html'),'utf8');
const js=readFileSync(resolve(root,'js/free-help80.js'),'utf8');
const css=readFileSync(resolve(root,'css/free-help80.css'),'utf8');
const expectedVideos=["2uCdM0w3Guk", "42qY6TLi8lM", "9YGA1pigUsA", "An8Vf3t63XI", "qYc4rgpV3dw", "rX8QeXgyiCg", "yRYRxfbK5X8"];
const expectedArticles=["https://www.revitalizedacademy.com/post/12-easy-to-follow-tips-for-powerful-oral-health", "https://www.revitalizedacademy.com/post/3-steps-to-better-gut-health-your-core-for-longevity", "https://www.revitalizedacademy.com/post/5-major-harmful-influences-on-neurological-health-and-what-you-can-do-about-them"];
const expectedFooterHash='3ca6399c79147298b726e73c73872a770c5fb72c928efb669a1a6bc2de4a0b11';

test('seven original videos remain available',()=>{assert.deepEqual([...html.matchAll(/data-youtube-id="([^"]+)"/g)].map(m=>m[1]).sort(),expectedVideos)});
test('three original article destinations remain available',()=>{for(const u of expectedArticles)assert.ok(html.includes(`href="${u}"`))});
test('existing footer and disclaimer are unchanged',()=>{const footer=html.match(/<footer class="site-footer">[\s\S]*?<\/footer>/)[0];assert.equal(createHash('sha256').update(footer).digest('hex'),expectedFooterHash)});
test('assessment buttons still point to the protected consult route',()=>{const links=[...html.matchAll(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].filter(m=>/Vitality Assessment/i.test(m[2]));assert.equal(links.length,2);for(const m of links)assert.equal(m[1],'consult.html')});
test('newsletter remains the original public Netlify form',()=>{assert.match(html,/name="revitalized-report"/);assert.match(html,/data-netlify="true"/);assert.match(html,/name="form-name" value="revitalized-report"/);for(const n of ['first_name','email','bot-field'])assert.ok(html.includes(`name="${n}"`))});
test('new assets and stylesheet exist',()=>{for(const p of ['css/free-help80.css','js/free-help80.js','assets/images/free-help80/emerald-botanical.webp','assets/images/free-help80/cream-library.webp'])assert.ok(existsSync(resolve(root,p)),p)});
test('no assessment or legal CSS selectors added',()=>{for(const s of ['.vitality-page','.vitality-card','.results-disclaimer','.legal-page','.footer-bottom'])assert.equal(css.includes(s),false)});
test('page script does not write assessment data or local storage',()=>{for(const s of ['vitality-lead','vitality-assessment','localStorage','sessionStorage','document.write'])assert.equal(js.includes(s),false)});
test('single main and h1; original watch/read anchor IDs retained',()=>{assert.equal((html.match(/<main\b/g)||[]).length,1);assert.equal((html.match(/<h1\b/g)||[]).length,1);for(const id of ['watch','read','podcast'])assert.ok(html.includes(`id="${id}"`))});
