// Build-time only: fetch reviewed publisher snapshot; never publish the bulk JSON.
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const pin=require('../config/repdb-source.json'),root=path.resolve(__dirname,'..');
async function prepare(){
 const folder=path.join(root,'netlify/private-repdb');fs.mkdirSync(folder,{recursive:true});
 for(const [file,expected] of [['exercises.json',pin.dataset_sha256],['LICENSE-DATA.md',pin.license_sha256]]){
  const dest=path.join(folder,file);let bytes=fs.existsSync(dest)?fs.readFileSync(dest):null;
  if(!bytes||crypto.createHash('sha256').update(bytes).digest('hex')!==expected){
   const r=await fetch(`https://raw.githubusercontent.com/RepDB/exercise-dataset/${pin.commit}/${file}`,{signal:AbortSignal.timeout(30000)});
   if(!r.ok)throw Error('Pinned RepDB source unavailable');bytes=Buffer.from(await r.arrayBuffer());
  }
  if(crypto.createHash('sha256').update(bytes).digest('hex')!==expected)throw Error('RepDB source/license changed: review before build');
  fs.writeFileSync(dest,bytes);
 }
 const dataset=JSON.parse(fs.readFileSync(path.join(folder,'exercises.json')));
 if(dataset.schema_version!==pin.schema_version||dataset.count!==pin.count||dataset.exercises.length!==pin.count||new Set(dataset.exercises.map(r=>r.id)).size!==pin.count)throw Error('RepDB snapshot shape/count mismatch');
 console.log(`Prepared ${pin.count} licensed RepDB exercises, ${pin.commit}; server-only, no API secret`);
}
if(require.main===module)prepare().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={prepare};
