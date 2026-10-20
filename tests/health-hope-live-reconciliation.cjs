const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
const git=fs.existsSync('/Library/Developer/CommandLineTools/usr/bin/git')?'/Library/Developer/CommandLineTools/usr/bin/git':'git';
const primary='fa1f490012507319bb93cca64d6cbaf039ceaec3',published='7403a4ff20895200e2655745181f37b5ef7d5c7b';
const run=args=>execFileSync(git,args,{maxBuffer:8*1024*1024}),read=file=>fs.readFileSync(file);
test('reconciliation changes only HHL files and additive shared documentation relative to committed primary',()=>{
 const names=run(['diff','--name-only',primary]).toString().trim().split('\n').filter(Boolean);
 for(const name of names)assert(/^(?:ARCHITECTURE\.md|CURRENT_BUILD_STATE\.md|DECISIONS\.md|SECURITY_MODEL\.md|portal\/index\.html)$/.test(name)||/^(?:docs\/(?:HEALTH_HOPE_LIVE_|health-hope-live-)|(?:netlify\/functions\/(?:_shared\/)?|portal\/|scripts\/(?:test-)?|tests\/(?:backend\/)?|supabase\/migrations\/\d+_)health-hope-live)/.test(name)||/^supabase\/migrations\/\d+_health_hope_live/.test(name),name);
});
test('every committed primary continuity application, SQL, test and evidence file is preserved exactly',()=>{
 const files=run(['diff','--name-only',published,primary]).toString().trim().split('\n').filter(p=>p!=='CURRENT_BUILD_STATE.md'&&p!=='portal/index.html');
 assert(files.length>=19);for(const file of files)assert.deepEqual(read(file),run(['show',primary+':'+file]),file);
});
test('shared portal retains all primary bytes except the six approved guest display/filter options',()=>{
 let current=read('portal/index.html').toString();
 for(const[value,label]of [['registered_guest','Registered Guest'],['engaged_guest','Engaged Guest'],['prospective_client','Prospective Client']]){
  const display='                    <option value="'+value+'" disabled>'+label+'</option>\n',filter='<option value="'+value+'">'+label+'</option>';
  assert.equal(current.split(display).length-1,1);assert.equal(current.split(filter).length-1,1);current=current.replace(display,'').replace(filter,'');
 }
 assert.equal(current,run(['show',primary+':portal/index.html']).toString());
});
test('approved public HHL experience, routing, branding and existing Function entrypoints stay exact published-source bytes',()=>{
 for(const file of ['index.html','health-hope-live.html','css/health-hope-live.css','js/health-hope-live.js','webinar.html','webinar-priority.html','netlify.toml','config/production-public-files.json','netlify/functions/health-hope-live.mjs','netlify/functions/health-hope-live-worker.mjs'])assert.deepEqual(read(file),run(['show',published+':'+file]),file);
});
