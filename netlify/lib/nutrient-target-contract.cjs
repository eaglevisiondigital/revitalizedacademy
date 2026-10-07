"use strict";
// Future authorized diary/RPC callers supply approved targets. No DRI values or
// medical recommendations are inferred from food composition or demographics.
function experience({nutrientKey,unit,consumed,context={},reference=null,coach=null}){
 const valid=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
 if(!nutrientKey||!unit||consumed!==null&&!valid(consumed))throw Error('Invalid intake');
 for(const target of [reference,coach])if(target&&(!valid(target.value)||target.unit!==unit||!target.source||!target.version))throw Error('Target requires approved source, version and matching unit');
 const effective=coach||reference;
 return {nutrient_key:nutrientKey,unit,consumed,context:{age:context.age??null,sex:context.sex??null,life_stage:context.lifeStage??null},reference_target:reference,coach_target:coach,effective_target:effective,effective_source:coach?'coach_override':reference?'reference':null};
}
module.exports={experience};
