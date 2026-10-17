// Fictional answers only. The named founder Auth identities below are LOCAL test actors.
const {randomUUID}=require('node:crypto');
const answers={assessment_for:[{type:'radio',checked:true,value:'Myself'}],water_intake_consistency:[{type:'select-one',value:'Never'}],water_intake:[{type:'number',value:'0'}],hydration_symptoms:[{type:'checkbox',checked:true,value:'None of these'}],nutrition_notes:[{type:'textarea',value:'FICTIONAL_RAW_SOURCE_ONLY <img src=x onerror=alert(1)>'}]};
async function seed(db){
 const q=(s,p=[])=>db.query(s,p),v=async(s,p=[])=>Object.values((await q(s,p)).rows[0])[0],sessions=new Map();
 async function user(email,role='owner',scope='all'){
  const id=randomUUID(),sid=randomUUID();await q('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())',[id,email]);await q('insert into auth.sessions(id,user_id) values($1,$2)',[sid,id]);sessions.set(id,sid);
  if(role){await q("insert into public.staff_access(user_id,role,status,onboarding_status,contact_scope) values($1,$2,'active','complete',$3)",[id,role,scope]);for(const key of ['crm.view','health.private.view','health.progress.manage'])await q('insert into public.staff_permission_overrides(user_id,permission_key,allowed,updated_by) values($1,$2,true,$1) on conflict(user_id,permission_key) do update set allowed=true',[id,key]);}
  return id;
 }
 await q("insert into public.staff_permission_catalog(permission_key,label,category,active) values('health.progress.manage','Manage health','Health',true) on conflict do nothing");
 const justyn=await user('justyn@revitalizedacademy.com'),elle=await user('elle@revitalizedacademy.com'),owner=await user('other-owner@example.invalid'),admin=await user('admin@example.invalid','admin'),coach=await user('coach@example.invalid','coach','assigned'),member=await user('member@example.invalid',null);
 const contact=await v("insert into public.contacts(first_name,last_name,email,lifecycle_stage) values('Fictional','B4','b4@example.invalid','assessment_lead') returning id");
 const workflow=await v("insert into public.workflow_records(contact_id,workflow_type,status,current_step,completion_percent,completed_at) values($1,'vitality_assessment','completed','complete',100,now()) returning id",[contact]);
 const draft=await v("insert into private.vitality_assessment_drafts(contact_id,workflow_id,recipient,identity,snapshot,status,verified_at,session_hash,recovery_hash,completed_at,final_form) values($1,$2,'b4@example.invalid','{}',$3,'completed',now(),encode(extensions.gen_random_bytes(32),'hex'),encode(extensions.gen_random_bytes(32),'hex'),now(),'assessment_summary=FICTIONAL_STORED_SUMMARY&coach_review_flags=None+reported') returning id",[contact,workflow,JSON.stringify({version:1,pathway:'Adult',fields:answers})]);
 const report=await v('insert into public.vitality_reports(contact_id,workflow_id) values($1,$2) returning id',[contact,workflow]);
 const fingerprint=await v("select encode(extensions.digest(jsonb_build_object('snapshot',snapshot,'final_form',final_form)::text,'sha256'),'hex') from private.vitality_assessment_drafts where id=$1",[draft]);
 const enroll=(active=true,write=false,hash=fingerprint)=>q('select private.roadmap_b4_set_cohort($1,$2,$3,$4,$5,$6)',[report,active,write,hash,justyn,'LOCAL FICTIONAL explicit review approval']);
 let actorTail=Promise.resolve();
 function actor(...args){const operation=actorTail.then(()=>runActor(...args));actorTail=operation.catch(()=>{});return operation;}
 async function runActor(uid,action,id=report,payload={},role='authenticated',claims={}){
  await q('savepoint b4_actor');try{await q('set local role '+role);await q("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true),set_config('request.jwt.claims',$3,true)",[uid||'',role,JSON.stringify({sub:uid,role,iss:'https://voalfpxiyznnqfcqcymd.supabase.co/auth/v1',session_id:sessions.get(uid),...claims})]);const result=await v('select public.roadmap_b4($1,$2,$3)',[action,id,JSON.stringify(payload)]);await q('reset role');await q('release savepoint b4_actor');return result;}
  catch(e){await q('rollback to savepoint b4_actor');await q('release savepoint b4_actor');throw e;}
 }
 return{q,v,justyn,elle,owner,admin,coach,member,contact,workflow,draft,report,fingerprint,enroll,actor,sessions,drain:()=>actorTail};
}
module.exports={answers,seed};
