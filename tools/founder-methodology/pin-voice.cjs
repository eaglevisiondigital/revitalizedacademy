'use strict';
// Offline source check. The normalized self-hash is a build identity, never a credential hash.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
function verify(){
 const file=path.resolve(__dirname,'../../js/vitality-roadmap-founder-voice.cjs'),source=fs.readFileSync(file,'utf8');
 const marker=/const HASH = '[a-f0-9]{64}';/g,matches=source.match(marker);assert.equal(matches?.length,1);
 const hash=crypto.createHash('sha256').update(source.replace(marker,"const HASH = '"+'0'.repeat(64)+"';")).digest('hex');
 const voice=require(file);assert.equal(voice.HASH,hash,'Voice source changed: review and explicitly repin before building');
 return voice.metadata();
}
module.exports={verify};
if(require.main===module)console.log(JSON.stringify(verify()));
