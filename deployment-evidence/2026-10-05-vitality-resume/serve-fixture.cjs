// Local-only renderer: exact built application assets, synthetic in-memory API responses.
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../../dist');let snapshot={version:1,section:0,section_label:'Introduction',percent:0,pathway:'Adult',fields:{}},revision=0,state='draft',fail=false;
const identity={first_name:'Synthetic',last_name:'Assessment',email:'synthetic@example.invalid',phone:'0000000000'};
const injection=`<script>const originalFetch=window.fetch.bind(window);window.fetch=(url,options={})=>{if(String(url).includes('/vitality-resume'))return originalFetch('/fixture-api',options);if(options.method==='POST')return Promise.resolve(new Response('{}',{status:200}));if(String(url).startsWith('http'))throw Error('Hosted requests are disabled in this isolated fixture');return originalFetch(url,options);};</script>`;
http.createServer(async(req,res)=>{
 if(req.url==='/runtime-config.js'){res.setHeader('Content-Type','text/javascript');res.end('window.RVA_PUBLIC_CONFIG='+JSON.stringify({environment:'local',supabaseUrl:'http://127.0.0.1:8766',supabaseKey:'sb_publishable_synthetic_fixture',appOrigin:'http://127.0.0.1:8766',paymentMode:'synthetic'})+';');return;}
 if(req.url==='/fixture-api'){
  let raw='';for await(const c of req)raw+=c;const b=JSON.parse(raw);let data={status:state,draft_id:'synthetic-draft',identity,snapshot,revision};
  if(b.action==='redeem')data.token='b'.repeat(64);
  if(b.action==='save'){if(fail){res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'We couldn’t save your latest changes. Please try again.'}));return;}snapshot=b.snapshot;revision++;data={...data,snapshot,revision};}
  if(['start','recover'].includes(b.action))data={ok:true,message:'If an unfinished assessment is available, we’ll email a secure link.'};
  if(b.action==='finalize'){state='completed';data={status:state};}
  res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(data));return;
 }
 if(req.url==='/fixture-fail'){fail=true;res.end('Synthetic save failure enabled');return;}
 if(req.url==='/fixture-recover'){fail=false;res.end('Synthetic saves restored');return;}
 const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+'/')){res.writeHead(404);res.end();return;}
 try{let data=fs.readFileSync(file);if(file.endsWith('/consult.html'))data=Buffer.from(data.toString().replace('<head>','<head>'+injection));res.writeHead(200,{'Content-Type':file.endsWith('.html')?'text/html':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'application/octet-stream','Cache-Control':'no-store'});res.end(data);}catch{res.writeHead(404);res.end();}
}).listen(8766,'127.0.0.1',()=>console.log('Isolated exact-asset renderer on http://127.0.0.1:8766/consult.html'));
