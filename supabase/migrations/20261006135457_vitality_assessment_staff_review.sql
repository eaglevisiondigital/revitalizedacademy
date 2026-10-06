-- Production-only staff review contract for completed Vitality Assessments.
-- Unfinished assessments expose status metadata only; private answers remain hidden.

create or replace function private.vitality_url_decode_component(p_value text)
returns text
language plpgsql
immutable
strict
set search_path = ''
as $$
declare
  source text := replace(p_value, '+', ' ');
  output bytea := ''::bytea;
  cursor integer := 1;
  pair text;
begin
  while cursor <= length(source) loop
    if substr(source, cursor, 1) = '%' and cursor + 2 <= length(source) then
      pair := substr(source, cursor + 1, 2);
      if pair ~ '^[0-9A-Fa-f]{2}$' then
        output := output || decode(pair, 'hex');
        cursor := cursor + 3;
        continue;
      end if;
    end if;
    output := output || convert_to(substr(source, cursor, 1), 'UTF8');
    cursor := cursor + 1;
  end loop;
  return convert_from(output, 'UTF8');
exception when character_not_in_repertoire then
  return null;
end;
$$;

create or replace function private.vitality_form_value(p_form text, p_name text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  part text;
  separator integer;
  key_text text;
begin
  if p_form is null or p_name is null then return null; end if;
  foreach part in array string_to_array(p_form, '&') loop
    separator := strpos(part, '=');
    if separator = 0 then
      key_text := private.vitality_url_decode_component(part);
      if key_text = p_name then return ''; end if;
    else
      key_text := private.vitality_url_decode_component(substr(part, 1, separator - 1));
      if key_text = p_name then
        return private.vitality_url_decode_component(substr(part, separator + 1));
      end if;
    end if;
  end loop;
  return null;
end;
$$;

create or replace function private.vitality_snapshot_values(p_snapshot jsonb, p_name text)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select coalesce(jsonb_agg(item.value->'value' order by item.ordinality), '[]'::jsonb)
  from jsonb_array_elements(coalesce(p_snapshot->'fields'->p_name, '[]'::jsonb)) with ordinality as item(value, ordinality)
  where coalesce(item.value->>'value', '') <> ''
    and (
      item.value->>'type' not in ('checkbox', 'radio')
      or coalesce((item.value->>'checked')::boolean, false)
    )
$$;

create or replace function private.vitality_snapshot_first_text(p_snapshot jsonb, p_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select private.vitality_snapshot_values(p_snapshot, p_name)->>0
$$;

revoke all on function private.vitality_url_decode_component(text) from public, anon, authenticated, service_role;
revoke all on function private.vitality_form_value(text, text) from public, anon, authenticated, service_role;
revoke all on function private.vitality_snapshot_values(jsonb, text) from public, anon, authenticated, service_role;
revoke all on function private.vitality_snapshot_first_text(jsonb, text) from public, anon, authenticated, service_role;

create or replace function public.list_vitality_assessment_reviews(p_filter text default 'all')
returns setof jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  staff_user_id uuid := auth.uid();
  normalized_filter text := lower(coalesce(nullif(trim(p_filter), ''), 'all'));
begin
  if staff_user_id is null
    or not private.staff_has_permission(staff_user_id, 'health.private.view') then
    raise exception 'Vitality review unavailable' using errcode = '42501';
  end if;
  if normalized_filter not in ('all', 'in_progress', 'completed', 'needs_review') then
    raise exception 'Invalid assessment filter' using errcode = '22023';
  end if;

  return query
  with latest as (
    select d.*,
      row_number() over (
        partition by d.contact_id
        order by coalesce(d.completed_at, d.updated_at, d.created_at) desc, d.created_at desc, d.id desc
      ) as contact_rank
    from private.vitality_assessment_drafts d
  ), scoped as (
    select d.*, c.first_name, c.last_name, c.email, c.referral_source,
      c.referral_source_other, c.sales_rep_name, c.assigned_to,
      w.status as workflow_status, w.current_step, w.completion_percent,
      w.started_at, w.completed_at as workflow_completed_at, w.last_activity_at,
      sa.display_name as assigned_staff_name,
      private.vitality_form_value(d.final_form, 'coach_review_flags') as coach_review_flags,
      exists (
        select 1 from public.contact_tags tag
        where tag.contact_id = d.contact_id
          and tag.source = 'automatic'
          and tag.rule_key = 'assessment-derived'
      ) as has_assessment_tags
    from latest d
    join public.contacts c on c.id = d.contact_id
    join public.workflow_records w on w.id = d.workflow_id
    left join public.staff_access sa on sa.user_id = c.assigned_to
    where d.contact_rank = 1
      and private.staff_can_access_contact(staff_user_id, d.contact_id)
  ), prepared as (
    select scoped.*,
      (
        scoped.status = 'completed'
        and (
          scoped.has_assessment_tags
          or coalesce(nullif(trim(scoped.coach_review_flags), ''), 'None reported') <> 'None reported'
          or private.vitality_snapshot_first_text(scoped.snapshot, 'urgent_safety_flag') = 'Yes'
          or private.vitality_snapshot_first_text(scoped.snapshot, 'self_harm_safety_flag') = 'Yes'
        )
      ) as needs_review
    from scoped
  )
  select jsonb_strip_nulls(jsonb_build_object(
    'contact_id', p.contact_id,
    'participant_name', nullif(trim(concat_ws(' ', p.first_name, p.last_name)), ''),
    'email', p.email,
    'status', case when p.status = 'completed' then 'completed' else 'in_progress' end,
    'email_verified', p.verified_at is not null,
    'current_section', coalesce(nullif(p.snapshot->>'section_label', ''), p.current_step),
    'completion_percent', case when p.status = 'completed' then 100 else coalesce(p.completion_percent, (p.snapshot->>'percent')::integer, 0) end,
    'started_at', coalesce(p.started_at, p.created_at),
    'completed_at', coalesce(p.completed_at, p.workflow_completed_at),
    'last_saved_at', p.updated_at,
    'pathway', coalesce(nullif(p.snapshot->>'pathway', ''), 'Adult'),
    'assessment_for', private.vitality_snapshot_first_text(p.snapshot, 'assessment_for'),
    'referral_source', p.referral_source,
    'referral_source_other', p.referral_source_other,
    'sales_rep_name', p.sales_rep_name,
    'assigned_staff', p.assigned_staff_name,
    'needs_review', p.needs_review
  ))
  from prepared p
  where normalized_filter = 'all'
     or (normalized_filter = 'completed' and p.status = 'completed')
     or (normalized_filter = 'in_progress' and p.status <> 'completed')
     or (normalized_filter = 'needs_review' and p.needs_review)
  order by coalesce(p.completed_at, p.updated_at, p.created_at) desc;
end;
$$;

create or replace function public.get_vitality_assessment_review(p_contact_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  staff_user_id uuid := auth.uid();
  draft private.vitality_assessment_drafts%rowtype;
  contact_row public.contacts%rowtype;
  workflow_row public.workflow_records%rowtype;
  assigned_staff_name text;
  coach_summary text;
  coach_flags text;
  tags jsonb;
  base jsonb;
begin
  if staff_user_id is null
    or not private.staff_has_permission(staff_user_id, 'health.private.view')
    or not private.staff_can_access_contact(staff_user_id, p_contact_id) then
    raise exception 'Vitality review unavailable' using errcode = '42501';
  end if;

  select d.* into draft
  from private.vitality_assessment_drafts d
  where d.contact_id = p_contact_id
  order by coalesce(d.completed_at, d.updated_at, d.created_at) desc, d.created_at desc, d.id desc
  limit 1;

  if draft.id is null then
    raise exception 'Vitality review unavailable' using errcode = '42501';
  end if;

  select * into contact_row from public.contacts where id = draft.contact_id;
  select * into workflow_row from public.workflow_records where id = draft.workflow_id;
  select sa.display_name into assigned_staff_name from public.staff_access sa where sa.user_id = contact_row.assigned_to;

  base := jsonb_strip_nulls(jsonb_build_object(
    'contact_id', contact_row.id,
    'participant_name', nullif(trim(concat_ws(' ', contact_row.first_name, contact_row.last_name)), ''),
    'email', contact_row.email,
    'status', case when draft.status = 'completed' then 'completed' else 'in_progress' end,
    'email_verified', draft.verified_at is not null,
    'current_section', coalesce(nullif(draft.snapshot->>'section_label', ''), workflow_row.current_step),
    'completion_percent', case when draft.status = 'completed' then 100 else coalesce(workflow_row.completion_percent, (draft.snapshot->>'percent')::integer, 0) end,
    'started_at', coalesce(workflow_row.started_at, draft.created_at),
    'completed_at', coalesce(draft.completed_at, workflow_row.completed_at),
    'last_saved_at', draft.updated_at,
    'pathway', coalesce(nullif(draft.snapshot->>'pathway', ''), 'Adult'),
    'assessment_for', private.vitality_snapshot_first_text(draft.snapshot, 'assessment_for'),
    'assessed_first_name', private.vitality_snapshot_first_text(draft.snapshot, 'assessed_first_name'),
    'assessed_last_name', private.vitality_snapshot_first_text(draft.snapshot, 'assessed_last_name'),
    'assessed_age', private.vitality_snapshot_first_text(draft.snapshot, 'assessed_age'),
    'assessed_relationship', private.vitality_snapshot_first_text(draft.snapshot, 'assessed_relationship'),
    'referral_source', contact_row.referral_source,
    'referral_source_other', contact_row.referral_source_other,
    'sales_rep_name', contact_row.sales_rep_name,
    'assigned_staff', assigned_staff_name
  ));

  -- Unfinished drafts intentionally stop here: no answer payload or summary leaves private storage.
  if draft.status <> 'completed' then
    return base;
  end if;

  coach_summary := private.vitality_form_value(draft.final_form, 'assessment_summary');
  coach_flags := private.vitality_form_value(draft.final_form, 'coach_review_flags');
  select coalesce(jsonb_agg(tag.tag order by tag.tag), '[]'::jsonb) into tags
  from public.contact_tags tag
  where tag.contact_id = draft.contact_id
    and tag.source = 'automatic'
    and tag.rule_key = 'assessment-derived';

  return base || jsonb_build_object(
    'coach_summary', coalesce(coach_summary, ''),
    'coach_review_flags', case
      when coach_flags is null or trim(coach_flags) = '' or trim(coach_flags) = 'None reported' then '[]'::jsonb
      else to_jsonb(string_to_array(coach_flags, ' | '))
    end,
    'derived_tags', tags,
    'answers', coalesce(draft.snapshot->'fields', '{}'::jsonb)
  );
end;
$$;

revoke all on function public.list_vitality_assessment_reviews(text) from public, anon;
revoke all on function public.get_vitality_assessment_review(uuid) from public, anon;
grant execute on function public.list_vitality_assessment_reviews(text) to authenticated;
grant execute on function public.get_vitality_assessment_review(uuid) to authenticated;

comment on function public.list_vitality_assessment_reviews(text) is
  'Private-health staff list. Contact scope is enforced per row; unfinished assessments expose status only.';
comment on function public.get_vitality_assessment_review(uuid) is
  'Private-health staff review. Completed answers only; unfinished drafts expose status only and credentials never leave private storage.';
