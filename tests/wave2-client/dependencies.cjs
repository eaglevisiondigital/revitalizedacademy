const path=require('node:path');
const directory=process.env.RVA_WAVE2_DEPENDENCIES||path.resolve(__dirname,'../../../revitalizedacademy/node_modules');
function dependency(name,version){const base=path.join(directory,name);const actual=require(path.join(base,'package.json')).version;if(actual!==version)throw Error(`${name} requires ${version}; got ${actual}`);return require(base);}
module.exports={pg:()=>dependency('pg','8.16.3'),jsdom:()=>dependency('jsdom','26.1.0')};
