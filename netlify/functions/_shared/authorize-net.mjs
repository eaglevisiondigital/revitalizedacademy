import {PaymentError,decimal,nextMonth} from './payment-domain.mjs';
const api={sandbox:'https://apitest.authorize.net/xml/v1/request.api',live:'https://api.authorize.net/xml/v1/request.api'};
const forms={sandbox:'https://test.authorize.net',live:'https://accept.authorize.net'};
export function gateway(env,fetcher=fetch){
 const mode=env.get('RVA_PAYMENTS_MODE');
 if(!api[mode]||env.get('RVA_PAYMENTS_ENABLED')!=='true')throw new PaymentError('payments_unavailable',503);
 const prefix=mode==='sandbox'?'RVA_CA_ANET_SANDBOX_':'RVA_CA_ANET_LIVE_';
 const login=env.get(prefix+'API_LOGIN_ID'),key=env.get(prefix+'TRANSACTION_KEY');
 if(!login||!key)throw new PaymentError('provider_not_configured',503);
 const authentication={name:login,transactionKey:key};
 async function call(method,body){
  let response,json;
  try{response=await fetcher(api[mode],{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({[method]:{merchantAuthentication:authentication,...body}}),signal:AbortSignal.timeout(8000)});
   if(!response.ok)throw Error();json=JSON.parse((await response.text()).replace(/^\uFEFF/,''));
  }catch{throw new PaymentError('provider_response_uncertain',503);}
  if(json.messages?.resultCode!=='Ok'){
   if(json.messages?.message?.some(x=>['E00003','E00007','E00013'].includes(x.code)))throw new PaymentError('provider_configuration_error',503);
   throw new PaymentError('provider_request_rejected',409);
  }
  return json;
 }
 const setting=(name,value)=>({settingName:name,settingValue:JSON.stringify(value)});
 return{
  mode,
  async hosted(ctx,origin,token){
   const {request:r,installment:i,attempt:a}=ctx;
   const j=await call('getHostedPaymentPageRequest',{refId:a.reference,transactionRequest:{transactionType:'authCaptureTransaction',amount:decimal(i.amount_cents),
    order:{invoiceNumber:a.reference,description:r.description.slice(0,255)},customer:{email:r.payer_email},
    transactionSettings:{setting:[{settingName:'duplicateWindow',settingValue:'28800'}]}},
    hostedPaymentSettings:{setting:[setting('hostedPaymentReturnOptions',{showReceipt:true,url:origin+'/pay/'+token+'?returned=1',urlText:'Return to ReVitalized Academy',cancelUrl:origin+'/pay/'+token,cancelUrlText:'Return without paying'}),
     setting('hostedPaymentButtonOptions',{text:'Pay '+decimal(i.amount_cents)+' CAD'}),setting('hostedPaymentPaymentOptions',{cardCodeRequired:true,showCreditCard:true,showBankAccount:false}),
     setting('hostedPaymentCustomerOptions',{showEmail:true,requiredEmail:true,addPaymentProfile:false}),setting('hostedPaymentBillingAddressOptions',{show:true,required:true})]}});
   if(!j.token)throw new PaymentError('provider_response_uncertain',502);
   return{token:j.token,url:forms[mode]+'/payment/payment'};
  },
  async details(id){if(!/^\d+$/.test(String(id)))throw new PaymentError('invalid_transaction');return(await call('getTransactionDetailsRequest',{transId:String(id)})).transaction;},
  async unsettled(){return(await call('getUnsettledTransactionListRequest',{})).transactions||[];},
  async profileFromTransaction(r,id){
   const j=await call('createCustomerProfileFromTransactionRequest',{transId:String(id),customer:{merchantCustomerId:r.id.replaceAll('-','').slice(0,20),description:'ReVitalized payment request',email:r.payer_email}});
   return{customer_profile_id:String(j.customerProfileId),payment_profile_id:String(j.customerPaymentProfileIdList?.[0]||'')};
  },
  async newProfile(r){const j=await call('createCustomerProfileRequest',{profile:{merchantCustomerId:r.id.replaceAll('-','').slice(0,20),description:'ReVitalized payment request',email:r.payer_email}});return String(j.customerProfileId);},
  async profileDetails(id){const j=await call('getCustomerProfileRequest',{customerProfileId:id,unmaskExpirationDate:false});
   return(j.profile?.paymentProfiles||[]).filter(p=>p.payment?.creditCard).map(p=>String(p.customerPaymentProfileId));
  },
  async cardForm(r,origin,token){
   const j=await call('getHostedProfilePageRequest',{customerProfileId:r.customer_profile_id,hostedProfileSettings:{setting:[
    {settingName:'hostedProfileReturnUrl',settingValue:origin+'/pay/'+token+'?card_returned=1'},
    {settingName:'hostedProfileReturnUrlText',settingValue:'Return to ReVitalized Academy'},
    {settingName:'hostedProfilePaymentOptions',settingValue:'showCreditCard'},
    {settingName:'hostedProfileCardCodeRequired',settingValue:'true'}]}});
   if(!j.token)throw new PaymentError('provider_response_uncertain',502);
   return{token:j.token,url:forms[mode]+(r.payment_profile_id?'/customer/manage':'/customer/addPayment')};
  },
  async subscription(r,firstDue,firstPaid){
   const start=firstPaid?nextMonth(firstDue):firstDue;
   const j=await call('ARBCreateSubscriptionRequest',{refId:r.id.replaceAll('-','').slice(0,20),subscription:{
    name:r.description.slice(0,50),paymentSchedule:{interval:{length:1,unit:'months'},startDate:start.slice(0,10),totalOccurrences:9999},amount:decimal(r.total_cents),
    profile:{customerProfileId:r.customer_profile_id,customerPaymentProfileId:r.payment_profile_id}}});
   if(!j.subscriptionId)throw new PaymentError('provider_response_uncertain',502);return String(j.subscriptionId);
  },
  async charge(ctx){const{request:r,installment:i,attempt:a}=ctx;
   const j=await call('createTransactionRequest',{refId:a.reference,transactionRequest:{transactionType:'authCaptureTransaction',amount:decimal(i.amount_cents),
    profile:{customerProfileId:r.customer_profile_id,paymentProfile:{paymentProfileId:r.payment_profile_id}},
    order:{invoiceNumber:a.reference,description:r.description.slice(0,255)},
    transactionSettings:{setting:[{settingName:'recurringBilling',settingValue:'true'},{settingName:'duplicateWindow',settingValue:'28800'}]}}});
   const t=j.transactionResponse;
   if(!t?.transId||t.transId==='0')throw new PaymentError('provider_response_uncertain',502);
   return String(t.transId);
  }
 };
}
