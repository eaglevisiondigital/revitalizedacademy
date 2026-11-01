'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {parseIpcs,capacity,lease}=require('../../tools/wave6-postgres/resource-gate.cjs');
const row=(id=1,n=0)=>`m ${id} 0x00112233 --rw------- fictional staff fictional staff ${n} 56 123 0 no-entry no-entry 12:00:00`;
test('metadata parses exact current macOS column structure without commands/credentials',()=>assert.deepEqual(parseIpcs('Shared Memory:\n'+row())[0],{id:1,key:'0x00112233',owner:'fictional',creator:'fictional',attachments:0,bytes:56,creatorPid:123,lastPid:0}));
test('metadata denied fails closed',()=>assert.throws(()=>parseIpcs('Shared Memory:\nipcs: sysctlbyname: Operation not permitted'),/UNAVAILABLE/));
test('missing shared memory section fails closed',()=>assert.throws(()=>parseIpcs('nothing'),/UNAVAILABLE/));
test('malformed row fails closed',()=>assert.throws(()=>parseIpcs('Shared Memory:\nm junk'),/UNPARSEABLE/));
test('noninteger fields fail closed',()=>assert.throws(()=>parseIpcs('Shared Memory:\n'+row().replace('0 56','bad 56')),/UNPARSEABLE/));
test('full SHMMNI inventory BLOCKS without asserting orphan ownership',()=>assert.equal(capacity(Array(32).fill({}),32).result,'BLOCKED_SYSV_CAPACITY'));
test('one free slot conservatively BLOCKS',()=>assert.equal(capacity(Array(31).fill({}),32).result,'BLOCKED_SYSV_CAPACITY'));
test('two free slots permit serialized test only',()=>assert.equal(capacity(Array(30).fill({}),32).result,'READY'));
test('invalid kernel limit cannot imply ready',()=>assert.throws(()=>capacity([],NaN),/INVALID/));
test('reserve cannot be weakened to one',()=>assert.throws(()=>capacity([],32,1),/INVALID/));
test('lease excludes simultaneous holder and leaves existing holder untouched',()=>{
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'rva-wave6-env-unit-')),lock=path.join(d,'lock');
 try{lease(lock,()=>{assert.equal(fs.statSync(lock).mode&0o777,0o700);assert.throws(()=>lease(lock,()=>assert.fail('second callback ran')),/EEXIST/);assert.ok(fs.existsSync(path.join(lock,'lease.json')));});assert.ok(!fs.existsSync(lock));}finally{fs.rmSync(d,{recursive:true,force:true});}
});
test('successful callback returns value and teardown removes only own lock',()=>{
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'rva-wave6-env-unit-'));try{fs.writeFileSync(path.join(d,'unrelated'),'preserve');assert.equal(lease(path.join(d,'lock'),()=>42),42);assert.equal(fs.readFileSync(path.join(d,'unrelated'),'utf8'),'preserve');}finally{fs.rmSync(d,{recursive:true,force:true});}
});
test('throwing callback removes own lease and preserves error',()=>{
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'rva-wave6-env-unit-')),lock=path.join(d,'lock');try{assert.throws(()=>lease(lock,()=>{throw Error('fictional callback failure');}),/fictional callback failure/);assert.ok(!fs.existsSync(lock));}finally{fs.rmSync(d,{recursive:true,force:true});}
});
test('relative lock path is rejected',()=>assert.throws(()=>lease('relative',()=>{}),/ABSOLUTE/));
test('source wrapper rejects relative source/output before database execution',()=>assert.throws(()=>require('../../tools/wave6-postgres/run-pinned-wave5.cjs').run('relative','relative'),/ABSOLUTE/));
test('source wrapper rejects writing accepted source tree',()=>assert.throws(()=>require('../../tools/wave6-postgres/run-pinned-wave5.cjs').run('/private/tmp/fictional','/private/tmp/fictional/outputs'),/OUTSIDE/));
test('source wrapper rejects normalized traversal into source',()=>assert.throws(()=>require('../../tools/wave6-postgres/run-pinned-wave5.cjs').run('/private/tmp/fictional','/private/tmp/other/../fictional/outputs'),/OUTSIDE/));
test('source wrapper rejects output symlink into source before executing git or PG',()=>{
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'rva-wave6-env-unit-')),source=path.join(d,'source'),link=path.join(d,'output-link');
 try{fs.mkdirSync(source);fs.symlinkSync(source,link);assert.throws(()=>require('../../tools/wave6-postgres/run-pinned-wave5.cjs').run(source,path.join(link,'new-output')),/OUTSIDE/);}finally{fs.rmSync(d,{recursive:true,force:true});}
});
test('tooling contains no cleanup or production route primitives',()=>{
 for(const f of ['resource-gate.cjs','run-pinned-wave5.cjs','shim-metadata.c']){const s=fs.readFileSync(path.resolve(__dirname,'../../tools/wave6-postgres',f),'utf8');assert.doesNotMatch(s,/IPC_RMID|ipcrm|kill\(|service_role|https?:\/\/|PGPASSWORD|DATABASE_URL/);}
});
