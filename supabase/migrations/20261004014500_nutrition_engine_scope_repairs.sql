-- Tighten Nutrition Engine access to the same contact-scoped privacy model used by Health & Progress.

drop policy if exists client_nutrient_targets_read on public.client_nutrient_targets;
create policy client_nutrient_targets_read
on public.client_nutrient_targets
for select to authenticated
using (
  exists (
    select 1
    from public.client_access ca
    where ca.user_id=(select auth.uid())
      and ca.contact_id=client_nutrient_targets.contact_id
      and ca.status='active'
  )
  or (
    private.staff_has_permission((select auth.uid()), 'health.private.view')
    and private.staff_can_access_contact((select auth.uid()), contact_id)
  )
);

drop policy if exists client_nutrient_targets_staff_manage on public.client_nutrient_targets;
create policy client_nutrient_targets_staff_manage
on public.client_nutrient_targets
for all to authenticated
using (
  private.staff_has_permission((select auth.uid()), 'plan.override')
  and private.staff_can_access_contact((select auth.uid()), contact_id)
)
with check (
  private.staff_has_permission((select auth.uid()), 'plan.override')
  and private.staff_can_access_contact((select auth.uid()), contact_id)
);

drop policy if exists nutrition_diary_items_read on public.nutrition_diary_items;
create policy nutrition_diary_items_read
on public.nutrition_diary_items
for select to authenticated
using (
  exists (
    select 1
    from public.client_access ca
    where ca.user_id=(select auth.uid())
      and ca.contact_id=nutrition_diary_items.contact_id
      and ca.status='active'
  )
  or (
    private.staff_has_permission((select auth.uid()), 'health.private.view')
    and private.staff_can_access_contact((select auth.uid()), contact_id)
  )
);

drop policy if exists nutrition_diary_items_insert on public.nutrition_diary_items;
create policy nutrition_diary_items_insert
on public.nutrition_diary_items
for insert to authenticated
with check (
  (
    exists (
      select 1
      from public.client_access ca
      where ca.user_id=(select auth.uid())
        and ca.contact_id=nutrition_diary_items.contact_id
        and ca.status='active'
    )
    and created_by=(select auth.uid())
  )
  or (
    private.staff_has_permission((select auth.uid()), 'health.progress.manage')
    and private.staff_can_access_contact((select auth.uid()), contact_id)
  )
);

drop policy if exists nutrition_diary_items_update on public.nutrition_diary_items;
create policy nutrition_diary_items_update
on public.nutrition_diary_items
for update to authenticated
using (
  exists (
    select 1
    from public.client_access ca
    where ca.user_id=(select auth.uid())
      and ca.contact_id=nutrition_diary_items.contact_id
      and ca.status='active'
  )
  or (
    private.staff_has_permission((select auth.uid()), 'health.progress.manage')
    and private.staff_can_access_contact((select auth.uid()), contact_id)
  )
)
with check (
  exists (
    select 1
    from public.client_access ca
    where ca.user_id=(select auth.uid())
      and ca.contact_id=nutrition_diary_items.contact_id
      and ca.status='active'
  )
  or (
    private.staff_has_permission((select auth.uid()), 'health.progress.manage')
    and private.staff_can_access_contact((select auth.uid()), contact_id)
  )
);
