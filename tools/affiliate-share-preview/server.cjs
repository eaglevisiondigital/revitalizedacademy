'use strict';
// Local fictional tool only; never a deployed route, authentication source or approval writer.
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const { spawnSync } = require('node:child_process');
const {createProviders}=require('../wave5-fixture-providers.cjs');
const {createProgressFixtures}=require('../wave6-progress-contract.cjs');
const { shareIntent } = require('../../js/rva-affiliate-share-contract.cjs');
const { fixture } = require('../../tests/wave2-affiliate/fixtures.cjs');
function preview({ channel, state }) {
  if (!['email','sms','dm','social'].includes(channel) || !['active','revoked','expired','wrong-account'].includes(state)) throw Error('invalid_fixture_selection');
  const f = fixture(); f.channel = channel;
  f.policy.destination_urls = ['https://academy.synthetic.invalid/enroll'];
  f.policy.asset_origins = ['https://media.synthetic.invalid'];
  f.campaign.destination_url = 'https://academy.synthetic.invalid/enroll';
  f.profile.share_url = 'https://academy.synthetic.invalid/enroll?ref=' + f.profile.referral_code;
  f.creative.asset_url = 'https://media.synthetic.invalid/fictional-resource.pdf';
  if (state === 'revoked') f.creative.revoked_at = f.context.now;
  if (state === 'expired') f.context.now = f.creative.expires_at;
  if (state === 'wrong-account') f.context.user_id = 'fictional-user-b';
  let intent;
  try { intent = shareIntent(f); } catch (error) { return { status:'held', reason:error.message }; }
  const encoded = spawnSync(process.env.RVA_PREVIEW_PYTHON || 'python3', [path.join(__dirname,'encode.py')], {
    input: JSON.stringify({ payload:intent.qr_payload }), encoding:'utf8', maxBuffer:128*1024, timeout:10000
  });
  if (encoded.status !== 0) throw Error('local_qr_encoder_unavailable');
  const qr = JSON.parse(encoded.stdout);
  return { status:'ready', copy:intent.copy_text, url:intent.referral_url,
    qr_data_url:'data:image/png;base64,'+qr.png, modules:qr.modules,
    quiet_zone_modules:qr.quiet_zone_modules, error_correction:qr.error_correction };
}
function createPreviewServer({providers=createProviders()}={}) {
  const progress=createProgressFixtures(()=>providers.manifest());
  const server = http.createServer(async (req,res) => {
    const origin='http://127.0.0.1:'+server.address().port;
    const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
      'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; img-src data:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"};
    function reply(code,body,type='application/json') {res.writeHead(code,{...headers,'Content-Type':type});res.end(typeof body==='string'?body:JSON.stringify(body));}
    if(req.headers.host!==new URL(origin).host || (req.headers.origin&&req.headers.origin!==origin) || req.headers['sec-fetch-site']==='cross-site')return reply(403,{error:'local_origin_required'});
    if(req.method==='GET'&&req.url==='/')return reply(200,fs.readFileSync(path.join(__dirname,'index.html'),'utf8'),'text/html; charset=utf-8');
    if(req.method==='GET'&&req.url==='/preview.js')return reply(200,fs.readFileSync(path.join(__dirname,'preview.js'),'utf8'),'application/javascript; charset=utf-8');
    if(req.method==='GET'&&req.url==='/api/bootstrap')return reply(200,providers.manifest());
    if(req.method!=='POST'||!['/api/preview','/api/scenario','/api/share','/api/education','/api/progress'].includes(req.url)||req.headers['content-type']!=='application/json')return reply(404,{error:'not_available'});
    let data='';
    try {
      for await(const chunk of req){data+=chunk;if(Buffer.byteLength(data)>4096)return reply(413,{error:'input_limit'});}
      const input=JSON.parse(data);
      if(!input||typeof input!=='object'||Array.isArray(input))return reply(400,{error:'invalid_fixture_selection'});
      if(req.url==='/api/scenario'){
        if(Object.keys(input).join(',')!=='state')return reply(400,{error:'invalid_fixture_selection'});
        return reply(200,providers.transition(input.state));
      }
      if(req.url==='/api/progress')return reply(200,await progress.execute(input));
      if(req.url==='/api/share')return reply(200,await providers.shareAdapter.execute(input));
      if(req.url==='/api/education')return reply(200,await providers.educationAdapter.execute(input));
      if(Object.keys(input).sort().join(',')!=='channel,state'||!['email','sms','dm','social'].includes(input.channel))return reply(400,{error:'invalid_fixture_selection'});
      const manifest=providers.manifest();
      if(input.state!==manifest.state)return reply(200,{status:'held',reason:'fixture_scenario_changed'});
      const result=await providers.shareAdapter.execute({...manifest.share,channel:input.channel});
      if(result.status!=='ready')return reply(200,result);
      const encoded=spawnSync(process.env.RVA_PREVIEW_PYTHON||'python3',[path.join(__dirname,'encode.py')],{input:JSON.stringify({payload:result.intent.qr_payload}),encoding:'utf8',maxBuffer:128*1024,timeout:10000});
      if(encoded.status!==0)throw Error('local_qr_encoder_unavailable');
      const qr=JSON.parse(encoded.stdout);
      return reply(200,{status:'ready',fixtureOnly:true,productionEligible:false,persisted:false,authority_revision:manifest.authority_revision,copy:result.intent.copy_text,url:result.intent.referral_url,qr_data_url:'data:image/png;base64,'+qr.png,modules:qr.modules,quiet_zone_modules:qr.quiet_zone_modules,error_correction:qr.error_correction});
    }catch{return reply(400,{error:'preview_unavailable'});}
  });
  server.requestTimeout=15000;server.headersTimeout=10000;server.keepAliveTimeout=1000;
  return server;
}
if (require.main===module) {
  const server=createPreviewServer();server.listen(0,'127.0.0.1',()=>console.log('Fictional local preview: http://127.0.0.1:'+server.address().port));
}
module.exports={createPreviewServer,preview};
