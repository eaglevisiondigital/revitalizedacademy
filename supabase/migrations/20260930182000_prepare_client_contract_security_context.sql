-- Allow the public contract-preparation RPC to invoke private validation/rendering
-- helpers without exposing those helpers directly to authenticated users.
-- Authorization remains enforced inside prepare_client_contract via finance.manage.

alter function public.prepare_client_contract(uuid, uuid, jsonb, boolean)
  security definer;

alter function public.prepare_client_contract(uuid, uuid, jsonb, boolean)
  set search_path = pg_catalog, public, private, extensions;

revoke all on function private.validate_agreement_merge_values(jsonb, jsonb) from public, anon, authenticated;
revoke all on function private.render_agreement_content(text, jsonb) from public, anon, authenticated;
