-- Read-only private operator metadata. Do not publish returned consent/source audit digests.
-- Run only after exact migration authorization; this file does not apply it.
begin read only;
select n.nspname||'.'||p.proname||'('||pg_catalog.oidvectortypes(p.proargtypes)||')' identity,
 encode(extensions.digest(p.prosrc,'sha256'),'hex') body_sha256,
 pg_catalog.pg_get_userbyid(p.proowner) owner,p.proacl::text acl,p.proconfig,p.prosecdef
from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
where (n.nspname='private' and p.proname in('roadmap_b42_operator_plan','roadmap_b6_set_pilot','roadmap_b6_context','roadmap_b6_live_session','roadmap_b6_check_consent','roadmap_b6_confirm_session','roadmap_b6_confirmed_session','roadmap_processing_set_grant','roadmap_processing_context'))
 or (n.nspname='public' and p.proname='roadmap_b6') order by identity;
select relrowsecurity from pg_catalog.pg_class where oid='private.roadmap_b6_session_confirmations'::regclass;
select r.role,has_table_privilege(r.role,'private.roadmap_b6_session_confirmations','SELECT,INSERT,UPDATE,DELETE') any_direct_privilege
from(values('anon'),('authenticated'),('service_role'))r(role);
select ingest,process,review,approve,internal_pdf from private.roadmap_processing_controls;
select count(*) new_session_confirmations from private.roadmap_b6_session_confirmations;
select count(*) existing_purpose_events,
 encode(extensions.digest(coalesce(jsonb_agg(to_jsonb(p)order by sequence)::text,''),'sha256'),'hex') private_consent_history_digest
from private.roadmap_b6_purpose_events p;
-- Compare with the separately captured preflight digest/count; never rewrite these records.
rollback;
