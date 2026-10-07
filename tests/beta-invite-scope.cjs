const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
const html=fs.readFileSync('portal/index.html','utf8'),source=fs.readFileSync('portal/portal-staff-access.js','utf8');
test('staff invite preserves explicit People scope for every role without reporting delivery',async t=>{
 for(const [role,scope] of [['admin','assigned'],['coach','all'],['coach','none'],['owner','all']]){
 const dom=new JSDOM(html.match(/<form id="staff-invite-form"[\s\S]*?<\/form>/)[0],{runScripts:'outside-only'});t.after(()=>dom.window.close());const w=dom.window,calls=[],statuses=[];
 w.el=id=>w.document.getElementById(id);w.inviteSubmitting=false;w.invoke=async body=>{calls.push(body);return {existing_auth_user:false};};w.client={rpc:async()=>({})};w.setStatus=(id,text)=>statuses.push(text);w.load=async()=>{};w.closeInvite=()=>{};w.setTimeout=()=>{};
 w.el('staff-invite-name').value='Approved Test';w.el('staff-invite-email').value='STAFF@example.invalid';w.el('staff-invite-phone').value='7853839568';w.el('staff-invite-role').value=role;w.el('staff-invite-contact-scope').value=scope;
 w.eval(source.slice(source.indexOf('  async function inviteStaff('),source.indexOf('  async function loadMatrix(')));
 await w.inviteStaff({preventDefault(){}});assert.equal(calls.length,1);assert.equal(calls[0].contact_scope,scope);assert.equal(calls[0].role,role);assert.equal(calls[0].email,'staff@example.invalid');assert(statuses.some(s=>/request accepted\. Delivery is not yet confirmed/.test(s)));
 }
});
