BEGIN;

CREATE OR REPLACE FUNCTION public.complete_my_staff_invitation()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO pg_catalog, public
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_count integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501';
  END IF;

  UPDATE public.staff_invitations i
  SET status='accepted',
      accepted_at=coalesce(i.accepted_at,now()),
      expires_at=null,
      updated_at=now()
  WHERE i.auth_user_id=v_user_id
    AND i.status IN ('pending','invited');

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$function$;

REVOKE ALL ON FUNCTION public.complete_my_staff_invitation() FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.complete_my_staff_invitation() TO authenticated;

UPDATE public.staff_invitations i
SET status='accepted',
    accepted_at=coalesce(i.accepted_at,now()),
    expires_at=null,
    updated_at=now()
WHERE i.status IN ('pending','invited')
  AND EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN public.staff_access s ON s.user_id=u.id AND s.status='active'
    WHERE u.id=i.auth_user_id
      AND lower(u.email)=lower(i.email)
      AND coalesce((u.raw_user_meta_data->>'staff_invite_completed')::boolean,false)
  );

COMMIT;
