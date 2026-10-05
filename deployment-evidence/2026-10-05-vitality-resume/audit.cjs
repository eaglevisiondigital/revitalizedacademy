// Read-only, synthetic exact-built audit. No network or hosted records.
// This diagnoses missing capability; passing this audit does NOT mean resume works.
const {JSDOM}=require('jsdom');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function page(){
  const dom=new JSDOM(fs.readFileSync(path.join(root,'dist/consult.html'),'utf8'),{url:'https://assessment.invalid/consult.html',runScripts:'outside-only'});
  const w=dom.window, d=w.document, requests=[];
  w.scrollTo=()=>{}; w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.RVA_ENV={edgeBaseUrl:'https://edge.invalid',supabaseKey:'synthetic-public-key'};
  w.CSS={escape:v=>String(v).replace(/[^a-zA-Z0-9_-]/g,c=>'\\'+c)};
  w.fetch=async(url,options)=>{requests.push({url:String(url),body:options.body});return {ok:true,status:200,json:async()=>({ok:true})};};
  for(const file of ['vitality-child.js','vitality55.js','revitalized-data.js'])w.eval(fs.readFileSync(path.join(root,'dist/js',file),'utf8'));
  const change=(control,value)=>{if(['radio','checkbox'].includes(control.type))control.checked=value;else control.value=value;control.dispatchEvent(new w.Event('input',{bubbles:true}));control.dispatchEvent(new w.Event('change',{bubbles:true}));};
  const start=async()=>{const form=d.querySelector('[data-vitality-lead-form]');for(const [key,value]of Object.entries({first_name:'Synthetic',last_name:'ResumeAudit',email:'resume-audit@example.invalid',phone:'0000000000'}))change(form.elements.namedItem(key),value);form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await sleep(20);};
  return {dom,w,d,requests,change,start};
}
(async()=>{
  const first=page(); await first.start();
  const form=first.d.querySelector('[data-assessment-form]');
  first.change(form.querySelector('[name="assessment_for"][value="Myself"]'),true);
  first.change(form.querySelector('[name="assessment_consent"]'),true);
  first.change(form.querySelector('[name="disclaimer_acknowledgment"]'),true);
  first.change(form.querySelector('[name="additional_context"]'),'Synthetic unfinished answer');
  first.d.querySelector('[data-next]').click(); await sleep(450);
  const section=Number(first.d.querySelector('[data-panel]:not([hidden])').dataset.panel);
  assert.equal(section,1);
  const progress=first.requests.filter(r=>r.url.includes('public-intake')).map(r=>JSON.parse(r.body));
  assert(progress.some(p=>p.type==='vitality_progress'));
  assert(progress.every(p=>!Object.hasOwn(p,'answers')));
  assert.equal(first.requests.filter(r=>r.url==='/').length,1);
  const local=Object.fromEntries(Object.keys(first.w.localStorage).map(k=>[k,first.w.localStorage.getItem(k)]));
  const session=Object.fromEntries(Object.keys(first.w.sessionStorage).map(k=>[k,first.w.sessionStorage.getItem(k)]));
  first.dom.window.close();
  const second=page();
  for(const[k,v]of Object.entries(local))second.w.localStorage.setItem(k,v);
  for(const[k,v]of Object.entries(session))second.w.sessionStorage.setItem(k,v);
  await sleep(450);
  assert.equal(second.d.querySelector('[data-assessment-step]').hidden,true);
  assert.equal(second.d.querySelector('[name="additional_context"]').value,'');
  assert.equal(second.requests.some(r=>/resume|restore/.test(r.url)),false);
  await second.start();
  assert.equal(Number(second.d.querySelector('[data-panel]:not([hidden])').dataset.panel),0);
  const result={audit:'exact-built mocked-network reload',leadPostsAcrossRestart:2,sectionBeforeClose:section,sectionAfterRestart:0,answerRestored:false,partialAnswerRequest:false,progressMetadataObserved:true,serverResumeRequest:false,hostedWrites:0,readiness:'VITALITY RESUME NOT READY'};
  second.dom.window.close();
  console.log(JSON.stringify(result,null,2));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
