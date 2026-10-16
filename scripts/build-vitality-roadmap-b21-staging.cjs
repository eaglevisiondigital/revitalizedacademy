// Isolated B2 preview only; B1/B2 builds and production manifest stay unchanged.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const build=spawnSync(process.execPath,['scripts/build-vitality-roadmap-b2-staging.cjs'],{encoding:'utf8'});
if(build.status!==0)throw Error(build.stderr||build.stdout);
const out='roadmap-b21-dist',assets=['js/vitality-roadmap-b21-engine.js','js/vitality-roadmap-b21-scenarios.js','portal/portal-roadmap-b21-workbench.js','css/vitality-roadmap-b21-workbench.css'];
fs.rmSync(out,{recursive:true,force:true});fs.cpSync('roadmap-b2-dist',out,{recursive:true});
for(const file of assets){fs.mkdirSync(path.dirname(path.join(out,file)),{recursive:true});fs.copyFileSync(file,path.join(out,file));}
const html=path.join(out,'portal/index.html');fs.writeFileSync(html,fs.readFileSync(html,'utf8').replace('</head>','<link rel="stylesheet" href="/css/vitality-roadmap-b21-workbench.css?v=100">\n</head>').replace('</body>',assets.filter(x=>x.endsWith('.js')).map(x=>`<script defer src="/${x}?v=100"></script>`).join('\n')+'\n</body>'));
console.log(JSON.stringify({output:path.resolve(out),origin:'https://roadmap-b2--revitalizedacademy-staging.netlify.app',assets:assets.length,approval:'held',participantScoring:false}));
