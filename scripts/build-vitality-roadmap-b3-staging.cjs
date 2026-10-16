// Static fictional rehearsal only. No production environment or hosted write adapter.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const built=spawnSync(process.execPath,['scripts/build-vitality-roadmap-b21-staging.cjs'],{encoding:'utf8'});if(built.status!==0)throw Error(built.stderr||built.stdout);
const out='roadmap-b3-dist',files=['js/vitality-roadmap-b3-adapter.js','js/vitality-roadmap-b3-fixtures.js','portal/portal-roadmap-b3-workbench.js','css/vitality-roadmap-b3-workbench.css'];
fs.rmSync(out,{recursive:true,force:true});fs.cpSync('roadmap-b21-dist',out,{recursive:true});for(const f of files){fs.mkdirSync(path.dirname(path.join(out,f)),{recursive:true});fs.copyFileSync(f,path.join(out,f));}
const html=path.join(out,'portal/index.html');fs.writeFileSync(html,fs.readFileSync(html,'utf8').replace('</head>','<link rel="stylesheet" href="/css/vitality-roadmap-b3-workbench.css?v=100">\n</head>').replace('</body>',files.filter(f=>f.endsWith('.js')).map(f=>`<script defer src="/${f}?v=100"></script>`).join('\n')+'\n</body>'));
console.log(JSON.stringify({output:out,origin:'https://roadmap-b2--revitalizedacademy-staging.netlify.app',realScoring:false,hostedWrites:false,release:'held'}));
