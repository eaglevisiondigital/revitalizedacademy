import {paymentApp} from './_shared/payments.mjs';
const env={get:(name:string)=>Netlify.env.get(name)};
export default async function(request:Request,context:{ip?:string}){
 try{return await paymentApp(env,{clientIp:context.ip}).handle(request);}catch{return new Response(JSON.stringify({error:'payments_unavailable'}),{status:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});}
}
export const config={path:['/api/payments/summary','/api/payments/staff-list','/api/payments/staff-create','/api/payments/webinar-start','/api/payments/begin','/api/payments/refresh','/api/payments/update-card']};
