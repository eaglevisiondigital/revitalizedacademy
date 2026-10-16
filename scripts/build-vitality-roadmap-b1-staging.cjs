// Isolated manual preview only. Never changes the accepted beta or production publish.
const fs=require('node:fs'),path=require('node:path'),{resolve}=require('../js/environment.js');
const origin='https://roadmap-b1--revitalizedacademy-staging.netlify.app';
const config=resolve({environment:'staging',supabaseUrl:'https://bvooallokgfktssadsrv.supabase.co',supabaseKey:'sb_publishable_AySpt-E1oApbE3mQDCUyeg_NN-VhdqO',appOrigin:origin,paymentMode:'synthetic'});
const root=path.resolve(__dirname,'..'),out=path.join(root,'roadmap-b1-dist');fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
const extra=['member/roadmap/index.html','portal/portal-roadmap-review.js','js/vitality-roadmap-view.js','js/vitality-roadmap-account.js','css/vitality-roadmap-workspace.css','js/environment.js'];
const files=[...new Set([...require('../config/production-public-files.json').filter(f=>f.startsWith('portal/')||f.startsWith('assets/images/')), ...extra])];
for(const f of files){if(f.includes('..')||path.isAbsolute(f))throw Error('Invalid path');const source=path.join(root,f);if(fs.lstatSync(source).isSymbolicLink())throw Error('Symlink refused');let bytes=fs.readFileSync(source);if(/\.(html|js|css|json|webmanifest)$/.test(f)&&f!=='js/environment.js'){
 let s=bytes.toString().replaceAll('voalfpxiyznnqfcqcymd','bvooallokgfktssadsrv').replaceAll('sb_publishable_09WCwErmz_KpKsI7AtlHyg_SQtHWmZd',config.supabaseKey).replaceAll('https://www.revitalizedacademy.com',origin).replaceAll('https://revitalizedacademy.com',origin);
 if(f==='portal/index.html')s=s.replace('<head>','<head>\n<script src="/runtime-config.js"></script><script src="/js/environment.js"></script>\n<link rel="stylesheet" href="/css/vitality-roadmap-workspace.css?v=100">').replace('</body>','<script defer src="/js/vitality-roadmap-view.js?v=100"></script><script defer src="/portal/portal-roadmap-review.js?v=100"></script>\n</body>').replace('portal-vitality-assessments.js?v=101','portal-vitality-assessments.js?v=b1');
 if(s.includes('voalfpxiyznnqfcqcymd')||s.includes('https://revitalizedacademy.com'))throw Error('Production binding in '+f);bytes=Buffer.from(s);
 }fs.mkdirSync(path.dirname(path.join(out,f)),{recursive:true});fs.writeFileSync(path.join(out,f),bytes);}
fs.writeFileSync(path.join(out,'runtime-config.js'),`window.RVA_PUBLIC_CONFIG=${JSON.stringify(config)};\n`);
fs.writeFileSync(path.join(out,'index.html'),'<!doctype html><html lang="en"><title>Roadmap B1 staging preview</title><h1>Private Roadmap foundation · staging only</h1><p>Approval and release held.</p><a href="/portal/#vitality-assessments">Staff review</a> · <a href="/member/roadmap/">My Vitality Roadmap</a></html>');
fs.writeFileSync(path.join(out,'_headers'),'/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n  Cache-Control: no-store\n  Referrer-Policy: no-referrer\n  X-Content-Type-Options: nosniff\n');
console.log(JSON.stringify({files:files.length+3,environment:config.environment,projectRef:config.projectRef,origin,output:out}));
