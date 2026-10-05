import {edgeEnvironment,configurationError,assertSyntheticRecipient} from '../_shared/environment.ts';
type RPC=(action:string,hash:string|null,next:string|null,payload:Record<string,unknown>)=>Promise<any>;
export type Dependencies={rpc:RPC;mail:(recipient:string,url:string)=>Promise<void>;final:(form:string)=>Promise<void>};
export const opaque=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
export async function digest(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');}
const neutral={ok:true,message:'If an unfinished assessment is available, we’ll email a secure link. Please check your inbox and spam folder.'};
const referralSources=new Set(['Facebook','Instagram','Google Search','YouTube','LinkedIn','TikTok','Friend / Family','Existing Client','Event / Webinar','Church / Community','Podcast','Email','Sales Rep','Other']);
export function validSnapshot(s:any){
 if(!s||s.version!==1||!Number.isInteger(s.section)||s.section<0||s.section>30||!Number.isInteger(s.percent)||s.percent<0||s.percent>99||!['Adult','Child (ages 0–18)'].includes(s.pathway)||typeof s.section_label!=='string'||s.section_label.length>160||!s.fields||Array.isArray(s.fields)||typeof s.fields!=='object')return false;
 if(Object.keys(s.fields).length>1600)return false;
 return Object.entries(s.fields).every(([key,rows]:[string,any])=>/^[a-zA-Z0-9_-]{1,160}$/.test(key)&&!['__proto__','constructor','prototype'].includes(key)&&Array.isArray(rows)&&rows.length<=100&&rows.every((r:any)=>r&&['text','email','tel','number','range','radio','checkbox','select-one','select-multiple','textarea'].includes(r.type)&&((typeof r.value==='string'&&r.value.length<=15000)||(typeof r.value==='number'&&Number.isFinite(r.value))||(Array.isArray(r.value)&&r.value.every((v:any)=>typeof v==='string'&&v.length<1000)))&&(r.checked===undefined||typeof r.checked==='boolean')));
}
// Same approved derived-tag rules as the assessment bridge; inspect saved active controls only.
export function assessmentTags(snapshot:any):string[]{
 const values:string[]=[];
 for(const [name,rows] of Object.entries(snapshot?.fields||{}) as [string,any[]][]){
  for(const r of rows){if(r.checked||['select-one','select-multiple'].includes(r.type)||(r.type==='textarea'&&/(goal|concern|symptom|condition|challenge|priority)/i.test(name)))values.push(String(r.value||''));}
 }
 const text=values.join(' ').toLowerCase();
 const rules:[RegExp,string][]=[
  [/low energy|lack of energy|energy crash|energy level/,'concern:low-energy'],[/fatigue|fatigued|exhausted|always tired|tiredness/,'concern:fatigue'],[/pain|aching|aches|joint pain|back pain|neck pain/,'concern:pain'],[/sleep|insomnia|waking at night|poor sleep/,'concern:sleep'],[/stress|overwhelm|anxiety/,'concern:stress'],[/digest|digestion|gut|bloat|bloating|constipat|reflux/,'concern:digestion'],[/chronic|long-term condition|long term condition/,'concern:chronic-condition'],[/energy|energetic/,'goal:energy'],[/weight|fat loss|lose weight/,'goal:weight'],[/strength|stronger|muscle/,'goal:strength'],[/mobility|flexibility|move better/,'goal:mobility'],[/longevity|live longer|healthy aging|age well/,'goal:longevity'],[/family|children|kids|spouse/,'goal:family-health']
 ];return rules.filter(([pattern])=>pattern.test(text)).map(([,tag])=>tag);
}
export function createHandler(deps:Dependencies){return async(req:Request)=>{
 const bad=configurationError();if(bad)return bad;
 const env=edgeEnvironment(),origin=req.headers.get('origin');
 const headers={'Access-Control-Allow-Origin':env.appOrigin,'Access-Control-Allow-Headers':'content-type,apikey','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json','Cache-Control':'no-store','Referrer-Policy':'no-referrer','Vary':'Origin'};
 const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(origin!==env.appOrigin)return reply({error:'Origin not allowed'},403);
 if(req.method==='OPTIONS')return reply({});
 if(req.method!=='POST')return reply({error:'Method not allowed'},405);
 try{
  const raw=await req.text();if(raw.length>600000)return reply({error:'Request too large'},413);
  const body=JSON.parse(raw),action=body.action;
  if(['start','recover'].includes(action)){
   const email=String(body.email||'').trim().toLowerCase();
   if(body.website||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return reply(neutral);
   if(action==='start'&&(!String(body.first_name||'').trim()||!String(body.last_name||'').trim()||!String(body.phone||'').trim()))return reply({error:'Contact details are required'},400);
   const referralSource=String(body.referral_source||'').trim();
   const salesRepName=referralSource==='Sales Rep'?String(body.sales_rep_name||'').trim():'';
   const referralSourceOther=referralSource==='Other'?String(body.referral_source_other||'').trim():'';
   if(action==='start'&&(!referralSources.has(referralSource)||(referralSource==='Sales Rep'&&!salesRepName)||(referralSource==='Other'&&!referralSourceOther)||salesRepName.length>160||referralSourceOther.length>240))return reply({error:'Referral details are required'},400);
   try{assertSyntheticRecipient(email);}catch{return reply(neutral);}
   const token=opaque(),hash=await digest(token);
   const data=await deps.rpc(action,null,hash,{email,first_name:String(body.first_name||'').slice(0,100),last_name:String(body.last_name||'').slice(0,100),phone:String(body.phone||'').slice(0,40),referral_source:referralSource,sales_rep_name:salesRepName,referral_source_other:referralSourceOther});
   if(data.recipient){
    try{await deps.mail(data.recipient,env.appOrigin+'/consult.html#resume='+token);}
    catch{await deps.rpc('cancel_mail',hash,null,{});return reply(neutral);}
   }
   return reply(neutral);
  }
  if(!['redeem','read','save','finalize'].includes(action))return reply({error:'Invalid action'},400);
  if(typeof body.token!=='string'||!/^[a-f0-9]{64}$/.test(body.token))return reply({error:'This link is unavailable. Request another email link.'},401);
  const hash=await digest(body.token);
  if(action==='redeem'){
   const token=opaque(),data=await deps.rpc('redeem',hash,await digest(token),{});
   return reply(data.status==='draft'?{...data,token}:data);
  }
  const expected=body.draft_id?{draft_id:body.draft_id}:{};
  if(action==='read')return reply(await deps.rpc('read',hash,null,expected));
  if(action==='save'){
   if(!Number.isInteger(body.revision)||!validSnapshot(body.snapshot))return reply({error:'Invalid assessment data'},400);
   return reply(await deps.rpc('save',hash,null,{...expected,revision:body.revision,snapshot:body.snapshot}));
  }
  if(!Number.isInteger(body.revision)||typeof body.form!=='string'||body.form.length>500000)return reply({error:'Invalid final submission'},400);
  const current=await deps.rpc('read',hash,null,expected);
  if(current.status!=='draft')return reply(current);
  const params=new URLSearchParams(body.form);
  if(params.get('form-name')!=='vitality-assessment'||params.get('email')?.toLowerCase()!==current.identity.email||!params.get('assessment_summary')||params.get('bot-field'))return reply({error:'Invalid final submission'},400);
  // Override all respondent identity with the verified draft identity.
  for(const [key,value]of Object.entries(current.identity))params.set(key,String(value||''));
  params.set('assessment_resume_id',current.draft_id);
  const ticket=await digest(opaque());
  const prepared=await deps.rpc('prepare_final',hash,ticket,{...expected,revision:body.revision,form:params.toString()});
  if(prepared.status!=='dispatch')return reply(prepared);
  try{await deps.final(params.toString());}
  catch{await deps.rpc('uncertain_final',hash,ticket,{});return reply({status:'delivery_uncertain'},409);}
  // If this commit fails, never send the Netlify form again automatically.
  return reply(await deps.rpc('finish_final',hash,ticket,{derived_tags:assessmentTags(current.snapshot)}));
 }catch(error){
  // Never serialize/log database/provider errors, request bodies, tokens or answers.
  const code=(error as {code?:string})?.code;
  return reply({error:code==='40001'?'Your assessment changed in another session. Reopen your secure link before continuing.':code==='42501'?'This link is unavailable. Request another email link.':'We couldn’t save your latest changes. Please try again.'},code==='40001'?409:code==='42501'?401:503);
 }
};}
