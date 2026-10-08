const {test,before,after,beforeEach,afterEach}=require('node:test');
const assert=require('node:assert/strict'),{Client}=require('pg'),{randomBytes,randomUUID}=require('node:crypto');
if(!/^rva_gate_\d+_\d+$/.test(process.env.RVA_TEST_DATABASE||''))throw Error('Disposable database required');
const db=new Client(),q=(s,p=[])=>db.query(s,p),one=async(s,p=[])=>Object.values((await q(s,p)).rows[0])[0];
const hash=()=>randomBytes(32).toString('hex'),identity={email:'repair@example.invalid',first_name:'Synthetic',last_name:'Repair',phone:'0000000000',referral_source:'Google Search',lead_owner:'edge'};
const cmd=async(a,h=null,n=null,p={})=>one('select public.vitality_resume_command($1,$2,$3,$4)',[a,h,n,p]);
async function deny(action,h,n=null,p={}){await q('savepoint denied');try{await assert.rejects(cmd(action,h,n,p),/Resume unavailable|permission denied/);}finally{await q('rollback to denied');await q('release denied');}}
const relax=()=>q('delete from private.vitality_resume_rate_limits');
const start=async()=>{const mail=hash(),result=await cmd('start',null,mail,{...identity,request_id:randomUUID()});return {mail,result};};
before(async()=>{await db.connect();await q("insert into public.journey_definitions(journey_key,name,audience) values('assessment_first','Synthetic','lead') on conflict do nothing");await q("insert into public.journey_step_definitions(journey_key,step_key,step_order,name,step_type) values('assessment_first','vitality_assessment',1,'Synthetic','assessment') on conflict do nothing");});after(()=>db.end());
test('eight independent PostgreSQL workers replay the same start after overlapping on a server barrier',async()=>{
 const lock=7820193,workers=Array.from({length:8},()=>new Client());await Promise.all(workers.map(c=>c.connect()));
 try{
  await q('select pg_advisory_lock($1)',[lock]);const pids=await Promise.all(workers.map(async c=>{await c.query('begin');return (await c.query('select pg_backend_pid() pid')).rows[0].pid;}));assert.equal(new Set(pids).size,8);
  const pending=workers.map(async c=>{await c.query('select pg_advisory_xact_lock_shared($1)',[lock]);const r=await c.query('select public.vitality_resume_command($1,null,$2,$3) result',['start',hash(),{...identity,email:'race@example.invalid',request_id:randomUUID()}]);await c.query('commit');return r.rows[0].result;});
  let waiting=0;for(let n=0;n<150;n++){waiting=Number(await one("select count(*) from pg_stat_activity where pid=any($1::int[]) and wait_event='advisory'",[pids]));if(waiting===8)break;await new Promise(r=>setTimeout(r,20));}assert.equal(waiting,8);await q('select pg_advisory_unlock($1)',[lock]);
  const results=await Promise.all(pending);assert.equal(results.filter(r=>r.recipient).length,1);assert.equal(results.filter(r=>r.start_identity).length,1);assert.equal(Number(await one("select count(*) from public.contacts where email='race@example.invalid'")),1);assert.equal(Number(await one("select count(*) from private.vitality_assessment_drafts where recipient='race@example.invalid'")),1);
 }finally{await q('select pg_advisory_unlock($1)',[lock]);await Promise.all(workers.map(c=>c.end()));}
});
