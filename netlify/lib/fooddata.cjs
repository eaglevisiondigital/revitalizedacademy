"use strict";
const {createHash}=require('node:crypto');
// USDA nutrient IDs, never display-name guesses. Priority is explicit where
// multiple analytical definitions exist; e.g. total folate is not folate DFE.
const mapping={
  1008:['energy_kcal','kcal'],2048:['energy_kcal','kcal'],2047:['energy_kcal','kcal'],1062:['energy_kcal','kcal'],
  1003:['protein_g','g'],1004:['fat_g','g'],1005:['carbohydrate_g','g'],1051:['water_g','g'],1007:['ash_g','g'],
  1079:['fiber_g','g'],2000:['sugars_g','g'],1063:['sugars_g','g'],1009:['starch_g','g'],
  1010:['sucrose_g','g'],1011:['glucose_g','g'],1012:['fructose_g','g'],1013:['lactose_g','g'],1014:['maltose_g','g'],1075:['galactose_g','g'],
  1087:['calcium_mg','mg'],1089:['iron_mg','mg'],1090:['magnesium_mg','mg'],1091:['phosphorus_mg','mg'],1092:['potassium_mg','mg'],1093:['sodium_mg','mg'],1095:['zinc_mg','mg'],1098:['copper_mg','mg'],1099:['fluoride_ug','ug'],1101:['manganese_mg','mg'],1103:['selenium_ug','ug'],
  1162:['vitamin_c_mg','mg'],1165:['thiamin_mg','mg'],1166:['riboflavin_mg','mg'],1167:['niacin_mg','mg'],1170:['pantothenic_acid_mg','mg'],1175:['vitamin_b6_mg','mg'],1177:['folate_ug','ug'],1178:['vitamin_b12_ug','ug'],1180:['choline_mg','mg'],1198:['betaine_mg','mg'],
  1106:['vitamin_a_rae_ug','ug'],1105:['retinol_ug','ug'],1107:['beta_carotene_ug','ug'],1108:['alpha_carotene_ug','ug'],1120:['beta_cryptoxanthin_ug','ug'],1122:['lycopene_ug','ug'],1123:['lutein_zeaxanthin_ug','ug'],1109:['vitamin_e_mg','mg'],1114:['vitamin_d_ug','ug'],1185:['vitamin_k_ug','ug'],1125:['beta_tocopherol_mg','mg'],1126:['gamma_tocopherol_mg','mg'],1127:['delta_tocopherol_mg','mg'],
  1258:['saturated_fat_g','g'],1292:['monounsaturated_fat_g','g'],1293:['polyunsaturated_fat_g','g'],1257:['trans_fat_g','g'],1253:['cholesterol_mg','mg'],
  1404:['omega3_ala_g','g'],1278:['omega3_epa_g','g'],1272:['omega3_dha_g','g'],1280:['omega3_dpa_g','g'],1321:['omega6_gla_g','g'],1406:['omega6_dgla_g','g'],1283:['phytosterols_mg','mg'],
  1210:['tryptophan_g','g'],1211:['threonine_g','g'],1212:['isoleucine_g','g'],1213:['leucine_g','g'],1214:['lysine_g','g'],1215:['methionine_g','g'],1216:['cystine_g','g'],1217:['phenylalanine_g','g'],1218:['tyrosine_g','g'],1219:['valine_g','g'],1220:['arginine_g','g'],1221:['histidine_g','g'],1222:['alanine_g','g'],1223:['aspartic_acid_g','g'],1224:['glutamic_acid_g','g'],1225:['glycine_g','g'],1226:['proline_g','g'],1227:['serine_g','g'],1018:['alcohol_g','g'],1057:['caffeine_mg','mg'],1058:['theobromine_mg','mg']
};
const types=['Foundation','SR Legacy','Survey (FNDDS)','Branded'];
const priority=[1008,2048,2047,1062,2000,1063];
function id(value){if(!Number.isSafeInteger(value)||value<1||value>2147483647)throw Error('Invalid FDC ID');return value;}
function numeric(v){return typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1e9;}
function text(v,max=500){return typeof v==='string'?v.trim().slice(0,max):null;}
function convert(amount,unit,target){
  const u=String(unit).trim().toLowerCase().replace(/[µμ]/g,'u');
  if(u===target)return amount;
  const mass={g:1,mg:0.001,ug:0.000001};
  if(mass[u]&&mass[target])return amount*mass[u]/mass[target];
  if(u==='kj'&&target==='kcal')return amount/4.184;
  throw Error('Unsupported source nutrient unit');
}
function normalize(food){
  id(food?.fdcId);if(!types.includes(food.dataType)||!text(food.description))throw Error('Invalid food source');
  const nutrition={},sourceNutrients=[],ignored=[];
  const rows=food.foodNutrients;if(!Array.isArray(rows)||rows.length>2000)throw Error('Invalid nutrient list');
  rows.slice().sort((a,b)=>{
    const rank=n=>{const p=priority.indexOf(n.nutrient?.id);return p<0?100:p;};return rank(a)-rank(b);
  }).forEach(row=>{
    const n=row.nutrient||{},m=mapping[n.id];
    if(row.amount===null||row.amount===undefined)return;
    if(!numeric(row.amount))throw Error('Invalid source nutrient amount');
    id(n.id);if(!text(n.unitName,40))throw Error('Missing source nutrient unit');
    sourceNutrients.push({id:n.id,name:text(n.name),unit:text(n.unitName,40),amount:row.amount});
    if(!m){ignored.push(n.id);return;}
    const amount=convert(row.amount,n.unitName,m[1]);
    if(nutrition[m[0]]===undefined)nutrition[m[0]]=amount;
  });
  const portions=[];
  for(const p of food.foodPortions||[]){
    if(!numeric(p.gramWeight)||p.gramWeight===0||!numeric(p.amount)||p.amount===0)continue;
    const description=text(p.portionDescription||p.modifier||p.measureUnit?.name,240);
    if(!description||description==='undetermined')continue;
    portions.push({id:String(p.id),description,amount:p.amount,gram_weight:p.gramWeight});
  }
  if(food.dataType==='Branded'&&numeric(food.servingSize)&&food.servingSize>0&&String(food.servingSizeUnit).toLowerCase()==='g'){
    portions.push({id:'label-serving',description:text(food.householdServingFullText,240)||'Label serving',amount:1,gram_weight:food.servingSize});
  }
  // USDA foodNutrients.amount is per 100g, including Branded; never multiply
  // labelNutrients (per label serving) into that basis a second time.
  const provenance={provider:'usda_fdc',fdc_id:food.fdcId,data_type:food.dataType,description:text(food.description),brand:text(food.brandName||food.brandOwner,160),publication_date:text(food.publicationDate,80),source_updated_at:text(food.modifiedDate||food.availableDate,80),barcode:text(food.gtinUpc,80),basis_grams:100,portions,nutrients:sourceNutrients,mapping_version:1,unmapped_nutrient_ids:ignored};
  const version=createHash('sha256').update(JSON.stringify(provenance)).digest('hex');
  return {name:provenance.description,brand:provenance.brand,barcode:provenance.barcode,nutrition,source_portions:portions,source_metadata:provenance,source_version:version,fdc_id:food.fdcId,source_data_type:food.dataType};
}
function searchInput(body){
  const query=text(body.query,121);if(!query||query.length>120||query.length<2)throw Error('Enter 2–120 search characters');
  const mode=body.mode||'generic';if(!['generic','branded','all'].includes(mode))throw Error('Invalid search type');
  return {query,pageSize:30,pageNumber:1,dataType:mode==='generic'?types.slice(0,3):mode==='branded'?['Branded']:types,requireAllWords:true};
}
function summarizeSearch(response){
  if(!Array.isArray(response.foods))throw Error('Invalid provider search response');
  return response.foods.filter(f=>Number.isSafeInteger(f.fdcId)&&types.includes(f.dataType)).slice(0,30).sort((a,b)=>types.indexOf(a.dataType)-types.indexOf(b.dataType)).map(f=>({fdcId:f.fdcId,name:text(f.description),type:f.dataType,brand:text(f.brandName||f.brandOwner,160),serving:text(f.householdServingFullText,240),publication:text(f.publicationDate,80)}));
}
module.exports={mapping,types,id,normalize,searchInput,summarizeSearch,convert};
