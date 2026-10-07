const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const {JSDOM}=require('jsdom');
const root=process.env.RVA_BETA_ASSET_ROOT||'.';const html=fs.readFileSync(root+'/portal/index.html','utf8');const source=fs.readFileSync(root+'/portal/portal-staff-access.js','utf8');
function runtime(t,environment='staging',role='owner'){
 const form=html.match(/<form id="beta-recipient-form"[\s\S]*?<\/form>/)[0];const dom=new JSDOM(form,{runScripts:'outside-only'});t.after(()=>dom.window.close());const w=dom.window,calls=[],opened=[];let uid='first-owner',resolve;
 w.RVA_PUBLIC_CONFIG={environment};w.portal={currentStaffRole:()=>role,currentUserId:()=>uid,openContact:async id=>opened.push(id)};w.client={rpc:(name,args)=>{calls.push({name,args});return new Promise(r=>resolve=r);}};w.el=id=>w.document.getElementById(id);w.setStatus=(id,text)=>w.el(id).textContent=text;
 const block=source.slice(source.indexOf('  const betaRecipientForm='),source.indexOf('  const betaStaffRecipientForm='));w.eval(block);
 const event=name=>w.document.dispatchEvent(new w.Event(name));const send=()=>w.el('beta-recipient-form').dispatchEvent(new w.Event('submit',{cancelable:true}));
 return {w,calls,opened,event,send,changeUser:()=>uid='different-account',complete:()=>resolve({data:{approved:true,contact_id:'existing-contact'},error:null})};
}
test('exact-built Owner approval is hidden in production and from non-Owners',t=>{
 for(const [env,role] of [['production','owner'],['staging','coach'],['staging','admin']]){const r=runtime(t,env,role);r.event('ra:dashboard-loaded');assert(r.w.el('beta-recipient-form').classList.contains('hidden'));r.send();assert.equal(r.calls.length,0);}
});
test('exact-built approval submits once, normalizes email and shows delivery-only acknowledgement',async t=>{
 const r=runtime(t);r.event('ra:dashboard-loaded');assert(!r.w.el('beta-recipient-form').classList.contains('hidden'));r.w.el('beta-recipient-email').value='OWNER-CLIENT@example.invalid';r.w.el('beta-recipient-reason').value='Approved test';r.send();r.send();assert.equal(r.calls.length,1);assert.equal(r.calls[0].name,'set_beta_test_recipient');assert.equal(r.calls[0].args.p_email,'owner-client@example.invalid');r.complete();await new Promise(setImmediate);assert.match(r.w.el('beta-recipient-status').textContent,/Recipient approved\. No invitation has been sent yet\./);
});
test('account reset clears recipient DOM and suppresses late prior-Owner response',async t=>{
 const r=runtime(t);r.event('ra:dashboard-loaded');r.w.el('beta-recipient-email').value='first@example.invalid';r.send();r.changeUser();r.event('ra:staff-access-reset');assert.equal(r.w.el('beta-recipient-email').value,'');assert.equal(r.w.el('beta-recipient-status').textContent,'');assert(r.w.el('beta-recipient-form').classList.contains('hidden'));r.complete();await new Promise(setImmediate);assert.equal(r.w.el('beta-recipient-status').textContent,'');
});

test('approval next action opens only existing contact and is cleared across accounts',async t=>{
 const r=runtime(t);r.event('ra:dashboard-loaded');r.w.el('beta-recipient-email').value='client@example.invalid';r.send();r.complete();await new Promise(setImmediate);assert(!r.w.el('beta-recipient-next').classList.contains('hidden'));r.w.el('beta-recipient-next').click();await new Promise(setImmediate);assert.deepEqual(r.opened,['existing-contact']);assert.equal(r.calls.length,1);r.changeUser();r.event('ra:staff-access-reset');r.w.el('beta-recipient-next').click();assert.deepEqual(r.opened,['existing-contact']);assert(r.w.el('beta-recipient-next').classList.contains('hidden'));
});
