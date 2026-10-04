-- Nutrition Engine permission and target-policy repair.
-- Defines plan.override without granting it to any role, and prevents that
-- management permission from becoming an alternate SELECT path.

insert into public.staff_permission_catalog
  (permission_key,label,category,description,sensitive,sort_order,active)
values
  (
    'plan.override',
    'Override Client Plans & Targets',
    'Health',
    'Modify client-specific nutrition, fitness and wellness plan targets within assigned contact scope.',
    true,
    65,
    true
  )
on conflict (permission_key) do update
set label=excluded.label,
    category=excluded.category,
    description=excluded.description,
    sensitive=excluded.sensitive,
    sort_order=excluded.sort_order,
    active=excluded.active;

drop policy if exists client_nutrient_targets_staff_manage on public.client_nutrient_targets;

drop policy if exists client_nutrient_targets_staff_insert on public.client_nutrient_targets;
create policy client_nutrient_targets_staff_insert
on public.client_nutrient_targets
for insert to authenticated
with check (
  private.staff_has_permission((select auth.uid()), 'plan.override')
  and private.staff_can_access_contact((select auth.uid()), contact_id)
);

drop policy if exists client_nutrient_targets_staff_update on public.client_nutrient_targets;
create policy client_nutrient_targets_staff_update
on public.client_nutrient_targets
for update to authenticated
using (
  private.staff_has_permission((select auth.uid()), 'plan.override')
  and private.staff_can_access_contact((select auth.uid()), contact_id)
)
with check (
  private.staff_has_permission((select auth.uid()), 'plan.override')
  and private.staff_can_access_contact((select auth.uid()), contact_id)
);

drop policy if exists client_nutrient_targets_staff_delete on public.client_nutrient_targets;
create policy client_nutrient_targets_staff_delete
on public.client_nutrient_targets
for delete to authenticated
using (
  private.staff_has_permission((select auth.uid()), 'plan.override')
  and private.staff_can_access_contact((select auth.uid()), contact_id)
);
