// Isolated fictional preview only. Never a production/beta deploy artifact.
const fs=require('fs'),path=require('path'),esbuild=require(process.env.RVA_ESBUILD_PATH||'esbuild');
require('child_process').execFileSync(process.execPath,['scripts/generate-roadmap-b6-pins.cjs','--check']);
const out=path.resolve('roadmap-b6-preview-dist');fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(path.join(out,'portal'),{recursive:true});fs.copyFileSync('tests/preview/b6.html',path.join(out,'index.html'));
for(const file of ['portal-roadmap-scoring-lab.css','portal-roadmap-calibration.css'])fs.copyFileSync('portal/'+file,path.join(out,'portal',file));
esbuild.buildSync({entryPoints:['tests/preview/b6-entry.cjs'],bundle:true,platform:'browser',format:'iife',outfile:path.join(out,'demo.js')});
if(/voalfpxiyznnqfcqcymd|bvooallokgfktssadsrv|service_role|supabaseKey|https?:\/\//.test(fs.readFileSync(path.join(out,'demo.js'),'utf8')))throw Error('Preview must have no endpoint, environment or service credential');
fs.writeFileSync(path.join(out,'_headers'),`/*\n  Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'none'; img-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'\n  Cache-Control: no-store\n  Referrer-Policy: no-referrer\n  X-Robots-Tag: noindex, nofollow, noarchive\n  X-Content-Type-Options: nosniff\n`);
fs.writeFileSync(path.join(out,'netlify.toml'),'[build]\npublish = "."\n[functions]\ndirectory = "__no_functions"\n');fs.mkdirSync(path.join(out,'__no_functions'));console.log('Built isolated B6 fictional rehearsal: no Functions, Auth, data or network connections');
