'use strict';
const {test}=require('node:test'),a=require('node:assert/strict');
const {fixture}=require('./fixture.cjs');
const writes=f=>f.calls.filter(x=>x.name==='check_in_my_habit');
test('EXPECTED BASELINE DEFECT: different surfaces send two concurrent RPCs for same habit/day',async()=>{const f=await fixture({baselineWave7:true,rpcGate:'check_in_my_habit'});try{const jobs=[f.mark(),f.act()];for(let i=0;i<35&&f.pending.length<2;i++)await f.tick();a.equal(writes(f).length,2);f.release();await Promise.all(jobs);}finally{f.close();}});
test('EXPECTED BASELINE DEFECT: successful alternate MarkToday remount erases unrelated weekly draft',async()=>{const f=await fixture({baselineWave7:true});try{const weekly=f.w.document.querySelector('[name=checkin_fictional_note]');weekly.value='Fictional unsaved note';await f.mark();a.equal(f.w.document.querySelector('[name=checkin_fictional_note]').value,'');a.notEqual(f.w.document.querySelector('[name=checkin_fictional_note]'),weekly);}finally{f.close();}});
test('EXPECTED BASELINE DEFECT: repeated alternate uncertain response sends another RPC',async()=>{const f=await fixture({baselineWave7:true});try{f.set({responseLoss:true});await f.mark();await f.mark();a.equal(writes(f).length,2);}finally{f.close();}});
