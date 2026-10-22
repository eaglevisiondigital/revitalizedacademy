-- LOCAL ONLY. Installs empty independent review authority; never renews processing.
begin;
do $$begin
 if (select encode(extensions.digest(prosrc,'sha256'),'hex') from pg_proc where oid='private.roadmap_processing_context(uuid,text)'::regprocedure) is distinct from 'e29b747feb17792c5a53043371286ab1402e76730c7daf12bddf155db2b891ed' then raise exception 'Reviewed saved-review security baseline required';end if;
 if (select encode(extensions.digest(prosrc,'sha256'),'hex') from pg_proc where oid='public.roadmap_processing(text,uuid,jsonb)'::regprocedure) is distinct from '7d34c85e11aae1bac1fba58f34d06b7fde69917b9f51cabe5db480c0f4baf786' then raise exception 'Reviewed saved-review security baseline required';end if;
 if (select encode(extensions.digest(prosrc,'sha256'),'hex') from pg_proc where oid='private.roadmap_b6_live_session(uuid,uuid)'::regprocedure) is distinct from '137c00f786b828f78e74cbd25045f0723b793f5455141806b2bc148adc25a54b' then raise exception 'Reviewed saved-review security baseline required';end if;
 if to_regprocedure('private.roadmap_b6_live_session(uuid,uuid)') is null
 or to_regprocedure('private.roadmap_processing_scope_operator(uuid,uuid,text)') is null
 or to_regclass('private.roadmap_saved_review_grants') is not null then
 raise exception 'Reviewed saved-review baseline required';end if;
end $$;

-- Exactly one case for this separately approved window. No other participant/founder/version.
create table private.roadmap_saved_review_grants(
 singleton boolean primary key default true check(singleton), id uuid not null unique default gen_random_uuid(),
 founder_id uuid not null references private.roadmap_b42_founders(user_id),
 report_id uuid not null references public.vitality_reports(id),
 version_id uuid not null references private.roadmap_processing_versions(id),
 fingerprint text not null check(fingerprint ~ '^[a-f0-9]{64}$'),
 document_hash text not null check(document_hash ~ '^[a-f0-9]{64}$'),
 consent_pins jsonb not null, starts_at timestamptz not null default clock_timestamp(),
 expires_at timestamptz not null check(expires_at <= '2026-10-22T22:00:00Z'::timestamptz),
 operator_id uuid not null references auth.users(id),operator_session uuid not null,founder_session uuid not null,
 authorization_reference text not null check(length(trim(authorization_reference)) between 10 and 1000),
 purpose text not null default 'caroline-r2-justyn-read-cited-feedback-20261022' check(purpose='caroline-r2-justyn-read-cited-feedback-20261022'),
 check(starts_at >= '2026-10-22T13:45:00Z'::timestamptz and starts_at < expires_at)
);
create table private.roadmap_saved_review_audit(
 sequence bigint generated always as identity primary key,grant_id uuid not null references private.roadmap_saved_review_grants(id),
 actor_id uuid not null references auth.users(id),session_id uuid not null,
 action text not null check(action in ('grant','revoke','read','review')),
 review_sequence bigint references private.roadmap_processing_reviews(sequence),
 authorization_reference text not null default '',created_at timestamptz not null default clock_timestamp()
);
do $$declare t text;begin
 foreach t in array array['grants','audit'] loop
 execute format('alter table private.roadmap_saved_review_%I enable row level security',t);
 execute format('revoke all on private.roadmap_saved_review_%I from public,anon,authenticated,service_role',t);
 execute format('create trigger %I before update or delete on private.roadmap_saved_review_%I for each row execute function private.roadmap_b4_immutable()','roadmap_saved_review_'||t||'_immutable',t);
 execute format('create trigger %I before truncate on private.roadmap_saved_review_%I for each statement execute function private.roadmap_b4_immutable()','roadmap_saved_review_'||t||'_no_truncate',t);
 end loop;
end $$;
revoke all on sequence private.roadmap_saved_review_audit_sequence_seq from public,anon,authenticated,service_role;

-- Validates durable retained records, not their expired processing windows. This helper
-- never returns answers and is reachable only inside the independent saved-review API.
create function private.roadmap_saved_review_basis(p_founder uuid,p_report uuid,p_version uuid,p_fingerprint text,p_hash text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v private.roadmap_processing_versions; b private.roadmap_b5_pilot_events;
 g private.roadmap_b6_grant_events; p private.roadmap_b6_purpose_events;
 s private.roadmap_processing_purposes; cohort private.roadmap_b4_cohort_events; pg private.roadmap_processing_grants;
 verification private.roadmap_b42_verifications;sop private.roadmap_b42_sop_attestations;m jsonb;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_report::text,416));
 select * into v from private.roadmap_processing_versions where id=p_version;
 if v.id is null or v.report_id is distinct from p_report or v.revision<>2 or v.actor_id is distinct from p_founder
 or v.pipeline is distinct from 'roadmap-internal-processing-v1'
 or v.document->'review'->'clientVisible' is distinct from 'false'::jsonb
 or v.document->'review'->>'export' is distinct from 'held' or v.document->'review'->>'delivery' is distinct from 'held' or v.document->'review'->>'email' is distinct from 'held'
 or v.document->>'sourceFingerprint' is distinct from p_fingerprint or v.document->'pins' is distinct from private.roadmap_b6_pins()
 or v.fingerprint is distinct from p_fingerprint or v.document_hash is distinct from p_hash
 or encode(extensions.digest(v.document::text,'sha256'),'hex') is distinct from p_hash
 or not exists(select 1 from private.roadmap_b42_founders f join auth.users u on u.id=f.user_id
 where f.user_id=p_founder and f.verified_email='justyn@revitalizedacademy.com' and lower(trim(u.email))=f.verified_email)
 or not exists(select 1 from public.vitality_reports r join public.contacts c on c.id=r.contact_id
 where r.id=p_report and lower(trim(c.first_name))='caroline' and lower(trim(c.last_name))='risi')
 then raise exception 'Exact saved review case required' using errcode='42501';end if;
 select * into b from private.roadmap_b5_pilot_events where report_id=p_report order by sequence desc limit 1;
 select * into g from private.roadmap_b6_grant_events where report_id=p_report order by sequence desc limit 1;
 select * into p from private.roadmap_b6_purpose_events where report_id=p_report and actor_id=p_founder order by sequence desc limit 1;
 select * into s from private.roadmap_processing_purposes where report_id=p_report and actor_id=p_founder order by sequence desc limit 1;
 select * into pg from private.roadmap_processing_grants where report_id=p_report order by sequence desc limit 1;
 select * into cohort from private.roadmap_b4_cohort_events where report_id=p_report order by sequence desc limit 1;
 select * into verification from private.roadmap_b42_verifications where id=b.verification_id;
 select * into sop from private.roadmap_b42_sop_attestations where id=verification.sop_id;
 if b.active is distinct from true or b.source_fingerprint is distinct from p_fingerprint
 or g.active is distinct from true or g.source_fingerprint is distinct from p_fingerprint or g.pilot_sequence is distinct from b.sequence or not g.allow_feedback
 or p.active is distinct from true or p.source_fingerprint is distinct from p_fingerprint or p.pilot_sequence is distinct from b.sequence
 or p.sequence is distinct from g.purpose_sequence or p.pins is distinct from private.roadmap_b6_pins() or g.pins is distinct from p.pins
 or p.acknowledgments is distinct from '{"experimental_purpose":true,"no_client_scores":true,"immutable_originals":true,"no_external_ai_exports":true,"manual_revocation_14_days":true,"separate_feedback_permission":true,"historical_provenance_limits":true}'::jsonb
 or s.active is distinct from true or s.fingerprint is distinct from p_fingerprint or s.b6_grant is distinct from g.sequence
 or s.acknowledgment is distinct from 'private_internal_draft_storage_review_separate_from_read_only_pilot_v1'
 or pg.active is distinct from true or not pg.allow_review or pg.allow_approval or pg.allow_pdf
 or pg.fingerprint is distinct from p_fingerprint or pg.b6_grant is distinct from g.sequence or pg.purpose is distinct from s.sequence
 or cohort.active is distinct from true or cohort.allow_drafts or cohort.source_fingerprint is distinct from p_fingerprint
 or verification.id is null or verification.actor_id is distinct from p_founder or verification.decision is distinct from 'confirmed'
 or not verification.eligible_at_confirmation or verification.source_fingerprint is distinct from p_fingerprint
 or exists(select 1 from private.roadmap_b42_verifications x where x.subject_key=verification.subject_key and x.revision>verification.revision)
 or sop.sop_version is distinct from 'RVA-B4-PILOT-READONLY-v1-2026-10-16'
 or not private.roadmap_b4_is_founder(p_founder) or not private.staff_can_access_contact(p_founder,verification.contact_id)
 then raise exception 'Retained personal consent and source authority required' using errcode='42501';end if;
 m:=private.roadmap_b42_descriptor(verification.contact_id,p_report);
 if (m->>'eligible') is distinct from 'true' or m->>'_source' is distinct from p_fingerprint
 or m->>'_fingerprint' is distinct from verification.metadata_fingerprint then
 raise exception 'Exact verified source changed' using errcode='40001';end if;
 -- References freeze consent history without reviving old session/batch/key lifetimes.
 return jsonb_build_object('b5',b.sequence,'b6',g.sequence,'purpose',p.sequence,'storage',s.sequence,'processing_grant',pg.sequence,'cohort',cohort.sequence,'verification',verification.id,'pins',p.pins);
end $$;

create function private.roadmap_saved_review_authorize(p_founder uuid,p_founder_session uuid,p_report uuid,p_version uuid,p_fingerprint text,p_hash text,p_expires timestamptz,p_operator uuid,p_operator_session uuid,p_reference text)
returns uuid language plpgsql security definer set search_path='' as $$
declare pins jsonb;old private.roadmap_saved_review_grants;fresh uuid;
begin
 perform pg_advisory_xact_lock(18062026);
 perform private.roadmap_processing_scope_operator(p_operator,p_operator_session,p_reference);
 perform private.roadmap_b6_live_session(p_founder,p_founder_session);
 if clock_timestamp()<'2026-10-22T13:45:00Z'::timestamptz or p_expires is null or p_expires<=clock_timestamp() or p_expires>'2026-10-22T22:00:00Z'::timestamptz
 or exists(select 1 from private.roadmap_processing_pilot_batches where expires_at>clock_timestamp())
 or exists(select 1 from private.roadmap_processing_controls where ingest or approve or internal_pdf)
 then raise exception 'Independent bounded review window required' using errcode='42501';end if;
 pins:=private.roadmap_saved_review_basis(p_founder,p_report,p_version,p_fingerprint,p_hash);
 select * into old from private.roadmap_saved_review_grants where singleton;
 if old.id is not null then
 if old.founder_id is distinct from p_founder or old.report_id is distinct from p_report or old.version_id is distinct from p_version
 or old.fingerprint is distinct from p_fingerprint or old.document_hash is distinct from p_hash or old.expires_at is distinct from p_expires or old.consent_pins is distinct from pins
 or old.operator_id is distinct from p_operator or old.operator_session is distinct from p_operator_session or old.authorization_reference is distinct from p_reference
 or exists(select 1 from private.roadmap_saved_review_audit where grant_id=old.id and action='revoke') then
 raise exception 'Changed or revoked review authorization' using errcode='42501';end if;return old.id;end if;
 insert into private.roadmap_saved_review_grants(founder_id,founder_session,report_id,version_id,fingerprint,document_hash,consent_pins,expires_at,operator_id,operator_session,authorization_reference)
 values(p_founder,p_founder_session,p_report,p_version,p_fingerprint,p_hash,pins,p_expires,p_operator,p_operator_session,p_reference) returning id into fresh;
 insert into private.roadmap_saved_review_audit(grant_id,actor_id,session_id,action,authorization_reference)values(fresh,p_operator,p_operator_session,'grant',p_reference);
 return fresh;
end $$;
create function private.roadmap_saved_review_revoke(p_grant uuid,p_operator uuid,p_session uuid,p_reference text)
returns void language plpgsql security definer set search_path='' as $$begin
 perform pg_advisory_xact_lock(18062026);
 perform private.roadmap_processing_scope_operator(p_operator,p_session,p_reference);
 if not exists(select 1 from private.roadmap_saved_review_audit where grant_id=p_grant and action='revoke') then
 insert into private.roadmap_saved_review_audit(grant_id,actor_id,session_id,action,authorization_reference)values(p_grant,p_operator,p_session,'revoke',p_reference);end if;
end $$;

create function private.roadmap_saved_review_context(p_report uuid,p_write boolean)
returns private.roadmap_saved_review_grants language plpgsql security definer set search_path='' as $$
declare a uuid:=private.roadmap_b42_actor();sid uuid:=(auth.jwt()->>'session_id')::uuid;g private.roadmap_saved_review_grants;
begin
 perform pg_advisory_xact_lock(18062026);
 perform private.roadmap_b6_live_session(a,sid);
 select * into g from private.roadmap_saved_review_grants where report_id=p_report and founder_id=a;
 if not exists(select 1 from private.roadmap_processing_controls where singleton and review and not ingest and not approve and not internal_pdf)
 or g.id is null or g.starts_at>clock_timestamp() or g.expires_at<=clock_timestamp()
 or exists(select 1 from private.roadmap_saved_review_audit where grant_id=g.id and action='revoke')
 or (p_write and not private.staff_has_permission(a,'health.progress.manage')) then
 raise exception 'Saved report review unavailable' using errcode='42501';end if;
 if private.roadmap_saved_review_basis(a,g.report_id,g.version_id,g.fingerprint,g.document_hash) is distinct from g.consent_pins
 then raise exception 'Saved report consent changed' using errcode='42501';end if;
 -- Recheck server time after any lock wait; no extension from a stale request timestamp.
 if g.expires_at<=clock_timestamp() then raise exception 'Saved report review expired' using errcode='42501';end if;
 return g;
end $$;

-- New invoker gateway; existing processing RPC/context/Functions are untouched.
create function private.roadmap_saved_review_api(p_action text,p_report uuid,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a uuid:=private.roadmap_b42_actor();sid uuid:=(auth.jwt()->>'session_id')::uuid;g private.roadmap_saved_review_grants;
 v private.roadmap_processing_versions;r private.roadmap_processing_reviews;proposal_data jsonb;req uuid;hash text;n integer;seq bigint;history jsonb;
begin
 perform pg_advisory_xact_lock(18062026);
 if p_action is null or p_action not in ('list','read','review') or p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>20000
 then raise exception 'Invalid saved review request' using errcode='22023';end if;
 if p_action='list' then
 if p_report is not null or p_payload<>'{}'::jsonb then raise exception 'Invalid saved review list' using errcode='22023';end if;
 select * into g from private.roadmap_saved_review_grants where founder_id=a;
 if g.id is null then return '[]'::jsonb;end if;
 g:=private.roadmap_saved_review_context(g.report_id,false);
 return jsonb_build_array(jsonb_build_object('report_id',g.report_id,'revision',2,'label','Caroline · saved Revision 2','expires_at',g.expires_at,'review_only',true));
 end if;
 g:=private.roadmap_saved_review_context(p_report,p_action='review');
 select * into v from private.roadmap_processing_versions where id=g.version_id;
 if p_action='read' then
 if p_payload<>'{}'::jsonb then raise exception 'Invalid saved review read' using errcode='22023';end if;
 select coalesce(jsonb_agg(jsonb_build_object('revision',revision,'actor',actor_id,'proposal',proposal)order by revision),'[]') into history from private.roadmap_processing_reviews where version_id=v.id;
 insert into private.roadmap_saved_review_audit(grant_id,actor_id,session_id,action)values(g.id,a,sid,'read');
 return jsonb_build_object('version_id',v.id,'revision',v.revision,'document',v.document,'reviews',history,'expires_at',g.expires_at,'review_only',true,'client_visible',false,'delivery','held','email','held');
 end if;
 if (select count(*)from jsonb_object_keys(p_payload))<>4 or not p_payload?&array['version_id','expected_revision','request_key','proposal']
 or p_payload->>'version_id' is distinct from v.id::text then raise exception 'Exact saved version required' using errcode='22023';end if;
 proposal_data:=p_payload->'proposal';req:=(p_payload->>'request_key')::uuid;hash:=encode(extensions.digest(p_payload::text,'sha256'),'hex');
 if req is null or jsonb_typeof(proposal_data) is distinct from 'object' then raise exception 'Invalid cited proposal' using errcode='22023';end if;
 if proposal_data->>'driver' is null or not (proposal_data->>'driver')=any(private.roadmap_b4_driver_keys())
 or proposal_data->>'decision' is null or proposal_data->>'decision' not in ('accurate','inaccurate','needs_adjustment','request_inputs')
 or jsonb_typeof(proposal_data->'rationale') is distinct from 'string' or length(trim(proposal_data->>'rationale')) not between 3 and 2000
 or jsonb_typeof(proposal_data->'citations') is distinct from 'array' then raise exception 'Cited feedback required' using errcode='22023';end if;
 if jsonb_array_length(proposal_data->'citations') not between 1 and 20
 or exists(select 1 from jsonb_object_keys(proposal_data)k where k not in ('driver','decision','interpretation','rationale','citations','suggestedAdjustment','missingInputRequest'))
 or exists(select 1 from jsonb_each(proposal_data)e where e.key in ('interpretation','suggestedAdjustment','missingInputRequest') and (jsonb_typeof(e.value)<>'string' or length(e.value#>>'{}')>2000))
 or exists(select 1 from jsonb_array_elements(proposal_data->'citations')ref where jsonb_typeof(ref)<>'string' or not exists(select 1 from jsonb_array_elements(v.document->'drivers'->(proposal_data->>'driver')->'evidence')e where e->'field'=ref)) then raise exception 'Invalid source citation' using errcode='22023';end if;
 select * into r from private.roadmap_processing_reviews where actor_id=a and request_key=req;
 if r.sequence is not null then
 if r.version_id<>v.id or r.request_hash<>hash then raise exception 'Changed retry' using errcode='22023';end if;
 return jsonb_build_object('revision',r.revision,'idempotent',true,'rules_adopted',false);end if;
 select coalesce(max(revision),0)into n from private.roadmap_processing_reviews where version_id=v.id;
 if p_payload->'expected_revision' is distinct from to_jsonb(n) then raise exception 'Concurrent review' using errcode='40001';end if;
 -- Recheck current session and expiry immediately before appending feedback.
 g:=private.roadmap_saved_review_context(p_report,true);
 insert into private.roadmap_processing_reviews(version_id,revision,actor_id,session_id,request_key,request_hash,proposal)
 values(v.id,n+1,a,sid,req,hash,proposal_data) returning sequence into seq;
 insert into private.roadmap_saved_review_audit(grant_id,actor_id,session_id,action,review_sequence)values(g.id,a,sid,'review',seq);
 return jsonb_build_object('revision',n+1,'rules_adopted',false);
exception when others then raise exception 'Saved report review unavailable' using errcode=sqlstate;
end $$;
create function public.roadmap_saved_review(p_action text,p_report uuid default null,p_payload jsonb default '{}')
returns jsonb language sql security invoker set search_path='' as $$
 select private.roadmap_saved_review_api(p_action,p_report,p_payload);
$$;
revoke all on function private.roadmap_saved_review_basis(uuid,uuid,uuid,text,text),private.roadmap_saved_review_authorize(uuid,uuid,uuid,uuid,text,text,timestamptz,uuid,uuid,text),private.roadmap_saved_review_revoke(uuid,uuid,uuid,text),private.roadmap_saved_review_context(uuid,boolean),private.roadmap_saved_review_api(text,uuid,jsonb),public.roadmap_saved_review(text,uuid,jsonb) from public,anon,authenticated,service_role;
grant execute on function private.roadmap_saved_review_api(text,uuid,jsonb),public.roadmap_saved_review(text,uuid,jsonb) to authenticated;
comment on function public.roadmap_saved_review(text,uuid,jsonb) is 'Independent Justyn/Caroline saved Revision2 read and cited feedback only, until 2026-10-22T22:00Z. No processing authority.';
commit;
