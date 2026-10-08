import type {Delivery} from './handler.ts';
// One invocation owns the raw token in memory. All retries use identical bytes/key.
// No raw credential, recipient or provider body is logged or persisted here.
export async function sendResumeMail(apiKey:string,key:string,body:string,send:typeof fetch=fetch,pause:(ms:number)=>Promise<void>=ms=>new Promise(r=>setTimeout(r,ms))):Promise<Delivery>{
 let uncertain=false,lastStatus:number|undefined;
 for(let attempt=0;attempt<3;attempt++){
  try{
   const response=await send('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json','Idempotency-Key':key},body,signal:AbortSignal.timeout(5000)});
   lastStatus=response.status;
   if(response.ok){const result=await response.json();if(typeof result.id==='string'&&/^[a-zA-Z0-9_-]{1,128}$/.test(result.id))return {state:'accepted',provider_id:result.id,provider_status:response.status};uncertain=true;}
   else if(response.status!==429&&response.status<500)return {state:uncertain?'uncertain':'failed',provider_status:response.status};
   if(response.status>=500)uncertain=true;
  }catch{uncertain=true;}
  if(attempt<2)await pause(500*(attempt+1));
 }
 return {state:uncertain?'uncertain':'failed',provider_status:lastStatus};
}
