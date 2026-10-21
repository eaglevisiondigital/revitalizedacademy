-- Unapplied forward repair. Separate production scope approval is required.
-- Keep pg-safeupdate enabled; target the existing checked singleton explicitly.
-- No table, role, grant, policy, original migration or unrelated routine change.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='15s';
DO $repair$
DECLARE spec record; target oid; definition text; normalized text; statement text;
 before_security jsonb; after_security jsonb;
BEGIN
 FOR spec IN SELECT * FROM (VALUES
  ('private.hhl_maintain()', '5bf2e0ce55b6679709a13d82f11dfba1', ARRAY[
   'UPDATE private.hhl_settings SET registration_enabled=false,zoom_enabled=false,notifications_enabled=false,provider_retention_ready=false;',
   'UPDATE private.hhl_settings SET retention_healthy_at=CASE WHEN EXISTS(SELECT 1 FROM private.hhl_sessions WHERE expired_at IS NULL AND private.hhl_expires_at(starts_at)<=now()) THEN NULL ELSE now() END;'
  ]),
  ('private.hhl_staff_guest_core(text,jsonb)', '2d011494a16059d1a692cdf970cf8fc9', ARRAY[
   'UPDATE private.hhl_settings SET registration_enabled=(p_data->>''registration_enabled'')::boolean,zoom_enabled=(p_data->>''zoom_enabled'')::boolean,notifications_enabled=(p_data->>''notifications_enabled'')::boolean;'
  ])
 ) AS expected(signature,original_md5,statements)
 LOOP
  target:=pg_catalog.to_regprocedure(spec.signature)::oid;
  IF target IS NULL THEN RAISE EXCEPTION 'required_event_function_missing: %',spec.signature;END IF;
  SELECT pg_catalog.pg_get_functiondef(p.oid),jsonb_build_object('owner',p.proowner,'acl',p.proacl,'definer',p.prosecdef,'config',p.proconfig)
   INTO definition,before_security FROM pg_catalog.pg_proc p WHERE p.oid=target;
  normalized:=definition;
  FOREACH statement IN ARRAY spec.statements LOOP
   normalized:=replace(normalized,left(statement,length(statement)-1)||' WHERE singleton;',statement);
  END LOOP;
  IF md5(normalized)<>spec.original_md5 THEN RAISE EXCEPTION 'event_source_fingerprint_changed: %',spec.signature;END IF;
  FOREACH statement IN ARRAY spec.statements LOOP
   IF position(statement IN normalized)=0 OR (length(normalized)-length(replace(normalized,statement,'')))/length(statement)<>1
    THEN RAISE EXCEPTION 'event_repair_target_changed: %',spec.signature;END IF;
   definition:=replace(definition,statement,left(statement,length(statement)-1)||' WHERE singleton;');
  END LOOP;
  IF definition<>pg_catalog.pg_get_functiondef(target) THEN EXECUTE definition;END IF;
  SELECT jsonb_build_object('owner',p.proowner,'acl',p.proacl,'definer',p.prosecdef,'config',p.proconfig)
   INTO after_security FROM pg_catalog.pg_proc p WHERE p.oid=target;
  IF before_security IS DISTINCT FROM after_security THEN RAISE EXCEPTION 'event_security_metadata_changed: %',spec.signature;END IF;
 END LOOP;
END
$repair$;
COMMIT;
