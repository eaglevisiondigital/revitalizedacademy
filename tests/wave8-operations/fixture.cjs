'use strict';
const fs=require('node:fs'),cp=require('node:child_process');
const {memberFixture}=require('../wave4-member/dom-fixture.cjs');
async function fixture(options={}){
 const read=fs.readFileSync;
 fs.readFileSync=function(file,...args){const source=file==='member/member110.js'&&options.baseline?cp.execFileSync('git',['show','2cbd6de16097890f501a410a276308ca5c4e000c:member/member110.js'],{encoding:'utf8'}):read.call(this,file,...args);return file==='member/member110.js'?String(source).replace('  resolveSession();\n})();','  window.__wave8={renderGoals};\n  resolveSession();\n})();'):source;};
 let promise;try{promise=memberFixture({...options,baseline:false});}finally{fs.readFileSync=read;}
 const f=await promise,client=f.w.supabase.createClient(),from=client.from,rpc=client.rpc;
 const store={row:{id:'synthetic-goal',title:'Fictional goal',status:'active',updated_at:'2026-11-01T00:00:00Z'},loss:false,readError:null,readThrow:false,readGate:false,reads:[],readPending:[]};
 client.from=table=>{if(table!=='my_goals')return from(table);const q={select:()=>q,then:(yes,no)=>{f.calls.push({kind:'query',table,actor:'synthetic-a'});store.reads.push('my_goals');return Promise.resolve().then(async()=>{const result={data:store.row?[structuredClone(store.row)]:[],error:store.readError};if(store.readGate)await new Promise(r=>store.readPending.push(r));if(store.readThrow)throw TypeError('Fictional read transport');return result;}).then(yes,no);}};return q;};
 client.rpc=async(name,args)=>{let result=await rpc(name,args);if(name==='update_my_goal_status'&&Object.hasOwn(options,'goalResult'))result={data:options.goalResult,error:null};if(name==='update_my_goal_status'&&!result.error&&result.data===true){store.row.status=args.p_status;store.row.updated_at='2026-11-01T00:01:00Z';if(store.loss)throw TypeError('Fictional response lost');}return result;};
 const render=()=>f.w.__wave8.renderGoals(store.row?[structuredClone(store.row)]:[]);render();
 return {...f,store,render,async act(label='Pause'){return f.click('#rm-goals button,#rm-goal-history button',label);},status:()=>f.w.document.getElementById('rm-goal-update-status')?.textContent||'',releaseRead(){store.readGate=false;store.readPending.splice(0).forEach(r=>r());}};
}
module.exports={fixture};
