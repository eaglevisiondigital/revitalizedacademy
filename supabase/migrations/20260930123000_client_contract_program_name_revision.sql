-- ReVitalized Academy client contract revision.
-- Preserve MK7 for historical agreements, publish MK8 for new assignments.
-- Customer-facing contracts use the actual enrolled program name instead of
-- generic Level 1 / Level 2 / Level 3 language.

with source as (
  select *
  from public.agreement_templates
  where agreement_key='revitalized-academy-client-contract'
    and version='MK7'
  limit 1
),
revised as (
  select
    extensions.gen_random_uuid() as id,
    agreement_key,
    name,
    'MK8'::text as version,
    description,
    replace(
      content_text,
      'The Client(s) will enroll in the Program as a {{program_level}} client as described in Appendix A.',
      'The Client(s) will enroll in the {{program_name}} program as described in Appendix A.'
    ) as content_text,
    status,
    requires_signature,
    audience,
    document_type,
    jsonb_build_object(
      'optional', coalesce(merge_schema->'optional','[]'::jsonb),
      'required',
      (
        select jsonb_agg(
          case when value='program_level' then 'program_name' else value end
          order by ord
        )
        from jsonb_array_elements_text(coalesce(merge_schema->'required','[]'::jsonb)) with ordinality as r(value,ord)
      )
    ) as merge_schema
  from source
),
inserted as (
  insert into public.agreement_templates(
    id,agreement_key,name,version,description,content_text,content_hash,status,
    requires_signature,created_by,published_by,published_at,created_at,updated_at,
    audience,document_type,merge_schema,source_filename
  )
  select
    id,agreement_key,name,version,description,content_text,
    encode(extensions.digest(convert_to(content_text,'UTF8'),'sha256'),'hex'),
    'published',requires_signature,null,null,now(),now(),now(),
    audience,document_type,merge_schema,null
  from revised
  on conflict (agreement_key,version) do nothing
  returning id
),
target as (
  select id from inserted
  union all
  select id
  from public.agreement_templates
  where agreement_key='revitalized-academy-client-contract'
    and version='MK8'
  limit 1
)
update public.program_agreement_requirements par
set agreement_template_id=(select id from target),
    active=true
where par.program_code='holistic-foundations'
  and par.active=true;

update public.agreement_templates
set status='retired',updated_at=now()
where agreement_key='revitalized-academy-client-contract'
  and version='MK7'
  and status='published';
