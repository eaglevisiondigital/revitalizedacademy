'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {memberFixture}=require('./member-fixture.cjs');
function fields(f,values){for(const [id,value] of Object.entries(values))f.w.document.getElementById(id).value=value;}
test('actual create goal handler maps typed fictional values to existing scoped RPC',async()=>{
 const f=await memberFixture();try{
 fields(f,{'rm-goal-title':' Fictional goal ','rm-goal-description':' Fictional detail ','rm-goal-target-value':'3','rm-goal-target-unit':'units','rm-goal-priority':'2'});
 await f.submit('rm-goal-form');const c=f.calls.find(c=>c.name==='create_my_goal');
 assert.deepEqual(c.args,{p_title:'Fictional goal',p_description:'Fictional detail',p_target_value:3,p_target_unit:'units',p_target_date:null,p_priority:2});
 assert.equal(c.actor,'synthetic-a');assert.equal(Object.hasOwn(c.args,'contact_id'),false);assert.equal(f.w.document.getElementById('rm-goal-form-status').textContent,'Goal created.');assert.deepEqual(f.errors,[]);
 }finally{f.close();}
});
test('actual create habit handler uses existing RPC and numeric schedule input',async()=>{
 const f=await memberFixture();try{
 fields(f,{'rm-habit-title':' Fictional habit ','rm-habit-category':'general','rm-habit-frequency':'daily','rm-habit-target':'2','rm-habit-unit':'units','rm-habit-start-date':'2026-11-01'});
 await f.submit('rm-habit-form');const c=f.calls.find(c=>c.name==='create_my_habit');assert.equal(c.args.p_target_per_period,2);assert.equal(c.args.p_title,'Fictional habit');assert.equal(c.args.p_starts_on,'2026-11-01');assert.equal(c.actor,'synthetic-a');assert.equal(Object.hasOwn(c.args,'user_id'),false);assert.deepEqual(f.errors,[]);
 }finally{f.close();}
});
test('actual check-in form validates required responses before any write',async()=>{
 const f=await memberFixture();try{await f.submit('rm-checkin-form');assert.equal(f.calls.filter(c=>c.kind==='write').length,0);assert.match(f.w.document.getElementById('rm-checkin-status').textContent,/complete all required/);}finally{f.close();}
});
test('actual weekly check-in creates exact current-member payload via existing table',async()=>{
 const f=await memberFixture();try{
 f.w.document.querySelector('[name="checkin_fictional_note"]').value='Invented weekly response';await f.submit('rm-checkin-form');
 const c=f.calls.find(c=>c.table==='client_checkins'&&c.kind==='write');assert.equal(c.actor,'synthetic-a');assert.equal(c.payload.contact_id,'contact-synthetic-a');assert.equal(c.payload.membership_id,'membership-synthetic-a');assert.equal(c.payload.created_by,'synthetic-a');assert.equal(c.payload.template_id,'synthetic-template');assert.deepEqual(c.payload.responses,{fictional_note:'Invented weekly response'});assert.equal(c.payload.status,'submitted');assert.deepEqual(f.errors,[]);
 }finally{f.close();}
});
test('actual goal handler displays fictional server wrong-actor denial without claiming authorization success',async()=>{
 const f=await memberFixture({rpcError:{code:'42501',message:'Fictional wrong actor denied'}});try{
 fields(f,{'rm-goal-title':'Fictional goal'});await f.submit('rm-goal-form');assert.equal(f.calls.filter(c=>c.name==='create_my_goal').length,1);assert.equal(f.w.document.getElementById('rm-goal-form-status').textContent,'Fictional wrong actor denied');assert.equal(f.w.document.getElementById('rm-goal-form-status').classList.contains('error'),true);
 }finally{f.close();}
});
test('actual check-in surfaces duplicate server response, not a second success',async()=>{
 const f=await memberFixture({writeError:{code:'23505',message:'Fictional duplicate'}});try{
 f.w.document.querySelector('[name="checkin_fictional_note"]').value='Invented';await f.submit('rm-checkin-form');assert.equal(f.calls.filter(c=>c.kind==='write').length,1);assert.match(f.w.document.getElementById('rm-checkin-status').textContent,/already been submitted/);
 }finally{f.close();}
});
test('BASELINE reproduction: stale weekly check-in switch throws before write',async()=>{
 const f=await memberFixture({baseline:true});try{
 f.w.document.querySelector('[name="checkin_fictional_note"]').value='Invented stale response';f.gateGetUser();const task=f.submit('rm-checkin-form');
 for(let i=0;i<20&&!f.pending.length;i++)await f.tick();assert.equal(f.pending.length,1);
 f.switchActor('synthetic-b');f.release();await assert.rejects(task,/contact_id/);
 assert.equal(f.calls.filter(c=>c.kind==='write').length,0);assert.equal(f.w.document.querySelectorAll('input,textarea').length,0);
 }finally{f.close();}
});

for(const next of ['synthetic-b',null])test('fixed pending identity check ignores '+(next?'account switch':'logout'),async()=>{
 const f=await memberFixture();try{
 f.w.document.querySelector('[name="checkin_fictional_note"]').value='Invented';f.gateGetUser();const task=f.submit('rm-checkin-form');
 for(let i=0;i<20&&!f.pending.length;i++)await f.tick();f.switchActor(next);f.release();await task;
 assert.equal(f.calls.filter(c=>c.kind==='write').length,0);assert.equal(f.w.document.querySelectorAll('input,textarea').length,0);assert.deepEqual(f.errors,[]);
 }finally{f.close();}
});
for(const auth of [{authUserId:null},{authUserId:'synthetic-b'},{authError:{message:'Fictional identity unavailable'}}])test('fixed identity response fails closed '+JSON.stringify(auth),async()=>{
 const f=await memberFixture(auth);try{
 f.w.document.querySelector('[name="checkin_fictional_note"]').value='Invented';await f.submit('rm-checkin-form');
 assert.equal(f.calls.filter(c=>c.kind==='write').length,0);assert.match(f.w.document.getElementById('rm-checkin-status').textContent,/could not be verified/);assert.deepEqual(f.errors,[]);
 }finally{f.close();}
});
for(const next of ['synthetic-b',null])for(const error of [null,{code:'23505',message:'Fictional duplicate'}])test('fixed response after '+(next?'switch':'logout')+' ignores completed '+(error?'duplicate':'write'),async()=>{
 const f=await memberFixture({writeGate:true,writeError:error});try{
 f.w.document.querySelector('[name="checkin_fictional_note"]').value='Invented';const oldStatus=f.w.document.getElementById('rm-checkin-status');const task=f.submit('rm-checkin-form');
 for(let i=0;i<20&&!f.pending.length;i++)await f.tick();assert.equal(f.pending.length,1);const queries=f.calls.filter(c=>c.kind==='query').length;
 f.switchActor(next);f.release();await task;
 assert.equal(f.calls.filter(c=>c.kind==='write').length,1);assert.equal(f.calls.filter(c=>c.kind==='query').length,queries);assert.equal(oldStatus.textContent,'Submitting your check-in...');assert.equal(f.w.document.querySelectorAll('input,textarea').length,0);assert.deepEqual(f.errors,[]);
 }finally{f.close();}
});
test('same-account token renewal keeps pending check-in and exact current-actor payload',async()=>{
 const f=await memberFixture();try{
 f.w.document.querySelector('[name="checkin_fictional_note"]').value='Invented refresh';f.gateGetUser();const task=f.submit('rm-checkin-form');
 for(let i=0;i<20&&!f.pending.length;i++)await f.tick();f.refresh();f.release();await task;
 const c=f.calls.find(c=>c.kind==='write');assert.equal(c.payload.created_by,'synthetic-a');assert.equal(c.payload.contact_id,'contact-synthetic-a');assert.equal(f.w.document.getElementById('rm-checkin-status').textContent,'Check-in submitted to your coaching team.');assert.deepEqual(f.errors,[]);
 }finally{f.close();}
});
