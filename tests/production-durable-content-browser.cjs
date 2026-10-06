// Exact-built, isolated browser fixtures. No live Supabase/Netlify writes or credentials.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.RVA_PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'../production-dist'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const sql=fs.readFileSync(path.resolve(__dirname,'../supabase/migrations/20261006164158_production_durable_content.sql'),'utf8');
const catalog=Array.from(sql.matchAll(/\('([^']+)','([^']+)','([^']+)','([^']+)',(true|false),(\d+)\)/g),m=>({nutrient_key:m[1],name:m[2],category:m[3],unit:m[4],default_visible:m[5]==='true',sort_order:Number(m[6])}));
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.RVA_CHROMIUM_EXECUTABLE?{executablePath:process.env.RVA_CHROMIUM_EXECUTABLE}:{})});let checks=0;const errors=[],measurements=[];
 try{
  const context=await browser.newContext();await context.route('**/*',r=>r.abort());
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('net::ERR_FAILED'))errors.push(m.text())});
  await page.setContent(read('portal/index.html').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link[^>]*>/gi,''));
  for(const f of ['portal/portal.css','portal/portal-polish.css','portal/portal-shell.css','portal/portal-programs.css'])await page.addStyleTag({content:read(f)});
  await page.evaluate(catalog=>{
   document.getElementById('auth-view').classList.add('hidden');document.getElementById('portal-view').classList.remove('hidden');
   const user={id:'owner',email:'owner@example.invalid'},profile={display_name:'Local Owner',phone:'0000000000',role:'owner',status:'active'};
   const rows={nutrition_nutrient_catalog:catalog,nutrition_methodologies:[{id:'n',name:'Real Nutrition',status:'draft'}],fitness_methodologies:[{id:'f',name:'Real Fitness',status:'draft'}],recipes:[{id:'r',title:'Example Recipe',methodology_id:'n',status:'published',servings:2,nutrition:{protein_g:5}}],food_catalog:[{id:'food',name:'Example Food',methodology_id:'n',active:true,nutrition:{protein_g:5},serving_size:1,serving_unit:'serving',grams_per_serving:50}],meal_plan_templates:[{id:'mp',title:'Meal Template',methodology_id:'n',days_count:7}],workout_templates:[{id:'wk',title:'Workout Template',methodology_id:'f',status:'published'}],fitness_programs:[{id:'fp',title:'Program',methodology_id:'f',weeks:12}],exercise_catalog:[{id:'ex',name:'Exercise',methodology_id:'f',status:'published'}],staff_access:[profile]};
   window.fixtureReads=[];window.fixtureWrites=[];
   const db={from(table){let single=false,filters=[],mutation=null;const q={select(){return q},order(){return q},limit(){return q},eq(k,v){filters.push([k,v]);return q},single(){single=true;return q},maybeSingle(){single=true;return q},insert(p){mutation=p;return q},update(p){mutation=p;return q},delete(){mutation={delete:true};return q},then(resolve){window.fixtureReads.push(table);if(mutation)window.fixtureWrites.push({table,mutation});const data=(rows[table]||[]).filter(row=>filters.every(([k,v])=>row[k]===undefined||row[k]===v));return Promise.resolve({data:single?data[0]||null:data,error:null}).then(resolve)}};return q},auth:{getSession:async()=>({data:{session:{user}}}),getUser:async()=>({data:{user}})},rpc:async name=>({data:name==='get_my_staff_access'?[profile]:{},error:null})};
   window.RA_PORTAL={authClient:db,currentUserId:()=>user.id,hasPermission:()=>true,permissions:()=>({'learning.manage':true}),currentStaffRole:()=> 'owner',showStatus:(node,text)=>{if(node)node.textContent=text},titleCase:s=>s,formatDate:s=>s};
  },catalog);
  for(const f of ['portal-shell.js','portal-programs.js','portal-recipe-builder.js','portal-content-composition.js','portal-account.js'])await page.addScriptTag({content:read('portal/'+f)});
  await page.waitForFunction(()=>window.RA_RECIPE_BUILDER&&window.RA_ACCOUNT&&document.querySelector('[data-program-content="recipes"]'));
  for(const size of [{width:1440,height:1000},{width:768,height:1024},{width:390,height:844}]){
   await page.setViewportSize(size);
   for(const key of ['recipes','foods','exercises','workouts','nutrition-methodology','fitness-methodology']){
    await page.evaluate(key=>{document.querySelector('.ra-sidebar button[data-workspace="programs"][data-target="#program-content-panel"]').click();document.querySelector('[data-program-content="'+key+'"]').click();document.getElementById('program-content-new').click();},key);
    const full=page.locator('.program-content-nutrient-details');if(await full.count())await full.evaluate(e=>e.open=true);
    const m=await page.evaluate(()=>{const modal=document.getElementById('program-content-modal'),dialog=modal.querySelector('section');return{pageOverflow:document.documentElement.scrollWidth>innerWidth+1,dialogOverflow:dialog.scrollWidth>dialog.clientWidth+1,width:dialog.getBoundingClientRect().width,viewport:innerWidth,fields:dialog.querySelectorAll('input,select,textarea').length}});
    assert(!m.pageOverflow&&!m.dialogOverflow,`${key} ${size.width}: ${JSON.stringify(m)}`);measurements.push({type:key,size: size.width,...m});checks++;
    await page.locator('#program-content-cancel').click();
   }
   await page.evaluate(()=>window.RA_RECIPE_BUILDER.open({id:'r',title:'Example Recipe',methodology_id:'n'}));await page.waitForSelector('.recipe-builder-modal:not(.hidden)');
   assert(await page.evaluate(()=>{const d=document.querySelector('.recipe-builder-dialog');return d.scrollWidth<=d.clientWidth+1&&document.documentElement.scrollWidth<=innerWidth+1}));checks++;await page.evaluate(()=>window.RA_RECIPE_BUILDER.close());
   for(const [key,row]of [['meal-plans',{id:'mp',title:'Meal Template'}],['workouts',{id:'wk',title:'Workout Template'}],['fitness',{id:'fp',title:'Program'}]]){
    await page.evaluate(({key,row})=>window.RA_CONTENT_COMPOSITION.open(key,row),{key,row});await page.waitForSelector('dialog[open]');assert(await page.evaluate(()=>{const d=document.querySelector('dialog');return d.scrollWidth<=d.clientWidth+1&&document.documentElement.scrollWidth<=innerWidth+1}));checks++;await page.evaluate(()=>window.RA_CONTENT_COMPOSITION.close());
   }
   for(const path of ['header','sidebar']){
    await page.evaluate(path=>{if(path==='header')document.getElementById('account-button').click();else document.querySelector('.ra-sidebar-footer button').click()},path);await page.waitForSelector('#account-modal:not(.hidden)');assert.equal(await page.locator('#account-email-input').inputValue(),'owner@example.invalid');assert(await page.evaluate(()=>{const d=document.querySelector('.account-dialog');return d.scrollWidth<=d.clientWidth+1&&document.documentElement.scrollWidth<=innerWidth+1}));checks++;await page.locator('#account-change-password').click();await page.locator('#account-password-cancel').click();await page.locator('#account-close').click();
   }
  }
  assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.fixtureWrites),[]);
  console.log(JSON.stringify({checks,errors,viewports:[1440,768,390],hostedWrites:0,measurementCount:measurements.length}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
