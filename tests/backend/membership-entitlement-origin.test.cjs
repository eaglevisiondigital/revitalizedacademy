const {test,before,after,beforeEach,afterEach}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {Client}=require('pg');
if(!/^rva_gate_\d+_\d+$/.test(process.env.RVA_TEST_DATABASE||''))throw Error('Run npm run test:backend; isolated database required');
const db=new Client();
const q=(sql,args=[])=>db.query(sql,args);
const scalar=async(sql,args=[])=>Object.values((await q(sql,args)).rows[0])[0];
let member,other,contact,otherContact,program,membership,otherMembership;

async function actor(uid,sql,args=[],role='authenticated'){
  await q('SAVEPOINT entitlement_actor');
  try{
    await q('SET LOCAL ROLE '+role);
    await q("SELECT set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true)",[uid||'',role]);
    const result=await q(sql,args);
    await q('RESET ROLE');
    await q("SELECT set_config('request.jwt.claim.sub','',true),set_config('request.jwt.claim.role','',true)");
    await q('RELEASE SAVEPOINT entitlement_actor');
    return result;
  }catch(error){
    await q('ROLLBACK TO SAVEPOINT entitlement_actor');
    await q('RELEASE SAVEPOINT entitlement_actor');
    throw error;
  }
}

async function createUser(label){
  const id=randomUUID();
  await q('INSERT INTO auth.users(id,email,email_confirmed_at) VALUES($1,$2,now())',[id,`${label}-${id}@example.invalid`]);
  return {id,contact:await scalar('SELECT contact_id FROM public.profiles WHERE user_id=$1',[id])};
}

before(()=>db.connect());
after(()=>db.end());
beforeEach(async()=>{
  await q('BEGIN');
  ({id:member,contact}=await createUser('member'));
  ({id:other,contact:otherContact}=await createUser('other'));
  program='entitlement-'+randomUUID();
  await q("INSERT INTO public.program_catalog(program_code,name,program_type) VALUES($1,'Synthetic entitlement program','membership')",[program]);
  membership=await scalar("INSERT INTO public.client_memberships(primary_contact_id,program_code,status) VALUES($1,$2,'pending') RETURNING id",[contact,program]);
  otherMembership=await scalar("INSERT INTO public.client_memberships(primary_contact_id,program_code,status) VALUES($1,$2,'pending') RETURNING id",[otherContact,program]);
  await q("INSERT INTO public.client_access(contact_id,membership_id,user_id,status) VALUES($1,$2,$3,'active'),($4,$5,$6,'active')",[contact,membership,member,otherContact,otherMembership,other]);
  await q("INSERT INTO public.program_entitlement_templates(program_code,entitlement_key,label,active) VALUES($1,'community','Community',true)",[program]);
  await q(`INSERT INTO public.membership_entitlements
    (membership_id,entitlement_key,label,status,provisioning_source,metadata)
    VALUES
    ($1,'nutrition_plans','Meal Plans','active','membership_override','{"approved_scope":"synthetic membership only"}'),
    ($1,'fitness_plans','Workout Plans','active','membership_override','{"approved_scope":"synthetic membership only"}'),
    ($1,'family_profiles','Family Profiles','inactive','membership_override','{"revoked":true}'),
    ($1,'ai_advisor','Unbacked template benefit','active','program_template','{}')`,[membership]);
});
afterEach(()=>q('ROLLBACK'));

test('approved membership-level nutrition and fitness survive pending to active reconciliation',async()=>{
  await q("UPDATE public.client_memberships SET status='active' WHERE id=$1",[membership]);
  const rows=(await q("SELECT entitlement_key,status,provisioning_source FROM public.membership_entitlements WHERE membership_id=$1 ORDER BY entitlement_key",[membership])).rows;
  const byKey=Object.fromEntries(rows.map(row=>[row.entitlement_key,row]));
  for(const key of ['nutrition_plans','fitness_plans']){
    assert.equal(byKey[key].status,'active');
    assert.equal(byKey[key].provisioning_source,'membership_override');
  }
});

test('revoked override and unbacked template benefit remain inactive',async()=>{
  await q("UPDATE public.client_memberships SET status='active' WHERE id=$1",[membership]);
  assert.equal(await scalar("SELECT status FROM public.membership_entitlements WHERE membership_id=$1 AND entitlement_key='family_profiles'",[membership]),'inactive');
  assert.equal(await scalar("SELECT status FROM public.membership_entitlements WHERE membership_id=$1 AND entitlement_key='ai_advisor'",[membership]),'inactive');
  await q("UPDATE public.client_memberships SET status='pending' WHERE id=$1",[membership]);
  await q("UPDATE public.client_memberships SET status='active' WHERE id=$1",[membership]);
  assert.equal(await scalar("SELECT status FROM public.membership_entitlements WHERE membership_id=$1 AND entitlement_key='ai_advisor'",[membership]),'inactive');
});

test('template-derived entitlement reconciliation remains unchanged',async()=>{
  await q("UPDATE public.client_memberships SET status='active' WHERE id=$1",[membership]);
  assert.equal(await scalar("SELECT status FROM public.membership_entitlements WHERE membership_id=$1 AND entitlement_key='community'",[membership]),'active');
  assert.equal(await scalar("SELECT provisioning_source FROM public.membership_entitlements WHERE membership_id=$1 AND entitlement_key='community'",[membership]),'program_template');
  await q("UPDATE public.program_entitlement_templates SET active=false WHERE program_code=$1 AND entitlement_key='community'",[program]);
  assert.equal(await scalar("SELECT status FROM public.membership_entitlements WHERE membership_id=$1 AND entitlement_key='community'",[membership]),'inactive');
  await q("UPDATE public.program_entitlement_templates SET active=true WHERE program_code=$1 AND entitlement_key='community'",[program]);
  assert.equal(await scalar("SELECT status FROM public.membership_entitlements WHERE membership_id=$1 AND entitlement_key='community'",[membership]),'active');
});

test('membership overrides never leak to another membership',async()=>{
  await q("UPDATE public.client_memberships SET status='active' WHERE id IN ($1,$2)",[membership,otherMembership]);
  const otherStoredKeys=(await q("SELECT entitlement_key FROM public.membership_entitlements WHERE membership_id=$1 ORDER BY entitlement_key",[otherMembership])).rows.map(row=>row.entitlement_key);
  assert(!otherStoredKeys.includes('nutrition_plans'));
  assert(!otherStoredKeys.includes('fitness_plans'));
  const otherVisibleKeys=(await actor(other,"SELECT entitlement_key FROM public.membership_entitlements ORDER BY entitlement_key")).rows.map(row=>row.entitlement_key);
  assert(!otherVisibleKeys.includes('nutrition_plans'));
  assert(!otherVisibleKeys.includes('fitness_plans'));
  assert.equal((await actor(member,"SELECT entitlement_key FROM public.membership_entitlements WHERE membership_id=$1",[otherMembership])).rowCount,0);
});

test('member cannot create, reactivate or reclassify membership benefits directly',async()=>{
  assert.equal((await actor(member,"UPDATE public.membership_entitlements SET status='active',provisioning_source='membership_override' WHERE membership_id=$1 AND entitlement_key='family_profiles' RETURNING id",[membership])).rowCount,0);
  await assert.rejects(actor(member,"INSERT INTO public.membership_entitlements(membership_id,entitlement_key,label,provisioning_source) VALUES($1,'tracking','Tracking','membership_override')",[membership]),/row.level|permission/i);
});
