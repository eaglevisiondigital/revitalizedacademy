"use strict";
const {createHash}=require('node:crypto');
const {id,normalize,searchInput,summarizeSearch}=require('./fooddata.cjs');
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function createHandler({env,fetch:request=fetch}){
 return async function handler(req){
  const deadline=AbortSignal.timeout(45000),timeout=ms=>AbortSignal.any([deadline,AbortSignal.timeout(ms)]);
  const respond=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  if(req.method!=='POST')return respond(405,{error:'POST required'});
  try{
   const url=env('RVA_FOOD_DATABASE_SUPABASE_URL'),anon=env('RVA_FOOD_DATABASE_SUPABASE_ANON_KEY'),service=env('RVA_FOOD_DATABASE_SUPABASE_SERVICE_ROLE_KEY');
   if(!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url||'')||!anon||!service)return respond(503,{error:'Food database server configuration is incomplete'});
   const bearer=req.headers.get('authorization');
   if(!/^Bearer [A-Za-z0-9_.-]+$/.test(bearer||''))return respond(401,{error:'Staff sign-in required'});
   const auth=await request(url+'/auth/v1/user',{headers:{apikey:anon,Authorization:bearer},signal:timeout(10000)});
   if(!auth.ok)return respond(401,{error:'Staff sign-in required'});
   const actor=(await auth.json()).id;if(!uuid.test(actor||''))return respond(401,{error:'Invalid staff session'});
   async function rpc(action,key=null,value=null,methodology=null){
    const result=await request(url+'/rest/v1/rpc/food_database_server',{method:'POST',headers:{apikey:service,Authorization:'Bearer '+service,'Content-Type':'application/json'},body:JSON.stringify({p_actor:actor,p_action:action,p_key:key,p_value:value,p_methodology:methodology}),signal:timeout(15000)});
    if(!result.ok){const error=await result.json().catch(()=>({}));const e=Error(error.code==='42501'?'Food authoring access denied':error.message?.includes('limit')?'Food database request limit reached':'Food database operation failed');e.status=error.code==='42501'?403:error.message?.includes('limit')?429:400;throw e;}
    return result.json();
   }
   const permission=await rpc('authorize');
   const raw=await req.text();if(raw.length>4096)return respond(413,{error:'Request too large'});
   const body=JSON.parse(raw);
   const key=env('USDA_FDC_API_KEY');
   async function provider(path,body){
    if(!key||key==='DEMO_KEY')throw Object.assign(Error('Configure the protected USDA_FDC_API_KEY'),{status:503});
    await rpc('budget');
    const response=await request('https://api.nal.usda.gov/fdc/v1/'+path+'?api_key='+encodeURIComponent(key),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:timeout(12000)});
    // Never echo provider request URLs, errors or secrets to browser/logs.
    if(!response.ok)throw Object.assign(Error(response.status===429?'Food database provider limit reached':'Food database provider unavailable'),{status:response.status===429?429:502});
    const raw=await response.text();if(raw.length>5000000)throw Error('Provider response too large');return JSON.parse(raw);
   }
   if(body.action==='search'){
    const input=searchInput(body),cacheKey='search:'+createHash('sha256').update(JSON.stringify(input)).digest('hex');
    let foods=await rpc('cache_get',cacheKey);
    if(!foods){foods=summarizeSearch(await provider('foods/search',input));await rpc('cache_put',cacheKey,foods);}
    return respond(200,{foods});
   }
   if(body.action==='details'){
    if(!Array.isArray(body.ids)||!body.ids.length||body.ids.length>10)throw Error('Choose 1–10 foods');body.ids.forEach(id);const ids=[...new Set(body.ids)];
    const values=[];const missing=[];
    for(const foodId of ids){const cached=await rpc('cache_get','detail:'+foodId);if(cached)values.push(cached);else missing.push(foodId);}
    if(missing.length){const detail=await provider('foods',{fdcIds:missing,format:'full'});if(!Array.isArray(detail)||detail.length!==missing.length)throw Error('Food details unavailable');for(const food of detail){if(!missing.includes(food.fdcId))throw Error('Unexpected source food');const normalized=normalize(food);values.push(normalized);await rpc('cache_put','detail:'+food.fdcId,normalized);}}
    return respond(200,{foods:values});
   }
   if(!['import','refresh'].includes(body.action))throw Error('Invalid food action');
   id(body.fdcId);if(!uuid.test(body.methodologyId||''))throw Error('Select an existing nutrition methodology');
   if(body.action==='refresh'&&!permission.admin)return respond(403,{error:'Owner/Admin required to refresh'});
   const existing=await rpc('get',String(body.fdcId));
   if(body.action==='import'&&existing)return respond(200,{food:existing});
   if(body.action==='refresh'&&!existing)throw Error('Import this food first');
   let food=body.action==='import'?await rpc('cache_get','detail:'+body.fdcId):null;
   if(!food){const foods=await provider('foods',{fdcIds:[body.fdcId],format:'full'});if(!Array.isArray(foods)||foods.length!==1||foods[0].fdcId!==body.fdcId)throw Error('Food details unavailable');food=normalize(foods[0]);await rpc('cache_put','detail:'+body.fdcId,food);}
   return respond(200,{food:await rpc(body.action,null,food,body.methodologyId)});
  }catch(error){if(error.name==='TimeoutError'||error.name==='AbortError')return respond(504,{error:'Food database timed out; please retry'});return respond(error.status||400,{error:error.status?error.message:'Invalid food database request'});}
 };
}
module.exports={createHandler};
