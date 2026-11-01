'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
process.env.RVA_WAVE6_BASELINE='1';
const {dailyFixture}=require('./daily-fixture.cjs');
const rpc=f=>f.calls.filter(c=>c.name==='check_in_my_habit');
async function gate(f){for(let i=0;i<35&&!f.pending.length;i++)await f.tick();assert.ok(f.pending.length);}
test('EXPECTED BASELINE DEFECT: daily rapid double action dispatches two RPCs',async()=>{const f=await dailyFixture({rpcGate:'check_in_my_habit'});try{const a=f.act(),b=f.act();await gate(f);assert.equal(rpc(f).length,2);f.release();await Promise.all([a,b]);}finally{f.close();}});
test('EXPECTED BASELINE DEFECT: daily habit skips verified getUser and writes with mismatched current identity',async()=>{const f=await dailyFixture({authUserId:'synthetic-b'});try{await f.act();assert.equal(rpc(f).length,1);}finally{f.close();}});
test('EXPECTED BASELINE DEFECT: successful daily action whole-dashboard reload erases unrelated weekly draft',async()=>{const f=await dailyFixture();try{f.w.document.querySelector('[name="checkin_fictional_note"]').value='Fictional unsaved weekly draft';await f.act();assert.equal(f.w.document.querySelector('[name="checkin_fictional_note"]').value,'');}finally{f.close();}});
