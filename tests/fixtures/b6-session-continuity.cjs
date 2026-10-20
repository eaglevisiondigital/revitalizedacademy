// Synthetic local database only. Apply deployed stack, then the isolated repair.
const fs=require('fs'),{seed:base}=require('./roadmap-processing-scope.cjs');
const file='supabase/environment-migrations/production/20261020184635_roadmap_b6_session_continuity.sql';
const migration=fs.readFileSync(file,'utf8').replace(/\bbegin;/,'').replace(/commit;\s*$/,'');
async function seed(db){const f=await base(db);await f.q(migration);return f;}
module.exports={seed,migration,file};
