// Three static files + headers only. Never include config, Functions, reports, Auth or private records.
const fs=require('node:fs'),path=require('node:path');
const esbuild=require(process.env.RVA_ESBUILD_PATH||'esbuild');
const out=path.resolve('roadmap-b5-preview-dist');fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(path.join(out,'portal'),{recursive:true});
fs.copyFileSync('tests/preview/b5.html',path.join(out,'index.html'));fs.copyFileSync('portal/portal-roadmap-scoring-lab.css',path.join(out,'portal/portal-roadmap-scoring-lab.css'));
esbuild.buildSync({entryPoints:['tests/preview/b5-entry.cjs'],bundle:true,platform:'browser',format:'iife',outfile:path.join(out,'demo.js')});
fs.writeFileSync(path.join(out,'_headers'),`/*\n  Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'none'; img-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'\n  Cache-Control: no-store\n  Referrer-Policy: no-referrer\n  X-Robots-Tag: noindex, nofollow, noarchive\n  X-Content-Type-Options: nosniff\n`);
if(/voalfpxiyznnqfcqcymd|bvooallokgfktssadsrv|service_role|supabaseKey|https:\/\//.test(fs.readFileSync(path.join(out,'demo.js'),'utf8')))throw Error('Preview must contain no environment, secret or endpoint');
fs.writeFileSync(path.join(out,'netlify.toml'),'[build]\npublish = "."\n[functions]\ndirectory = "__no_functions"\n');fs.mkdirSync(path.join(out,'__no_functions'));
console.log('Built isolated fictional-only B5 preview (no Functions or connections)');
