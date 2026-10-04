// Loopback-only synthetic UI fixture. Exact built assets; no hosted fetches or writes.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {installBetaFixture}=require('../../tests/helpers/beta-core-fixture.cjs');
const root=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'rva-beta-ui-'));
fs.cpSync(path.resolve(__dirname,'../../dist'),root,{recursive:true});
process.on('exit',()=>fs.rmSync(root,{recursive:true,force:true}));
process.on('SIGINT',()=>process.exit(0));
const modules=['portal-programs.js','portal-recipe-builder.js','portal-content-composition.js','portal-people.js','portal-staff-access.js','portal-wellness.js'];
const server=http.createServer((req,res)=>{
 const name=new URL(req.url,'http://127.0.0.1').pathname;
 if(name==='/fixture.js'){
  res.setHeader('Content-Type','application/javascript');res.end(`const fixture=(${installBetaFixture.toString()})(window);document.getElementById('auth-view').classList.add('hidden');document.getElementById('portal-view').classList.remove('hidden');document.addEventListener('DOMContentLoaded',()=>{
   const toolbar=document.getElementById('beta-fixture-toolbar');
   ['people-add-button','staff-invite-button'].forEach(id=>{const b=document.getElementById(id);b.classList.remove('hidden');toolbar.append(b);});
   document.getElementById('fixture-client').onclick=()=>{document.dispatchEvent(new CustomEvent('ra:contact-opened',{detail:{contactId:'contact-a',contact:{id:'contact-a',first_name:'Synthetic',last_name:'Client'}}}));document.getElementById('contact-drawer').classList.remove('hidden');document.getElementById('contact-drawer').setAttribute('aria-hidden','false');document.getElementById('contact-loading').classList.add('hidden');document.getElementById('contact-content').classList.remove('hidden');};
   document.querySelectorAll('[data-fixture-detail]').forEach(b=>b.onclick=()=>{document.dispatchEvent(new CustomEvent('ra:member-dashboard-loaded',{detail:{healthContext:{contactId:'contact-a',userId:'member-a'}}}));document.dispatchEvent(new CustomEvent('ra:member-assignment-open',{detail:{kind:b.dataset.fixtureDetail,id:'assigned-a'}}));});
   document.querySelectorAll('[data-close-contact],#close-contact').forEach(b=>b.onclick=()=>{document.getElementById('contact-drawer').classList.add('hidden');document.dispatchEvent(new CustomEvent('ra:contact-closed'));});
  });`);return;
 }
 if(name==='/portal/'||name==='/'){
  let html=fs.readFileSync(path.join(root,'portal/index.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
  html=html.replace('</head>','<style>'+fs.readFileSync(path.join(root,'member/member110.css'),'utf8').slice(fs.readFileSync(path.join(root,'member/member110.css'),'utf8').indexOf('.rm-assigned-detail{'))+'</style><style>#beta-fixture-toolbar{padding:16px;background:#fff2cc;display:flex;flex-wrap:wrap;gap:10px;position:relative;z-index:2}#beta-fixture-toolbar button{min-height:44px}.portal-grid>section{display:none!important}#program-content-panel{display:block!important} .portal-grid{display:block!important}</style></head>');
  html=html.replace('<body>','<body><aside id="beta-fixture-toolbar"><strong>LOCAL SYNTHETIC BETA FIXTURE — no hosted data</strong><button id="fixture-client">Client Assignments</button><button data-fixture-detail="meal">View Assigned Meal</button><button data-fixture-detail="workout">View Assigned Workout</button></aside>');
  html=html.replace('</body>','<script src="/fixture.js"></script>'+modules.map(file=>'<script src="/portal/'+file+'"></script>').join('')+'<script src="/member/member-assigned-content.js"></script></body>');
  res.setHeader('Content-Type','text/html');res.end(html);return;
 }
 const file=path.resolve(root,'.'+decodeURIComponent(name));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end('Not found');return;}
 res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});server.listen(Number(process.env.RVA_FIXTURE_PORT||8877),'127.0.0.1',()=>console.log('Synthetic beta fixture: http://127.0.0.1:'+server.address().port+'/portal/'));
