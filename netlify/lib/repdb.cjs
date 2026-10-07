"use strict";
const pin=require('../../config/repdb-source.json');
const muscles=['Neck','Shoulders','Chest','Upper Back','Lats','Biceps','Triceps','Forearms & Grip','Abdominals','Spinal / Lower Back','Glutes','Hip Flexors','Hip Adductors & Abductors','Quadriceps','Hamstrings','Calves & Lower Leg','Feet & Ankles'];
const movements=['Squat','Hinge','Pull','Push','Lunge','Carry','Rotation','Core','Cardio','Mobility / Range of Motion','Balance / Proprioception','Prehab / Corrective','Athletic / Power'];
const mapping={anterior_deltoid:'Shoulders',lateral_deltoid:'Shoulders',posterior_deltoid:'Shoulders',supraspinatus:'Shoulders',pectoralis_major:'Chest',rhomboids:'Upper Back',trapezius:'Upper Back',latissimus_dorsi:'Lats',biceps_brachii:'Biceps',brachialis:'Biceps',triceps_brachii:'Triceps',brachioradialis:'Forearms & Grip',forearm_extensors:'Forearms & Grip',forearm_flexors:'Forearms & Grip',forearms:'Forearms & Grip',rectus_abdominis:'Abdominals',transverse_abdominis:'Abdominals',obliques:'Abdominals',erector_spinae:'Spinal / Lower Back',quadratus_lumborum:'Spinal / Lower Back',gluteus_maximus:'Glutes',gluteus_medius:'Glutes',hip_flexors:'Hip Flexors',adductors:'Hip Adductors & Abductors',abductors:'Hip Adductors & Abductors',quadriceps:'Quadriceps',hamstrings:'Hamstrings',gastrocnemius:'Calves & Lower Leg',soleus:'Calves & Lower Leg'};
const slug=v=>{if(typeof v!=='string'||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)||v.length>150)throw Error('Invalid RepDB exercise ID');return v;};
const list=v=>Array.isArray(v)?v.filter(x=>typeof x==='string'&&x.length<=6000):[];
const mapped=v=>[...new Set(list(v).map(k=>mapping[k]).filter(Boolean))];
function image(p){return typeof p==='string'&&/^images\/flat\/[a-z0-9-]+\.webp$/.test(p)?`https://raw.githubusercontent.com/RepDB/exercise-dataset/${pin.commit}/${p}`:null;}
function normalize(r){
 slug(r.id);if(typeof r.name_en!=='string'||r.name_en.length>240)throw Error('Invalid source name');
 return {provider:'repdb',id:r.id,version:pin.commit,name:r.name_en,description:r.description_en||null,primary_muscles:list(r.primary_muscles),secondary_muscles:list(r.secondary_muscles),body_part:r.body_part||null,equipment:typeof r.equipment==='string'?[r.equipment]:[],category:r.category,force_type:r.force_type||null,mechanic:r.mechanic||null,difficulty:r.difficulty,goals:list(r.goals),tags:list(r.tags),met:typeof r.met==='number'&&Number.isFinite(r.met)?r.met:null,instructions:list(r.instructions_en),tips:list(r.tips_en),images:[image(r.images?.flat?.start),image(r.images?.flat?.peak)].filter(Boolean),attribution:'Exercise data by RepDB (repdb.co)',rva_muscles:mapped([...(r.primary_muscles||[]),...(r.secondary_muscles||[])])};
}
function search(rows,q){
 if(typeof q!=='string'||q.trim().length<2||q.length>100)throw Error('Enter 2–100 search characters');
 const tokens=q.toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(Boolean);
 if(!tokens.length)throw Error('Enter an exercise name');
 return rows.filter(r=>tokens.every(t=>(r.name_en+' '+r.id+' '+(r.equipment||'')).toLowerCase().replaceAll('-',' ').includes(t))).sort((a,b)=>a.name_en.localeCompare(b.name_en)).slice(0,20).map(normalize);
}
module.exports={normalize,search,slug,mapped,muscles,movements,pin};
