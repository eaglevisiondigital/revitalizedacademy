// Compile real adult field/option IDs from unchanged questionnaire code in a no-network DOM.
const fs=require('node:fs'),crypto=require('node:crypto'),{JSDOM}=require('jsdom');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
function compile(){
 const html=fs.readFileSync('consult.html','utf8'),source=fs.readFileSync('js/vitality55.js','utf8');
 const dom=new JSDOM(html,{url:'https://synthetic.invalid/consult.html',runScripts:'outside-only'}),w=dom.window;
 try{w.CSS={escape:s=>String(s).replace(/[^a-zA-Z0-9_-]/g,c=>'\\'+c)};w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.fetch=()=>{throw Error('Source compilation must not make network requests');};w.eval(source);
 const form=w.document.querySelector('[data-assessment-form]');
 for(const screen of form.querySelectorAll('[data-symptom-screen]')){const boxes=[...screen.querySelectorAll('input[type=checkbox]')];for(const c of boxes)c.checked=c.value!=='None of these';boxes[0].dispatchEvent(new w.Event('input',{bubbles:true}));}
 const fields={};const symptoms=[];
 for(const c of form.querySelectorAll('[data-panel] [name]')){
 const panel=c.closest('[data-panel]'),section=panel.querySelector('h2')?.textContent.trim();
 if(!fields[c.name]){const q=c.closest('.vitality-question'),card=c.closest('[data-symptom-card]');const labelNode=(['radio','checkbox'].includes(c.type)?q?.querySelector('legend'):null)||c.labels?.[0]||q?.querySelector('.vitality-question-label');const labelCopy=labelNode?.cloneNode(true);labelCopy?.querySelectorAll('input,select,textarea,.vitality-required').forEach(x=>x.remove());const label=labelCopy?.textContent||c.name;
 fields[c.name]={id:c.name,section,kind:c.type,required:c.required,label:label.replace(/\s+/g,' ').trim(),options:[],conditions:[...function*(el){while(el&&el!==form){if(el.dataset?.showWhen)yield el.dataset.showWhen;el=el.parentElement;}}(c)],dynamic:!!card};}
 const values=c.tagName==='SELECT'?[...c.options].filter(x=>x.value!=='').map(x=>x.value):['radio','checkbox'].includes(c.type)?[c.value]:[];
 fields[c.name].options=[...new Set([...fields[c.name].options,...values])];
 }
 for(const screen of form.querySelectorAll('[data-symptom-screen]'))for(const c of screen.querySelectorAll(':scope > .vitality-options input'))if(c.value!=='None of these'&&c.value!=='Other'){
 const slug=c.value.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');const prefix=screen.dataset.symptomScreen;const base=prefix+'_'+slug;
 symptoms.push({id:base,label:c.value,screenId:prefix+'_symptoms',section:screen.closest('[data-panel]').querySelector('h2').textContent.trim(),frequency:base+'_frequency',disruption:base+'_disruption',duration:base+'_duration',ownership:'section_observation_only_pending_primary_owner_approval'});
 }
 return{schemaVersion:1,questionnaireVersion:'secure-snapshot-v1',sourceFiles:{'consult.html':hash(html),'js/vitality55.js':hash(source)},fieldCount:Object.keys(fields).length,symptomCount:symptoms.length,fields,symptoms};
 }finally{dom.window.close();}
}
if(require.main===module){const value=compile(),json=JSON.stringify(value,null,2)+'\n',path='config/roadmap-b2/source-map.json';const browserSource=`/* Generated metadata only; no participant responses. */\nwindow.RVA_ROADMAP_B2_SOURCE_MAP=${JSON.stringify(value)};\n`;if(process.argv.includes('--check')){if(fs.readFileSync(path,'utf8')!==json||fs.readFileSync('js/vitality-roadmap-b2-source-map.js','utf8')!==browserSource)throw Error('Source map drift; regenerate and review');}else{fs.writeFileSync(path,json);fs.writeFileSync('js/vitality-roadmap-b2-source-map.js',browserSource);}console.log(JSON.stringify({fieldCount:value.fieldCount,symptomCount:value.symptomCount,drift:false}));}
module.exports={compile};
