'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {memberFixture}=require('./dom-fixture.cjs');
const fill=(f,id,value)=>f.w.document.getElementById(id).value=value;
async function pending(f){for(let i=0;i<30&&!f.pending.length;i++)await f.tick();assert(f.pending.length);}
function prepare(f,kind){if(kind==='progress'){fill(f,'rm-progress-value','7');fill(f,'rm-progress-note','Fictional submitted note');}else fill(f,'rm-'+kind+'-title','Fictional '+kind);}
for(const next of ['synthetic-b',null])test('progress pending identity '+(next?'switch':'logout')+' ignores stale request',async()=>{
 const f=await memberFixture();try{prepare(f,'progress');f.gateGetUser();const job=f.submit('rm-progress-form');await pending(f);f.switchActor(next);f.release();await job;assert.equal(f.calls.filter(x=>x.kind==='write').length,0);assert.equal(f.w.document.querySelectorAll('input,textarea').length,0);assert.deepEqual(f.errors,[]);}finally{f.close();}
});
for(const auth of [{authUserId:null},{authUserId:'synthetic-b'},{authError:{message:'Fictional auth unavailable'}}])test('progress identity failure denies '+JSON.stringify(auth),async()=>{
 const f=await memberFixture(auth);try{prepare(f,'progress');await f.submit('rm-progress-form');assert.equal(f.calls.filter(x=>x.kind==='write').length,0);assert.match(f.w.document.getElementById('rm-progress-status').textContent,/could not be verified/);}finally{f.close();}
});
test('progress snapshot survives changed input and same-account renewal',async()=>{
 const f=await memberFixture();try{prepare(f,'progress');f.gateGetUser();const job=f.submit('rm-progress-form');await pending(f);fill(f,'rm-progress-note','Fictional later draft');f.refresh();f.release();await job;const w=f.calls.find(x=>x.kind==='write');assert.equal(w.payload.note,'Fictional submitted note');assert.equal(w.payload.contact_id,'contact-synthetic-a');assert.equal(w.payload.created_by,'synthetic-a');assert.equal(w.payload.value_numeric,7);assert.equal(f.w.document.getElementById('rm-progress-status').textContent,'Progress saved.');}finally{f.close();}
});
for(const kind of ['goal','habit','progress'])test(kind+' concurrent submits dispatch once and unlock for retry',async()=>{
 const rpc='create_my_'+kind,f=await memberFixture(kind==='progress'?{writeGate:true}:{rpcGate:rpc});try{prepare(f,kind);const a=f.submit('rm-'+kind+'-form'),b=f.submit('rm-'+kind+'-form');await pending(f);assert.equal(f.calls.filter(x=>kind==='progress'?x.kind==='write':x.name===rpc).length,1);assert.equal(f.w.document.getElementById('rm-'+kind+'-form').getAttribute('aria-busy'),'true');f.release();await Promise.all([a,b]);assert.notEqual(f.w.document.getElementById('rm-'+kind+'-form').getAttribute('aria-busy'),'true');}finally{f.close();}
});
for(const kind of ['goal','habit','progress'])for(const code of ['42501','23505'])test(kind+' server '+code+' remains visible and retryable',async()=>{
 const error={code,message:'Fictional '+code+' denied'},f=await memberFixture(kind==='progress'?{writeError:error}:{rpcError:error});try{prepare(f,kind);await f.submit('rm-'+kind+'-form');const status=f.w.document.getElementById(kind==='progress'?'rm-progress-status':'rm-'+kind+'-form-status');assert.equal(status.textContent,error.message);assert(status.classList.contains('error'));assert.notEqual(f.w.document.getElementById('rm-'+kind+'-form').getAttribute('aria-busy'),'true');assert.equal(f.w.document.getElementById(kind==='progress'?'rm-progress-value':'rm-'+kind+'-title').value,kind==='progress'?'7':'Fictional '+kind);await f.submit('rm-'+kind+'-form');assert.equal(f.calls.filter(x=>kind==='progress'?x.kind==='write':x.name==='create_my_'+kind).length,2);}finally{f.close();}
});
for(const kind of ['goal','habit','progress'])for(const next of ['synthetic-b',null])for(const error of [null,{code:'42501',message:'Fictional stale denial'}])test(kind+' pending transport '+(error?'denial':'success')+' after '+(next?'switch':'logout')+' has no late UI/reload',async()=>{
 const f=await memberFixture(kind==='progress'?{writeGate:true,writeError:error}:{rpcGate:'create_my_'+kind,rpcError:error});try{prepare(f,kind);const status=f.w.document.getElementById(kind==='progress'?'rm-progress-status':'rm-'+kind+'-form-status');const job=f.submit('rm-'+kind+'-form');await pending(f);const old=status.textContent,queries=f.calls.filter(x=>x.kind==='query').length;f.switchActor(next);f.release();await job;assert.equal(status.textContent,old);assert.equal(f.calls.filter(x=>x.kind==='query').length,queries);assert.equal(f.w.document.querySelectorAll('input,textarea').length,0);assert.deepEqual(f.errors,[]);}finally{f.close();}
});
for(const kind of ['goal','habit'])for(const next of ['synthetic-b',null])for(const error of [null,{code:'42501',message:'Fictional stale denial'}])test(kind+' status completion after '+(next?'switch':'logout')+' stays silent '+!!error,async()=>{
 const f=await memberFixture({rpcGate:'update_my_'+kind+'_status',rpcError:error});try{const job=f.click('#rm-'+(kind==='goal'?'goals':'habits')+' button','Pause');await pending(f);const n=f.calls.filter(x=>x.kind==='query').length;f.switchActor(next);f.release();await job;assert.equal(f.calls.filter(x=>x.kind==='alert').length,0);assert.equal(f.calls.filter(x=>x.kind==='query').length,n);}finally{f.close();}
});
for(const kind of ['goal','habit'])test(kind+' row pending status double tap dispatches once; renewal retains task',async()=>{
 const rpc='update_my_'+kind+'_status',f=await memberFixture({rpcGate:rpc});try{const selector='#rm-'+(kind==='goal'?'goals':'habits')+' button';const a=f.click(selector,'Pause'),b=f.click(selector,'Pause');await pending(f);f.refresh();assert.equal(f.calls.filter(x=>x.name===rpc).length,1);f.release();await Promise.all([a,b]);assert.equal(f.calls.filter(x=>x.kind==='alert').length,0);}finally{f.close();}
});
for(const value of ['-1','101'])test('progress range '+value+' rejects before identity/write',async()=>{
 const f=await memberFixture();try{prepare(f,'progress');fill(f,'rm-progress-value',value);await f.submit('rm-progress-form');assert.equal(f.calls.filter(x=>x.kind==='write').length,0);assert.match(f.w.document.getElementById('rm-progress-status').textContent,/expected range/);}finally{f.close();}
});
test('progress zero remains a valid fictional measurement',async()=>{
 const f=await memberFixture();try{prepare(f,'progress');fill(f,'rm-progress-value','0');await f.submit('rm-progress-form');assert.equal(f.calls.find(x=>x.kind==='write').payload.value_numeric,0);}finally{f.close();}
});
for(const kind of ['goal','habit'])test(kind+' normal current actor success preserves scoped RPC payload',async()=>{
 const f=await memberFixture();try{prepare(f,kind);await f.submit('rm-'+kind+'-form');const c=f.calls.find(x=>x.name==='create_my_'+kind);assert.equal(c.actor,'synthetic-a');assert.equal(c.args.p_title,'Fictional '+kind);assert.equal(Object.hasOwn(c.args,'contact_id'),false);assert.equal(Object.hasOwn(c.args,'user_id'),false);}finally{f.close();}
});
for(const next of ['synthetic-b',null])test('habit mark-today stale completion stays silent after '+(next?'switch':'logout'),async()=>{
 const f=await memberFixture({rpcGate:'check_in_my_habit',rpcError:{code:'42501',message:'Fictional stale denial'}});try{const a=f.click('#rm-habits button','Mark Today'),b=f.click('#rm-habits button','Mark Today');await pending(f);assert.equal(f.calls.filter(x=>x.name==='check_in_my_habit').length,1);f.switchActor(next);f.release();await Promise.all([a,b]);assert.equal(f.calls.filter(x=>x.kind==='alert').length,0);}finally{f.close();}
});
const actions=[['createGoal','create_my_goal',f=>{prepare(f,'goal');return f.submit('rm-goal-form');}],['createHabit','create_my_habit',f=>{prepare(f,'habit');return f.submit('rm-habit-form');}],['updateGoal','update_my_goal_status',f=>f.click('#rm-goals button','Pause')],['updateHabit','update_my_habit_status',f=>f.click('#rm-habits button','Pause')],['markHabit','check_in_my_habit',f=>f.click('#rm-habits button','Mark Today')]];
for(const [name,rpc,action]of actions)for(const auth of [{authUserId:null},{authUserId:'synthetic-b'},{authError:{message:'Fictional auth unavailable'}}])test(name+' actual getUser failure denies before RPC '+JSON.stringify(auth),async()=>{
 const f=await memberFixture(auth);try{await action(f);assert.equal(f.calls.filter(x=>x.name===rpc).length,0);}finally{f.close();}
});
for(const [name,rpc,action]of actions)for(const next of ['synthetic-b',null])test(name+' pending getUser '+(next?'switch':'logout')+' dispatches no stale RPC',async()=>{
 const f=await memberFixture();try{f.gateGetUser();const job=action(f);await pending(f);f.switchActor(next);f.release();await job;assert.equal(f.calls.filter(x=>x.name===rpc).length,0);assert.equal(f.calls.filter(x=>x.kind==='alert').length,0);assert.deepEqual(f.errors,[]);}finally{f.close();}
});
for(const kind of ['goal','habit'])for(const next of ['synthetic-b',null,'renew'])test(kind+' delayed modal close after '+next+' respects completed task lineage',async()=>{
 const f=await memberFixture({gateModalTimers:true});try{await f.button('rm-add-'+kind);prepare(f,kind);const modal=f.w.document.getElementById('rm-'+kind+'-modal');await f.submit('rm-'+kind+'-form');assert.equal(f.modalTimers.length,1);if(next==='renew')f.refresh();else f.switchActor(next);f.modalTimers[0]();assert.equal(modal.getAttribute('aria-hidden'),next==='renew'?'true':'false');assert.deepEqual(f.errors,[]);}finally{f.close();}
});
for(const kind of ['goal','habit'])test(kind+' successful old modal timer cannot close newly reopened same-user draft',async()=>{
 const f=await memberFixture({gateModalTimers:true});try{await f.button('rm-add-'+kind);prepare(f,kind);await f.submit('rm-'+kind+'-form');assert.equal(f.modalTimers.length,1);await f.button('rm-add-'+kind);fill(f,'rm-'+kind+'-title','Fictional reopened draft');f.modalTimers[0]();assert.equal(f.w.document.getElementById('rm-'+kind+'-modal').getAttribute('aria-hidden'),'false');assert.equal(f.w.document.getElementById('rm-'+kind+'-title').value,'Fictional reopened draft');}finally{f.close();}
});
for(const kind of ['goal','habit','progress'])test(kind+' old finally cannot unlock replacement form after account reset',async()=>{
 const f=await memberFixture(kind==='progress'?{writeGate:true}:{rpcGate:'create_my_'+kind});try{prepare(f,kind);const old=f.w.document.getElementById('rm-'+kind+'-form'),job=f.submit('rm-'+kind+'-form');await pending(f);f.switchActor('synthetic-b');const replacement=f.w.document.createElement('form');replacement.id='rm-'+kind+'-form';replacement.setAttribute('aria-busy','true');const button=f.w.document.createElement('button');button.type='submit';button.disabled=true;replacement.append(button);f.w.document.body.append(replacement);f.release();await job;assert.equal(replacement.getAttribute('aria-busy'),'true');assert.equal(button.disabled,true);assert.equal(old.getAttribute('aria-busy'),null);}finally{f.close();}
});
