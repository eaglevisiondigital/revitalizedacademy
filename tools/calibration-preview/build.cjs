'use strict';
// Static CommonJS bundle of the existing reviewed fixture/UI/engines. No build of Functions.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const here=__dirname,root=path.resolve(here,'../..'),src=root,out=path.join(here,'generated/preview');
fs.mkdirSync(out,{recursive:true});
const modules=[],seen=new Map(),sourceHashes={};
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
function add(file){
 file=path.resolve(file);if(seen.has(file))return seen.get(file);
 assert(file.startsWith(src+path.sep)||file===path.join(here,'entry.cjs'),'Source outside reviewed preview boundary');
 const id='m'+modules.length;seen.set(file,id);modules.push(null);let content=fs.readFileSync(file,'utf8');sourceHashes[path.relative(root,file)]=hash(content);
 if(file.endsWith('.json'))content='module.exports='+content+';';
 else content=content.replace(/require\((['"])([^'"]+)\1\)/g,(_,q,target)=>{assert(target.startsWith('.'),'External dependency prohibited: '+target);let dep=path.resolve(path.dirname(file),target);if(!path.extname(dep))dep+='.js';return 'require('+JSON.stringify(add(dep))+')';});
 modules[Number(id.slice(1))]=JSON.stringify(id)+':function(module,exports,require){\n'+content+'\n}';return id;
}
const entry=add(path.join(here,'entry.cjs'));
const bundle="(()=>{const modules={"+modules.join(',')+"},cache={};function load(id){if(cache[id])return cache[id].exports;const m=cache[id]={exports:{}};modules[id](m,m.exports,load);return m.exports;}load("+JSON.stringify(entry)+");})();";
assert(!/voalfpxiyznnqfcqcymd|bvooallokgfktssadsrv|supabaseKey|service_role|https:\/\//.test(bundle),'Environment or endpoint prohibited in offline bundle');
fs.writeFileSync(path.join(out,'demo.js'),bundle);
fs.copyFileSync(path.join(src,'portal/portal-roadmap-scoring-lab.css'),path.join(out,'lab.css'));
let html=fs.readFileSync(path.join(src,'tests/preview/b5.html'),'utf8').replace('/portal/portal-roadmap-scoring-lab.css','/lab.css').replace('B5 · Fictional Founder Scoring Lab · B5.3 Rehearsal','Founder Calibration · LOCAL SYNTHETIC ONLY').replace('<h1>Founder Scoring Lab · B5.3</h1>','<h1>Founder calibration · LOCAL SYNTHETIC ONLY</h1>').replace('</style>','.fictional-feedback{border:2px solid #936a20}.fictional-feedback form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}.fictional-feedback label:has(textarea){grid-column:1/-1}@media(max-width:800px){.fictional-feedback form{grid-template-columns:1fr}}@media print{body{display:none!important}}</style>');
fs.writeFileSync(path.join(out,'index.html'),html);
fs.writeFileSync(path.join(out,'_headers'),"/*\n  Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'none'; img-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'; object-src 'none'\n  Cache-Control: no-store\n  Referrer-Policy: no-referrer\n  X-Robots-Tag: noindex, nofollow, noarchive\n  X-Content-Type-Options: nosniff\n");
const files=Object.fromEntries(fs.readdirSync(out).map(name=>[name,hash(fs.readFileSync(path.join(out,name)))]));
fs.writeFileSync(path.join(here,'generated/manifest.json'),JSON.stringify({baseline:'a0e4692c5954ec21c1de7517ed706cf71b86a15c',synthetic_only:true,functions:0,network_connections:false,files,sourceHashes},null,2)+'\n');
console.log(JSON.stringify({preview:out,modules:modules.length,files:Object.keys(files),production_changes:0}));
