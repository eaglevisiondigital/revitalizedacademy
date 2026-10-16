-- STAGING ONLY: optional referral fields read safely from the inspected older contact schema.
begin;
create or replace function private.get_secure_vitality_review(p_contact_id uuid)
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
    'referral_source', to_jsonb(contact_row)->>'referral_source',
    'referral_source_other', to_jsonb(contact_row)->>'referral_source_other',
    'sales_rep_name', to_jsonb(contact_row)->>'sales_rep_name',
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


revoke all on function private.get_secure_vitality_review(uuid) from public,anon,authenticated,service_role;
commit;
