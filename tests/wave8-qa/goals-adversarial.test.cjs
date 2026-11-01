'use strict';
const {test}=require('node:test'),a=require('node:assert/strict'),{fixture}=require('../wave8-operations/fixture.cjs');
const writes=f=>f.calls.filter(x=>x.name==='update_my_goal_status');
const settle=async(f,predicate)=>{for(let n=0;n<80&&!predicate();n++)await f.tick();a.ok(predicate());};
test('independent two distinct goals may finish concurrently without duplicate dispatch or lost drafts',async()=>{
 const f=await fixture({rpcGate:'update_my_goal_status'});try{
  const rows=[{id:'fictional-goal-one',title:'Fictional first',status:'active'},{id:'fictional-goal-two',title:'Fictional second',status:'active'}],client=f.w.supabase.createClient(),rpc=client.rpc,from=client.from;
  client.rpc=async(name,args)=>{const r=await rpc(name,args);if(name==='update_my_goal_status'&&r.data===true)rows.find(x=>x.id===args.p_goal_id).status=args.p_status;return r;};
  client.from=table=>table!=='my_goals'?from(table):{select(){return this;},then(yes,no){return Promise.resolve({data:structuredClone(rows),error:null}).then(yes,no);}};
  f.w.__wave8.renderGoals(structuredClone(rows));f.w.document.querySelector('[name=checkin_fictional_note]').value='Fictional independent retained note';
  const buttons=[...f.w.document.querySelectorAll('#rm-goals button')].filter(x=>x.textContent==='Pause');buttons[0].click();buttons[1].click();await settle(f,()=>f.pending.length===2);f.release();await settle(f,()=>writes(f).length===2&&rows.every(x=>x.status==='paused'));
  a.deepEqual(writes(f).map(x=>x.args.p_goal_id).sort(),['fictional-goal-one','fictional-goal-two']);a.equal(f.w.document.querySelector('[name=checkin_fictional_note]').value,'Fictional independent retained note');a.deepEqual(f.errors,[]);
 }finally{f.close();}
});
test('independent concurrent Check status clicks do not retransmit uncertain mutation',async()=>{const f=await fixture();try{
 f.store.loss=true;await f.act();f.store.readGate=true;const one=f.act('Check status'),two=f.act('Check status');await settle(f,()=>f.store.readPending.length===1);f.releaseRead();await Promise.all([one,two]);a.equal(writes(f).length,1);a.equal(f.store.reads.length,1);a.match(f.status(),/still unconfirmed/);
}finally{f.close();}});
test('independent malformed successful read is held, never treated as acknowledged mutation',async()=>{const f=await fixture();try{
 const client=f.w.supabase.createClient(),from=client.from;client.from=table=>table!=='my_goals'?from(table):{select(){return this;},then(yes,no){return Promise.resolve({data:{id:'synthetic-goal',status:'paused'},error:null}).then(yes,no);}};
 await f.act();a.match(f.status(),/unconfirmed/);await f.act('Check status');a.equal(writes(f).length,1);a.match(f.status(),/No new update was sent/);a.deepEqual(f.errors,[]);
}finally{f.close();}});
test('independent absent saved goal remains held without recreating goal or blind retry',async()=>{const f=await fixture();try{f.store.loss=true;await f.act();f.store.row=null;await f.act('Check status');a.equal(writes(f).length,1);a.match(f.status(),/not currently available/);a.equal(f.w.document.querySelectorAll('#rm-goals button,#rm-goal-history button').length,0);}finally{f.close();}});
test('independent authoritative absent verified user fails closed for entire protected document',async()=>{const f=await fixture({authUserId:null});try{f.w.document.querySelector('[name=checkin_fictional_note]').value='Fictional private draft';await f.act();a.equal(writes(f).length,0);a.equal(f.w.document.querySelectorAll('input,textarea,#rm-goals').length,0,'authoritative absence must not leave protected controls/drafts mounted');}finally{f.close();}});
