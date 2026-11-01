'use strict';
const {memberFixture}=require('../wave4-member/dom-fixture.cjs');
async function checkinFixture(options={}){
 const fs=require('node:fs'),cp=require('node:child_process'),originalRead=fs.readFileSync;let fixturePromise;
 if(process.env.RVA_WAVE5_BASELINE==='1')fs.readFileSync=function(p,...args){if(p==='member/member110.js')return cp.execFileSync('git',['show','024b1c20c802ce6a9470fc46fabdd3bae75ed980:member/member110.js'],{encoding:'utf8'});return originalRead.call(this,p,...args);};
 try{fixturePromise=memberFixture();}finally{fs.readFileSync=originalRead;}
 const f=await fixturePromise,client=f.w.supabase.createClient(),originalFrom=client.from;
 const rows=options.rows||new Map(),outcomes=[],gates=[];let readError=null,gateWrites=false;
 const clone=x=>JSON.parse(JSON.stringify(x));
 client.from=function(table){if(table!=='client_checkins')return originalFrom(table);let filters=[],payload,selected='';const query={};
  query.select=x=>(selected=x,query);query.eq=(k,v)=>(filters.push([k,v]),query);query.neq=(k,v)=>(filters.push([k,v,true]),query);query.order=()=>query;query.limit=()=>query;query.maybeSingle=()=>query;query.single=()=>query;
  query.insert=x=>(payload=clone(x),query);
  query.then=async(resolve,reject)=>{try{
   if(payload){f.calls.push({kind:'write',table,method:'insert',payload:clone(payload)});const outcome=outcomes.shift()||{commit:true};let error=outcome.error||null;
    const key=[payload.contact_id,payload.template_id,payload.period_start].join('/');
    if(outcome.commit!==false){if(rows.has(key))error={code:'23505',message:'Fictional period duplicate'};else rows.set(key,{...payload,id:'fictional-checkin-'+rows.size});}
    if(gateWrites)await new Promise(r=>gates.push(r));if(outcome.throw)throw TypeError('Fictional connection interrupted');return resolve({data:null,error});
   }
   f.calls.push({kind:'checkin-read',table,selected,filters:clone(filters)});if(readError){const e=readError;readError=null;return resolve({data:null,error:e});}
   const row=[...rows.values()].find(row=>filters.every(([k,v,not])=>not?row[k]!==v:row[k]===v));return resolve({data:row?clone(row):null,error:null});
  }catch(e){if(reject)return reject(e);throw e;}};return query;
 };
 return {...f,rows,configure(next={}){if(Object.hasOwn(next,'readError'))readError=next.readError;if(next.outcome)outcomes.push(next.outcome);if(Object.hasOwn(next,'gateWrites'))gateWrites=next.gateWrites;},releaseWrites(){gateWrites=false;gates.splice(0).forEach(r=>r());},writeGates:gates,fill(value='Fictional weekly observation'){f.w.document.querySelector('[name="checkin_fictional_note"]').value=value;}};
}
module.exports={checkinFixture};
