-- STAGING-ONLY FOUNDATION; do not promote to production without security and identity acceptance.
-- Roadmap scores and founder approval APIs remain disabled until finalized founder rules.
create table if not exists private.vitality_roadmap_versions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.vitality_reports(id) on delete restrict,
  contact_id uuid not null references public.contacts(id) on delete restrict,
  source_workflow_id uuid references public.workflow_records(id) on delete restrict,
  version integer not null check (version > 0),
  state text not null default 'draft' check (state in ('draft','needs_clarification','under_review','approved','released')),
  questionnaire_version text,
  scoring_version text,
  knowledge_version text,
  source_fingerprint text,
  approved_snapshot jsonb not null default '{}'::jsonb,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  unique (report_id, version),
  constraint founder_approval_gate check (
    (state not in ('approved','released'))
    or (approved_by is not null and approved_at is not null and scoring_version is not null)
  ),
  constraint no_release_without_approval check (
    state <> 'released' or released_at is not null
  )
);
create index if not exists vitality_roadmap_versions_lookup
  on private.vitality_roadmap_versions(contact_id, state, released_at desc);
alter table private.vitality_roadmap_versions enable row level security;
revoke all on private.vitality_roadmap_versions from public, anon, authenticated;

create table if not exists private.vitality_roadmap_review_audit (
  id uuid primary key default gen_random_uuid(),
  roadmap_version_id uuid not null references private.vitality_roadmap_versions(id) on delete restrict,
  actor_id uuid not null references auth.users(id),
  action text not null,
  reason text,
  change_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table private.vitality_roadmap_review_audit enable row level security;
revoke all on private.vitality_roadmap_review_audit from public, anon, authenticated;

-- Free Roadmap recipients are NOT required to have a paid client_memberships row.
-- Writes/claims will be implemented only through verified, audited server-side flows.
create table if not exists public.vitality_roadmap_access (
  contact_id uuid primary key references public.contacts(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  verified_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists vitality_roadmap_access_user on public.vitality_roadmap_access(user_id);
alter table public.vitality_roadmap_access enable row level security;
revoke all on public.vitality_roadmap_access from public, anon, authenticated;

-- Read-only, zero-data endpoint: only the signed-in, VERIFIED person may see
-- a released AND approved immutable snapshot linked to their own contact ID.
-- No paid membership join, and never returns reviewer drafts.
create or replace function public.get_my_released_vitality_roadmaps()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $fn$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'report_id', selected.report_id,
      'version', selected.version,
      'approved_at', selected.approved_at,
      'released_at', selected.released_at,
      'report', selected.approved_snapshot
    ) order by selected.released_at desc
  ), '[]'::jsonb)
  from (
    select distinct on (v.report_id)
      v.report_id, v.version, v.approved_at, v.released_at, v.approved_snapshot
    from private.vitality_roadmap_versions v
    join public.vitality_reports r on r.id=v.report_id and r.contact_id=v.contact_id
    join public.vitality_roadmap_access a on a.contact_id=v.contact_id
    where auth.uid() is not null
      and a.user_id=auth.uid()
      and a.verified_at is not null
      and a.revoked_at is null
      and v.state='released'
      and v.approved_by is not null
      and v.approved_at is not null
      and v.released_at is not null
      and v.scoring_version is not null
    order by v.report_id,v.version desc
  ) selected;
$fn$;
revoke execute on function public.get_my_released_vitality_roadmaps() from public,anon,authenticated;
grant execute on function public.get_my_released_vitality_roadmaps() to authenticated;

-- Intentional launch posture:
-- - No generated drafts, approvals or customer grants are backfilled.
-- - No staff write functions exist yet.
-- - Existing 15 report placeholders remain untouched.
-- - Production rollout requires role/RLS, synthetic client, and PDF/email tests.
