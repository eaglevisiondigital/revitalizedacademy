const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {normalize,mapping,id,searchInput,summarizeSearch}=require('../netlify/lib/fooddata.cjs');
const {createHandler}=require('../netlify/lib/food-database-service.cjs');
const {experience}=require('../netlify/lib/nutrient-target-contract.cjs');
const foods=require('./fixtures/usda-foods.json').foods;
test('official apple search preserves all five varieties and generic source preference',()=>{
 const names=['fuji','gala','granny smith','honeycrisp','red delicious'];const result=summarizeSearch({foods:[{fdcId:99,description:'Brand apple',dataType:'Branded'},...require('./fixtures/usda-apple-search.json').foods]});assert.equal(result[0].type,'Foundation');assert.equal(result.at(-1).type,'Branded');for(const n of names)assert(result.some(f=>f.name.toLowerCase().includes(n)),n);assert.equal(new Set(result.map(f=>f.fdcId)).size,result.length);assert.equal(searchInput({query:'apple'}).dataType.includes('Branded'),false);
});
test('two real Foundation apple varieties remain distinct with source identifiers and portions',()=>{const [a,b]=foods.slice(0,2).map(normalize);assert.notEqual(a.fdc_id,b.fdc_id);assert.notEqual(a.nutrition.energy_kcal,b.nutrition.energy_kcal);assert.equal(a.source_portions[0].gram_weight,140);assert.equal(a.source_metadata.basis_grams,100);assert(a.source_metadata.nutrients.some(n=>n.id===1003&&n.unit==='g'));});
test('SR Legacy and real Branded food use per100g amounts, not label serving totals',()=>{const generic=normalize(foods[2]),branded=normalize(foods.at(-1));assert.equal(generic.nutrition.energy_kcal,89);assert.equal(branded.source_data_type,'Branded');assert(branded.brand);assert.equal(branded.nutrition.energy_kcal,foods.at(-1).foodNutrients.find(n=>n.nutrient.id===1008).amount);});
test('all mapped catalog keys exist, broad vitamin/mineral/amino/fat coverage; no guessed aggregate',()=>{
 const sql=fs.readFileSync('supabase/migrations/20261004013000_nutrition_engine_nutrient_catalog.sql','utf8');for(const [key]of Object.values(mapping))assert(sql.includes("('"+key+"'"),key);
 const food=normalize(foods[2]);for(const key of ['protein_g','magnesium_mg','potassium_mg','vitamin_a_rae_ug','vitamin_c_mg','vitamin_d_ug','vitamin_e_mg','vitamin_k_ug','thiamin_mg','tryptophan_g','omega3_epa_g'])assert.equal(typeof food.nutrition[key],'number',key);assert.equal(food.nutrition.omega3_g,undefined);assert.equal(food.nutrition.omega6_la_g,undefined);
});
test('unknown/null amounts are omitted; genuine zero preserved; malformed amount/unit/ID rejected',()=>{
 const base={...foods[0],foodNutrients:[{nutrient:{id:1003,unitName:'g'},amount:0},{nutrient:{id:1008,unitName:'kcal'},amount:null}]};assert.deepEqual(normalize(base).nutrition,{protein_g:0});
 for(const amount of ['',false,-1,Infinity,'2'])assert.throws(()=>normalize({...base,foodNutrients:[{nutrient:{id:1003,unitName:'g'},amount}]}));
 assert.throws(()=>normalize({...base,foodNutrients:[{nutrient:{id:1003,unitName:'IU'},amount:1}]}));for(const value of ['1',0,-1,1.5,NaN,2147483648])assert.throws(()=>id(value));
});
test('mass-unit normalization and specific-energy priority do not double count',()=>{const food=normalize({...foods[0],foodNutrients:[{nutrient:{id:1003,unitName:'mg'},amount:1000},{nutrient:{id:2048,unitName:'kcal'},amount:50},{nutrient:{id:2047,unitName:'kcal'},amount:60}]});assert.deepEqual(food.nutrition,{energy_kcal:50,protein_g:1});});
test('intake/reference/coach target contract is independent, explicit and unknown-safe',()=>{const r=experience({nutrientKey:'protein_g',unit:'g',consumed:94,context:{age:40,sex:'female',lifeStage:'adult'},reference:{value:90,unit:'g',source:'approved-reference',version:'1'},coach:{value:120,unit:'g',source:'authorized-coach',version:'2'}});assert.equal(r.effective_target.value,120);assert.equal(r.reference_target.value,90);assert.equal(experience({nutrientKey:'protein_g',unit:'g',consumed:null}).effective_target,null);assert.throws(()=>experience({nutrientKey:'protein_g',unit:'g',consumed:0,reference:{value:90,unit:'mg'}}));});
function harness({admin=true,access=true,configured=true}={}){
 const actor='11111111-1111-4111-8111-111111111111',method='22222222-2222-4222-8222-222222222222',cache=new Map(),calls=[],local=new Map();
 const handler=createHandler({env:n=>({'RVA_FOOD_DATABASE_SUPABASE_URL':'https://test.supabase.co','RVA_FOOD_DATABASE_SUPABASE_ANON_KEY':'public','RVA_FOOD_DATABASE_SUPABASE_SERVICE_ROLE_KEY':'secret','USDA_FDC_API_KEY':configured?'protected-test-key':null}[n]),fetch:async(url,options)=>{
  calls.push({url,options});if(url.endsWith('/auth/v1/user'))return Response.json({id:actor});
  if(url.includes('/rpc/')){const p=JSON.parse(options.body);if(!access)return Response.json({code:'42501'},{status:403});if(p.p_action==='authorize')return Response.json({admin});if(p.p_action==='get')return Response.json(local.get(Number(p.p_key))||null);if(p.p_action==='cache_get')return Response.json(cache.get(p.p_key)||null);if(p.p_action==='cache_put')cache.set(p.p_key,p.p_value);if(['import','refresh'].includes(p.p_action)){local.set(p.p_value.fdc_id,p.p_value);return Response.json(p.p_value);}return Response.json({});}
  if(url.includes('foods/search'))return Response.json({foods:foods.map(f=>({...f}))});return Response.json(JSON.parse(options.body).fdcIds.map(id=>foods.find(f=>f.fdcId===id)));
 }});
 const invoke=body=>handler(new Request('https://revitalizedacademy.com/.netlify/functions/food-database',{method:'POST',headers:{Authorization:'Bearer verified-test'},body:JSON.stringify(body)}));return {invoke,calls,method,handler};
}
test('server verifies Auth, ignores body actor; cache/import reuse avoids repeat USDA requests',async()=>{
 const h=harness();for(let i=0;i<2;i++)assert.equal((await h.invoke({action:'search',query:'apple',actor:'forged'})).status,200);assert.equal(h.calls.filter(c=>c.url.includes('api.nal')).length,1);
 for(let i=0;i<2;i++)assert.equal((await h.invoke({action:'import',fdcId:foods[0].fdcId,methodologyId:h.method})).status,200);assert.equal(h.calls.filter(c=>c.url.includes('api.nal')).length,2);assert(h.calls.filter(c=>c.url.includes('/rpc/')).every(c=>JSON.parse(c.options.body).p_actor==='11111111-1111-4111-8111-111111111111'));
});
test('details supports multiple IDs, protected credential gate and denied/non-admin refresh',async()=>{
 const h=harness();const response=await h.invoke({action:'details',ids:foods.slice(0,2).map(f=>f.fdcId)});assert.equal(response.status,200);assert.equal((await response.json()).foods.length,2);
 assert.equal((await harness({configured:false}).invoke({action:'search',query:'apple'})).status,503);
 assert.equal((await harness({access:false}).invoke({action:'search',query:'apple'})).status,403);
 assert.equal((await harness({admin:false}).invoke({action:'refresh',fdcId:foods[0].fdcId,methodologyId:h.method})).status,403);
 assert.equal((await h.handler(new Request('https://example.invalid',{method:'POST',body:'{}'}))).status,401);
});
test('no key/server role ships in manifest; source scripts match exact build',()=>{const manifest=require('../config/public-files.json');for(const path of ['portal/portal-food-database.js','portal/portal-food-database.css']){assert(manifest.includes(path));assert.equal(fs.readFileSync(path,'utf8'),fs.readFileSync('dist/'+path,'utf8'));}for(const path of manifest.filter(f=>/\.(?:js|html)$/.test(f)))assert.doesNotMatch(fs.readFileSync('dist/'+path,'utf8'),/USDA_FDC_API_KEY|RVA_FOOD_DATABASE_SUPABASE_SERVICE_ROLE_KEY/);});
