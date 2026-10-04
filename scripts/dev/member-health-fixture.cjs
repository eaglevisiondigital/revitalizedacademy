// Local-only exact-built UI fixture. Never connects to Supabase or writes hosted data.
// npm run build must run first with the existing staging configuration.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {installMock}=require('../../tests/helpers/member-health-fixture.cjs');
const dist=path.resolve(__dirname,'../../dist');
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1'),name=decodeURIComponent(url.pathname);
 if(name==='/fixture.js'){
  res.setHeader('Content-Type','application/javascript');res.end(`(()=>{const f=(${installMock.toString()})(window);const scenario=new URL(location.href).searchParams.get('scenario')||'normal';
  if(scenario==='empty')for(const name of ['my_health_metric_latest','my_recent_progress','my_goals','my_habits','my_health_connection_center'])f.state.overrides[name]={data:[]};
  if(scenario==='empty') {f.state.overrides.my_coaching_hub={data:null};f.state.overrides.get_my_nutrition_day={data:{totals:{},targets:[],items:[]}};f.state.overrides.get_my_nutrition_trends={data:[]};}
  if(scenario==='partial'){f.state.overrides.my_habits=()=>Promise.reject(Error('Synthetic optional failure'));f.state.overrides.get_my_nutrition_day={error:{message:'Synthetic unavailable'}};}
  if(scenario==='long'){for(const [name,title]of [['my_goals','Goal'],['my_habits','Habit']])f.state.overrides[name]={data:[{id:'synthetic',contact_id:'contact-a',title:title+' with an intentionally long descriptive name '+ 'longword'.repeat(45),status:'active',target_value:180,target_unit:'lb',target_per_period:1,unit:'walk',last_7_day_value:4,today_value:0}]};}
  document.addEventListener('DOMContentLoaded',()=>document.querySelector('#fixture-logout').addEventListener('click',()=>f.emit('SIGNED_OUT',null)));
  })();`);return;
 }
 if(name==='/member/'||name==='/'){
  let html=fs.readFileSync(path.join(dist,'member/index.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
  html=html.replace('<body>',`<body><aside style="padding:8px;background:#fff2cc;font:14px sans-serif;overflow-wrap:anywhere">LOCAL SYNTHETIC FIXTURE · No hosted data · <a href="?scenario=normal">Normal</a> · <a href="?scenario=empty">Empty</a> · <a href="?scenario=partial">Partial</a> · <a href="?scenario=long">Long labels</a> · <button id="fixture-logout">Simulate logout</button></aside>`).replace('</body>','<script src="/fixture.js"></script><script defer src="/member/member110.js?v=209"></script><script defer src="/member/member-nutrition.js?v=1"></script><script defer src="/member/member-health-progress.js?v=1"></script></body>');
  res.setHeader('Content-Type','text/html');res.end(html);return;
 }
 const file=path.resolve(dist,'.'+name);if(!file.startsWith(dist+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end('Not found');return;}
 res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
server.listen(Number(process.env.RVA_FIXTURE_PORT||8876),'127.0.0.1',()=>console.log('Local fixture: http://127.0.0.1:'+server.address().port+'/member/'));
