'use strict';
// Fictional disposable fixture ONLY. Recreate captured trigger ACL representation; never relax guards.
const fresh=require('../wave6-security/household-trigger-catalog.json');
const qi=s=>'"'+s.replaceAll('"','""')+'"',lit=s=>"'"+s.replaceAll("'","''")+"'";
function sql(){let s='BEGIN; GRANT USAGE ON SCHEMA private TO service_role; CREATE TEMP TABLE wave7_trigger_restore(fn text primary key, body text);\n';
for(const t of fresh.original_triggers)s+=`INSERT INTO wave7_trigger_restore VALUES(${lit(t.function)},pg_get_functiondef(${lit(t.function)}::regprocedure)); DROP TRIGGER ${qi(t.name)} ON public.${qi(t.table)};\n`;
for(const t of fresh.original_triggers.filter(x=>x.name.startsWith('notify_client_assignment')))s+=`DROP FUNCTION ${t.function};\n`;
s+=`DO $restore$ DECLARE r record;BEGIN FOR r IN SELECT * FROM wave7_trigger_restore ORDER BY fn LOOP EXECUTE r.body; END LOOP;END$restore$;\n`;
for(const t of fresh.original_triggers){if(!t.name.startsWith('notify_client_assignment'))s+=`REVOKE ALL ON FUNCTION ${t.function} FROM PUBLIC,anon,authenticated,service_role;\n`;if(t.function==='private.emit_member_sync_event()')s+=`GRANT EXECUTE ON FUNCTION ${t.function} TO service_role;\n`;s+=t.definition+';\n';}
s+='DROP TABLE wave7_trigger_restore; COMMIT;\n';return s;}
module.exports={sql};
