'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),a=require('node:assert/strict');
const old=JSON.parse(fs.readFileSync('docs/orchestration/issue-56/wave5/RESULTS_MATRIX.json'));
const original=fs.readFileSync('docs/orchestration/issue-56/ACCEPTANCE_MATRIX.json');
a.equal(crypto.createHash('sha256').update(original).digest('hex'),old.sourceMatrixSha256);
const result=structuredClone(old);result.schemaVersion='rva-wave6-case-results-v1';result.wave5MatrixPreserved=true;
for(const c of result.cases){c.wave5EvidenceRetained=true;c.wave6ActualPostgres='NOT_RUN_ENVIRONMENT_BLOCKED';if(c.status==='FAIL'){c.actualObservedSubtests+=' Wave6 guarded corrective source prepared, exact unchanged five assertions NOT RUN; historical FAIL remains.';c.blockingOrNotRunReason='Historical actual failure is unresolved until corrected actual PostgreSQL execution. Local resource capacity and managed-session/business gates remain.';}if(c.caseId==='O01'){c.actualSuiteIds=['QA_WAVE6_COORDINATION'];c.actualObservedSubtests='Entire original LOCAL structural procedure independently executed against accepted9be source registers and actual four Wave6 dispatches/worktrees/branches with independently supplied native receipt.15PASS, including negative source/dispatch/ownership/scope cases. No business or source completeness implied.';c.completeCaseRun=true;c.fullPackagePassed=true;}if(['C02','A01','V01'].includes(c.caseId))c.wave6PartialCoverage='Fictional actual runtime/provider/UI and detached educational progress tested; cannot substitute for full authorized backend/business acceptance.';}
const counts={PASS:0,FAIL:0,BLOCKED:0,NOT_RUN:0};for(const c of result.cases)counts[c.status]++;
a.equal(result.cases.length,57);a.deepEqual(result.cases.map(c=>c.caseId),JSON.parse(original).cases.map(c=>c.id));a.deepEqual(counts,{PASS:1,FAIL:3,BLOCKED:42,NOT_RUN:11});result.counts=counts;
fs.writeFileSync('docs/orchestration/issue-56/wave6/RESULTS_MATRIX.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(counts));
