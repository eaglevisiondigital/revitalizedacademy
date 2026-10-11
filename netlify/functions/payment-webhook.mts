import {paymentApp} from './_shared/payments.mjs';
export default async function(request:Request){
 try{return await paymentApp({get:(name:string)=>Netlify.env.get(name)}).webhook(request);}catch{return new Response('',{status:503});}
}
export const config={path:'/api/payments/webhook'};
