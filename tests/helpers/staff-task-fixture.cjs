// Run the unchanged production task helper against a fictional session boundary.
const fs=require('node:fs'),path=require('node:path');
module.exports=(w,session,current)=>{const source=fs.readFileSync(path.resolve(__dirname,'../../portal/portal.js'),'utf8');const start=source.indexOf('  function createAuthenticatedTaskGuard(){'),end=source.indexOf('\n  function endStaffDocument()',start);return new w.Function('captureStaffSession','isStaffSessionCurrent','return ('+source.slice(start,end)+')')(session,current);};
