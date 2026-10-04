// Synthetic in-memory transport used by maintained DOM tests and the loopback browser fixture.
// It never sends requests to hosted services and does not substitute for RLS tests.
function installBetaFixture(w){
 const clone=v=>JSON.parse(JSON.stringify(v));
 const method='synthetic-method',stamp='2026-10-04T00:00:00Z';
 const base={id:'recipe-a',methodology_id:method,title:'Synthetic meal',status:'published',servings:2,instructions:'Mix carefully. '+ 'Long instruction '.repeat(12),nutrition:{energy_kcal:0,protein_g:12},updated_at:stamp};
 const state={calls:[],overrides:{},rights:new Set(['learning.manage','health.private.view','health.progress.manage','staff.manage','crm.manage','staff.view']),tables:{
 nutrition_methodologies:[{id:method,name:'Synthetic nutrition',status:'draft'}],fitness_methodologies:[{id:method,name:'Synthetic fitness',status:'draft'}],
 nutrition_nutrient_catalog:[{active:true,nutrient_key:'energy_kcal',name:'Calories',unit:'kcal',category:'energy',default_visible:true,sort_order:0},{active:true,nutrient_key:'protein_g',name:'Protein',unit:'g',category:'macronutrient',default_visible:true,sort_order:1}],
 recipes:[base],food_catalog:[{id:'food-a',methodology_id:method,name:'Synthetic food',active:true,nutrition:{energy_kcal:0},serving_size:100,serving_unit:'g',grams_per_serving:100,updated_at:stamp}],
 recipe_ingredients:[{id:'ingredient-a',recipe_id:'recipe-a',ingredient:'Synthetic food',food_id:'food-a',quantity:1,unit:'serving',weight_grams:100,sort_order:1}],
 meal_plan_templates:[{id:'meals-a',methodology_id:method,title:'Synthetic meal plan',status:'draft',days_count:7,updated_at:stamp}],meal_plan_template_items:[],
 exercise_catalog:[{id:'exercise-a',methodology_id:method,name:'Synthetic exercise '+ 'LongName'.repeat(30),status:'published',category:'strength',movement_type:'strength',environment:'either',instructions:'Move safely.',updated_at:stamp}],
 workout_templates:[{id:'workout-a',methodology_id:method,title:'Synthetic workout',status:'published',environment:'either',duration_minutes:20,updated_at:stamp}],workout_template_exercises:[],
 fitness_programs:[{id:'fitness-a',methodology_id:method,title:'Synthetic fitness program',status:'draft',weeks:4,updated_at:stamp}],fitness_program_workouts:[],contacts:[],
 client_access:[{contact_id:'contact-a',membership_id:'membership-a',status:'active'}],client_memberships:[{id:'membership-a',program_code:'synthetic'}],
 my_staff_permissions_view:[{permission_key:'staff.view',allowed:true},{permission_key:'staff.manage',allowed:true}],
 staff_directory:[{user_id:'staff-a',display_name:'Synthetic Owner',role:'owner'}],
 },seq:0};
 function query(table){
  const call={table,op:'select',filters:[],payload:null,single:false};
  const q={select(){return q;},eq(k,v){call.filters.push([k,v]);return q;},ilike(k,v){call.filters.push([k,v.replace(/\\([\\%_])/g,'$1')]);return q;},not(){return q;},in(){return q;},order(){return q;},limit(){return q;},is(){return q;},gte(){return q;},lte(){return q;},single(){call.single=true;return q;},maybeSingle(){call.single=true;return q;},insert(p){call.op='insert';call.payload=p;return q;},upsert(p){call.op='upsert';call.payload=p;return q;},update(p){call.op='update';call.payload=p;return q;},delete(){call.op='delete';return q;},then(resolve,reject){
   state.calls.push(clone(call));
   const run=()=>{
    if(state.overrides[table])return typeof state.overrides[table]==='function'?state.overrides[table](clone(call)):state.overrides[table];
    const stored=state.tables[table]||[],matches=row=>call.filters.every(([k,v])=>String(row[k]).toLowerCase()===String(v).toLowerCase());let rows=stored.filter(matches);
    if(['insert','upsert'].includes(call.op)){rows=(Array.isArray(call.payload)?call.payload:[call.payload]).map(p=>({id:'synthetic-'+(++state.seq),updated_at:stamp,...clone(p)}));state.tables[table]=[...stored,...rows];}
    if(call.op==='update')rows.forEach(row=>Object.assign(row,clone(call.payload)));
    if(call.op==='delete')state.tables[table]=stored.filter(row=>!matches(row));
    return {data:clone(call.single?rows[0]||null:rows),error:null};
   };return Promise.resolve().then(run).then(resolve,reject);
  }};return q;
 }
 const client={from:query,rpc(name,args){state.calls.push({name,args:clone(args||{})});if(state.overrides[name])return Promise.resolve(typeof state.overrides[name]==='function'?state.overrides[name](args):state.overrides[name]);if(name==='recalculate_recipe_nutrition')return Promise.resolve({data:{ingredients_incomplete:0}});if(name==='get_my_assigned_meal')return Promise.resolve({data:{...base,ingredients:[{ingredient:'Synthetic food',quantity:0,unit:'g'}],scheduled_date:'2026-10-04'}});if(name==='get_my_assigned_workout')return Promise.resolve({data:{title:'Synthetic workout',exercises:[{name:'Synthetic exercise '+ 'LongName'.repeat(30),instructions:'Move safely.',sets:2,reps:'8',rest_seconds:30}]}});return Promise.resolve({data:[]});},functions:{invoke(){return Promise.resolve({data:{ok:true}});}},auth:{onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}};},getUser:async()=>({data:{user:{id:'staff-a'}}}),getSession:async()=>({data:{session:{user:{id:'staff-a'}}}})}};
 w.RA_PORTAL={authClient:client,hasPermission:key=>state.rights.has(key),currentUserId:()=> 'staff-a',currentStaffRole:()=> 'owner',staffDirectory:()=>state.tables.staff_directory,staff:()=>state.tables.staff_directory,showStatus:(node,message)=>{if(node)node.textContent=message;},titleCase:value=>String(value||'').replaceAll('_',' '),formatDate:v=>String(v),logActivity:async()=>{},openContact:async()=>{},loadDashboard:async()=>{},formatMoney:v=>String(v)};
 w.RA_MEMBER_CLIENT=client;w.alert=message=>state.calls.push({alert:message});
 return {state,client};
}
module.exports={installBetaFixture};
