const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const {stripTypeScriptTypes}=require('node:module');
function harness(patch={}){
 const env={RVA_ENVIRONMENT:'staging',SUPABASE_URL:'https://bvooallokgfktssadsrv.supabase.co',RVA_APP_ORIGIN:'https://beta.revitalizedacademy.com',RVA_PAYMENT_MODE:'synthetic',RVA_SYNTHETIC_EMAIL_ALLOWLIST:'existing@example.invalid',...patch};
 const scope={Deno:{env:{get:k=>env[k]}},URL,Response};vm.createContext(scope);
 for(const file of ['environment.ts','beta-recipient.ts']){
 const s=stripTypeScriptTypes(fs.readFileSync('supabase/functions/_shared/'+file,'utf8')).replace(/^import .*;\s*$/mg,'').replace(/export /g,'');vm.runInContext(s,scope);
 }
 return patch.STAFF ? scope.assertApprovedBetaStaffRecipient : scope.assertApprovedBetaNotification;
}
const job={recipient:'approved@example.invalid',channel:'email',body:'Continue https://beta.revitalizedacademy.com/member/onboarding/'};
test('static recipients remain accepted without querying dynamic registry',async()=>{let calls=0;await harness()({...job,recipient:'existing@example.invalid'},{rpc:()=>{calls++;throw Error('Unexpected query');}});assert.equal(calls,0);});
test('exact dynamic Owner approval allows delivery',async()=>{let p;await harness()(job,{rpc:async(name,params)=>{assert.equal(name,'beta_test_recipient_approved');p=params;return {data:true,error:null};}});assert.equal(p.p_email,job.recipient);});
test('unapproved and registry error fail closed',async()=>{for(const r of [{data:false},{data:null,error:Error('Unavailable')}])await assert.rejects(harness()(job,{rpc:async()=>r}),/not an approved/);});
test('SMS and foreign URLs remain denied even for approved address',async()=>{const admin={rpc:async()=>({data:true})};await assert.rejects(harness()({...job,channel:'sms'},admin),/SMS/);await assert.rejects(harness()({...job,body:'https://revitalizedacademy.com/member/'},admin),/leaves staging/);});
test('dynamic exception refuses another project or staging hostname',async()=>{for(const patch of [{SUPABASE_URL:'https://abcdefghijklmnopqrst.supabase.co'},{RVA_APP_ORIGIN:'https://other.example.invalid'}])await assert.rejects(harness(patch)(job,{rpc:async()=>({data:true})}));});
test('production never queries or uses staging approvals',async()=>{let calls=0;await harness({RVA_ENVIRONMENT:'production',SUPABASE_URL:'https://voalfpxiyznnqfcqcymd.supabase.co',RVA_APP_ORIGIN:'https://revitalizedacademy.com'})(job,{rpc:async()=>{calls++;return {data:false};}});assert.equal(calls,0);});

const staffHarness=patch=>harness({STAFF:true,...patch});
test('staff dynamic approval queries only the separate staff registry',async()=>{
 let calls=0;await staffHarness()('APPROVED@example.invalid',{rpc:async(name,p)=>{calls++;assert.equal(name,'beta_staff_test_recipient_approved');assert.equal(p.p_email,'approved@example.invalid');return {data:true};}});assert.equal(calls,1);
});
test('staff static allowlist is preserved; no registry lookup',async()=>{
 await staffHarness()('existing@example.invalid',{rpc:()=>{throw Error('Unexpected query');}});
});
test('staff unapproved or failing registry blocks mail',async()=>{
 for(const r of [{data:false},{data:true,error:Error('Unavailable')}])await assert.rejects(staffHarness()('unapproved@example.invalid',{rpc:async()=>r}),/not an approved/);
});
test('staff exceptions refuse other project and non-beta destinations, even static recipients',async()=>{
 for(const p of [{SUPABASE_URL:'https://abcdefghijklmnopqrst.supabase.co'},{RVA_APP_ORIGIN:'https://other.example.invalid'}])await assert.rejects(staffHarness(p)('approved@example.invalid',{rpc:async()=>({data:true})}));
 await assert.rejects(staffHarness({RVA_APP_ORIGIN:'https://other.example.invalid'})('existing@example.invalid',{rpc:async()=>({data:true})}));
});
test('staff production never consults beta approval',async()=>{
 await staffHarness({RVA_ENVIRONMENT:'production',SUPABASE_URL:'https://voalfpxiyznnqfcqcymd.supabase.co',RVA_APP_ORIGIN:'https://revitalizedacademy.com'})('production@example.invalid',{rpc:()=>{throw Error('Unexpected query');}});
});
