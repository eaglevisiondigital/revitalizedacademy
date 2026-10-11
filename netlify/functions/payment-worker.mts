import {paymentApp} from './_shared/payments.mjs';
export default async function(){
 try{return new Response(JSON.stringify(await paymentApp({get:(name:string)=>Netlify.env.get(name)}).worker()));}
 catch{return new Response(JSON.stringify({error:'payments_worker_unavailable'}),{status:503});}
}
export const config={schedule:'* * * * *'};
