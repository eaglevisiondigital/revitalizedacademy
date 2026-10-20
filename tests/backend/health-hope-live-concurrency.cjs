const {test}=require('node:test'),assert=require('node:assert/strict'),{Client}=require('pg'),{randomUUID,createHash}=require('node:crypto');
if(process.env.PGHOST!=='127.0.0.1'||!/^rva_hhl_gate_\d+_\d+$/.test(process.env.RVA_TEST_DATABASE||''))throw Error('Disposable local event database required');
test('eight simultaneous registrations produce one master contact, one session registration and one confirmation',async()=>{
 const admin=new Client();await admin.connect();let clients=[];
 try{
  const id=randomUUID(),email=randomUUID()+'@example.invalid';
  await admin.query('update private.hhl_settings set registration_enabled=true');
  await admin.query("insert into private.hhl_sessions(id,regular_date,starts_at,closes_at,status,manual_join_url) values($1,'2027-05-06','2027-05-06T22:30:00Z','2027-05-06T22:30:00Z','published','https://zoom.us/j/12345678901?pwd=fictional')",[id]);
  clients=await Promise.all(Array.from({length:8},async()=>{const c=new Client();await c.connect();return c;}));
  await Promise.all(clients.map((c,n)=>c.query("set role service_role").then(()=>c.query('select public.hhl_service_command($1,$2)',['register',{request_id:randomUUID(),session_id:id,first_name:'Concurrent',last_name:'Visitor',email,event_notifications:true,marketing_requested:false,source:'health_hope_live_website',guest_model_version:'hhl-guest-v1',ip_hash:createHash('sha256').update('fictional-'+n).digest('hex')}]))));
  assert.equal(Number((await admin.query('select count(*) n from public.contacts where email=$1',[email])).rows[0].n),1);
  assert.equal((await admin.query('select lifecycle_stage from public.contacts where email=$1',[email])).rows[0].lifecycle_stage,'registered_guest');
  assert.equal(Number((await admin.query("select count(*) n from public.contact_tags t join public.contacts c on c.id=t.contact_id where c.email=$1 and tag='health_hope_live_guest'",[email])).rows[0].n),1);
  assert.equal(Number((await admin.query('select count(*) n from private.hhl_registrations where session_id=$1',[id])).rows[0].n),1);
  assert.equal(Number((await admin.query("select count(*) n from private.hhl_jobs j join private.hhl_registrations r on r.id=j.registration_id where r.session_id=$1 and kind='confirmation'",[id])).rows[0].n),1);
 }finally{await Promise.all(clients.map(c=>c.end()));await admin.end();}
});
