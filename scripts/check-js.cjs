const {execFileSync}=require('node:child_process');
const fs=require('node:fs');
const roots=['js','member','portal','journey','v'];let count=0;
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=dir+'/'+e.name;if(e.isDirectory())walk(f);else if(f.endsWith('.js')){execFileSync(process.execPath,['--check',f],{stdio:'pipe'});count++;}}}
roots.filter(fs.existsSync).forEach(walk);console.log(`${count} JavaScript files pass syntax checks.`);
