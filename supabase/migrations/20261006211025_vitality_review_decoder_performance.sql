-- Preserve the existing review authorization and returned data. Decode runs,
-- rather than repeatedly slicing Unicode text and concatenating one byte.
create or replace function private.vitality_url_decode_component(p_value text)
returns text
language plpgsql
immutable
strict
set search_path = ''
as $$
declare
  decoded_hex text;
begin
  select coalesce(pg_catalog.string_agg(
    case when part.piece[1] ~ '^%[0-9A-Fa-f]{2}$'
      then pg_catalog.substr(part.piece[1], 2)
      else pg_catalog.encode(pg_catalog.convert_to(part.piece[1], 'UTF8'), 'hex')
    end, '' order by part.position), '')
  into decoded_hex
  from pg_catalog.regexp_matches(pg_catalog.replace(p_value, '+', ' '),
    '%[0-9A-Fa-f]{2}|[^%]+|%', 'g') with ordinality as part(piece, position);

  return pg_catalog.convert_from(pg_catalog.decode(decoded_hex, 'hex'), 'UTF8');
exception when character_not_in_repertoire then
  return null;
end;
$$;

-- CREATE OR REPLACE preserves the existing ACL. Keep the decoder private.
revoke all on function private.vitality_url_decode_component(text)
  from public, anon, authenticated, service_role;
