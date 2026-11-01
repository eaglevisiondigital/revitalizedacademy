'use strict';
const fs=require('node:fs'),cp=require('node:child_process');
const {dailyFixture}=require('../wave6-features/daily-fixture.cjs');
async function fixture(options={}){
 const read=fs.readFileSync;
 fs.readFileSync=function(p,...args){const text=p==='member/member110.js'&&options.baselineWave7?cp.execFileSync('git',['show','38f086792addaa9b131cecaf261ef21f89f5ffc7:member/member110.js'],{encoding:'utf8'}):read.call(this,p,...args);return p==='member/member110.js'?String(text).replace('  resolveSession();\n})();','  window.__wave7={renderHabits};\n  resolveSession();\n})();'):text;};
 let pending;try{pending=dailyFixture(options);}finally{fs.readFileSync=read;}
 const f=await pending;
 let row={id:'fictional-daily-habit',title:'Fictional alternate practice',status:'active',frequency:'daily',target_per_period:2,today_value:0};
 const renderAlternate=()=>f.w.__wave7.renderHabits([row]);renderAlternate();
 return {...f,row,renderAlternate,alt:()=>f.w.document.querySelector('#rm-habits button'),async mark(){return f.click('#rm-habits button',f.w.document.querySelector('#rm-habits button').textContent);}};
}
module.exports={fixture};
