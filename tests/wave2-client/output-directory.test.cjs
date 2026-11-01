const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const output=require('./output-directory.cjs');
test('default receipt directory remains the author issue54 wave2 path',()=>assert.equal(output('/fixture/repository',''),'/fixture/repository/docs/orchestration/issue-54/wave2'));
test('explicit absolute QA output stays outside the author receipt directory',()=>assert.equal(output('/fixture/repository','/private/tmp/qa-wave2-b'),'/private/tmp/qa-wave2-b'));
test('explicit relative QA output resolves from the repository root',()=>assert.equal(output('/fixture/repository','qa-receipts'),path.resolve('/fixture/repository','qa-receipts')));
