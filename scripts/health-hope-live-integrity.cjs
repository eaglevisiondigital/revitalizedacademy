'use strict';
const assert=require('node:assert/strict');
// Netlify Pretty URLs reserializes anchor attributes as well as their href.
// Every non-anchor byte and every attribute/content value remains significant.
function normalize(html){return html.replace(/<a\b(?:[^"'>]|"[^"]*"|'[^']*')*>/gi,tag=>{
  const attributes=[...tag.slice(2,-1).matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)].map(match=>{
    const key=match[1];assert(/^[A-Za-z_:][-A-Za-z0-9_:.]*$/.test(key),'Invalid anchor attribute');let value=match[2]??match[3]??match[4]??null;
    if(key==='href'&&value!==null&&!/^(?:[a-z][a-z\d+.-]*:|#|\/\/)/i.test(value)){const url=new URL(value,'https://site.invalid/');url.pathname=url.pathname.replace(/\.html$/,'').replace(/\/index$/,'/');value=url.pathname+url.search+url.hash;}
    return[key,value];
  }).sort(([a],[b])=>a.localeCompare(b));
  assert.equal(new Set(attributes.map(([key])=>key)).size,attributes.length,'Duplicate anchor attribute');
  return'<a'+attributes.map(([key,value])=>' '+key+(value===null?'':'='+JSON.stringify(value))).join('')+'>';
});}
module.exports={normalize};
