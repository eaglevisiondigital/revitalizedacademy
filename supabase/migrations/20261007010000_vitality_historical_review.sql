-- Historical review does not create resume drafts or credentials, change status,
-- or overwrite original contact/workflow/report records. Import is operator-only.
create table private.vitality_historical_reviews (
 workflow_id uuid primary key references public.workflow_records(id),
 contact_id uuid not null references public.contacts(id),
 source_key text not null unique,
 source_received_at timestamptz not null,
 source_submitted_at timestamptz,
 pathway text,
 assessment_for text,
 assessment_summary text not null,
 coach_review_flags text,
 source_digest text not null check(source_digest ~ '^[a-f0-9]{64}$'),
 reconciled_at timestamptz not null default now()
);
alter table private.vitality_historical_reviews enable row level security;
revoke all on private.vitality_historical_reviews from public,anon,authenticated,service_role;

create or replace function private.list_secure_vitality_reviews(p_filter text default 'all')
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


revoke all on function private.list_secure_vitality_reviews(text) from public,anon,authenticated,service_role;
revoke all on function private.get_secure_vitality_review(uuid) from public,anon,authenticated,service_role;

create function private.get_historical_vitality_review(p_contact_id uuid,p_detail boolean default false)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
 w public.workflow_records%rowtype; c public.contacts%rowtype;
 h private.vitality_historical_reviews%rowtype; r public.vitality_reports%rowtype;
 tags jsonb; flags text; base jsonb; assigned text;
begin
 if auth.uid() is null or not private.staff_has_permission(auth.uid(),'health.private.view')
   or not private.staff_can_access_contact(auth.uid(),p_contact_id) then
   raise exception 'Vitality review unavailable' using errcode='42501';
 end if;
 select * into w from public.workflow_records where contact_id=p_contact_id and workflow_type='vitality_assessment'
 order by coalesce(completed_at,last_activity_at,created_at) desc,created_at desc,id desc limit 1;
 if w.id is null then raise exception 'Vitality review unavailable' using errcode='42501'; end if;
 select * into c from public.contacts where id=p_contact_id;
 select * into h from private.vitality_historical_reviews where workflow_id=w.id;
 select * into r from public.vitality_reports where workflow_id=w.id order by created_at desc,id desc limit 1;
 select display_name into assigned from public.staff_access where user_id=c.assigned_to;
 select coalesce(jsonb_agg(tag order by tag),'[]'::jsonb) into tags from public.contact_tags
 where contact_id=p_contact_id and source='automatic' and rule_key='assessment-derived';
 flags:=h.coach_review_flags;
 base:=jsonb_strip_nulls(jsonb_build_object(
 'contact_id',c.id,'participant_name',nullif(trim(concat_ws(' ',c.first_name,c.last_name)),''),'email',c.email,
 'status',case when w.status='completed' then 'completed' else 'in_progress' end,
 'current_section',w.current_step,'completion_percent',w.completion_percent,
 'started_at',coalesce(w.started_at,w.created_at),'completed_at',w.completed_at,
 'last_saved_at',coalesce(w.last_activity_at,w.updated_at),'pathway',h.pathway,'assessment_for',h.assessment_for,
 'referral_source',c.referral_source,'referral_source_other',c.referral_source_other,'sales_rep_name',c.sales_rep_name,
 'assigned_staff',assigned,'historical_record',true,
 'needs_review',w.status='completed' and (jsonb_array_length(tags)>0 or coalesce(nullif(trim(flags),''),'None reported')<>'None reported')
 ));
 if not p_detail or w.status<>'completed' then return base; end if;
 return base || jsonb_build_object('coach_summary',coalesce(nullif(r.coach_summary,''),h.assessment_summary,''),
 'historical_summary_available',h.workflow_id is not null,
 'coach_review_flags',case when coalesce(nullif(trim(flags),''),'None reported')='None reported' then '[]'::jsonb else to_jsonb(string_to_array(flags,' | ')) end,
 'derived_tags',tags,'answers','{}'::jsonb);
end $$;
revoke all on function private.get_historical_vitality_review(uuid,boolean) from public,anon,authenticated,service_role;

create or replace function public.list_vitality_assessment_reviews(p_filter text default 'all')
returns setof jsonb language plpgsql stable security definer set search_path='' as $$
declare f text:=lower(coalesce(nullif(trim(p_filter),''),'all'));
begin
 if auth.uid() is null or not private.staff_has_permission(auth.uid(),'health.private.view') then
 raise exception 'Vitality review unavailable' using errcode='42501'; end if;
 if f not in ('all','completed','in_progress','needs_review') then raise exception 'Invalid assessment filter' using errcode='22023'; end if;
 return query
 with old_contacts as (select distinct contact_id from public.workflow_records w where workflow_type='vitality_assessment'
 and not exists(select 1 from private.vitality_assessment_drafts d where d.contact_id=w.contact_id)
 and private.staff_can_access_contact(auth.uid(),w.contact_id)),
 reviews(review) as (
 select * from private.list_secure_vitality_reviews(f)
 union all
 select private.get_historical_vitality_review(contact_id,false) from old_contacts
 )
 select review from reviews where f='all' or review->>'status'=f or (f='needs_review' and (review->>'needs_review')::boolean)
 order by coalesce(review->>'completed_at',review->>'last_saved_at',review->>'started_at') desc;
end $$;

create or replace function public.get_vitality_assessment_review(p_contact_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if exists(select 1 from private.vitality_assessment_drafts where contact_id=p_contact_id) then
 return private.get_secure_vitality_review(p_contact_id); end if;
 return private.get_historical_vitality_review(p_contact_id,true);
end $$;

-- Idempotent one-time import into existing completed workflows only. No runtime Netlify access.
create function private.reconcile_vitality_history(p_workflow_id uuid,p_contact_id uuid,p_email text,
 p_received_at timestamptz,p_submitted_at timestamptz,p_summary text,p_flags text,p_pathway text,p_assessment_for text)
returns text language plpgsql set search_path='' as $$
declare w public.workflow_records%rowtype; source_key text; digest text; old private.vitality_historical_reviews%rowtype;
begin
 select * into w from public.workflow_records where id=p_workflow_id for update;
 if w.id is null or w.contact_id<>p_contact_id or w.workflow_type<>'vitality_assessment' or w.status<>'completed'
 or w.completed_at is null or abs(extract(epoch from (w.completed_at-p_received_at)))>300
 or not exists(select 1 from public.contacts where id=p_contact_id and lower(trim(email))=lower(trim(p_email)))
 or exists(select 1 from private.vitality_assessment_drafts where workflow_id=w.id)
 or not coalesce(length(p_summary) between 1 and 500000,false) then
 raise exception 'Historical source does not match existing completed assessment' using errcode='22023'; end if;
 source_key:='netlify:6a9b44095ad81b0008809a89:'||p_received_at::text||':'||lower(trim(p_email));
 digest:=encode(extensions.digest(convert_to(p_summary,'UTF8'),'sha256'),'hex');
 select * into old from private.vitality_historical_reviews where workflow_id=w.id;
 if old.workflow_id is not null then
 if old.source_key=source_key and old.source_digest=digest and old.coach_review_flags is not distinct from p_flags
 and old.source_submitted_at is not distinct from p_submitted_at and old.pathway is not distinct from p_pathway
 and old.assessment_for is not distinct from p_assessment_for then return 'already_reconciled'; end if;
 raise exception 'Conflicting historical source; operator review required' using errcode='23505'; end if;
 insert into private.vitality_historical_reviews(workflow_id,contact_id,source_key,source_received_at,source_submitted_at,
 assessment_summary,coach_review_flags,pathway,assessment_for,source_digest)
 values(w.id,p_contact_id,source_key,p_received_at,p_submitted_at,p_summary,p_flags,p_pathway,p_assessment_for,digest);
 return 'reconciled';
end $$;
revoke all on function private.reconcile_vitality_history(uuid,uuid,text,timestamptz,timestamptz,text,text,text,text) from public,anon,authenticated,service_role;
