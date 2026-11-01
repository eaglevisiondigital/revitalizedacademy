'use strict';
// Metadata and bounded changed-source scan only; never inspect protected source archives/client records.
const fs=require('node:fs'),cp=require('node:child_process'),crypto=require('node:crypto'),zlib=require('node:zlib');
const base='fad394ef',head=cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const names=cp.execFileSync('git',['diff','--name-only','--diff-filter=ACMR',base+'..HEAD'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
const rules={private_key:/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,github_token:/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/,aws_key:/\bAKIA[0-9A-Z]{16}\b/,postgres_password_uri:/postgres(?:ql)?:\/\/[^\s:@/]+:[^\s@/]{4,}@[^\s/]+/i,secret_assignment:/\b(?:SUPABASE_SERVICE_ROLE_KEY|SUPABASE_ACCESS_TOKEN|NETLIFY_AUTH_TOKEN|RESEND_API_KEY|DATABASE_PASSWORD)\s*[:=]\s*["'](?!fictional|synthetic|example|placeholder|\$|<)[A-Za-z0-9._-]{20,}["']/};
const findings=[],files=[],archives=[];
for(const file of names){const data=fs.readFileSync(file),entry={path:file,sha256:crypto.createHash('sha256').update(data).digest('hex'),bytes:data.length};files.push(entry);
 if(/\.(?:zip|pdf|docx|txt|csv|jsonl|mp4|mp3)$/i.test(file)&&!/^(?:tests|docs\/orchestration|proposals|tools)\//.test(file))archives.push({path:file,reason:'manual classification required for outside-source artifact'});
 let content;if(file.endsWith('.gz')){content=zlib.gunzipSync(data).toString('utf8');entry.decompressedBytes=Buffer.byteLength(content);entry.decompressedSha256=crypto.createHash('sha256').update(content).digest('hex');entry.classification='fictional browser failure evidence; names/credentials searched without content output';}else if(data.subarray(0,8192).includes(0)){entry.classification='binary: metadata only';continue;}else content=data.toString('utf8');
 entry.classification||='source, synthetic tests or sanitized coordination evidence';
 for(const [rule,pattern]of Object.entries(rules))if(pattern.test(content))findings.push({path:file,rule});
 if(/(?:caroline|alex|johnny)[_ -]?(?:answers|questionnaire[_ -]?response|medical[_ -]?record)/i.test(file))findings.push({path:file,rule:'protected client filename classification'});
 if(file.endsWith('.gz')&&/(?:Alex Walker|Caroline Risi|Johnny|eyJ[a-zA-Z0-9_-]{20,}\.)/.test(content))findings.push({path:file,rule:'raw browser evidence private identifier/token review'});
}
const report={base,head,scope:'Wave3–8 cumulative changed source only; no private records, archives, logs or credentials read from outside Git',files:files.length,credentialPatternMatches:findings,artifactReview:archives,entries:files,limitations:'Pattern scan is not proof of absence of every possible secret or PHI. Changed fixtures and runtime are independently reviewed; existing baseline private material not reopened. No push or hosted mutation.'};
fs.mkdirSync('docs/orchestration/issue-56/wave8',{recursive:true});fs.writeFileSync('docs/orchestration/issue-56/wave8/SOURCE_HYGIENE.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({files:files.length,findings:findings.length,artifactReview:archives.length}));process.exitCode=findings.length||archives.length?1:0;
