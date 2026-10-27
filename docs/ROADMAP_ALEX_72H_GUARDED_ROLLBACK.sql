-- LOCAL rollback artifact; separate protected Owner execution only. Never delete history.
begin;
do $$declare p jsonb;begin
perform pg_advisory_xact_lock(18062026);select pin into p from private.roadmap_alex_contract where singleton;
if exists(select 1 from private.roadmap_alex_windows w join private.roadmap_alex_contract c on c.singleton where c.expires_at>clock_timestamp()and not exists(select 1 from private.roadmap_alex_audit where window_id=w.id and action='revoke'))then raise exception 'Revoke the new authority through its audited Owner path first';end if;
if exists(select 1 from private.roadmap_processing_jobs where id=(p->>'job')::uuid and status='leased'and lease_until>clock_timestamp())then raise exception 'Do not roll back during an in-flight lease';end if;
if(select encode(extensions.digest(pg_get_functiondef(p.oid),'sha256'),'hex')from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private'and p.proname='roadmap_processing_context')is distinct from '573a4b878909a32b4f328b26f6bb1e9f468c9de99e32d9da1f744c33a6e56f35'then raise exception 'Rollback dependency changed';end if;
if(select encode(extensions.digest(pg_get_functiondef(p.oid),'sha256'),'hex')from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private'and p.proname='roadmap_processing_seal_challenge_context')is distinct from '35d4dd765f4f785bdbf6a53049f024f80a481867b2452b685e45aac488fa6d2b'then raise exception 'Rollback dependency changed';end if;
if(select encode(extensions.digest(pg_get_functiondef(p.oid),'sha256'),'hex')from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'and p.proname='roadmap_b6')is distinct from 'e2f4c5c4a0e6392067d592784e905705bac6e0c53fe235dcf9f1d52b0e9d66c7'then raise exception 'Rollback dependency changed';end if;
if(select encode(extensions.digest(pg_get_functiondef(p.oid),'sha256'),'hex')from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'and p.proname='roadmap_processing')is distinct from '835531e25580669ac92a5f34d56b3021e12fc38e9edff2104d8df2b60e046954'then raise exception 'Rollback dependency changed';end if;
if(select encode(extensions.digest(pg_get_functiondef(p.oid),'sha256'),'hex')from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'and p.proname='roadmap_saved_review')is distinct from '1501a1571f87852107920d07a454c29f8bef0c5174556ec7b9f50d3e1e6977cb'then raise exception 'Rollback dependency changed';end if;
end $$;
CREATE OR REPLACE FUNCTION private.roadmap_processing_context(p_report uuid, p_mode text DEFAULT 'read'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare c jsonb;p private.roadmap_processing_purposes;g private.roadmap_processing_grants;issuer private.roadmap_processing_purposes;flags private.roadmap_processing_controls;a uuid;batch private.roadmap_processing_pilot_batches;begin
 c:=private.roadmap_b6_context(p_report,false);a:=private.roadmap_b42_actor();
 select * into flags from private.roadmap_processing_controls where singleton for share;
 perform 1 from auth.sessions where id=(auth.jwt()->>'session_id')::uuid and user_id=a for share;
 perform 1 from public.staff_access where user_id=a for share;
 -- Revalidate after row locks; logout/status changes cannot resurrect an in-flight writer.
 c:=private.roadmap_b6_context(p_report,false);
 select * into g from private.roadmap_processing_grants where report_id=p_report order by sequence desc limit 1;
 select * into p from private.roadmap_processing_purposes where report_id=p_report and actor_id=a order by sequence desc limit 1;
 select * into issuer from private.roadmap_processing_purposes where sequence=g.purpose;
 if not flags.process or g.active is distinct from true or g.expires_at<=clock_timestamp() or g.expires_at>(c->>'expires_at')::timestamptz
 or g.b6_grant is distinct from (c->>'grant_sequence')::bigint or g.fingerprint is distinct from c->>'source_fingerprint'
 or p.active is distinct from true or p.session_id is distinct from (auth.jwt()->>'session_id')::uuid or p.fingerprint is distinct from g.fingerprint or p.b6_grant is distinct from g.b6_grant
 or issuer.active is distinct from true or not exists(select 1 from public.staff_access where user_id=issuer.actor_id and role='owner' and status='active' and onboarding_status='complete' and contact_scope='all') or not private.staff_has_permission(issuer.actor_id,'health.private.view') or exists(select 1 from private.roadmap_processing_purposes where report_id=p_report and actor_id=issuer.actor_id and sequence>issuer.sequence)
 or not exists(select 1 from auth.sessions where id=issuer.session_id and user_id=issuer.actor_id and (not_after is null or not_after>clock_timestamp()))
 or (p_mode='review' and (not flags.review or not g.allow_review or not (c->>'can_feedback')::boolean))
 or (p_mode='approve' and (not flags.approve or not g.allow_approval or not g.allow_review or not flags.review or not (c->>'can_feedback')::boolean))
 or (p_mode='pdf' and (not flags.internal_pdf or not g.allow_pdf)) then raise exception 'Internal processing authorization held' using errcode='42501';end if;
 select * into batch from private.roadmap_processing_pilot_batches order by sequence desc limit 1;
 if batch.id is null or batch.expires_at<=clock_timestamp() or not exists(select 1 from jsonb_array_elements(batch.sources)s where s->>'report'=p_report::text and s->>'fingerprint'=g.fingerprint and s->>'grant'=g.sequence::text) then raise exception 'Three-source scope held or changed' using errcode='42501';end if;
 return c||jsonb_build_object('processing_grant',g.sequence,'processing_expires_at',g.expires_at,'client_visible',false,'delivery','held','email','held');
end $function$
;
CREATE OR REPLACE FUNCTION private.roadmap_processing_seal_challenge_context(p_key uuid, p_job uuid, p_lease text, p_document jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare j private.roadmap_processing_jobs;k private.roadmap_processing_seal_keys;b private.roadmap_processing_pilot_batches;c jsonb;r uuid;actor uuid;sid uuid;challenge text;begin
 actor:=private.roadmap_b42_actor();sid:=(auth.jwt()->>'session_id')::uuid;
 perform pg_advisory_xact_lock(18062026);
 if p_lease is null or p_lease !~ '^[a-f0-9]{64}$' or jsonb_typeof(p_document) is distinct from 'object' or octet_length(p_document::text)>1800000 then raise exception 'Bound worker proof required' using errcode='42501';end if;
 select * into j from private.roadmap_processing_jobs where id=p_job;
 select id into r from public.vitality_reports where contact_id=j.contact_id and workflow_id=j.workflow_id;
 if r is null or (select count(*)from public.vitality_reports where contact_id=j.contact_id and workflow_id=j.workflow_id)<>1 then raise exception 'Exact source required' using errcode='42501';end if;
 c:=private.roadmap_processing_context(r,'read');
 select * into j from private.roadmap_processing_jobs where id=p_job for update;
 select * into b from private.roadmap_processing_pilot_batches order by sequence desc limit 1;
 select * into k from private.roadmap_processing_seal_keys where id=p_key for share;
 if j.status is distinct from 'leased' or j.lease_until<=clock_timestamp() or j.lease_hash is distinct from encode(extensions.digest(p_lease,'sha256'),'hex')
 or j.actor_id is distinct from actor or j.session_id is distinct from sid or j.grant_sequence is distinct from (c->>'processing_grant')::bigint
 or j.fingerprint is distinct from c->>'source_fingerprint' or j.pins is distinct from private.roadmap_b6_pins()
 or k.active is distinct from true or k.batch_id is distinct from b.id or k.expires_at<=clock_timestamp() or k.expires_at>b.expires_at
 then raise exception 'Current founder lease and sealing identity required' using errcode='42501';end if;
 challenge:=jsonb_build_object('protocol','rva-roadmap-seal-hmac-sha256-v1','key',k.id,'batch',b.id,'job',j.id,'lease_hash',j.lease_hash,
 'document_hash',encode(extensions.digest(p_document::text,'sha256'),'hex'),'fingerprint',j.fingerprint,'grant',j.grant_sequence,
 'actor',actor,'session',sid,'key_expires_at',k.expires_at,'batch_expires_at',b.expires_at,'pins',j.pins)::text;
 return jsonb_build_object('protocol','rva-roadmap-seal-hmac-sha256-v1','challenge',challenge);
end $function$
;
CREATE OR REPLACE FUNCTION public.roadmap_b6(p_action text, p_report uuid DEFAULT NULL::uuid, p_payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare actor uuid:=private.roadmap_b42_actor();sid uuid:=(auth.jwt()->>'session_id')::uuid;c jsonb;p jsonb;g private.roadmap_b6_grant_events;entry record;available jsonb:='[]';seq bigint;current_revision integer;old private.roadmap_b6_feedback;key uuid;pin text;ref jsonb;ack jsonb;ready boolean;identity_meta jsonb;purpose_acknowledged boolean;existing_purpose private.roadmap_b6_purpose_events;purpose_retry boolean:=false;
begin
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>20000 then raise exception 'Invalid request' using errcode='22023'; end if;
 if p_action='authorize' and p_report is null and p_payload='{}'::jsonb then return jsonb_build_object('authorized',true,'pins',private.roadmap_b6_pins(),'cohort','operator_only','drafts','held','release','held'); end if;
 if p_action='list' and p_report is null and p_payload='{}'::jsonb then
 for entry in select e.* from (select distinct on(report_id) * from private.roadmap_b5_pilot_events order by report_id,sequence desc)e where e.active and e.expires_at>clock_timestamp() loop
 begin
 c:=private.roadmap_b6_basis(entry.report_id);ready:=false;begin perform private.roadmap_b6_context(entry.report_id,false);ready:=true;exception when sqlstate '42501' or sqlstate '40001' or sqlstate '55000' then null;end;select * into g from private.roadmap_b6_grant_events where report_id=entry.report_id order by sequence desc limit 1;
 identity_meta:=private.roadmap_b42_public_metadata(private.roadmap_b42_descriptor((select contact_id from public.vitality_reports where id=entry.report_id),entry.report_id));
 purpose_acknowledged:=false;begin purpose_acknowledged:=private.roadmap_b6_confirm_session(entry.report_id);exception when sqlstate '42501' or sqlstate '40001' or sqlstate '55000' then null;end;
 available:=available||jsonb_build_array(jsonb_build_object('purpose_acknowledged',purpose_acknowledged,'report_id',entry.report_id,'label','Individually verified source','identity',identity_meta,'ready',ready,'operator_grant',coalesce(g.active and g.expires_at>clock_timestamp() and g.source_fingerprint=c->>'source_fingerprint' and g.pilot_sequence=entry.sequence,false)));
 exception when sqlstate '42501' or sqlstate '40001' or sqlstate '55000' then null;end;
 end loop;return available;
 end if;
 if p_action='attest' and p_report is not null then
 perform pg_advisory_xact_lock(hashtextextended(p_report::text,416));
 c:=private.roadmap_b6_basis(p_report);ack:=p_payload->'acknowledgments';
 if not p_payload ?& array['active','sop','acknowledgments'] or exists(select 1 from jsonb_object_keys(p_payload)k where k not in ('active','sop','acknowledgments')) or jsonb_typeof(p_payload->'active') is distinct from 'boolean' or p_payload->>'sop' is distinct from private.roadmap_b6_pins()->>'sop'
 or ack is distinct from '{"experimental_purpose":true,"no_client_scores":true,"immutable_originals":true,"no_external_ai_exports":true,"manual_revocation_14_days":true,"separate_feedback_permission":true,"historical_provenance_limits":true}'::jsonb then raise exception 'New B6 purpose/SOP acknowledgment required' using errcode='22023'; end if;
 select * into existing_purpose from private.roadmap_b6_purpose_events where report_id=p_report and actor_id=actor order by sequence desc limit 1;
 if existing_purpose.sequence is not null and existing_purpose.source_fingerprint=c->>'source_fingerprint'
 and existing_purpose.pilot_sequence=(c->>'pilot_sequence')::bigint and existing_purpose.active=(p_payload->>'active')::boolean
 and existing_purpose.acknowledgments=ack and existing_purpose.pins=private.roadmap_b6_pins() then
 purpose_retry:=true;seq:=existing_purpose.sequence;
 else
 insert into private.roadmap_b6_purpose_events(report_id,actor_id,session_id,source_fingerprint,pilot_sequence,active,acknowledgments,pins)values(p_report,actor,sid,c->>'source_fingerprint',(c->>'pilot_sequence')::bigint,(p_payload->>'active')::boolean,ack,private.roadmap_b6_pins())returning sequence into seq;
 end if;
 if (p_payload->>'active')::boolean then perform private.roadmap_b6_confirm_session(p_report);end if;
 ready:=false;begin perform private.roadmap_b6_context(p_report,false);ready:=true;exception when sqlstate '42501' or sqlstate '40001' or sqlstate '55000' then null;end;
 return jsonb_build_object('acknowledged',true,'idempotent',purpose_retry,'can_open',ready,'operator_activation','separate_required','enrolled',false);
 end if;
 if p_action is null or p_action not in ('read','check','compute','hypothetical','feedback_save','feedback_history') or p_report is null then raise exception 'Invalid action' using errcode='22023'; end if;
 c:=private.roadmap_b6_context(p_report,p_action='feedback_save');
 if p_action<>'feedback_save' and p_payload<>'{}'::jsonb then raise exception 'Invalid payload' using errcode='22023'; end if;
 select coalesce(max(revision),0) into current_revision from private.roadmap_b6_feedback where report_id=p_report;
 if p_action='feedback_save' then
 if not p_payload ?& array['expected_revision','request_key','source_fingerprint','grant_sequence','manual','notes','citations'] or exists(select 1 from jsonb_object_keys(p_payload)k where k not in ('expected_revision','request_key','source_fingerprint','grant_sequence','manual','notes','citations')) then raise exception 'Invalid feedback' using errcode='22023'; end if;
 perform private.roadmap_b6_validate_manual(p_payload->'manual');
 if p_payload->>'source_fingerprint' is distinct from c->>'source_fingerprint' or p_payload->'grant_sequence' is distinct from c->'grant_sequence' then raise exception 'Source changed' using errcode='40001'; end if;
 if jsonb_typeof(p_payload->'notes') is distinct from 'string' or length(trim(p_payload->>'notes')) not between 3 and 2000 or jsonb_typeof(p_payload->'citations') is distinct from 'array' or jsonb_array_length(p_payload->'citations') not between 1 and 20 then raise exception 'Cited proposed rule feedback required' using errcode='22023'; end if;
 for ref in select value from jsonb_array_elements(p_payload->'citations') loop if jsonb_typeof(ref)<>'string' or not (c->'source'->'answers') ? (ref#>>'{}') then raise exception 'Invalid citation' using errcode='22023'; end if;end loop;
 key:=(p_payload->>'request_key')::uuid;pin:=encode(extensions.digest(p_payload::text,'sha256'),'hex');
 select * into old from private.roadmap_b6_feedback where actor_id=actor and request_key=key;
 if old.id is not null then if old.report_id<>p_report or old.request_fingerprint<>pin then raise exception 'Changed retry' using errcode='22023'; end if;return jsonb_build_object('revision',old.revision,'idempotent',true,'adopted',false);end if;
 if jsonb_typeof(p_payload->'expected_revision') is distinct from 'number' or p_payload->>'expected_revision' !~ '^[0-9]+$' or (p_payload->>'expected_revision')::integer<>current_revision then raise exception 'Feedback conflict' using errcode='40001'; end if;
 insert into private.roadmap_b6_feedback(report_id,grant_sequence,revision,actor_id,session_id,source_fingerprint,pins,manual,notes,citations,provenance,request_key,request_fingerprint)
 values(p_report,(c->>'grant_sequence')::bigint,current_revision+1,actor,sid,c->>'source_fingerprint',private.roadmap_b6_pins(),p_payload->'manual',p_payload->>'notes',p_payload->'citations','independent_manual_and_proposed_rules_not_adopted',key,pin);
 current_revision:=current_revision+1;
 end if;
 insert into private.roadmap_b6_audit(report_id,actor_id,session_id,action,grant_sequence,source_fingerprint)values(p_report,actor,sid,p_action,(c->>'grant_sequence')::bigint,c->>'source_fingerprint');
 if p_action='feedback_save' then return jsonb_build_object('revision',current_revision,'adopted',false,'drafts','held','release','held');end if;
 if p_action='feedback_history' then select coalesce(jsonb_agg(jsonb_build_object('revision',revision,'manual',manual,'notes',notes,'citations',citations,'pins',pins,'reviewer',case when actor_id=(select user_id from private.roadmap_b42_founders where verified_email='justyn@revitalizedacademy.com') then 'Justyn' else 'Elle' end,'created_at',created_at,'provenance',provenance)order by revision),'[]')into p from private.roadmap_b6_feedback where report_id=p_report and source_fingerprint=c->>'source_fingerprint';return p;end if;
 if p_action='check' then return jsonb_build_object('authorized',true,'grant_sequence',c->'grant_sequence','purpose_sequence',c->'purpose_sequence','can_feedback',c->'can_feedback','expires_at',c->'expires_at','pins',private.roadmap_b6_pins());end if;
 return c||jsonb_build_object('revision',current_revision,'actual_score',null,'actual_stage',null);
exception when others then raise exception 'Assessment calibration unavailable' using errcode=sqlstate;
end $function$
;
CREATE OR REPLACE FUNCTION public.roadmap_processing(p_action text, p_report uuid, p_payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare a uuid:=private.roadmap_b42_actor();sid uuid:=(auth.jwt()->>'session_id')::uuid;c jsonb;j private.roadmap_processing_jobs;v private.roadmap_processing_versions;r private.roadmap_processing_reviews;lease text;n integer;out jsonb;prior_purpose private.roadmap_processing_purposes;proposal_data jsonb;req uuid;hash text;begin
 perform pg_advisory_xact_lock(18062026);
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>1900000 then raise exception 'Invalid request' using errcode='22023';end if;
 if p_action='attest' then
 c:=private.roadmap_b6_context(p_report,false);
 if p_payload is distinct from '{"active":true,"acknowledgment":"private_internal_draft_storage_review_separate_from_read_only_pilot_v1"}'::jsonb and p_payload is distinct from '{"active":false,"acknowledgment":"private_internal_draft_storage_review_separate_from_read_only_pilot_v1"}'::jsonb then raise exception 'New personal purpose required' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_report::text||a::text,763));
 select * into prior_purpose from private.roadmap_processing_purposes where report_id=p_report and actor_id=a order by sequence desc limit 1;
 if prior_purpose.session_id=sid and prior_purpose.fingerprint=c->>'source_fingerprint' and prior_purpose.b6_grant=(c->>'grant_sequence')::bigint and prior_purpose.active=(p_payload->>'active')::boolean then return '{"acknowledged":true,"idempotent":true,"processing":"operator_grant_and_controls_required"}';end if;
 insert into private.roadmap_processing_purposes(report_id,actor_id,session_id,fingerprint,b6_grant,active,acknowledgment)values(p_report,a,sid,c->>'source_fingerprint',(c->>'grant_sequence')::bigint,(p_payload->>'active')::boolean,p_payload->>'acknowledgment');
 insert into private.roadmap_processing_audit(report_id,actor_id,session_id,action)values(p_report,a,sid,'attest');return '{"acknowledged":true,"processing":"operator_grant_and_controls_required"}';end if;
 if p_action is null or p_action not in ('claim','finish','read','review','approve','regenerate','pdf') then raise exception 'Invalid action' using errcode='22023';end if;
 c:=private.roadmap_processing_context(p_report,case when p_action in ('review','approve','pdf')then p_action else 'read' end);
 perform pg_advisory_xact_lock(hashtextextended(p_report::text,761));
 if p_action in ('read','claim','pdf') and p_payload<>'{}'::jsonb then raise exception 'Unexpected payload' using errcode='22023';end if;
 select * into v from private.roadmap_processing_versions where report_id=p_report and fingerprint=c->>'source_fingerprint' order by revision desc limit 1;
 if p_action in ('read','pdf') then
 insert into private.roadmap_processing_audit(report_id,actor_id,session_id,action)values(p_report,a,sid,p_action);
 select coalesce(jsonb_agg(jsonb_build_object('revision',revision,'proposal',proposal,'actor',actor_id,'created_at',created_at)order by revision),'[]') into out from private.roadmap_processing_reviews where version_id=v.id;
 return jsonb_build_object('version_id',v.id,'revision',v.revision,'document',v.document,'reviews',out,'expires_at',c->'processing_expires_at','client_visible',false,'delivery','held','internal_review_approved',exists(select 1 from private.roadmap_processing_approvals where version_id=v.id and review_revision=(select coalesce(max(revision),0)from private.roadmap_processing_reviews where version_id=v.id)),'pdf',case when p_action='pdf'then'internal_render_only'else'held'end);end if;
 if p_action='regenerate' then
 perform private.roadmap_processing_context(p_report,'review');
 if v.id is null or p_payload->>'version_id' is distinct from v.id::text or (select count(*)from jsonb_object_keys(p_payload))<>2 or not p_payload?&array['version_id','request_key'] then raise exception 'Current draft/regeneration key required' using errcode='40001';end if;
 req:=(p_payload->>'request_key')::uuid;
 select * into j from private.roadmap_processing_jobs where regeneration_key=req;
 if j.id is not null then if j.parent_version is distinct from v.id then raise exception 'Changed regeneration retry' using errcode='22023';end if;return '{"queued":true,"idempotent":true}';end if;
 insert into private.roadmap_processing_jobs(draft_id,contact_id,workflow_id,fingerprint,regeneration_key,parent_version,generation)
 select d.id,d.contact_id,d.workflow_id,c->>'source_fingerprint',req,v.id,coalesce((select max(generation)from private.roadmap_processing_jobs where draft_id=d.id and fingerprint=c->>'source_fingerprint'),0)+1 from private.vitality_assessment_drafts d join public.vitality_reports report on report.contact_id=d.contact_id and report.workflow_id=d.workflow_id where report.id=p_report;
 insert into private.roadmap_processing_audit(report_id,actor_id,session_id,action)values(p_report,a,sid,'regenerate');return '{"queued":true,"global_rules_changed":false}';end if;
 if p_action='claim' then
 if (select count(*) from public.vitality_reports where (contact_id,workflow_id)=(select contact_id,workflow_id from public.vitality_reports where id=p_report))<>1 then raise exception 'Ambiguous report' using errcode='42501';end if;
 select jobs.* into j from private.roadmap_processing_jobs jobs join public.vitality_reports report on jobs.contact_id=report.contact_id and jobs.workflow_id=report.workflow_id
 where report.id=p_report and jobs.fingerprint=c->>'source_fingerprint' and jobs.pipeline='roadmap-internal-processing-v1' and jobs.pins=private.roadmap_b6_pins() and jobs.status<>'complete' and jobs.attempts<3 and (jobs.status='pending' or jobs.lease_until<=clock_timestamp())order by jobs.generation for update of jobs skip locked limit 1;
 if j.id is null then return jsonb_build_object('claimed',false,'version_id',v.id);end if;
 lease:=encode(extensions.gen_random_bytes(32),'hex');
 update private.roadmap_processing_jobs set status='leased',attempts=attempts+1,lease_hash=encode(extensions.digest(lease,'sha256'),'hex'),lease_until=clock_timestamp()+interval '90 seconds',actor_id=a,session_id=sid,grant_sequence=(c->>'processing_grant')::bigint,document_hash=null,seal_hash=null where id=j.id;
 insert into private.roadmap_processing_audit(report_id,job_id,actor_id,session_id,action)values(p_report,j.id,a,sid,'claim');
 select coalesce(jsonb_agg(proposal order by revision),'[]')into out from private.roadmap_processing_reviews where version_id=v.id;
 return jsonb_build_object('claimed',true,'job',j.id,'lease',lease,'context',c,'previous_reviews',out);end if;
 if p_action='finish' then
 if (select count(*) from jsonb_object_keys(p_payload))<>4 or not p_payload?&array['job','lease','seal','document'] then raise exception 'Invalid finish' using errcode='22023';end if;
 select * into j from private.roadmap_processing_jobs where id=(p_payload->>'job')::uuid for update;
 if j.id is null or not exists(select 1 from public.vitality_reports where id=p_report and contact_id=j.contact_id and workflow_id=j.workflow_id) or j.fingerprint is distinct from c->>'source_fingerprint' or j.actor_id is distinct from a or j.session_id is distinct from sid or j.grant_sequence is distinct from (c->>'processing_grant')::bigint
 or j.lease_hash is distinct from encode(extensions.digest(p_payload->>'lease','sha256'),'hex') or j.seal_hash is null or j.seal_hash is distinct from encode(extensions.digest(p_payload->>'seal','sha256'),'hex') or j.document_hash is distinct from encode(extensions.digest((p_payload->'document')::text,'sha256'),'hex') then raise exception 'Invalid sealed result' using errcode='42501';end if;
 if j.status='complete' then select * into v from private.roadmap_processing_versions where job_id=j.id;return jsonb_build_object('version_id',v.id,'idempotent',true);end if;
 if not exists(select 1 from private.roadmap_processing_seal_keys k join private.roadmap_processing_pilot_batches batch on batch.id=k.batch_id where k.id=j.seal_key_id and k.active and k.expires_at>clock_timestamp() and batch.expires_at>clock_timestamp() and batch.sequence=(select max(sequence)from private.roadmap_processing_pilot_batches)) then raise exception 'Worker sealing identity expired or revoked' using errcode='42501';end if;
 if j.status<>'leased' or j.lease_until<=clock_timestamp() then raise exception 'Lease expired' using errcode='42501';end if;
 select coalesce(max(revision),0)+1 into n from private.roadmap_processing_versions where report_id=p_report;
 insert into private.roadmap_processing_versions(job_id,report_id,revision,fingerprint,pipeline,document,document_hash,actor_id,session_id,grant_sequence)values(j.id,p_report,n,j.fingerprint,j.pipeline,p_payload->'document',j.document_hash,a,sid,j.grant_sequence)returning * into v;
 update private.roadmap_processing_jobs set status='complete' where id=j.id;
 insert into private.roadmap_processing_audit(report_id,job_id,actor_id,session_id,action)values(p_report,j.id,a,sid,'finish');return jsonb_build_object('version_id',v.id,'revision',n,'client_visible',false);end if;
 if v.id is null or p_payload->>'version_id' is distinct from v.id::text then raise exception 'Stale version' using errcode='40001';end if;
 select coalesce(max(revision),0)into n from private.roadmap_processing_reviews where version_id=v.id;
 if p_action='review' then
 if (select count(*) from jsonb_object_keys(p_payload))<>4 or not p_payload?&array['version_id','expected_revision','request_key','proposal'] then raise exception 'Invalid review' using errcode='22023';end if;
 proposal_data:=p_payload->'proposal';req:=(p_payload->>'request_key')::uuid;hash:=encode(extensions.digest(p_payload::text,'sha256'),'hex');
 if jsonb_typeof(proposal_data) is distinct from 'object' or proposal_data->>'driver' is null or not (proposal_data->>'driver')=any(private.roadmap_b4_driver_keys()) or proposal_data->>'decision' is null or proposal_data->>'decision' not in ('accurate','inaccurate','needs_adjustment','request_inputs') or jsonb_typeof(proposal_data->'rationale') is distinct from 'string' or length(trim(proposal_data->>'rationale')) not between 3 and 2000 or jsonb_typeof(proposal_data->'citations') is distinct from 'array' or jsonb_array_length(proposal_data->'citations')>20
 or exists(select 1 from jsonb_object_keys(proposal_data)k where k not in ('driver','decision','interpretation','rationale','citations','suggestedAdjustment','missingInputRequest'))
 or exists(select 1 from jsonb_each(proposal_data)e where e.key in ('interpretation','suggestedAdjustment','missingInputRequest') and (jsonb_typeof(e.value)<>'string' or length(e.value#>>'{}')>2000))
 or exists(select 1 from jsonb_array_elements(proposal_data->'citations')ref where jsonb_typeof(ref)<>'string' or not exists(select 1 from jsonb_array_elements(v.document->'drivers'->(proposal_data->>'driver')->'evidence')e where e->'field'=ref)) then raise exception 'Invalid cited proposal' using errcode='22023';end if;
 select * into r from private.roadmap_processing_reviews where actor_id=a and request_key=req;
 if r.sequence is not null then if r.request_hash<>hash then raise exception 'Changed retry' using errcode='22023';end if;return jsonb_build_object('revision',r.revision,'idempotent',true);end if;
 if p_payload->'expected_revision' is distinct from to_jsonb(n)then raise exception 'Concurrent review' using errcode='40001';end if;
 insert into private.roadmap_processing_reviews(version_id,revision,actor_id,session_id,request_key,request_hash,proposal)values(v.id,n+1,a,sid,req,hash,proposal_data);
 insert into private.roadmap_processing_audit(report_id,actor_id,session_id,action)values(p_report,a,sid,'review');return jsonb_build_object('revision',n+1,'rules_adopted',false);end if;
 if p_action='approve' then
 if (select count(*)from jsonb_object_keys(p_payload))<>3 or not p_payload?&array['version_id','expected_revision','rationale'] or p_payload->'expected_revision' is distinct from to_jsonb(n) or (select count(*)from(select distinct on(proposal->>'driver') proposal from private.roadmap_processing_reviews where version_id=v.id order by proposal->>'driver',revision desc)x where x.proposal->>'decision'='accurate')<>12 then raise exception 'Reviewed current version required' using errcode='40001';end if;
 insert into private.roadmap_processing_approvals(version_id,review_revision,actor_id,session_id,rationale)values(v.id,n,a,sid,p_payload->>'rationale')on conflict do nothing;
 insert into private.roadmap_processing_audit(report_id,actor_id,session_id,action)values(p_report,a,sid,'approve');return '{"internal_review_approved":true,"client_visible":false,"delivery":"held","email":"held"}';end if;
 raise exception 'Invalid action' using errcode='22023';
exception when others then raise exception 'Internal Roadmap processing unavailable' using errcode=sqlstate;
end $function$
;
CREATE OR REPLACE FUNCTION public.roadmap_saved_review(p_action text, p_report uuid DEFAULT NULL::uuid, p_payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE sql
 SET search_path TO ''
AS $function$
 select private.roadmap_saved_review_api(p_action,p_report,p_payload);
$function$
;
revoke all on function public.roadmap_alex_key_preflight(uuid,uuid,text,text)from public,anon,authenticated,service_role;
commit;
