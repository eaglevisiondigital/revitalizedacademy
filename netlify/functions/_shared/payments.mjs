import {gateway} from './authorize-net.mjs';
import {PaymentError,hash,newToken,tokenHash,validatePlan,verifySignature,transactionMetadata,nextMonth} from './payment-domain.mjs';
const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex'}});
export function paymentApp(env,{fetcher=fetch,providerFactory=gateway,clientIp}={}){
 const origin=env.get('RVA_PAYMENTS_ORIGIN'),url=env.get('RVA_PAYMENTS_SUPABASE_URL');
 if(!['https://revitalizedacademy.com','https://beta.revitalizedacademy.com','https://revitalizedacademy-staging.netlify.app'].includes(origin))throw new PaymentError('environment_not_configured',503);
 const expected=origin==='https://revitalizedacademy.com'?'voalfpxiyznnqfcqcymd':'bvooallokgfktssadsrv';
 if(url!=='https://'+expected+'.supabase.co')throw new PaymentError('environment_mismatch',503);
 async function rpc(name,data,jwt){
  const key=jwt?env.get('RVA_PAYMENTS_SUPABASE_ANON_KEY'):env.get('RVA_PAYMENTS_SUPABASE_SERVICE_ROLE_KEY');
  if(!key)throw new PaymentError('database_not_configured',503);
  let res;
  try{res=await fetcher(url+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+(jwt||key),'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(10000)});}catch{throw new PaymentError('database_unavailable',503);}
  if(!res.ok){const j=await res.json().catch(()=>({}));const safe=['link_unavailable','country_route_unavailable','plan_not_available','webinar_unconfigured','webinar_unavailable','webinar_full','payment_processing','nothing_due','consent_required','verified_sign_in_required','payments_unavailable','unbalanced_plan','existing_request_requires_recovery'];
   throw new PaymentError(safe.includes(j.message)?j.message:'request_not_available',res.status===401||res.status===403?403:409);}
  return res.json();
 }
 const command=(action,data={})=>rpc('payment_service_command',{p_action:action,p_data:data});
 function sandboxRecipient(email){
  if(env.get('RVA_PAYMENTS_MODE')!=='sandbox')return;
  const recipients=(env.get('RVA_PAYMENTS_SANDBOX_RECIPIENTS')||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
  if(recipients.some(s=>s.includes('*'))||!recipients.includes(String(email).toLowerCase()))throw new PaymentError('sandbox_recipient_not_allowed',403);
 }
 async function actor(req,required=false){
  const auth=req.headers.get('authorization');if(!auth){if(required)throw new PaymentError('sign_in_required',401);return{};}
  if(!auth.startsWith('Bearer '))throw new PaymentError('invalid_session',401);
  const jwt=auth.slice(7),key=env.get('RVA_PAYMENTS_SUPABASE_ANON_KEY');
  const res=await fetcher(url+'/auth/v1/user',{headers:{apikey:key,Authorization:auth},signal:AbortSignal.timeout(10000)});
  if(!res.ok)throw new PaymentError('invalid_session',401);const user=await res.json();
  if(!user.id||!user.email_confirmed_at)throw new PaymentError('verified_sign_in_required',403);
  return{jwt,actor_id:user.id,actor_email:user.email};
 }
 async function configured(){const c=await command('configuration'),mode=env.get('RVA_PAYMENTS_MODE');
  const expectedMode=origin==='https://revitalizedacademy.com'?'live':'sandbox';
  if(mode!==expectedMode||!c.enabled||!c.canadian_currency_verified||c.provider_mode!==mode||env.get('RVA_PAYMENTS_ENABLED')!=='true')throw new PaymentError('payments_unavailable',503);
  return c;
 }
 async function storeProfile(requestId,transactionId){
  const r=await command('profile_claim',{request_id:requestId});if(!r)return;
  const ids=await providerFactory(env,fetcher).profileFromTransaction(r,transactionId);
  if(!/^\d+$/.test(ids.customer_profile_id)||!/^\d+$/.test(ids.payment_profile_id))throw new PaymentError('profile_requires_review',409);
  await command('profile_saved',{request_id:r.id,...ids});
 }
 async function reconcile(p,id){
  let tx=transactionMetadata(await p.details(id),p.mode);
  if(tx.provider_currency&&tx.provider_currency!=='CAD')throw new PaymentError('provider_currency_mismatch',409);
  if(tx.original_transaction_id&&tx.status==='refunded'){
   const original=transactionMetadata(await p.details(tx.original_transaction_id),p.mode);
   if(tx.amount_cents!==original.amount_cents)throw new PaymentError('partial_refund_requires_review',409);
   tx={...original,status:'refunded'};
  }
  const result=await command('reconcile',tx);
  if(result.profile_required)await storeProfile(result.request_id,tx.provider_transaction_id);
  return result;
 }
 async function setupRecurring(r,schedule){
  if(r.plan!=='monthly')return;
  const claimed=await command('subscription_claim',{request_id:r.id});if(!claimed)return;
  const first=schedule[0];if(!first)throw new PaymentError('schedule_requires_review',409);
  const id=await providerFactory(env,fetcher).subscription(claimed,first.due_at,['paid','settled'].includes(first.status));
  const firstPaid=['paid','settled'].includes(first.status);
  await command('subscription_saved',{request_id:r.id,subscription_id:id,first_number:firstPaid?2:1,start_at:firstPaid?nextMonth(first.due_at):first.due_at});
 }
 return{
  async handle(req){
   try{
    if(req.method!=='POST'||req.headers.get('origin')!==origin)throw new PaymentError('request_not_allowed',403);
    if(Number(req.headers.get('content-length')||0)>16000)throw new PaymentError('request_too_large',413);
    const raw=await req.text();if(raw.length>16000)throw new PaymentError('request_too_large',413);
    let body;try{body=JSON.parse(raw);}catch{throw new PaymentError('invalid_request');}
    const action=new URL(req.url).pathname.split('/').at(-1),identity=await actor(req,action.startsWith('staff-'));
    const input={token_hash:body.token?tokenHash(body.token):null,...identity};delete input.jwt;
    if(action==='summary')return response(await command('summary',input));
    if(action==='staff-list')return response(await rpc('staff_list_payment_requests',{p_contact:body.contact_id},identity.jwt));
    if(action==='staff-create'){
     const spec=validatePlan({...body,route:body.merchant_route,mode:body.plan});
     const token=newToken();await rpc('staff_create_payment_request',{p_contact:body.contact_id,p_data:{...spec,plan:spec.mode},p_token_hash:hash(token),p_nonce:body.nonce},identity.jwt);
     return response({url:origin+'/pay/'+token});
    }
    await configured();const p=providerFactory(env,fetcher);
    if(action==='webinar-start'){
     const token=newToken(),now=new Date().toISOString();
     sandboxRecipient(body.email);
     if(identity.actor_email&&identity.actor_email.toLowerCase()!==String(body.email).toLowerCase())throw new PaymentError('account_email_mismatch',403);
     await command('webinar_start',{first_name:body.first_name,last_name:body.last_name,email:body.email,nonce:body.nonce,token_hash:hash(token),ip_hash:clientIp?hash(clientIp):null,product:'webinar',description:'ReVitalized Roadmap to a Healthy You Webinar',country:body.country,currency:'CAD',merchant_route:'CA_AUTHORIZE_NET',plan:'one_time',total_cents:5000,schedule:[{amount_cents:5000,due_at:now}],payer_email:body.email});
     return response({url:origin+'/pay/'+token});
    }
    if(action==='begin'){
     sandboxRecipient((await command('poll',input)).request.payer_email);
     const ctx=await command('begin',{...input,consent_version:body.consent===true?'payments-v1':null});
     if(ctx.profile_only){
      let r=ctx.request;
      if(!r.customer_profile_id){const claimed=await command('profile_claim',{request_id:r.id});if(!claimed)throw new PaymentError('profile_requires_review',409);
       const id=await p.newProfile(r);await command('profile_saved',{request_id:r.id,customer_profile_id:id});r={...r,customer_profile_id:id};}
      return response(await p.cardForm(r,origin,body.token));
     }
     try{const form=await p.hosted(ctx,origin,body.token);await command('attempt_state',{attempt_id:ctx.attempt.id,status:'pending'});return response(form);}
     catch(e){await command('attempt_state',{attempt_id:ctx.attempt.id,status:'review'});throw e;}
    }
    if(action==='refresh'){
     let ctx=await command('poll',input);
     const refs=new Set(ctx.attempts.filter(a=>['processing','pending','review'].includes(a.status)).map(a=>a.reference));
     if(refs.size){for(const candidate of await p.unsettled())if(refs.has(candidate.invoiceNumber))await reconcile(p,String(candidate.transId));}
     for(const a of ctx.attempts)if(a.provider_transaction_id)await reconcile(p,a.provider_transaction_id);
     ctx=await command('poll',input);
     if(ctx.request.customer_profile_id&&ctx.request.recurring_state==='profile_ready'&&!ctx.request.payment_profile_id){
      const ids=await p.profileDetails(ctx.request.customer_profile_id);if(ids.length!==1)throw new PaymentError('profile_requires_review',409);
      await command('profile_saved',{request_id:ctx.request.id,customer_profile_id:ctx.request.customer_profile_id,payment_profile_id:ids[0]});
     }
     ctx=await command('poll',input);const summary=await command('summary',input);await setupRecurring(ctx.request,summary.schedule);
     return response(await command('summary',input));
    }
    if(action==='update-card'){
     const r=await command('card_context',input);if(!r.customer_profile_id)throw new PaymentError('profile_requires_review',409);
     sandboxRecipient(r.payer_email);
     return response(await p.cardForm(r,origin,body.token));
    }
    throw new PaymentError('invalid_request');
   }catch(e){return response({error:e instanceof PaymentError?e.code:'request_unavailable'},e instanceof PaymentError?e.status:503);}
  },
  async webhook(req){
   try{
    if(req.method!=='POST')return response({},405);
    const raw=await req.text();if(raw.length>32000)return response({},413);
    const mode=env.get('RVA_PAYMENTS_MODE'),signatureKey=env.get(mode==='sandbox'?'RVA_CA_ANET_SANDBOX_SIGNATURE_KEY':'RVA_CA_ANET_LIVE_SIGNATURE_KEY');
    if(!verifySignature(raw,req.headers.get('x-anet-signature'),signatureKey))return response({},401);
    await configured();const event=JSON.parse(raw);
    const allowed=['net.authorize.payment.authcapture.created','net.authorize.payment.authorization.created','net.authorize.payment.capture.created','net.authorize.payment.priorAuthCapture.created','net.authorize.payment.refund.created','net.authorize.payment.void.created','net.authorize.customer.subscription.failed','net.authorize.customer.subscription.suspended','net.authorize.customer.subscription.terminated'];
    if(!allowed.includes(event.eventType))return response({received:true});
    if(!/^[A-Za-z0-9-]{1,100}$/.test(event.notificationId||'')||!/^\d+$/.test(String(event.payload?.id||'')))return response({},400);
    await command('inbox',{notification_id:event.notificationId,event_type:event.eventType,entity_id:String(event.payload.id)});
    return response({received:true});
   }catch{return response({error:'webhook_not_accepted'},503);}
  },
  async worker(){
   await configured();const p=providerFactory(env,fetcher);let processed=0;
   for(const e of await command('inbox_claim')){
    try{if(e.event_type.includes('.subscription.'))await command('subscription_state',{subscription_id:e.entity_id});else await reconcile(p,e.entity_id);
     await command('inbox_done',{notification_id:e.notification_id});processed++;
    }catch{await command('inbox_done',{notification_id:e.notification_id,error_code:'provider_reconciliation_required'});}
    return {processed};
   }
   const ready=await command('recurring_ready');if(ready){await setupRecurring(ready.request,ready.summary.schedule);return {processed};}
   const due=await command('due_claim');
   if(due){try{sandboxRecipient(due.request.payer_email);await reconcile(p,await p.charge(due));}catch{await command('attempt_state',{attempt_id:due.attempt.id,status:'review'});}return {processed};}
   const transaction=await command('transaction_due');
   if(transaction){await reconcile(p,transaction.transaction_id);return {processed};}
   for(const job of await command('receipts_claim')){
    try{
     const r=job.request,key=env.get('RESEND_API_KEY'),from=env.get('REVITALIZED_EMAIL_FROM');if(!key||!from)throw Error();
     sandboxRecipient(r.payer_email);
     const amount=(job.amount_cents/100).toFixed(2)+' '+r.currency;
     const text='ReVitalized Academy\n\nPayment received: '+amount+'\n'+r.description+'\nTransaction: '+job.transaction_id+
      (r.product==='webinar'?'\nYour webinar registration is confirmed.':'\nYour payment is recorded. Enrollment/account access follows the separate enrollment process.');
     const res=await fetcher('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json','Idempotency-Key':'rva-payment-receipt-'+job.id},body:JSON.stringify({from,to:[r.payer_email],subject:'Your ReVitalized Academy payment receipt',text}),signal:AbortSignal.timeout(10000)});
     if(!res.ok)throw Error();await command('receipt_done',{id:job.id});
    }catch{await command('receipt_done',{id:job.id,error_code:'receipt_delivery_pending'});}
   }
   return{processed};
  }
 };
}
