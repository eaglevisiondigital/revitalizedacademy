'use strict';
// Metadata-only private capture input. Never contacts a live database.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),evidence=path.resolve(root,'../deployment-evidence/2026-11-01-wave3');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const pins={
 'catalog-normalized.json':'94322f192cda7bdaeae45c7fb2137745933bf66eef2816467c012f41d380e757',
 'catalog-supplement.json':'7cc1fb4f753edc6eb703212f2ee9970c0d0f8607758663a07f84f49a15227c94',
 'catalog-trigger-supplement.json':'701101757c450145361c670316e72ca83ca669877f28ce2dcb26d948b5aebff3',
 'catalog-goal-fk-supplement.json':'f64786c8b9aeb292dc020694fb72ab2df5329003d49e41a72cdc1e0645f27dda',
 'catalog-price-fk-supplement.json':'d519bfae09ecfba8a6b02f9355691fb6bd433f6c7ce8ded426f502982902af0f'
};
test('independent metadata inputs retain exact Master capture hashes outside source control',()=>{
 for(const [name,hash] of Object.entries(pins))assert.equal(sha(path.join(evidence,name)),hash,name);
 assert.equal(Object.keys(read(path.join(evidence,'catalog-normalized.json'))).includes('rows'),false);
});
test('independent allowance fixture subset tables and routine bodies match current metadata captures',()=>{
 const captures=Object.keys(pins).map(n=>read(path.join(evidence,n))),current=read(path.join(root,'tests/wave3-allowance/current-subset.json'));
 const tables=new Map(captures.flatMap(c=>c.tables||[]).map(t=>[t.schema+'.'+t.name,t]));
 const routines=new Map(captures.flatMap(c=>c.routines||[]).map(r=>[r.schema+'.'+r.name+'('+r.args+')',r]));
 assert(current.tables.length>=10);assert(current.routines.length>=30);
 for(const table of current.tables)assert.deepEqual(table,tables.get(table.schema+'.'+table.name),table.name);
 for(const routine of current.routines)assert.deepEqual(routine,routines.get(routine.schema+'.'+routine.name+'('+routine.args+')'),routine.name);
});
test('independent goal reconstruction selects all 25 current tables, current invoker view and 80 captured routines without substitution',()=>{
 const {inputs,CORE}=require('../wave3-goals/reconstruct.cjs'),input=inputs(root);
 const captures=Object.keys(pins).map(n=>read(path.join(evidence,n)));
 const tables=new Map(captures.flatMap(c=>c.tables||[]).map(t=>[t.schema+'.'+t.name,t]));
 const routines=new Map(captures.flatMap(c=>c.routines||[]).map(r=>[r.schema+'.'+r.name+'('+r.args+')',r]));
 assert.equal(CORE.length,25);assert.equal(input.routines.size,80);assert.equal(input.pins.catalogs.length,Object.keys(pins).length);
 for(const name of [...CORE,'my_goals'])assert.deepEqual(input.tables.get('public.'+name),tables.get('public.'+name),name);
 for(const [name,routine] of input.routines)assert.deepEqual(routine,routines.get(name),name);
});
