// Local design review only. No database, credentials, participant persistence,
// staff Auth or provider connections. Do not deploy this development server.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../production-dist'),port=Number(process.env.RVA_HHL_PREVIEW_PORT||48973);
const allowed=new Set(require('../config/production-public-files.json'));
const sessions=[{id:'11111111-1111-4111-8111-111111111111',starts_at:'2026-10-22T22:30:00Z',closes_at:'2026-10-22T22:30:00Z',status:'published',public_note:'Fictional session for local design review'},{id:'22222222-2222-4222-8222-222222222222',starts_at:'2026-10-29T22:30:00Z',closes_at:'2026-10-29T22:30:00Z',status:'published',public_note:'Fictional session for local design review'}];
http.createServer(async(req,res)=>{
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 const url=new URL(req.url,'http://127.0.0.1:'+port);
 if(url.pathname==='/api/health-hope-live/sessions'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({sessions}));}
 if(url.pathname==='/api/health-hope-live/register'&&req.method==='POST'){
  let size=0,raw='';for await(const chunk of req){size+=chunk.length;if(size>16000){res.writeHead(413);return res.end();}raw+=chunk;}
  let data;try{data=JSON.parse(raw);}catch{res.writeHead(400);return res.end();}
  res.setHeader('Content-Type','application/json');if(!/@example\.invalid$/i.test(data.email||'')){res.writeHead(400);return res.end(JSON.stringify({error:'Use a fictional example.invalid address for this local preview'}));}
  res.writeHead(202);return res.end(JSON.stringify({received:true}));
 }
 if(req.method!=='GET'){res.writeHead(405);return res.end();}
 let file=url.pathname==='/'?'index.html':url.pathname==='/health-hope-live'?'health-hope-live.html':url.pathname.slice(1);
 // Deliberately exclude staff/member pages and all server/test/config sources.
 if(!allowed.has(file)||/^(portal|member|pay|tests|scripts|config|supabase|netlify|admin|account)/.test(file)||!fs.existsSync(path.join(root,file))){res.writeHead(404);return res.end('Not available in this local public design preview.');}
 let bytes=fs.readFileSync(path.join(root,file));
 if(file.endsWith('.html')){bytes=Buffer.from(bytes.toString().replace(/(<body[^>]*>)/i,'$1<div style="background:#f2d79a;color:#243c30;padding:12px 20px;text-align:center;font:600 13px/1.5 Arial,sans-serif">Local design preview · Fictional sessions · Registration is not saved · Use review@example.invalid</div>'));res.setHeader('Content-Type','text/html');}
 else res.setHeader('Content-Type',file.endsWith('.css')?'text/css':file.endsWith('.js')?'application/javascript':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.webp')?'image/webp':file.endsWith('.png')?'image/png':file.endsWith('.jpg')?'image/jpeg':'application/octet-stream');
 res.end(bytes);
}).listen(port,'127.0.0.1',()=>console.log('Health & Hope Live local design preview: http://127.0.0.1:'+port+'/health-hope-live'));
