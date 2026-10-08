const {test,before,after,beforeEach,afterEach}=require('node:test');
const assert=require('node:assert/strict'),{Client}=require('pg'),{randomBytes,randomUUID}=require('node:crypto');
if(!/^rva_gate_\d+_\d+$/.test(process.env.RVA_TEST_DATABASE||''))throw Error('Disposable database required');
const db=new Client(),q=(s,p=[])=>db.query(s,p),one=async(s,p=[])=>Object.values((await q(s,p)).rows[0])[0];
const hash=()=>randomBytes(32).toString('hex'),identity={email:'repair@example.invalid',first_name:'Synthetic',last_name:'Repair',phone:'0000000000',referral_source:'Google Search',lead_owner:'edge'};
const cmd=async(a,h=null,n=null,p={})=>one('select public.vitality_resume_command($1,$2,$3,$4)',[a,h,n,p]);
async function deny(action,h,n=null,p={}){await q('savepoint denied');try{await assert.rejects(cmd(action,h,n,p),/Resume unavailable|permission denied/);}finally{await q('rollback to denied');await q('release denied');}}
const relax=()=>q('delete from private.vitality_resume_rate_limits');
const start=async()=>{const mail=hash(),result=await cmd('start',null,mail,{...identity,request_id:randomUUID()});return {mail,result};};
before(()=>db.connect());after(()=>db.end());
beforeEach(async()=>{await q('begin');await q("insert into public.journey_definitions(journey_key,name,audience) values('assessment_first','Synthetic','lead') on conflict do nothing");await q("insert into public.journey_step_definitions(journey_key,step_key,step_order,name,step_type) values('assessment_first','vitality_assessment',1,'Synthetic','assessment') on conflict do nothing");});
afterEach(()=>q('rollback'));
test('five replayed starts across rate windows create one logical start, one mail and one staff notification claim',async()=>{
 const a=await start();assert(a.result.start_identity);for(let i=0;i<5;i++){await relax();assert.deepEqual(await cmd('start',null,hash(),{...identity,request_id:randomUUID()}),{});}
 for(const table of ['public.contacts','public.workflow_records','private.vitality_assessment_drafts','private.vitality_resume_mail_attempts'])assert.equal(Number(await one('select count(*) from '+table)),1,table);
 assert.equal(Number(await one("select count(*) from public.journey_events where event_type='vitality_started'")),1);
 assert.equal(Number(await one("select count(*) from private.vitality_resume_mail_attempts where lead_status='dispatching'")),1);
});
test('request replay remains suppressed after the minute/hour throttle windows',async()=>{
 await start();await relax();const id=randomUUID(),a=hash();assert((await cmd('recover',null,a,{email:identity.email,request_id:id})).recipient);await relax();assert.deepEqual(await cmd('recover',null,hash(),{email:identity.email,request_id:id}),{});
 assert.equal(Number(await one('select count(*) from private.vitality_resume_mail_attempts')),2);
});
test('resend is bounded to one minute and three sends per hour, including start',async()=>{
 const a=await start();assert.deepEqual(await cmd('recover',null,hash(),{email:identity.email}),{});
 for(let i=0;i<2;i++){await q("update private.vitality_resume_rate_limits set last_request=now()-interval '61 seconds'");assert((await cmd('recover',null,hash(),{email:identity.email})).recipient);}
 await q("update private.vitality_resume_rate_limits set last_request=now()-interval '61 seconds'");assert.deepEqual(await cmd('recover',null,hash(),{email:identity.email}),{});
 assert.equal(Number(await one('select count(*) from private.vitality_resume_mail_attempts')),3);
});
test('latest accepted link supersedes older link and directly restores the same draft',async()=>{
 const a=await start();await cmd('mail_result',a.mail,null,{state:'accepted',provider_id:'provider-one',provider_status:200});await relax();const next=hash();await cmd('recover',null,next,{email:identity.email});await cmd('mail_result',next,null,{state:'accepted',provider_id:'provider-two',provider_status:200});
 await deny('redeem',a.mail,hash());const session=hash(),r=await cmd('redeem',next,session);assert.equal(r.status,'draft');assert.equal(r.identity.email,identity.email);assert.equal((await cmd('read',session)).draft_id,r.draft_id);await deny('redeem',next,hash());
 assert.equal(await one("select credential_state from private.vitality_resume_mail_attempts where credential_hash=$1",[next]),'consumed');
});
test('provider timeout keeps the possibly delivered link usable, records uncertainty without storing raw tokens',async()=>{
 const a=await start();await cmd('mail_result',a.mail,null,{state:'uncertain'});assert.equal(await one('select delivery_state from private.vitality_resume_mail_attempts'),'uncertain');assert.equal((await cmd('redeem',a.mail,hash())).status,'draft');
 assert.equal(await one("select count(*)=0 from information_schema.columns where table_schema='private' and table_name='vitality_resume_mail_attempts' and column_name in ('token','url','body','email')"),true);
});
test('definitive rejection leaves the previously accepted credential valid',async()=>{
 const a=await start();await cmd('mail_result',a.mail,null,{state:'accepted'});await relax();const failed=hash();await cmd('recover',null,failed,{email:identity.email});await cmd('mail_result',failed,null,{state:'failed',provider_status:429});await deny('redeem',failed,hash());assert.equal((await cmd('redeem',a.mail,hash())).status,'draft');
});
test('link opened while provider response is delayed stays single-use after acknowledgement',async()=>{
 const a=await start(),session=hash();const before=await cmd('redeem',a.mail,session);await cmd('mail_result',a.mail,null,{state:'accepted',provider_id:'provider-delayed',provider_status:200});await deny('redeem',a.mail,hash());assert.equal((await cmd('read',session)).draft_id,before.draft_id);assert.equal(await one('select recovery_hash is null from private.vitality_assessment_drafts'),true);
});
test('old response and duplicate delivery acknowledgements cannot resurrect consumed/superseded links',async()=>{
 const a=await start();await relax();const b=hash();await cmd('recover',null,b,{email:identity.email});await cmd('mail_result',b,null,{state:'accepted'});await cmd('mail_result',a.mail,null,{state:'accepted'});await deny('redeem',a.mail,hash());const session=hash();await cmd('redeem',b,session);await cmd('mail_result',b,null,{state:'accepted'});await deny('redeem',b,hash());assert.equal((await cmd('read',session)).status,'draft');
});
test('existing pre-migration draft gets no repeated start mail or staff claim',async()=>{
 const a=await start();await q('delete from private.vitality_resume_mail_attempts');await relax();assert.deepEqual(await cmd('start',null,hash(),identity),{});assert.equal(Number(await one('select count(*) from private.vitality_resume_mail_attempts')),0);
});
test('mail and lead journal denies direct access and mutations to browser/member/service roles',async()=>{
 await start();for(const role of ['anon','authenticated','service_role']){await q('savepoint roles');await q('set local role '+role);await assert.rejects(q('select * from private.vitality_resume_mail_attempts'),/permission denied/);await q('rollback to roles');await q('set local role '+role);await assert.rejects(q("update private.vitality_resume_mail_attempts set lead_status='accepted'"),/permission denied/);await q('rollback to roles');await q('release roles');}
});
test('expired pending credentials and completed assessments remain locked',async()=>{
 const a=await start();await q("update private.vitality_resume_mail_attempts set expires_at=now()-interval '1 second'");await deny('redeem',a.mail,hash());await q("update private.vitality_resume_mail_attempts set expires_at=now()+interval '30 days'");const session=hash();await cmd('redeem',a.mail,session);const ticket=hash();await cmd('prepare_final',session,ticket,{revision:0,form:'synthetic=1'});await cmd('finish_final',session,ticket);await relax();assert.deepEqual(await cmd('start',null,hash(),identity),{});assert.deepEqual(await cmd('recover',null,hash(),{email:identity.email}),{});assert.equal((await cmd('read',session)).status,'completed');
});

test('legacy browser start records its notification owner without issuing a second staff claim',async()=>{const {lead_owner,...legacy}=identity;const r=await cmd('start',null,hash(),legacy);assert.equal(r.start_identity,null);assert.equal(await one('select lead_status from private.vitality_resume_mail_attempts'),'legacy_browser');});
