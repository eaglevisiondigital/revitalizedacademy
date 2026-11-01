'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {memberFixture}=require('./dom-fixture.cjs');
const fill=(f,id,value)=>f.w.document.getElementById(id).value=value;
async function pending(f){for(let i=0;i<30&&!f.pending.length;i++)await f.tick();assert(f.pending.length);}
for(const next of ['synthetic-b',null])test('BASELINE progress pending identity '+(next?'switch':'logout')+' throws before write',async()=>{
 const f=await memberFixture({baseline:true});try{fill(f,'rm-progress-value','7');f.gateGetUser();const job=f.submit('rm-progress-form');await pending(f);f.switchActor(next);f.release();await assert.rejects(job,/contact_id/);assert.equal(f.calls.filter(x=>x.kind==='write').length,0);}finally{f.close();}
});
for(const kind of ['goal','habit'])test('BASELINE '+kind+' duplicate pending submit dispatches twice',async()=>{
 const rpc='create_my_'+kind,f=await memberFixture({baseline:true,rpcGate:rpc});try{fill(f,'rm-'+kind+'-title','Fictional '+kind);const a=f.submit('rm-'+kind+'-form'),b=f.submit('rm-'+kind+'-form');await pending(f);assert.equal(f.calls.filter(x=>x.name===rpc).length,2);f.release();await Promise.all([a,b]);}finally{f.close();}
});
for(const kind of ['goal','habit'])test('BASELINE '+kind+' late denial alerts after switch',async()=>{
 const rpc='update_my_'+kind+'_status',f=await memberFixture({baseline:true,rpcGate:rpc,rpcError:{code:'42501',message:'Fictional stale denial'}});try{const job=f.click('#rm-'+(kind==='goal'?'goals':'habits')+' button','Pause');await pending(f);f.switchActor('synthetic-b');f.release();await job;assert.equal(f.calls.filter(x=>x.kind==='alert').length,1);}finally{f.close();}
});
test('BASELINE progress pending identity reads changed note instead of submitted snapshot',async()=>{
 const f=await memberFixture({baseline:true});try{fill(f,'rm-progress-value','7');fill(f,'rm-progress-note','Fictional submitted note');f.gateGetUser();const job=f.submit('rm-progress-form');await pending(f);fill(f,'rm-progress-note','Fictional changed note');f.release();await job;assert.equal(f.calls.find(x=>x.kind==='write').payload.note,'Fictional changed note');}finally{f.close();}
});
test('BASELINE habit mark-today late denial alerts after logout',async()=>{
 const f=await memberFixture({baseline:true,rpcGate:'check_in_my_habit',rpcError:{code:'42501',message:'Fictional stale denial'}});try{const job=f.click('#rm-habits button','Mark Today');await pending(f);f.switchActor(null);f.release();await job;assert.equal(f.calls.filter(x=>x.kind==='alert').length,1);}finally{f.close();}
});
