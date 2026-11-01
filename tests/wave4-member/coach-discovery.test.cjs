'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process');
const {JSDOM,VirtualConsole}=require('../wave2-client/dependencies.cjs').jsdom();
test('UNCHANGED Coach full module reproduces missing capacity result on fictional active membership',async()=>{
 const logs=[],queries=[],vc=new VirtualConsole();vc.on('error',(...args)=>logs.push(args.map(String).join(' ')));
 const dom=new JSDOM(fs.readFileSync('portal/index.html','utf8'),{url:'https://coach.synthetic.invalid/portal/',runScripts:'outside-only',virtualConsole:vc});
 try{
  const w=dom.window;w.fetch=()=>{throw Error('external_forbidden');};
  function from(table){let single=false;const q={};for(const method of ['select','eq','order','limit'])q[method]=()=>q;for(const method of ['single','maybeSingle'])q[method]=()=>{single=true;return q;};q.then=(yes,no)=>{queries.push(table);const data=table==='client_access'?{contact_id:'fictional-contact',membership_id:'fictional-membership'}:table==='client_memberships'?{id:'fictional-membership',status:'active'}:single?{}:[];return Promise.resolve({data,error:null}).then(yes,no);};return q;}
  w.RA_PORTAL={authClient:{from},titleCase:s=>s,staffDirectory:()=>[],currentUserId:()=> 'fictional-coach',loadDashboard:async()=>{},logActivity:async()=>{}};
  w.eval(cp.execFileSync('git',['show','5926b915f60b1be6d009c94362b91356a303cb33:portal/portal-coaching.js'],{encoding:'utf8'}));
  w.document.dispatchEvent(new w.CustomEvent('ra:contact-opened',{detail:{contactId:'fictional-contact',contact:{id:'fictional-contact',first_name:'Fictional',last_name:'Adult'}}}));
  for(let i=0;i<25&&!logs.length;i++)await new Promise(resolve=>setTimeout(resolve,10));
  assert.match(logs.join('|'),/Coaching workspace load failed/);assert.match(w.document.getElementById('client-coaching-status').textContent,/data/);assert.equal(queries.includes('coaching_session_notes'),true);assert.equal(queries.some(t=>t.includes('capacity')),false);
 }finally{dom.window.close();}
});
