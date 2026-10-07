const {test,before,after,beforeEach,afterEach}=require('node:test'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto'),{Client}=require('pg');
const {normalize}=require('../../netlify/lib/fooddata.cjs'),source=require('../fixtures/usda-foods.json').foods;
if(!/^rva_gate_\d+_\d+$/.test(process.env.RVA_TEST_DATABASE||'')||process.env.PGHOST!=='127.0.0.1')throw Error('Isolated local database required');
const db=new Client(),q=(s,p=[])=>db.query(s,p),val=async(s,p=[])=>Object.values((await q(s,p)).rows[0])[0];let owner,admin,coach,member,inactive,method;
async function actor(uid,sql,args=[],role='authenticated'){await q('savepoint actor');try{await q('set local role '+role);await q("select set_config('request.jwt.claim.sub',$1,true)",[uid||'']);const r=await q(sql,args);await q('reset role');await q('release actor');return r;}catch(e){await q('rollback to actor');await q('release actor');throw e;}}
async function user(role,status='active'){const id=randomUUID();await q('insert into auth.users(id,email) values($1,$2)',[id,id+'@example.invalid']);if(role)await q("insert into public.staff_access(user_id,role,status,onboarding_status,contact_scope) values($1,$2,$3,'complete','all')",[id,role,status]);if(role)await q("update public.staff_access set onboarding_status='complete' where user_id=$1",[id]);return id;}
before(()=>db.connect());after(()=>db.end());beforeEach(async()=>{await q('begin');await q("insert into public.staff_permission_catalog(permission_key,label,category) values('learning.manage','Content','Learning') on conflict do nothing");await q("insert into public.staff_role_permission_defaults(role,permission_key,allowed) values('owner','learning.manage',true),('admin','learning.manage',true),('coach','learning.manage',true) on conflict(role,permission_key) do update set allowed=true");owner=await user('owner');admin=await user('admin');coach=await user('coach');member=await user(null);inactive=await user('owner','inactive');method=await val("insert into public.nutrition_methodologies(methodology_key,name) values($1,'Local USDA methodology') returning id",[randomUUID()]);});afterEach(()=>q('rollback'));
async function server(action,value=null,key=null,user=owner){return(await actor(null,'select public.food_database_server($1,$2,$3,$4,$5) result',[user,action,key,value,method],'service_role')).rows[0].result;}
const importFood=(food=source[0],user=owner)=>server('import',normalize(food),null,user);
async function recipe(){return(await actor(owner,"insert into public.recipes(methodology_id,title,servings) values($1,'Recipe fixture',2) returning id",[method])).rows[0].id;}
async function ingredient(recipe,food,quantity=100,unit='g',portion=null){return(await actor(owner,"insert into public.recipe_ingredients(recipe_id,food_id,ingredient,quantity,unit,source_portion_id) values($1,$2,'Food',$3,$4,$5) returning id",[recipe,food,quantity,unit,portion])).rows[0].id;}
async function calculate(id){return(await actor(owner,'select public.recalculate_recipe_nutrition($1) result',[id])).rows[0].result;}
test('canonical Fuji/Gala/generic/branded imports remain distinct, duplicate import reuses ID and custom stays custom',async()=>{
 const a=await importFood(),again=await importFood(),b=await importFood(source[1]),generic=await importFood(source[2]),brand=await importFood(source.at(-1));assert.equal(a.id,again.id);assert.notEqual(a.id,b.id);assert.equal(generic.source_data_type,'SR Legacy');assert.equal(brand.source_data_type,'Branded');assert.equal(Number(await val("select count(*) from public.food_catalog where provider='usda_fdc'")),4);
 const custom=(await actor(owner,"insert into public.food_catalog(methodology_id,name,nutrition,serving_size,grams_per_serving) values($1,'Custom', $2,1,20) returning *",[method,{protein_g:5}])).rows[0];assert.equal(custom.provider,null);assert.deepEqual(custom.nutrition,{protein_g:5});
});
test('Owner/Admin approval is independent and audited; Coach/member/direct forged approval denied',async()=>{
 const f=await importFood();for(const user of [owner,admin])await actor(user,'select public.set_food_revitalized_approved($1,true)',[f.id]);assert.equal(await val('select revitalized_approved from public.food_catalog where id=$1',[f.id]),true);assert.equal(await val('select source_version from public.food_catalog where id=$1',[f.id]),f.source_version);
 for(const user of [coach,member,inactive])await assert.rejects(actor(user,'select public.set_food_revitalized_approved($1,false)',[f.id]),/Owner\/Admin/);
 await assert.rejects(actor(coach,'update public.food_catalog set revitalized_approved=false where id=$1',[f.id]),/authorized/);await actor(owner,'select public.set_food_revitalized_approved($1,false)',[f.id]);assert.equal(Number(await val("select count(*) from private.food_source_history where action='approval'")),3);
});
test('server RPC denies browser/anon, member/inactive, explicit permission denial; permitted Coach may import only',async()=>{
 await assert.rejects(actor(owner,"select public.food_database_server($1,'authorize')",[owner]),/permission denied/);await assert.rejects(actor(null,"select public.food_database_server($1,'authorize')",[owner],'anon'),/permission denied/);
 for(const user of [member,inactive])await assert.rejects(server('authorize',null,null,user),/denied/);
 const f=await importFood(source[0],coach);await assert.rejects(server('refresh',normalize(source[0]),null,coach),/Owner\/Admin/);
 await q('insert into public.staff_permission_overrides(user_id,permission_key,allowed,updated_by) values($1,$2,false,$3)',[coach,'learning.manage',owner]);await assert.rejects(server('authorize',null,null,coach),/denied/);
 await assert.rejects(actor(owner,'update public.food_catalog set nutrition=$2 where id=$1',[f.id,{protein_g:0}]),/read-only/);await assert.rejects(actor(owner,"insert into public.food_catalog(methodology_id,name,provider,fdc_id,source_version) values($1,'Forge','usda_fdc',999,$2)",[method,'a'.repeat(64)]),/authorized/);
});
test('macros/micros whole recipe, servings, quantity edits and persistence use measured composition',async()=>{
 const a=await importFood(),b=await importFood(source[1]),r=await recipe(),first=await ingredient(r,a.id,150);await ingredient(r,b.id,100);
 const data=await calculate(r);assert.equal(data.complete,true);assert.equal(data.total_recipe_weight_grams,250);assert.equal(data.recipe_total.energy_kcal,a.nutrition.energy_kcal*1.5+b.nutrition.energy_kcal);assert(Math.abs(data.nutrition_per_serving.magnesium_mg-(a.nutrition.magnesium_mg*1.5+b.nutrition.magnesium_mg)/2)<1e-6);
 await actor(owner,'update public.recipe_ingredients set quantity=200 where id=$1',[first]);const changed=await calculate(r);assert.equal(changed.total_recipe_weight_grams,300);assert.equal((await actor(owner,'select nutrition from public.recipes where id=$1',[r])).rows[0].nutrition.energy_kcal,changed.nutrition_per_serving.energy_kcal);
});
test('USDA source portions/ounces convert; unbacked cups/milliliters never assume weights',async()=>{
 const f=await importFood(source[2]),r=await recipe(),p=f.source_portions.find(p=>p.description==='cup, sliced');assert(p);
 const i=await ingredient(r,f.id,2,'source portion',p.id);let d=await calculate(r);assert.equal(d.total_recipe_weight_grams,300);assert.equal(d.recipe_total.energy_kcal,267);
 await actor(owner,"update public.recipe_ingredients set quantity=1,unit='oz',source_portion_id=null where id=$1",[i]);d=await calculate(r);assert.equal(d.total_recipe_weight_grams,28.349523125);
 for(const unit of ['cup','ml']){await actor(owner,'update public.recipe_ingredients set unit=$2 where id=$1',[i,unit]);d=await calculate(r);assert.equal(d.complete,false);assert.deepEqual(d.recipe_total,{});assert.equal(d.total_recipe_weight_grams,null);assert.deepEqual(await val('select nutrition_snapshot from public.recipe_ingredients where id=$1',[i]),{});}
});
test('source refresh records history and never changes published recipe until explicit recalc',async()=>{
 const f=await importFood(),r=await recipe();await ingredient(r,f.id);await calculate(r);await actor(owner,"update public.recipes set status='published' where id=$1",[r]);const before=await val('select nutrition from public.recipes where id=$1',[r]);
 const updated=JSON.parse(JSON.stringify(source[0]));updated.foodNutrients.find(n=>n.nutrient.id===1003).amount=10;const fresh=await server('refresh',normalize(updated));assert.equal(fresh.id,f.id);assert.notEqual(fresh.source_version,f.source_version);assert.deepEqual(await val('select nutrition from public.recipes where id=$1',[r]),before);assert.equal(await val("select nutrition_snapshot->>'source_version' from public.recipe_ingredients where recipe_id=$1",[r]),f.source_version);
 assert.equal(Number(await val("select count(*) from private.food_source_history where action='before_refresh'")),1);await calculate(r);assert.equal((await val('select nutrition from public.recipes where id=$1',[r])).protein_g,5);
 await actor(owner,'update public.food_catalog set active=true,category=$2 where id=$1',[f.id,'Produce']);await actor(owner,'update public.food_catalog set active=false where id=$1',[f.id]);assert.equal(await val('select active from public.food_catalog where id=$1',[f.id]),false);
});
test('unknown nutrient coverage excludes full totals; real zero persists; invalid ingredient clears cache',async()=>{
 const a=await importFood(),b=await importFood(source[1]),r=await recipe();await ingredient(r,a.id);const i=await ingredient(r,b.id);
 const updated={...normalize(source[1]),nutrition:{protein_g:0}};updated.source_version='a'.repeat(64);await server('refresh',updated);
 const d=await calculate(r);assert.equal(d.recipe_total.energy_kcal,undefined);assert.equal(d.partial_recipe_total.energy_kcal,a.nutrition.energy_kcal);assert.equal(d.nutrient_coverage.energy_kcal,1);assert.equal(d.recipe_total.protein_g,a.nutrition.protein_g);
 await actor(owner,'update public.recipe_ingredients set food_id=null where id=$1',[i]);assert.equal((await calculate(r)).complete,false);assert.deepEqual(await val('select nutrition_snapshot from public.recipe_ingredients where id=$1',[i]),{});
});
test('malformed import IDs/nutrients/units, private-cache reads denied and server quota is atomic',async()=>{
 const base=normalize(source[0]);for(const patch of [{fdc_id:0},{fdc_id:1.5},{fdc_id:null},{nutrition:{protein_g:null}},{nutrition:{made_up:5}},{source_portions:[{id:'x',amount:1,gram_weight:0}]},{source_version:'invalid'}])await assert.rejects(server('import',{...base,...patch}),/Invalid/);
 for(const table of ['food_source_history','food_database_cache','food_database_usage'])await assert.rejects(actor(owner,'select * from private.'+table),/permission denied/);
 await server('cache_put',{a:1},'test');assert.deepEqual(await server('cache_get',null,'test'),{a:1});for(let i=0;i<60;i++)await server('budget');await assert.rejects(server('budget'),/limit/);
 assert.equal(Number(await val('select count(*) from pg_tables where schemaname=$1 and tablename=any($2) and rowsecurity',['private',['food_source_history','food_database_cache','food_database_usage']])),3);
});
