import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {HEALTH_HOPE_MEETING as meeting} from '../netlify/functions/_shared/health-hope-live-meeting.mjs';
import {createHealthHopeApp,emailForJob,zoomClient} from '../netlify/functions/_shared/health-hope-live.mjs';
const origin='https://revitalizedacademy.com',values={RVA_HHL_ORIGIN:origin,RVA_HHL_SUPABASE_URL:'https://voalfpxiyznnqfcqcymd.supabase.co',RVA_HHL_SUPABASE_ANON_KEY:'fictional-publishable-key'};
const env={get:key=>values[key]},context={site:{id:'ece0f6f3-6c3d-46e6-bb51-95ce1ccefb06'}};
const request=(action='staff',jwt=true)=>new Request(origin+'/api/health-hope-live/'+action,{method:'POST',headers:{origin,'Content-Type':'application/json',...(jwt?{authorization:'Bearer fictional.staff.jwt'}:{})},body:JSON.stringify({action:'overview',data:{}})});
test('provided meeting is a frozen server-only manual setup with no implied validation or activation',()=>{
 assert(Object.isFrozen(meeting));assert.equal(meeting.meeting_id,'82516112925');assert.equal(meeting.join_url,'https://us02web.zoom.us/j/82516112925');assert.equal(meeting.join_mode,'manual');assert.equal(meeting.zoom_schedule,'no_fixed_time');assert.equal(meeting.verification_status,'provided_unverified');assert.equal(meeting.automatic_attendance_verified,false);assert.equal(meeting.automatic_registration_compatible,false);assert.equal(meeting.timezone,'America/New_York');assert.equal(meeting.local_time,'18:30');assert.equal(meeting.duration_minutes,30);
});
test('only successfully authorized managers receive the meeting preparation data through their own staff JWT',async()=>{
 let calls=0;const a=createHealthHopeApp(env,{context,fetcher:async(_url,options)=>{calls++;assert.equal(options.headers.Authorization,'Bearer fictional.staff.jwt');assert.equal(options.headers.apikey,'fictional-publishable-key');return Response.json({can_manage:true,sessions:[]});}});
 assert.equal((await a.handle(request('staff',false))).status,401);assert.equal(calls,0);const response=await a.handle(request());assert.equal(response.headers.get('Cache-Control'),'no-store');const {join_url,...setup}=meeting;assert.deepEqual((await response.json()).meeting_setup,setup);assert.equal(calls,1);
});
test('provided link enters only existing authorized audited draft commands; overrides and publication/editing are preserved',async()=>{
 for(const[action,data,expected]of [
  ['prepare-weekly',{manual_join_url:''},meeting.join_url],
  ['prepare-weekly',{manual_join_url:'https://zoom.us/j/99999999999'},'https://zoom.us/j/99999999999'],
  ['session-save',{status:'draft',join_mode:'manual',manual_join_url:''},meeting.join_url],
  ['session-save',{status:'published',join_mode:'manual',manual_join_url:''},''],
  ['session-save',{id:'existing-session',status:'draft',join_mode:'manual',manual_join_url:''},''],
  ['session-save',{status:'draft',join_mode:'manual',zoom_meeting_id:'99999999999',manual_join_url:''},''],
 ]){
  let observed;const a=createHealthHopeApp(env,{context,fetcher:async(_url,options)=>{observed=JSON.parse(options.body);assert.equal(options.headers.Authorization,'Bearer fictional.staff.jwt');return Response.json({saved:true});}});
  const r=new Request(origin+'/api/health-hope-live/staff',{method:'POST',headers:{origin,'Content-Type':'application/json',authorization:'Bearer fictional.staff.jwt'},body:JSON.stringify({action,data})});assert.equal((await a.handle(r)).status,200);assert.equal(observed.p_action,action);assert.equal(observed.p_data.manual_join_url,expected);
 }
});
test('read-only staff and denied sessions cannot receive meeting setup metadata',async()=>{
 for(const[body,status]of [[{can_manage:false,sessions:[]},200],[{code:'42501'},403]]){const a=createHealthHopeApp(env,{context,fetcher:async()=>Response.json(body,{status})});const response=await a.handle(request());const text=await response.text();assert(!text.includes(meeting.meeting_id));assert(!text.includes('meeting_setup'));if(status===403)assert.equal(response.status,403);}
});
test('configuration alone leaves registration, normal worker and retention held without network requests',async()=>{
 const a=createHealthHopeApp(env,{context,fetcher:()=>{throw Error('Unexpected provider/database call');}});assert.equal((await a.handle(request('register',false))).status,503);assert.deepEqual(await a.worker(),{held:true,processed:0});assert.deepEqual(await a.retention(),{held:true});const response=await a.handle(new Request(origin+'/api/health-hope-live/sessions'));assert.deepEqual(await response.json(),{sessions:[],timezone:'America/New_York'});
});
test('No Fixed Time Zoom meeting is rejected by the existing per-occurrence registration adapter',async()=>{
 const e={get:key=>({RVA_HHL_ZOOM_ACCOUNT_ID:'fictional-account',RVA_HHL_ZOOM_CLIENT_ID:'fictional-client',RVA_HHL_ZOOM_CLIENT_SECRET:'fictional-secret',RVA_HHL_ZOOM_MEETING_ID:meeting.meeting_id})[key]};let writes=0;
 const z=zoomClient(e,async(url,options)=>{if(url==='https://zoom.us/oauth/token')return Response.json({access_token:'fictional-token',expires_in:3600});if(options.method==='POST')writes++;return Response.json({id:meeting.meeting_id,type:3});});await assert.rejects(z.meeting(meeting.meeting_id),/zoom_meeting_requires_review/);assert.equal(writes,0);
});
test('confirmation and reminder show the selected date and correct Eastern DST while reusing the exact shared link',()=>{
 for(const kind of ['confirmation','reminder'])for(const[starts_at,date,zone]of [['2026-10-22T22:30:00Z','October 22, 2026','EDT'],['2026-11-05T23:30:00Z','November 5, 2026','EST']]){
  const mail=emailForJob({kind,join_mode:'manual',starts_at,join_url:meeting.join_url});assert(mail.text.includes(date));assert(mail.text.includes('6:30 PM '+zone));assert(mail.text.includes(meeting.join_url));assert(mail.text.includes('shared recurring Zoom link'));assert(!mail.text.includes('Your private joining link'));assert(mail.text.includes('registration is for the session above'));
 }
 const canceled=emailForJob({kind:'cancellation',join_mode:'manual',starts_at:'2026-10-22T22:30:00Z',join_url:meeting.join_url});assert(!canceled.text.includes(meeting.join_url));
});
test('approved public files contain no provided meeting ID or URL and server setup module is excluded from static publication',()=>{
 const files=JSON.parse(readFileSync('config/production-public-files.json'));assert(!files.some(file=>file.includes('health-hope-live-meeting.mjs')));for(const file of ['index.html','health-hope-live.html','js/health-hope-live.js','portal/health-hope-live.html','portal/health-hope-live.js'])assert(!readFileSync(file,'utf8').includes(meeting.meeting_id),file);
});
