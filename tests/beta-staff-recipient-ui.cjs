const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
const root=process.env.RVA_BETA_ASSET_ROOT||'.',html=fs.readFileSync(root+'/portal/index.html','utf8'),source=fs.readFileSync(root+'/portal/portal-staff-access.js','utf8');
function runtime(t,environment='staging',role='owner',manage=true){
 const dom=new JSDOM(html.match(/<form id="beta-staff-recipient-form"[\s\S]*?<\/form>/)[0],{runScripts:'outside-only'});t.after(()=>dom.window.close());const w=dom.window,calls=[],opened=[];let uid='owner',resolve;
 w.RVA_PUBLIC_CONFIG={environment};w.portal={currentStaffRole:()=>role,currentUserId:()=>uid};w.myPermissions={'staff.manage':manage};w.client={rpc:(name,args)=>{calls.push({name,args});return new Promise(r=>resolve=r);}};w.el=id=>w.document.getElementById(id);w.setStatus=(id,text)=>w.el(id).textContent=text;
 w.staffRows=[];w.openInvite=()=>opened.push('invite');const input=w.document.createElement('input');input.id='staff-invite-email';w.document.body.append(input);
 w.eval(source.slice(source.indexOf('  const betaStaffRecipientForm='),source.lastIndexOf('})();')));w.renderBetaStaffRecipientApproval();
 return {w,calls,opened,send:()=>w.el('beta-staff-recipient-form').dispatchEvent(new w.Event('submit',{cancelable:true})),reset:()=>{uid='another';w.document.dispatchEvent(new w.Event('ra:staff-access-reset'));},complete:()=>resolve({data:{approved:true}})};
}
test('Owner/Admin staff approval visible only in staging with staff.manage',t=>{
 for(const [env,role,manage,visible] of [['staging','owner',true,true],['staging','admin',true,true],['staging','coach',true,false],['staging','admin',false,false],['production','owner',true,false]]){const r=runtime(t,env,role,manage);assert.equal(!r.w.el('beta-staff-recipient-form').classList.contains('hidden'),visible);if(!visible){r.send();assert.equal(r.calls.length,0);}}
});
test('staff approval sends one normalized purpose-specific RPC, no role grant or invite',async t=>{
 const r=runtime(t);r.w.el('beta-staff-recipient-email').value='STAFF@example.invalid';r.w.el('beta-staff-recipient-reason').value='Approved beta';r.send();r.send();assert.equal(r.calls.length,1);assert.equal(r.calls[0].name,'set_beta_staff_test_recipient');assert.equal(r.calls[0].args.p_email,'staff@example.invalid');r.complete();await new Promise(setImmediate);assert.match(r.w.el('beta-staff-recipient-status').textContent,/Recipient approved\. No invitation has been sent yet\./);
});
test('staff approval private form clears and late response is ignored on account switch',async t=>{
 const r=runtime(t);r.w.el('beta-staff-recipient-email').value='staff@example.invalid';r.send();r.reset();r.complete();await new Promise(setImmediate);assert.equal(r.w.el('beta-staff-recipient-email').value,'');assert.equal(r.w.el('beta-staff-recipient-status').textContent,'');assert(r.w.el('beta-staff-recipient-form').classList.contains('hidden'));
});

test('staff next action opens prefilled form only, preserves existing identities and clears across accounts',async t=>{
 const r=runtime(t);r.w.el('beta-staff-recipient-email').value='STAFF@example.invalid';r.send();r.complete();await new Promise(setImmediate);r.w.el('beta-staff-recipient-next').click();assert.deepEqual(r.opened,['invite']);assert.equal(r.w.el('staff-invite-email').value,'staff@example.invalid');assert.equal(r.calls.length,1);r.w.staffRows.push({email:'staff@example.invalid'});r.w.el('beta-staff-recipient-next').click();assert.deepEqual(r.opened,['invite']);assert.match(r.w.el('beta-staff-recipient-status').textContent,/already has a staff record/);r.reset();r.w.el('beta-staff-recipient-next').click();assert.deepEqual(r.opened,['invite']);
});
