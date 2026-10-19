'use strict';
const http=require('http'),fs=require('fs'),path=require('path');
const files={'/':['index.html','text/html; charset=utf-8'],'/demo.js':['demo.js','text/javascript; charset=utf-8'],'/lab.css':['lab.css','text/css; charset=utf-8']};
const port=Number(process.env.RVA_CALIBRATION_PORT||48958);
http.createServer((req,res)=>{
 const file=files[req.url];if(req.method!=='GET'||!file){res.writeHead(404);return res.end();}
 const host=req.headers.host;if(!['127.0.0.1:'+port,'localhost:'+port].includes(host)){res.writeHead(403);return res.end();}
 res.writeHead(200,{'Content-Type':file[1],'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'none'; img-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'; object-src 'none'",'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex,nofollow,noarchive','X-Content-Type-Options':'nosniff'});res.end(fs.readFileSync(path.join(__dirname,'generated/preview',file[0])));
}).listen(port,'127.0.0.1',()=>console.log('Synthetic-only founder rehearsal ready on http://127.0.0.1:'+port+'/; no real authentication or source connections'));
