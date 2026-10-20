'use strict';
// Deterministic local authoring only. Never connects to a database or a provider.
const fs=require('fs'),crypto=require('crypto'),assert=require('assert/strict');
const dir='supabase/environment-migrations/production/',file=dir+'20261020184635_roadmap_b6_session_continuity.sql';
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
function fn(file,name){const text=fs.readFileSync(dir+file,'utf8'),start=text.indexOf('create '+(text.includes('create or replace function '+name+'(')?'or replace ':'')+'function '+name+'(');assert(start>=0,name);const end=text.indexOf('$$;',text.indexOf('as $$',start))+3;const sql=text.slice(start,end);return{sql:sql.replace(/^create function/,'create or replace function'),body:sql.slice(sql.indexOf('as $$')+5,sql.lastIndexOf('$$;'))};}
function replace(text,a,b){assert.equal(text.split(a).length,2,'Expected exactly one reviewed replacement: '+a.slice(0,100));return text.replace(a,b);}
const originals={
 'private.roadmap_b42_operator_plan':fn('20261016195245_vitality_roadmap_b42_identity_verification.sql','private.roadmap_b42_operator_plan'),
 'private.roadmap_b6_set_pilot':fn('20261018051432_vitality_roadmap_b6_calibration.sql','private.roadmap_b6_set_pilot'),
 'private.roadmap_b6_context':fn('20261018051432_vitality_roadmap_b6_calibration.sql','private.roadmap_b6_context'),
 'public.roadmap_b6':fn('20261019213244_b6_purpose_acknowledgment_feedback.sql','public.roadmap_b6'),
 'private.roadmap_processing_set_grant':fn('20261019180611_roadmap_internal_processing_v1.sql','private.roadmap_processing_set_grant')
};
const expected={
 'private.roadmap_b42_operator_plan':'72b3abadebd0c70af60cc2193c9f79c674a63ace51c9e1aa49fca57d2cba8c94',
 'private.roadmap_b6_set_pilot':'19563e31b98c2825bb37643e7c193e5fccc37e634641c447cfcf1f0b6477944c',
 'private.roadmap_b6_context':'81ceea23bfcce6913457ef269e7365c78ff4eff492d6a32fa9821fe60ae31731',
 'public.roadmap_b6':'0a79110531443fe7a58a685cb0e37a32ce509adebfb98fe40335039947223089',
 'private.roadmap_processing_set_grant':'82a98a45cfc7ccc26dad6e0fdf5b8f245492b3edc799da390affd0f52df544ba'
};
for(const [n,f]of Object.entries(originals))assert.equal(sha(f.body),expected[n],n);
const checks=Object.entries(expected).map(([name,digest])=>`if (select encode(extensions.digest(prosrc,'sha256'),'hex') from pg_proc where oid='${name}(${name==='private.roadmap_b42_operator_plan'?'uuid':name==='private.roadmap_b6_set_pilot'?'bigint,timestamptz,text,text,boolean,text':name==='private.roadmap_b6_context'?'uuid,boolean':name==='public.roadmap_b6'?'text,uuid,jsonb':'bigint,timestamptz,uuid,uuid,text,boolean,boolean,boolean'})'::regprocedure) is distinct from '${digest}' then raise exception 'Reviewed continuity baseline required: ${name}';end if;`).join('\n');
const support=`
-- Authentication confirmations are not consent. No original purpose or SOP row is changed.
create table private.roadmap_b6_session_confirmations(
 purpose_sequence bigint not null references private.roadmap_b6_purpose_events(sequence),
 actor_id uuid not null references private.roadmap_b42_founders(user_id),session_id uuid not null,
 expires_at timestamptz not null,created_at timestamptz not null default clock_timestamp(),
 primary key(purpose_sequence,session_id)
);
alter table private.roadmap_b6_session_confirmations enable row level security;
revoke all on private.roadmap_b6_session_confirmations from public,anon,authenticated,service_role;
create trigger roadmap_b6_session_confirmations_immutable before update or delete on private.roadmap_b6_session_confirmations for each row execute function private.roadmap_b4_immutable();
create trigger roadmap_b6_session_confirmations_no_truncate before truncate on private.roadmap_b6_session_confirmations for each statement execute function private.roadmap_b4_immutable();

create function private.roadmap_b6_live_session(p_actor uuid,p_session uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 perform 1 from auth.sessions where id=p_session and user_id=p_actor for share;
 perform 1 from public.staff_access where user_id=p_actor for share;
 if not exists(select 1 from auth.sessions where id=p_session and user_id=p_actor and(not_after is null or not_after>clock_timestamp()))
 or not private.roadmap_b4_is_founder(p_actor)
 or not exists(select 1 from private.roadmap_b42_founders f join auth.users u on u.id=f.user_id where f.user_id=p_actor and lower(trim(u.email))=f.verified_email)
 or not exists(select 1 from public.staff_access where user_id=p_actor and role='owner' and status='active' and onboarding_status='complete' and contact_scope='all')
 or not private.staff_has_permission(p_actor,'health.private.view') or not private.staff_has_permission(p_actor,'crm.view')
 then raise exception 'Current authenticated founder session required' using errcode='42501';end if;
end $$;

create function private.roadmap_b6_check_consent(p_purpose bigint) returns private.roadmap_b6_purpose_events language plpgsql security definer set search_path='' as $$
declare p private.roadmap_b6_purpose_events;b private.roadmap_b5_pilot_events;plan jsonb;begin
 select * into p from private.roadmap_b6_purpose_events where sequence=p_purpose;
 if p.sequence is null then raise exception 'Retained B6 consent unavailable' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(p.report_id::text,416));
 select * into b from private.roadmap_b5_pilot_events where report_id=p.report_id order by sequence desc limit 1;
 if p.active is distinct from true or exists(select 1 from private.roadmap_b6_purpose_events where report_id=p.report_id and actor_id=p.actor_id and sequence>p.sequence)
 or p.pins is distinct from private.roadmap_b6_pins()
 or p.acknowledgments is distinct from '{"experimental_purpose":true,"no_client_scores":true,"immutable_originals":true,"no_external_ai_exports":true,"manual_revocation_14_days":true,"separate_feedback_permission":true,"historical_provenance_limits":true}'::jsonb
 or b.active is distinct from true or b.starts_at>clock_timestamp() or b.expires_at<=clock_timestamp() or p.pilot_sequence is distinct from b.sequence or p.source_fingerprint is distinct from b.source_fingerprint
 or not private.roadmap_b4_is_founder(p.actor_id) or not exists(select 1 from private.roadmap_b42_founders f join auth.users u on u.id=f.user_id where f.user_id=p.actor_id and lower(trim(u.email))=f.verified_email)
 or not private.staff_has_permission(p.actor_id,'health.private.view') or not private.staff_has_permission(p.actor_id,'crm.view')
 then raise exception 'Valid retained B6 consent required' using errcode='42501';end if;
 plan:=private.roadmap_b42_operator_plan(b.verification_id);
 if plan->>'source_fingerprint' is distinct from p.source_fingerprint or not private.staff_can_access_contact(p.actor_id,(plan->>'contact_id')::uuid)
 or not exists(select 1 from(select * from private.roadmap_b4_cohort_events where report_id=p.report_id order by sequence desc limit 1)e where active and not allow_drafts and source_fingerprint=p.source_fingerprint)
 then raise exception 'Retained consent source unavailable' using errcode='42501';end if;
 return p;
end $$;

create function private.roadmap_b6_confirm_session(p_report uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare a uuid:=private.roadmap_b42_actor();sid uuid:=(auth.jwt()->>'session_id')::uuid;p private.roadmap_b6_purpose_events;b private.roadmap_b5_pilot_events;plan jsonb;until_at timestamptz;begin
 perform pg_advisory_xact_lock(hashtextextended(p_report::text,416));
 perform private.roadmap_b6_live_session(a,sid);
 perform private.roadmap_b6_basis(p_report);
 select * into p from private.roadmap_b6_purpose_events where report_id=p_report and actor_id=a order by sequence desc limit 1;
 p:=private.roadmap_b6_check_consent(p.sequence);
 select * into b from private.roadmap_b5_pilot_events where sequence=p.pilot_sequence;
 plan:=private.roadmap_b42_operator_plan(b.verification_id);
 select least(b.expires_at,(plan->>'revoke_by')::timestamptz,coalesce(not_after,b.expires_at)) into until_at from auth.sessions where id=sid and user_id=a;
 if until_at is null or until_at<=clock_timestamp() then raise exception 'Founder confirmation expired' using errcode='42501';end if;
 insert into private.roadmap_b6_session_confirmations(purpose_sequence,actor_id,session_id,expires_at)values(p.sequence,a,sid,until_at)on conflict do nothing;
 return exists(select 1 from private.roadmap_b6_session_confirmations where purpose_sequence=p.sequence and actor_id=a and session_id=sid and expires_at>clock_timestamp());
end $$;

create function private.roadmap_b6_confirmed_session(p_purpose bigint) returns uuid language plpgsql security definer set search_path='' as $$
declare p private.roadmap_b6_purpose_events;c private.roadmap_b6_session_confirmations;begin
 p:=private.roadmap_b6_check_consent(p_purpose);
 select x.* into c from private.roadmap_b6_session_confirmations x join auth.sessions s on s.id=x.session_id and s.user_id=x.actor_id
 where x.purpose_sequence=p.sequence and x.actor_id=p.actor_id and x.expires_at>clock_timestamp() and(s.not_after is null or s.not_after>clock_timestamp()) order by x.created_at desc,x.session_id limit 1;
 if c.session_id is null then raise exception 'Current founder confirmation required' using errcode='42501';end if;
 perform private.roadmap_b6_live_session(p.actor_id,c.session_id);
 return c.session_id;
end $$;
revoke all on function private.roadmap_b6_live_session(uuid,uuid),private.roadmap_b6_check_consent(bigint),private.roadmap_b6_confirm_session(uuid),private.roadmap_b6_confirmed_session(bigint) from public,anon,authenticated,service_role;
`;
let plan=replace(originals['private.roadmap_b42_operator_plan'].sql," or not exists(select 1 from auth.sessions where id=v.session_id and user_id=v.actor_id and (not_after is null or not_after>now()))\n",' -- Original verification session is immutable provenance, not current authentication.\n');
let pilot=replace(originals['private.roadmap_b6_set_pilot'].sql," or not exists(select 1 from auth.sessions where id=p.session_id and user_id=p.actor_id and (not_after is null or not_after>clock_timestamp()))",'');
pilot=replace(pilot,' -- Operator helper cannot use auth.uid():',' perform private.roadmap_b6_confirmed_session(p.sequence);\n -- Operator helper cannot use auth.uid():');
let context=replace(originals['private.roadmap_b6_context'].sql," c:=private.roadmap_b6_basis(p_report);actor:=private.roadmap_b42_actor();"," c:=private.roadmap_b6_basis(p_report);actor:=private.roadmap_b42_actor();\n if not private.roadmap_b6_confirm_session(p_report) then raise exception 'Current founder confirmation required' using errcode='42501';end if;");
context=replace(context," or not exists(select 1 from auth.sessions where id=issuer.session_id and user_id=issuer.actor_id and (not_after is null or not_after>clock_timestamp()))",'');
context=replace(context," or p.active is distinct from true or p.session_id is distinct from (auth.jwt()->>'session_id')::uuid",' or p.active is distinct from true');
context=replace(context," select * into issuer from private.roadmap_b6_purpose_events where sequence=g.purpose_sequence;"," issuer:=private.roadmap_b6_check_consent(g.purpose_sequence);");
let rpc=originals['public.roadmap_b6'].sql;
const start=rpc.indexOf(' select coalesce((select p.active'),end=rpc.indexOf(' into purpose_acknowledged;',start)+' into purpose_acknowledged;'.length;
assert(start>=0&&end>start);rpc=rpc.slice(0,start)+" purpose_acknowledged:=false;begin purpose_acknowledged:=private.roadmap_b6_confirm_session(entry.report_id);exception when sqlstate '42501' or sqlstate '40001' or sqlstate '55000' then null;end;"+rpc.slice(end);
rpc=replace(rpc,'existing_purpose.sequence is not null and existing_purpose.session_id=sid and existing_purpose.source_fingerprint', 'existing_purpose.sequence is not null and existing_purpose.source_fingerprint');
rpc=replace(rpc,' ready:=false;begin perform private.roadmap_b6_context(p_report,false);',' if (p_payload->>\'active\')::boolean then perform private.roadmap_b6_confirm_session(p_report);end if;\n ready:=false;begin perform private.roadmap_b6_context(p_report,false);');
let grant=replace(originals['private.roadmap_processing_set_grant'].sql,' select private.roadmap_b42_operator_plan(verification_id) into plan from private.roadmap_b5_pilot_events where sequence=b.pilot_sequence;',` perform private.roadmap_b6_check_consent(b.purpose_sequence);
 perform private.roadmap_b6_check_consent((select sequence from private.roadmap_b6_purpose_events where report_id=p.report_id and actor_id=p.actor_id order by sequence desc limit 1));
 perform private.roadmap_b6_live_session(p.actor_id,p.session_id);
 perform private.roadmap_processing_scope_operator(p_operator,p_session,p_authorization);
 select private.roadmap_b42_operator_plan(verification_id) into plan from private.roadmap_b5_pilot_events where sequence=b.pilot_sequence;`);
const replacements=[plan,pilot,context,rpc,grant];
fs.writeFileSync(file,'-- B6 continuity: local candidate only. No consent/source/grant/control backfill.\nbegin;\ndo $$begin\n'+checks+'\nend $$;\n'+support+'\n'+replacements.join('\n\n')+'\ncommit;\n');
fs.mkdirSync('docs/b6-session-continuity',{recursive:true});
fs.writeFileSync('docs/b6-session-continuity/rollback-functions.sql','-- Reviewed forward repair: first hold processing/review under separate authorization.\n-- Restore only these definitions; do not delete confirmations or immutable evidence.\nbegin;\n'+Object.values(originals).map(x=>x.sql).join('\n\n')+'\ncommit;\n');
console.log(JSON.stringify({migration:file,sha256:sha(fs.readFileSync(file)),replacedFunctions:Object.keys(originals),newTables:1,seededRecords:0}));
