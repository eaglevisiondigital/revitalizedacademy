-- Harden member health-provider disconnect so the existing full-member
-- Privacy Center control works without broad client UPDATE grants.
BEGIN;

CREATE OR REPLACE FUNCTION public.disconnect_my_health_provider(
  p_provider_key text,
  p_revoke_all_metric_consents boolean DEFAULT true
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_contact_id uuid;
BEGIN
  IF v_user_id IS NULL OR NOT private.full_member_access() THEN
    RAISE EXCEPTION 'Full member access is required';
  END IF;

  SELECT ca.contact_id INTO v_contact_id
  FROM public.client_access ca
  WHERE ca.user_id=v_user_id
    AND ca.status='active'
  ORDER BY ca.updated_at DESC
  LIMIT 1;

  IF v_contact_id IS NULL THEN
    RAISE EXCEPTION 'Full member access is required';
  END IF;

  UPDATE public.health_integration_connections
  SET status='disconnected',
      last_error=NULL,
      credential_reference=NULL,
      granted_scopes='[]'::jsonb,
      updated_at=now()
  WHERE contact_id=v_contact_id
    AND user_id=v_user_id
    AND provider_key=p_provider_key;

  IF p_revoke_all_metric_consents THEN
    UPDATE public.health_metric_consents
    SET allowed=false,
        revoked_at=now(),
        updated_at=now()
    WHERE user_id=v_user_id
      AND contact_id=v_contact_id
      AND provider_key=p_provider_key
      AND allowed=true;
  END IF;

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.disconnect_my_health_provider(text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.disconnect_my_health_provider(text,boolean) TO authenticated,service_role;

COMMIT;
