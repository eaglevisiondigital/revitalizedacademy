// Local, synthetic and read-only. Not a production server or authentication bypass.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const allowed=new Set(['portal/health-hope-live.html','portal/health-hope-live.css','portal/health-hope-live.js','css/health-hope-live.css','assets/images/revitalized-logo-dark-approved-v69.png']);
const sessions=[
 {id:'11111111-1111-4111-8111-111111111111',regular_date:'2026-10-29',starts_at:'2026-10-29T22:30:00Z',closes_at:'2026-10-29T22:30:00Z',status:'published',revision:2,join_mode:'manual',registered:0,attended:0},
 {id:'22222222-2222-4222-8222-222222222222',regular_date:'2026-11-05',starts_at:'2026-11-05T23:30:00Z',closes_at:'2026-11-05T23:30:00Z',status:'draft',revision:1,join_mode:'manual',registered:0,attended:0},
 {id:'33333333-3333-4333-8333-333333333333',regular_date:'2026-11-12',starts_at:'2026-11-12T23:30:00Z',closes_at:'2026-11-12T23:30:00Z',status:'draft',revision:1,join_mode:'zoom',zoom_ready:false,registered:0,attended:0},
 {id:'44444444-4444-4444-8444-444444444444',regular_date:'2026-11-19',starts_at:'2026-11-19T23:30:00Z',closes_at:'2026-11-19T23:30:00Z',status:'cancelled',revision:1,join_mode:'manual',registered:0,attended:0}
];
const overview={can_manage:true,settings:{registration_enabled:false,zoom_enabled:false,notifications_enabled:false},sessions:[...sessions].reverse(),people:[],review_count:0};
const json=(res,data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
const server=http.createServer(async(req,res)=>{
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'");
 const url=new URL(req.url,'http://127.0.0.1');
 if(url.pathname==='/runtime-config.js'){res.setHeader('Content-Type','application/javascript');return res.end('window.RVA_PUBLIC_CONFIG={supabaseUrl:"https://synthetic.invalid",supabaseKey:"fictional-preview-key"};');}
 if(url.pathname==='/preview-supabase.js'){res.setHeader('Content-Type','application/javascript');return res.end('window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:{access_token:"synthetic-preview-only",user:{id:"local-synthetic-operator"}}}}),onAuthStateChange:()=>{}}})};');}
 if(url.pathname==='/api/health-hope-live/staff'&&req.method==='POST'){
  let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>16000)return json(res,{error:'preview_readonly'},413);}
  let body;try{body=JSON.parse(raw);}catch{return json(res,{error:'invalid_request'},400);}
  if(body.action==='overview')return json(res,overview);
  if(body.action==='privacy-overview')return json(res,{can_manage_all:true,retention:{enabled:true,provider_ready:true,healthy_at:new Date().toISOString()},sessions:[],totals:[]});
  if(body.action==='review-list')return json(res,{identities:[],attendance:[]});
  return json(res,{error:'preview_readonly'},409);
 }
 if(req.method!=='GET')return json(res,{error:'preview_readonly'},405);
 let file=url.pathname==='/portal/health-hope-live'||url.pathname==='/'?'portal/health-hope-live.html':url.pathname.slice(1);
 if(!allowed.has(file)){res.writeHead(404);return res.end('Local preview assets only.');}
 let bytes=fs.readFileSync(path.join(root,file));
 if(file.endsWith('.html')){bytes=Buffer.from(bytes.toString().replace('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/dist/umd/supabase.js','/preview-supabase.js').replace('<header class="hhl-header','<div class="hhl-preview-notice">Local Design Preview · Synthetic Sessions · No Changes Are Saved</div><header class="hhl-header'));res.setHeader('Content-Type','text/html');}
 else if(file==='portal/health-hope-live.css'){bytes=Buffer.concat([bytes,Buffer.from('\n.hhl-preview-notice{text-align:center;padding:8px 15px;border-bottom:1px solid #dedfce;background:#efefdf;color:#52634c;font:500 11px/1.5 Arial,sans-serif}')]);res.setHeader('Content-Type','text/css');}
 else res.setHeader('Content-Type',file.endsWith('.css')?'text/css':file.endsWith('.js')?'application/javascript':'image/png');
 res.end(bytes);
});
server.listen(0,'127.0.0.1',()=>{const url='http://127.0.0.1:'+server.address().port+'/portal/health-hope-live';fs.writeFileSync(path.join(__dirname,'preview-address.json'),JSON.stringify({url,synthetic:true,readOnly:true,productionConnections:0},null,2)+'\n');console.log(url);});
