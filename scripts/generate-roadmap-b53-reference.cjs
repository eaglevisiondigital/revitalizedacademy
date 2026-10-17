// Public display projection: fictional measurements + public question wording, never participant data.
const fs=require('node:fs'),crypto=require('node:crypto');
const C=require('../js/vitality-roadmap-b5-contract.js'),cases=require('../js/vitality-roadmap-b5-cases.cjs');
const base=require('../js/vitality-roadmap-b2-engine.js');
const registry=require('../config/roadmap-b4/source-map.json');
const files=['js/vitality-roadmap-b5-cases.cjs','js/vitality-roadmap-b5-contract.js','js/vitality-roadmap-b21-engine.js','js/vitality-roadmap-b2-engine.js','config/roadmap-b4/source-map.json'];
const hashes=Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]));
const data={version:'b53-readable-fictional-reference-v1',pins:C.pins,hashes,cases:cases.map(c=>({id:c.id,label:c.label,explanation:c.explanation||'Fictional engineering case; no participant or questionnaire responses supplied.',input:c.input,findingCalculations:(c.input.findings||[]).map(f=>base.symptom(f))})),drivers:Object.fromEntries(Object.entries(C.crosswalk(registry)).map(([key,d])=>[key,{...d,fields:d.fields.map(f=>({...f,options:registry.fields[f.id].options||[],kind:registry.fields[f.id].kind}))}]))};
const output='/* Generated public fictional reference. Run scripts/generate-roadmap-b53-reference.cjs; no real answers. */\n(function(root){const data='+JSON.stringify(data)+';if(typeof module===\'object\'&&module.exports)module.exports=data;else root.RVA_B53_REFERENCE=data;})(typeof window===\'object\'?window:globalThis);\n';
const target='portal/portal-roadmap-scoring-lab-reference.js';
if(process.argv.includes('--check')){if(fs.readFileSync(target,'utf8')!==output)throw Error('B5.3 display reference is stale');}else fs.writeFileSync(target,output);
console.log(`B5.3 reference: ${data.cases.length} fictional cases; ${Object.keys(data.drivers).length} Driver contexts; ${Object.values(data.drivers).reduce((n,d)=>n+d.fields.length,0)} public question contexts`);
