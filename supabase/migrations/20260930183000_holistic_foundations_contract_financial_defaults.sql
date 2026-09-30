-- Holistic Foundations is a recurring membership with no upfront Good Faith deposit.
-- Keep this as program configuration so the contract workflow does not invent financial terms.

update public.program_catalog
set metadata = coalesce(metadata,'{}'::jsonb)
  || jsonb_build_object('good_faith_deposit_cents',0)
where program_code='holistic-foundations';
