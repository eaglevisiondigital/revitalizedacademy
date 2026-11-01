'use strict';
const fs=require('node:fs'),cp=require('node:child_process');
const {memberFixture}=require('../wave4-member/dom-fixture.cjs');
async function dailyFixture(options={}){
 const read=fs.readFileSync;let promise;
 // Expose only the actual lexical renderer for fictional setup; preserve all production bodies.
 fs.readFileSync=function(p,...args){if(p==='member/member110.js'){
  const source=process.env.RVA_WAVE6_BASELINE==='1'?cp.execFileSync('git',['show','9beae3bb40c154d2bfd623e8d2355b3a6c3cd306:member/member110.js'],{encoding:'utf8'}):read.call(this,p,...args);
  return source.replace('  resolveSession();\n})();','  window.__wave6Daily={renderDailyActions};\n  resolveSession();\n})();');
 }return read.call(this,p,...args);};
 try{promise=memberFixture(options);}finally{fs.readFileSync=read;}
 const f=await promise,client=f.w.supabase.createClient(),from=client.from,originalRPC=client.rpc;
 let row={habit_count:1,habits_completed_today:0,habits:[{habit_id:'fictional-daily-habit',title:'Fictional daily practice',target:1,unit:'reflection',completed_today:false}],meals:[],workouts:[],challenges:[]};
 let responseLoss=false,bootFailure=false,bootError=null;
 client.from=table=>{if(table!=='my_app_bootstrap_v2')return from(table);const q={select:()=>q,single:()=>q,then:(resolve,reject)=>Promise.resolve().then(()=>{f.calls.push({kind:'daily-read'});if(bootFailure)throw Error('fictional unavailable');if(bootError)return {data:null,error:bootError};return{data:{access:{},home:{},daily_actions:structuredClone(row),member_profile:{first_name:'Fictional'}},error:null};}).then(resolve,reject)};return q;};
 client.rpc=async(name,args)=>{const result=await originalRPC(name,args);if(name==='check_in_my_habit'&&responseLoss)throw TypeError('fictional lost response');return result;};
 const render=()=>f.w.__wave6Daily.renderDailyActions(structuredClone(row));render();
 return {...f,habit:()=>row.habits[0],set(next={}){if(Object.hasOwn(next,'responseLoss'))responseLoss=next.responseLoss;if(Object.hasOwn(next,'bootFailure'))bootFailure=next.bootFailure;if(Object.hasOwn(next,'bootError'))bootError=next.bootError;if(next.habit)Object.assign(row.habits[0],next.habit);if(next.rpcError)options.rpcError=next.rpcError;if(next.row)row=next.row;},render,async act(){return f.click('#rm-today-habits button',f.w.document.querySelector('#rm-today-habits button').textContent);},button:()=>f.w.document.querySelector('#rm-today-habits button'),status:()=>f.w.document.getElementById('rm-today-status').textContent};
}
module.exports={dailyFixture};
