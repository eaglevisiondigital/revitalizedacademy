// Receipt wrapper only: executes the unchanged actual-app DOM assertions.
const fs=require('node:fs'),path=require('node:path'),{spawnSync,execFileSync}=require('node:child_process'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'../..'),out=require('./output-directory.cjs')(root);fs.mkdirSync(out,{recursive:true});
const receipt={runnerSha256:createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),outputDirectory:out,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),startedAt:new Date().toISOString(),adapter:'Actual onboarding HTML/JS; fake Auth/RPC; no managed Auth or production acceptance',productionCalls:0};
const result=spawnSync(process.execPath,['--test','--test-reporter=tap',path.join(__dirname,'onboarding.test.cjs')],{cwd:root,env:process.env,encoding:'utf8',maxBuffer:8*1024*1024,timeout:30000});
const output=(result.stdout||'')+(result.stderr||'');fs.writeFileSync(path.join(out,'onboarding-dom.tap'),output);process.stdout.write(output);
for(const key of ['tests','pass','fail','skipped']){const match=output.match(new RegExp('^# '+key+' (\\d+)$','m'));if(match)receipt[key]=Number(match[1]);}
receipt.exitCode=result.status;receipt.result=result.status===0?'PASS_PARTIAL':'FAIL';if(result.error)receipt.error=result.error.message;receipt.completedAt=new Date().toISOString();
fs.writeFileSync(path.join(out,'dom-receipt.json'),JSON.stringify(receipt,null,2)+'\n');process.exitCode=result.status??1;
