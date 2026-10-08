const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),sleep=ms=>new Promise(r=>setTimeout(r,ms));
function server(){return {snapshot:{version:1,fields:{},section:0,section_label:'Introduction',percent:0,pathway:'Adult'},identity:null,revision:0,status:'draft',requests:[],leads:[],fail:false,delay:0,finals:0,mailConsumed:false};}
async function page(s,mode='mail'){
 const d=new JSDOM(fs.readFileSync(path.join(root,'consult.html'),'utf8'),{url:'https://assessment.invalid/consult.html',runScripts:'outside-only'}),w=d.window,doc=w.document;
 w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.CSS={escape:v=>String(v).replace(/[^a-zA-Z0-9_-]/g,c=>'\\'+c)};
 w.RVA_ENV={edgeBaseUrl:'https://edge.invalid',supabaseKey:'public-test'};
 const identity=s.identity||(s.identity={first_name:'Synthetic',last_name:'Participant',email:'test@example.invalid',phone:'0000000000',referral_source:'Google Search',sales_rep_name:'',referral_source_other:''});
 if(mode==='mail')w.RVA_RESUME_LINK='a'.repeat(64);if(mode==='session')w.sessionStorage.setItem('rva_vitality_session_v1','b'.repeat(64));
 w.fetch=async(url,opt)=>{
  if(url==='/'){s.leads.push(Object.fromEntries(new URLSearchParams(opt.body)));s.requests.push({action:'lead'});return {ok:true,status:200};}
  const body=JSON.parse(opt.body);s.requests.push(body);if(s.delay)await sleep(s.delay);
  if(body.action==='start')for(const name of ['first_name','last_name','email','phone','referral_source','sales_rep_name','referral_source_other'])identity[name]=body[name]||'';
  if(body.action==='recover'&&s.recoveryFail)return {ok:false,status:503,json:async()=>({error:'Please try again.'})};
  let data={status:s.status,draft_id:'synthetic-draft',identity,snapshot:structuredClone(s.snapshot),revision:s.revision};
  if(body.action==='start'||body.action==='recover')data={ok:true,message:s.recoveryMessage||'If an unfinished assessment is available, we’ll email a secure link.'};
  if(body.action==='redeem'){
   if(s.mailConsumed)return {ok:false,status:401,json:async()=>({error:'This link is unavailable. Request another email link.'})};
   s.mailConsumed=true;data.token='b'.repeat(64);
  }
  if(body.action==='save'){
   if(s.fail)return {ok:false,json:async()=>({error:'We couldn’t save your latest changes. Please try again.'})};
   if(body.revision!==s.revision)return {ok:false,json:async()=>({error:'Revision conflict'})};
   s.snapshot=structuredClone(body.snapshot);s.revision++;data={...data,snapshot:s.snapshot,revision:s.revision};
  }
  if(body.action==='finalize'){if(s.status!=='completed')s.finals++;s.status='completed';data={status:'completed'};}
  return {ok:true,status:200,json:async()=>data};
 };
 for(const file of ['vitality-child.js','vitality55.js','vitality-resume.js'])w.eval(fs.readFileSync(path.join(root,'js',file),'utf8'));
 await sleep(5);
 const form=doc.querySelector('[data-assessment-form]');
 function set(name,value,choice){const list=Array.from(form.querySelectorAll(`[name="${name}"]`));const c=choice?list.find(c=>c.value===choice):list[0];assert(c,name);if(['checkbox','radio'].includes(c.type))c.checked=Boolean(value);else c.value=value;c.dispatchEvent(new w.Event('input',{bubbles:true}));c.dispatchEvent(new w.Event('change',{bubbles:true}));return c;}
 return {d,w,doc,form,set,flush:()=>w.RVA_RESUME.flush(),close:()=>d.window.close()};
}
test('first contact capture remains independent and health entry waits for verified email',async()=>{const s=server(),p=await page(s,'none');const lead=p.doc.querySelector('[data-vitality-lead-form]');for(const[k,v]of Object.entries({first_name:'Synthetic',last_name:'Lead',email:'test@example.invalid',phone:'0000000000',referral_source:'Google Search'}))lead.elements[k].value=v;lead.dispatchEvent(new p.w.Event('submit',{bubbles:true,cancelable:true}));await sleep(5);assert.deepEqual(s.requests.map(r=>r.action),['start']);assert.equal(s.requests[0].referral_source,'Google Search');assert.equal(s.leads.length,0);assert.equal(p.doc.querySelector('[data-assessment-step]').hidden,true);assert.match(p.doc.querySelector('[data-start-confirmation]').textContent,/Check Your Email/);p.close();});
test('referral source is required and exposes only the selected conditional detail',async()=>{
 const s=server(),p=await page(s,'none');p.doc.querySelector('[data-start-new]').click();const lead=p.doc.querySelector('[data-vitality-lead-form]'),source=lead.elements.referral_source;
 assert.equal(source.required,true);assert.equal(source.value,'');assert.deepEqual(Array.from(source.options).map(o=>o.textContent),['Select one','Facebook','Instagram','Google Search','YouTube','LinkedIn','TikTok','Friend / Family','Existing Client','Event / Webinar','Church / Community','Podcast','Email','Sales Rep','Other']);
 source.value='Sales Rep';source.dispatchEvent(new p.w.Event('change',{bubbles:true}));assert.equal(lead.elements.sales_rep_name.required,true);assert.equal(lead.elements.sales_rep_name.disabled,false);assert.equal(lead.elements.referral_source_other.disabled,true);
 lead.elements.sales_rep_name.value='Synthetic Rep';source.value='Other';source.dispatchEvent(new p.w.Event('change',{bubbles:true}));assert.equal(lead.elements.sales_rep_name.value,'');assert.equal(lead.elements.sales_rep_name.required,false);assert.equal(lead.elements.sales_rep_name.disabled,true);assert.equal(lead.elements.referral_source_other.required,true);
 lead.elements.referral_source_other.value='Synthetic source';source.value='Facebook';source.dispatchEvent(new p.w.Event('change',{bubbles:true}));assert.equal(lead.elements.referral_source_other.value,'');assert.equal(lead.elements.referral_source_other.disabled,true);p.close();
});
test('Sales Rep referral is included in the initial secure payload and restored identity',async()=>{
 const s=server(),p=await page(s,'none'),lead=p.doc.querySelector('[data-vitality-lead-form]');for(const[k,v]of Object.entries({first_name:'Synthetic',last_name:'Lead',email:'test@example.invalid',phone:'0000000000',referral_source:'Sales Rep'}))lead.elements[k].value=v;lead.elements.referral_source.dispatchEvent(new p.w.Event('change',{bubbles:true}));lead.elements.sales_rep_name.value='Synthetic Rep';lead.dispatchEvent(new p.w.Event('submit',{bubbles:true,cancelable:true}));await sleep(5);assert.equal(s.requests[0].sales_rep_name,'Synthetic Rep');assert.equal(s.requests[0].referral_source_other,'');assert.equal(s.leads.length,0);p.close();
 s.mailConsumed=false;const restored=await page(s,'mail');assert.equal(restored.form.elements.referral_source.value,'Sales Rep');assert.equal(restored.form.elements.sales_rep_name.value,'Synthetic Rep');restored.close();
});
test('no raw answers are written to browser storage',async()=>{const p=await page(server());p.set('additional_context','Synthetic private context');await p.flush();assert.equal(p.w.localStorage.length,0);assert.equal(p.w.sessionStorage.length,1);assert.equal(p.w.sessionStorage.getItem('rva_vitality_session_v1'),'b'.repeat(64));p.close();});
test('closing a tab loses its credential; plain new tab needs fresh email recovery without resetting the server draft',async()=>{
 const s=server(),original=await page(s);
 original.set('assessment_for',true,'Myself');original.set('assessment_consent',true);original.set('disclaimer_acknowledgment',true);
 original.doc.querySelector('[data-next]').click();await sleep(10);
 original.set('additional_context','Synthetic answer survives a closed tab');original.set('primary_goals',true,'Energy');await original.flush();
 const before={snapshot:structuredClone(s.snapshot),revision:s.revision,status:s.status},requestCount=s.requests.length;original.close();
 const blank=await page(s,'none');
 assert.equal(blank.w.sessionStorage.length,0);assert.equal(blank.w.localStorage.length,0);
 assert.equal(blank.w.RVA_RESUME.canEdit(),false);assert.equal(blank.doc.querySelector('[data-assessment-step]').hidden,true);
 assert.equal(s.requests.length,requestCount);assert.deepEqual({snapshot:s.snapshot,revision:s.revision,status:s.status},before);
 const recovery=blank.doc.querySelector('[data-resume-request]');recovery.elements.resume_email.value='test@example.invalid';
 recovery.dispatchEvent(new blank.w.Event('submit',{bubbles:true,cancelable:true}));await sleep(5);
 assert.deepEqual(s.requests.slice(requestCount).map(r=>r.action),['recover']);
 assert.deepEqual({snapshot:s.snapshot,revision:s.revision,status:s.status},before);blank.close();
 // Model receipt of a newly issued mail credential, not replay of the consumed original.
 s.mailConsumed=false;const restored=await page(s,'mail');
 assert.equal(restored.w.RVA_RESUME.canEdit(),true);assert.equal(restored.form.elements.additional_context.value,'Synthetic answer survives a closed tab');
 assert.equal(Array.from(restored.form.querySelectorAll('[name="primary_goals"]')).find(c=>c.value==='Energy').checked,true);
 assert.equal(restored.w.RVA_VITALITY.section(),before.snapshot.section);assert.equal(restored.doc.querySelector('[data-progress-percent]').textContent,before.snapshot.percent+'%');
 assert.equal(s.revision,before.revision);assert.deepEqual(s.requests.slice(requestCount).map(r=>r.action),['recover','redeem']);restored.close();
});
test('a second email-link open fails closed without replacing the draft or invalidating its original session',async()=>{
 const s=server(),first=await page(s);first.set('additional_context','Synthetic saved answer');await first.flush();
 const before={snapshot:structuredClone(s.snapshot),revision:s.revision,status:s.status};
 const second=await page(s);
 assert.equal(second.w.RVA_RESUME.canEdit(),false);
 assert.equal(second.doc.querySelector('[data-assessment-step]').hidden,true);
 assert.match(second.doc.querySelector('[data-resume-status]').textContent,/This link is unavailable/);
 assert.equal(second.w.sessionStorage.length,0);
 assert.deepEqual({snapshot:s.snapshot,revision:s.revision,status:s.status},before);
 assert.equal(s.requests.filter(r=>['lead','start','recover','finalize'].includes(r.action)).length,0);
 assert.equal(first.w.RVA_RESUME.canEdit(),true);
 second.close();first.close();
 const restored=await page(s,'session');
 assert.equal(restored.w.RVA_RESUME.canEdit(),true);
 assert.equal(restored.form.elements.additional_context.value,'Synthetic saved answer');
 assert.equal(restored.doc.querySelector('[data-resume-status]').textContent,'Saved');
 assert.deepEqual(s.requests.map(r=>r.action),['redeem','save','redeem','read']);restored.close();
});
test('debounce coalesces repeated text input and only acknowledges a server save',async()=>{const s=server(),p=await page(s);p.set('additional_context','S');p.set('additional_context','Synthetic');assert.match(p.doc.querySelector('[data-resume-status]').textContent,/Saving/);assert.equal(s.requests.filter(r=>r.action==='save').length,0);await sleep(750);assert.equal(s.requests.filter(r=>r.action==='save').length,1);assert.equal(p.doc.querySelector('[data-resume-status]').textContent,'Saved');p.close();});
for(const [label,name,value,choice]of [['radio','assessment_for',true,'Myself'],['checkbox','primary_goals',true,'Energy'],['text','additional_context','Synthetic text'],['range-zero','overall_quality_of_life','0']])test(label+' restores after a new document using server state',async()=>{const s=server(),a=await page(s);const control=a.set(name,value,choice);const expected=control.type==='checkbox'||control.type==='radio'?control.checked:control.value;await a.flush();a.close();const b=await page(s,'session');const c=choice?Array.from(b.form.querySelectorAll(`[name="${name}"]`)).find(c=>c.value===choice):b.form.elements[name];assert.equal(['checkbox','radio'].includes(c.type)?c.checked:c.value,expected);b.close();});
test('numeric zero remains numeric and blank numeric remains blank',async()=>{const s=server(),p=await page(s);p.set('assessment_for',true,'My child');p.set('assessed_age','0');await p.flush();assert.equal(s.snapshot.fields.assessed_age[0].value,0);p.set('assessed_age','');await p.flush();assert.equal(s.snapshot.fields.assessed_age[0].value,'');p.close();});
test('child pathway, guardian permission and conditional proxy details restore',async()=>{const s=server(),p=await page(s);p.set('assessment_for',true,'My child');p.set('assessed_first_name','Synthetic');p.set('assessed_last_name','Child');p.set('assessed_age','8');p.set('assessment_authorization',true);await p.flush();assert.equal(s.snapshot.pathway,'Child (ages 0–18)');p.close();const b=await page(s,'session');assert.equal(b.form.elements.assessment_pathway.value,'Child (ages 0–18)');assert.equal(b.form.elements.assessment_authorization.checked,true);assert.equal(b.form.elements.assessed_first_name.value,'Synthetic');b.close();});
test('adult proxy and permission restore without requiring paid membership',async()=>{const s=server(),a=await page(s);a.set('assessment_for',true,'Someone else');a.set('assessed_age','45');a.set('assessed_first_name','Synthetic');a.set('assessed_last_name','Adult');a.set('assessed_relationship','Sibling');a.set('assessment_authorization',true);await a.flush();a.close();const b=await page(s,'session');assert.equal(b.form.elements.assessed_relationship.value,'Sibling');assert.equal(b.form.elements.assessment_authorization.checked,true);assert.equal(b.form.elements.assessment_pathway.value,'Adult');b.close();});
test('dynamic symptom detail restores after its controlling checkbox creates the fields',async()=>{const s=server(),a=await page(s);a.set('assessment_for',true,'Myself');const screen=a.form.querySelector('[data-symptom-screen]'),box=Array.from(screen.querySelectorAll('input[type=checkbox]')).find(c=>c.value!=='None of these');a.set(box.name,true,box.value);const detail=screen.querySelector('[data-symptom-details] select');a.set(detail.name,detail.options[1].value);const name=detail.name,value=detail.value;await a.flush();a.close();const b=await page(s,'session');assert.equal(b.form.elements[name].value,value);b.close();});
test('section and progress restore with a retained session credential after document reload',async()=>{const s=server(),a=await page(s);a.set('assessment_for',true,'Myself');a.set('assessment_consent',true);a.set('disclaimer_acknowledgment',true);a.doc.querySelector('[data-next]').click();await sleep(10);await a.flush();assert.equal(s.snapshot.section,1);assert(s.snapshot.percent>0);a.close();const b=await page(s,'session');assert.equal(b.w.RVA_VITALITY.section(),1);assert.equal(b.doc.querySelector('[data-progress-percent]').textContent,s.snapshot.percent+'%');b.close();});
test('failed autosave retains current answers and Retry succeeds without false Saved',async()=>{const s=server(),a=await page(s);s.fail=true;a.set('additional_context','Keep this synthetic answer');assert.equal(await a.flush(),false);assert.match(a.doc.querySelector('[data-resume-status]').textContent,/couldn’t save/);assert.equal(a.form.elements.additional_context.value,'Keep this synthetic answer');s.fail=false;assert.equal(await a.flush(),true);assert.equal(a.doc.querySelector('[data-resume-status]').textContent,'Saved');a.close();});
test('edits during an outstanding save are serialized and latest content is persisted',async()=>{const s=server(),a=await page(s);s.delay=30;a.set('additional_context','First');const pending=a.flush();a.set('additional_context','Second');await pending;assert.equal(s.snapshot.fields.additional_context[0].value,'Second');assert.equal(s.revision,2);a.close();});
test('continue later flushes before sending recovery request',async()=>{const s=server(),a=await page(s);a.set('additional_context','Later');a.doc.querySelector('[data-continue-later]').click();await sleep(15);assert.deepEqual(s.requests.slice(-2).map(r=>r.action),['save','recover']);a.close();});
test('email-only recovery never restores answers directly',async()=>{const s=server(),a=await page(s,'none');const f=a.doc.querySelector('[data-resume-request]');f.elements.resume_email.value='test@example.invalid';f.dispatchEvent(new a.w.Event('submit',{bubbles:true,cancelable:true}));await sleep(5);assert.equal(a.doc.querySelector('[data-assessment-step]').hidden,true);assert.equal(s.requests[0].action,'recover');a.close();});
test('required fields still block section navigation after resume',async()=>{const a=await page(server());a.doc.querySelector('[data-next]').click();await sleep(5);assert.equal(a.w.RVA_VITALITY.section(),0);assert.equal(a.doc.querySelector('[data-assessment-error]').classList.contains('show'),true);a.close();});
test('completed state cannot reopen editable fields and shows 100 percent',async()=>{const s=server();s.status='completed';const a=await page(s,'session');assert.equal(a.doc.querySelector('[data-assessment-step]').hidden,true);assert.equal(a.doc.querySelector('[data-complete-step]').hidden,false);assert.equal(a.doc.querySelector('[data-progress-percent]').textContent,'100%');assert.equal(a.w.RVA_RESUME.canEdit(),false);a.close();});
test('final submission is routed through the secure contract and locks the form',async()=>{const s=server(),a=await page(s);await a.w.RVA_RESUME.finalize('form-name=vitality-assessment&email=test%40example.invalid&assessment_summary=Synthetic');assert.equal(s.finals,1);assert.equal(a.w.RVA_RESUME.canEdit(),false);assert.equal(a.doc.querySelector('[data-complete-step]').hidden,false);a.close();});
test('normal final submission after server restoration retains coach summary and completes once',async()=>{
 const s=server();let p=await page(s);
 p.set('assessment_for',true,'Myself');p.set('assessment_consent',true);p.set('disclaimer_acknowledgment',true);
 p.doc.querySelector('[data-next]').click();await sleep(15);await p.flush();p.close();p=await page(s,'session');
 for(let step=0;step<35&&p.doc.querySelector('[data-complete-step]').hidden;step++){
  const panel=p.form.querySelector('[data-panel]:not([hidden])');assert(panel);
  const active=c=>!c.disabled&&!c.closest('[hidden]');
  for(const name of ['reproductive_screen_path','hormone_pathway']){const c=Array.from(panel.querySelectorAll(`[name="${name}"]`)).find(c=>c.tagName==='SELECT'||c.value==='Male');if(c&&active(c))p.set(name,c.type==='radio'?true:'Male',c.type==='radio'?'Male':undefined);}
  for(const screen of panel.querySelectorAll('[data-symptom-screen]')){if(!active(screen))continue;const c=Array.from(screen.querySelectorAll('input')).find(c=>c.value==='None of these');if(c)p.set(c.name,true,c.value);}
  const goals=panel.querySelector('[name="primary_goals"]');if(goals&&active(goals))p.set(goals.name,true,goals.value);
  for(const c of panel.querySelectorAll('[required]')){if(!active(c)||c.checkValidity())continue;p.set(c.name,['checkbox','radio'].includes(c.type)?true:c.tagName==='SELECT'?c.options[1].value:'Synthetic answer',['checkbox','radio'].includes(c.type)?c.value:undefined);}
  const before=p.w.RVA_VITALITY.section();p.doc.querySelector('[data-next]').click();await sleep(15);await p.flush();
  assert(p.w.RVA_VITALITY.section()!==before||!p.doc.querySelector('[data-complete-step]').hidden,p.doc.querySelector('[data-assessment-error]').textContent);
 }
 assert.equal(s.finals,1);const final=s.requests.find(r=>r.action==='finalize'),data=new URLSearchParams(final.form);assert.match(data.get('assessment_summary'),/Synthetic/);assert.equal(data.get('form-name'),'vitality-assessment');assert.equal(data.get('assessment_for'),'Myself');assert.equal(p.doc.querySelector('[data-progress-percent]').textContent,'100%');p.close();
});

test('entry offers Start and Resume without requests or creating an identity',async()=>{
 const s=server(),p=await page(s,'none');
 assert.equal(p.doc.querySelector('[data-assessment-entry]').hidden,false);
 assert.equal(p.doc.querySelector('[data-lead-step]').hidden,true);
 assert.equal(p.doc.querySelector('[data-recovery-panel]').hidden,true);
 assert.deepEqual(s.requests,[]);
 p.doc.querySelector('[data-start-new]').click();
 assert.equal(p.doc.querySelector('[data-lead-step]').hidden,false);
 assert.equal(p.doc.querySelector('[data-assessment-progress]').hidden,false);
 assert.equal(p.doc.activeElement,p.doc.querySelector('#lead-first'));
 assert.deepEqual(s.requests,[]);p.close();
});
test('Resume opens the one existing recovery form and switching preserves unsent contact fields',async()=>{
 const s=server(),p=await page(s,'none');p.doc.querySelector('[data-start-new]').click();
 p.doc.querySelector('#lead-first').value='Unsent synthetic';p.doc.querySelector('[data-open-resume]').click();
 assert.equal(p.doc.querySelector('[data-lead-step]').hidden,true);
 assert.equal(p.doc.querySelector('[data-recovery-panel]').hidden,false);
 assert.equal(p.doc.querySelector('[data-assessment-progress]').hidden,true);
 assert.equal(p.doc.activeElement,p.doc.querySelector('#resume-email'));
 assert.equal(p.doc.querySelector('[data-open-resume]').getAttribute('aria-expanded'),'true');
 assert.equal(p.doc.querySelectorAll('[data-resume-request]').length,1);
 p.doc.querySelector('[data-start-new]').click();
 assert.equal(p.doc.querySelector('#lead-first').value,'Unsent synthetic');assert.deepEqual(s.requests,[]);p.close();
});
test('invalid recovery email sends no request',async()=>{
 const s=server(),p=await page(s,'none');p.doc.querySelector('[data-open-resume]').click();
 const f=p.doc.querySelector('[data-resume-request]');f.elements.resume_email.value='invalid';
 f.dispatchEvent(new p.w.Event('submit',{bubbles:true,cancelable:true}));await sleep(5);
 assert.deepEqual(s.requests,[]);p.close();
});
test('recovery uses the existing endpoint with email only and a fixed neutral confirmation',async()=>{
 for(const email of ['test@example.invalid','unknown@example.invalid']){
  const s=server(),p=await page(s,'none');p.doc.querySelector('[data-open-resume]').click();
  const f=p.doc.querySelector('[data-resume-request]');f.elements.resume_email.value=email;
  f.dispatchEvent(new p.w.Event('submit',{bubbles:true,cancelable:true}));await sleep(5);
  assert.equal(s.requests.length,1);assert.equal(s.requests[0].action,'recover');assert.equal(s.requests[0].email,email);assert.match(s.requests[0].request_id,/^[a-f0-9-]{36}$/);
  assert.match(p.doc.querySelector('[data-recovery-confirmation]').textContent,/If there’s an unfinished assessment connected to that email/);assert.match(p.doc.querySelector('[data-recovery-confirmation]').textContent,/Use the most recent email/);
  assert.equal(p.doc.querySelector('[data-assessment-step]').hidden,true);
  assert.equal(p.w.sessionStorage.length,0);assert.equal(p.w.localStorage.length,0);p.close();
 }
});
test('duplicate recovery submission is suppressed while one request is pending',async()=>{
 const s=server(),p=await page(s,'none');s.delay=30;
 const f=p.doc.querySelector('[data-resume-request]');f.elements.resume_email.value='test@example.invalid';
 for(let i=0;i<2;i++)f.dispatchEvent(new p.w.Event('submit',{bubbles:true,cancelable:true}));
 assert.equal(f.querySelector('button').disabled,true);await sleep(45);
 assert.equal(s.requests.length,1);assert.equal(f.querySelector('button').disabled,true);p.close();
});
test('recovery transport failure keeps form retryable without a success confirmation',async()=>{
 const s=server(),p=await page(s,'none');s.recoveryFail=true;
 const f=p.doc.querySelector('[data-resume-request]');f.elements.resume_email.value='test@example.invalid';
 f.dispatchEvent(new p.w.Event('submit',{bubbles:true,cancelable:true}));await sleep(5);
 assert.equal(p.doc.querySelector('[data-recovery-confirmation]').hidden,true);
 assert.equal(f.querySelector('button').disabled,false);assert.match(p.doc.querySelector('[data-resume-status]').textContent,/try again/);
 s.recoveryFail=false;f.dispatchEvent(new p.w.Event('submit',{bubbles:true,cancelable:true}));await sleep(5);
 assert.equal(p.doc.querySelector('[data-recovery-confirmation]').hidden,false);p.close();
});
test('verified restoration hides entry/recovery choices and preserves the active assessment stage',async()=>{
 const p=await page(server());assert.equal(p.doc.querySelector('[data-assessment-entry]').hidden,true);
 assert.equal(p.doc.querySelector('[data-recovery-panel]').hidden,true);
 assert.equal(p.doc.querySelector('[data-assessment-progress]').hidden,false);
 assert.equal(p.doc.querySelector('[data-progress-contact]').textContent,'✓ Contact Saved');
 assert.equal(p.doc.querySelector('[data-progress-assessment]').classList.contains('active'),true);p.close();
});
test('completed reload marks all three stages complete, keeps 100%, and cannot expose entry controls',async()=>{
 const s=server();s.status='completed';const p=await page(s,'session');
 assert.deepEqual(['contact','assessment','complete'].map(stage=>p.doc.querySelector(`[data-progress-${stage}]`).textContent),['✓ Contact Saved','✓ Assessment Complete','✓ Complete']);
 assert.equal(p.doc.querySelector('[data-progress-contact]').classList.contains('active'),false);
 assert.equal(p.doc.querySelector('[data-progress-complete]').getAttribute('aria-current'),'step');
 assert.equal(p.doc.querySelectorAll('[data-assessment-progress] .future').length,0);
 assert.equal(p.doc.querySelector('[data-assessment-entry]').hidden,true);
 assert.equal(p.doc.querySelector('[data-recovery-panel]').hidden,true);
 assert.equal(p.doc.querySelector('[data-lead-step]').hidden,true);
 assert.equal(p.doc.querySelector('[data-assessment-step]').hidden,true);
 assert.equal(p.doc.querySelector('[data-complete-step]').hidden,false);
 assert.equal(p.doc.querySelector('[data-progress-percent]').textContent,'100%');
 assert.equal(p.form.querySelectorAll('input:not(:disabled),select:not(:disabled),textarea:not(:disabled),button:not(:disabled)').length,0);
 assert.deepEqual(s.requests.map(r=>r.action),['read']);p.close();
});

test('five rapid contact submits lock immediately, make one secure start and no browser Netlify posts',async()=>{
 const s=server(),p=await page(s,'none');p.doc.querySelector('[data-start-new]').click();const f=p.doc.querySelector('[data-vitality-lead-form]');for(const [k,v]of Object.entries(s.identity))if(f.elements[k])f.elements[k].value=v;s.delay=25;
 for(let i=0;i<5;i++)f.dispatchEvent(new p.w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(f.querySelector('button').disabled,true);assert.match(f.querySelector('button').textContent,/Saving your assessment/);await sleep(45);
 assert.equal(s.requests.length,1);assert.equal(s.requests[0].action,'start');assert.equal(s.leads.length,0);assert.equal(f.hidden,true);assert.equal(p.doc.querySelector('[data-start-confirmation]').hidden,false);assert.match(p.doc.querySelector('[data-start-confirmation]').textContent,/do not start a new assessment/);assert.match(p.doc.querySelector('[data-start-email-copy]').textContent,/t•••@example.invalid/);assert.equal(p.doc.activeElement,p.doc.querySelector('[data-start-confirmation]'));assert.equal(p.doc.querySelector('[data-start-resend]').disabled,true);
 for(let i=0;i<5;i++)f.dispatchEvent(new p.w.Event('submit',{bubbles:true,cancelable:true}));await sleep(5);assert.equal(s.requests.length,1);p.close();
});
test('pending opaque mail credential survives script-loading reload and clears after direct resume',async()=>{
 const s=server(),p=await page(s,'none');p.w.sessionStorage.setItem('rva_vitality_pending_link_v1','a'.repeat(64));p.w.eval(fs.readFileSync(path.join(root,'js/vitality-resume.js'),'utf8'));await sleep(5);assert.equal(p.doc.querySelector('[data-assessment-step]').hidden,false);assert.equal(s.requests.filter(r=>r.action==='redeem').length,1);assert.equal(s.requests.filter(r=>r.action==='recover').length,0);assert.equal(p.w.sessionStorage.getItem('rva_vitality_pending_link_v1'),null);p.close();
});
