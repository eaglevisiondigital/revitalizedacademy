'use strict';
const {test}=require('node:test'),a=require('node:assert/strict'),path=require('node:path');
const fixtureRoot=process.env.RVA_WAVE6_FIXTURE_ROOT||path.resolve(__dirname,'../..');
const {dailyFixture}=require(path.join(fixtureRoot,'tests/wave6-features/daily-fixture.cjs'));
test('independent: verified different getUser identity clears old private document even without Auth callback',async()=>{
 const f=await dailyFixture({authUserId:'synthetic-b'});try{a.equal(f.w.document.querySelectorAll('[name=checkin_fictional_note]').length,1);await f.act();a.equal(f.calls.filter(x=>x.name==='check_in_my_habit').length,0);a.equal(f.w.document.querySelectorAll('[name=checkin_fictional_note],#rm-today-habits button').length,0,'verified account mismatch must clear old private data, not merely disable writes');}finally{f.close();}
});
test('independent: read-only status reauthentication mismatch clears prior private state without another write',async()=>{
 const f=await dailyFixture();try{f.set({responseLoss:true});await f.act();f.w.supabase.createClient().auth.getUser=async()=>({data:{user:{id:'synthetic-b'}},error:null});await f.act();a.equal(f.calls.filter(x=>x.name==='check_in_my_habit').length,1);a.equal(f.w.document.querySelectorAll('[name=checkin_fictional_note],#rm-today-habits button').length,0);}finally{f.close();}
});
test('independent: getUser transport uncertainty retains draft and cannot send new habit RPC',async()=>{
 const f=await dailyFixture({authError:{message:'Fictional timeout'}});try{const field=f.w.document.querySelector('[name=checkin_fictional_note]');field.value='Independent fictional draft';await f.act();a.equal(f.calls.filter(x=>x.name==='check_in_my_habit').length,0);a.equal(f.w.document.querySelector('[name=checkin_fictional_note]').value,'Independent fictional draft');}finally{f.close();}
});
test('independent: concurrent status reads cannot restore protected daily card after a genuine authorization denial',async()=>{
 const f=await dailyFixture();try{
  f.set({responseLoss:true});await f.act();a.match(f.status(),/unconfirmed/);
  const client=f.w.supabase.createClient(),from=client.from,pending=[];
  client.from=table=>{if(table!=='my_app_bootstrap_v2')return from(table);const q={select:()=>q,single:()=>q,then:(resolve,reject)=>new Promise(r=>pending.push(r)).then(resolve,reject)};return q;};
  const one=f.act(),two=f.act();for(let i=0;i<30&&pending.length<2;i++)await f.tick();
  // A valid repair may serialize reads; then only one request may be pending.
  a.ok(pending.length>=1);pending[0]({data:null,error:{code:'42501',message:'Synthetic revoked access'}});await one;
  a.equal(f.w.document.querySelectorAll('#rm-today-habits button').length,0);
  if(pending[1])pending[1]({data:{daily_actions:{habits:[{habit_id:'fictional-daily-habit',title:'Fictional stale private card',target:1,completed_today:true}],meals:[],workouts:[],challenges:[]}},error:null});
  await two;a.equal(f.w.document.querySelectorAll('#rm-today-habits button').length,0,'late successful transport must not undo an established 42501 denial');
  a.equal(f.calls.filter(x=>x.name==='check_in_my_habit').length,1);
 }finally{f.close();}
});
