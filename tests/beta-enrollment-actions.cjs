const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
test('payment review targets the existing payment step without advancing the active assessment',async t=>{
 const source=fs.readFileSync('portal/portal-action-center.js','utf8'),dom=new JSDOM(fs.readFileSync('portal/index.html','utf8'),{runScripts:'outside-only'});t.after(()=>dom.window.close());const w=dom.window,calls=[];
 w.contact={id:'existing-contact'};w.enrollmentMode=true;w.el=id=>w.document.getElementById(id);
 w.client={from(table){const filters=[];const q={select(){return q;},eq(k,v){filters.push([k,v]);return q;},order(){return q;},in(){return q;},like(){return q;},limit(){return q;},maybeSingle(){return q;},then(resolve){calls.push({table,filters});return Promise.resolve({data:table==='admin_contact_journey_summary'?{journey_id:'existing-journey',current_step_key:'vitality_assessment'}:table==='contact_journey_steps'?{id:'existing-payment-step',step_key:'payment_agreement',name:'Payment & Agreement'}:table==='journey_enrollment_activations'?{id:'existing-activation'}:null}).then(resolve);}};return q;}};
 for(const name of ['populateStaff','populateTypes','populateTemplates','renderOpenActions','renderOperational','renderNoJourneyActionState'])w[name]=()=>{};w.applySelectedTemplate=async()=>{};w.toDatetimeLocal=()=>"";
 w.eval(source.slice(source.indexOf('  async function loadActionData()'),source.indexOf('  async function openActionCenter(')));
 assert.equal(await w.loadActionData(),true);assert.equal(w.summary.current_step_key,'vitality_assessment');assert.equal(w.step.id,'existing-payment-step');assert(calls.some(c=>c.table==='contact_journey_steps'&&c.filters.some(([k,v])=>k==='step_key'&&v==='payment_agreement')));assert(!calls.some(c=>/update|insert/.test(c.table)));
});
test('invitation entry cannot resend another contact’s cached contract',()=>{const source=fs.readFileSync('portal/portal-agreements.js','utf8');const block=source.slice(source.indexOf('document.addEventListener("ra:open-client-invitation"'),source.indexOf('document.addEventListener("ra:enrollment-configured"'));assert.match(block,/row\.contact_id===activeContact\.id/);assert.match(block,/sendAgreement\(existing\)/);assert.match(block,/else void openClientAssign\(\)/);});

function invitationEntry(rows){
 const source=fs.readFileSync((process.env.RVA_BETA_ASSET_ROOT||'.')+'/portal/portal-agreements.js','utf8');
 const block=source.slice(source.indexOf('document.addEventListener("ra:open-client-invitation"'),source.indexOf('document.addEventListener("ra:enrollment-configured"'));
 const calls=[];let handle;
 new Function('document','activeContact','portal','clientAgreements','templates','sendAgreement','openClientAssign',block)(
  {addEventListener:(_name,fn)=>handle=fn},{id:'existing-contact'},{hasPermission:()=>true},rows,
  [{id:'published-template',document_type:'client_contract',merge_schema:{required:['client_name','program_name']}}],
  row=>calls.push({action:'send',id:row.id}),()=>calls.push({action:'prepare'}));
 handle({detail:{contactId:'existing-contact'}});return calls;
}
test('unsent auto-created contract opens preparation without sending or creating an agreement',()=>{
 assert.deepEqual(invitationEntry([{id:'existing-draft',contact_id:'existing-contact',agreement_template_id:'published-template',status:'not_sent',merge_values:{}}]),[{action:'prepare'}]);
});
test('only an already prepared complete contract can resend through the enrollment entry',()=>{
 const row={id:'existing-agreement',contact_id:'existing-contact',agreement_template_id:'published-template',status:'sent',rendered_content_hash:'existing-hash',merge_values:{client_name:'Test client',program_name:'Existing program'}};
 assert.deepEqual(invitationEntry([row]),[{action:'send',id:'existing-agreement'}]);
 assert.deepEqual(invitationEntry([{...row,merge_values:{client_name:'Test client'}}]),[{action:'prepare'}]);
 assert.deepEqual(invitationEntry([{...row,rendered_content_hash:null}]),[{action:'prepare'}]);
 assert.deepEqual(invitationEntry([{...row,contact_id:'different-contact'}]),[{action:'prepare'}]);
});
