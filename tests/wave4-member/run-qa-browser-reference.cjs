'use strict';
// Read-only QA assertions; redirect only module root/output to this lane's owned package.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),source=path.resolve(root,'../academy-wave4-qa/tests/wave4-qa/browser-independent.cjs');
const out=path.resolve(process.env.RVA_WAVE4_MEMBER_OUTPUT||path.join(root,'docs/orchestration/issue-54/wave4/followup/qa-browser-reference'));fs.mkdirSync(out,{recursive:true});
const bytes=fs.readFileSync(source),original=bytes.toString('utf8');
const declaration="const root=path.resolve(__dirname,'../..'),out=path.join(root,'docs/orchestration/issue-56/wave4/browser-independent');";
if(!original.includes(declaration))throw Error('QA reference path contract changed; inspect before adapting');
const code=original.replace(declaration,'const root='+JSON.stringify(root)+',out='+JSON.stringify(out)+';');
fs.writeFileSync(path.join(out,'REFERENCE.json'),JSON.stringify({source:path.relative(root,source),sha256:crypto.createHash('sha256').update(bytes).digest('hex'),adaptation:'Only root/output declaration redirected; assertions and browser behavior unchanged',independentExecutionClaim:false},null,2)+'\n');
const filename=path.join(__dirname,'qa-reference-browser.cjs'),mod=new Module(filename,module);mod.filename=filename;mod.paths=Module._nodeModulePaths(__dirname);mod._compile(code,filename);
