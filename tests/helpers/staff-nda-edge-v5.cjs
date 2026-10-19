'use strict';
// Execute the exact observed v5 SOURCE with fictional clients only; no network/credentials.
const fs=require('node:fs'),vm=require('node:vm'),{stripTypeScriptTypes}=require('node:module'),{webcrypto,createHash}=require('node:crypto');
const source=fs.readFileSync(__dirname+'/../fixtures/staff-agreement-sign-v5.ts','utf8');
const sourceHash=createHash('sha256').update(source).digest('hex');
function harness({agreement,user={id:'fictional-staff',email:'fictional@example.invalid'},dbOperation}={}){
 const rows=agreement?{...agreement}:null,calls=[];let handler;
 const operation=async(table,kind,values,filters)=>{calls.push({table,kind});if(dbOperation)return dbOperation(table,kind,values,filters);if(kind==='read')return{data:rows&&filters.every(([k,v])=>rows[k]===v)?{...rows}:null,error:null};if(kind==='update'){if(table==='staff_agreements')Object.assign(rows,values);return{data:table==='staff_agreements'?{...rows}:null,error:null};}return{data:{...values},error:null};};
 class Query{constructor(table){this.table=table;this.kind='read';this.filters=[];}select(){return this;}eq(k,v){this.filters.push([k,v]);return this;}update(v){this.kind='update';this.values=v;return this;}upsert(v){this.kind='upsert';this.values=v;return this;}insert(v){this.kind='insert';this.values=v;return this;}single(){return operation(this.table,this.kind,this.values,this.filters);}maybeSingle(){return this.single();}then(ok,bad){return this.single().then(ok,bad);}}
 const admin={auth:{getUser:async()=>({data:{user},error:user?null:{message:'fictional invalid session'}})},from:t=>new Query(t)};
 const js=stripTypeScriptTypes(source.replace(/^import .*;\s*$/gm,''));
 const errors=[];const context=vm.createContext({Request,Response,Headers,URL,TextEncoder,crypto:webcrypto,Date,console:{error:()=>errors.push('sanitized_v5_error')},createClient:()=>admin,Deno:{env:{get:k=>k==='SUPABASE_URL'?'https://fictional.invalid':k==='SUPABASE_SERVICE_ROLE_KEY'?'fictional-service-key':undefined},serve:fn=>handler=fn}});
 vm.runInContext(js,context);return{handler,calls,errors,rows};
}
const request=(body={},extra={})=>new Request('https://voalfpxiyznnqfcqcymd.supabase.co/functions/v1/staff-agreement-sign',{method:'POST',headers:{Origin:'https://revitalizedacademy.com',Authorization:'Bearer fictional-token','Content-Type':'application/json',...extra.headers},body:JSON.stringify(body)});
module.exports={harness,request,sourceHash};
