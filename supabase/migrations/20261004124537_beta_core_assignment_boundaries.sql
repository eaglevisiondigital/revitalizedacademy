-- Beta Readiness Core: retain existing content/assignment tables and permissions.
-- Forward-only candidate. No role grants, entitlement changes or hosted data seeding.
CREATE FUNCTION private.beta_member_assignment_access(p_contact uuid,p_kind text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public,private AS $$
 SELECT private.full_member_access() AND EXISTS (
 SELECT 1 FROM public.client_access ca JOIN public.membership_entitlements e ON e.membership_id=ca.membership_id
 WHERE ca.user_id=auth.uid() AND ca.contact_id=p_contact AND ca.status='active'
 AND NOT ca.needs_onboarding_claim AND e.status='active'
 AND e.entitlement_key IN ('tracking',CASE p_kind WHEN 'meal' THEN 'nutrition_plans' WHEN 'workout' THEN 'fitness_plans' END));
$$;
CREATE FUNCTION private.beta_staff_assignment_access(p_contact uuid,p_write boolean DEFAULT false)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public,private AS $$
 SELECT private.staff_has_permission(auth.uid(),CASE WHEN p_write THEN 'health.progress.manage' ELSE 'health.private.view' END)
 AND private.staff_can_access_contact(auth.uid(),p_contact);
$$;
REVOKE ALL ON FUNCTION private.beta_member_assignment_access(uuid,text),private.beta_staff_assignment_access(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.beta_member_assignment_access(uuid,text),private.beta_staff_assignment_access(uuid,boolean) TO authenticated;

DO $$ DECLARE p record; BEGIN FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='client_meal_plans' AND permissive='PERMISSIVE' LOOP EXECUTE format('DROP POLICY %I ON public.client_meal_plans',p.policyname); END LOOP; END $$;
CREATE POLICY beta_read ON public.client_meal_plans FOR SELECT TO authenticated USING(private.beta_staff_assignment_access(contact_id) OR private.beta_member_assignment_access(contact_id,'meal'));
CREATE POLICY beta_insert ON public.client_meal_plans FOR INSERT TO authenticated WITH CHECK(private.beta_staff_assignment_access(contact_id,true));
CREATE POLICY beta_update ON public.client_meal_plans FOR UPDATE TO authenticated USING(private.beta_staff_assignment_access(contact_id,true)) WITH CHECK(private.beta_staff_assignment_access(contact_id,true));

DO $$ DECLARE p record; BEGIN FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='client_meal_plan_items' AND permissive='PERMISSIVE' LOOP EXECUTE format('DROP POLICY %I ON public.client_meal_plan_items',p.policyname); END LOOP; END $$;
CREATE POLICY beta_read ON public.client_meal_plan_items FOR SELECT TO authenticated USING(private.beta_staff_assignment_access(contact_id) OR private.beta_member_assignment_access(contact_id,'meal'));
CREATE POLICY beta_insert ON public.client_meal_plan_items FOR INSERT TO authenticated WITH CHECK(private.beta_staff_assignment_access(contact_id,true));
CREATE POLICY beta_update ON public.client_meal_plan_items FOR UPDATE TO authenticated USING(private.beta_staff_assignment_access(contact_id,true) OR private.beta_member_assignment_access(contact_id,'meal')) WITH CHECK(private.beta_staff_assignment_access(contact_id,true) OR private.beta_member_assignment_access(contact_id,'meal'));

DO $$ DECLARE p record; BEGIN FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='client_fitness_plans' AND permissive='PERMISSIVE' LOOP EXECUTE format('DROP POLICY %I ON public.client_fitness_plans',p.policyname); END LOOP; END $$;
CREATE POLICY beta_read ON public.client_fitness_plans FOR SELECT TO authenticated USING(private.beta_staff_assignment_access(contact_id) OR private.beta_member_assignment_access(contact_id,'workout'));
CREATE POLICY beta_insert ON public.client_fitness_plans FOR INSERT TO authenticated WITH CHECK(private.beta_staff_assignment_access(contact_id,true));
CREATE POLICY beta_update ON public.client_fitness_plans FOR UPDATE TO authenticated USING(private.beta_staff_assignment_access(contact_id,true)) WITH CHECK(private.beta_staff_assignment_access(contact_id,true));

DO $$ DECLARE p record; BEGIN FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='client_workout_assignments' AND permissive='PERMISSIVE' LOOP EXECUTE format('DROP POLICY %I ON public.client_workout_assignments',p.policyname); END LOOP; END $$;
CREATE POLICY beta_read ON public.client_workout_assignments FOR SELECT TO authenticated USING(private.beta_staff_assignment_access(contact_id) OR private.beta_member_assignment_access(contact_id,'workout'));
CREATE POLICY beta_insert ON public.client_workout_assignments FOR INSERT TO authenticated WITH CHECK(private.beta_staff_assignment_access(contact_id,true));
CREATE POLICY beta_update ON public.client_workout_assignments FOR UPDATE TO authenticated USING(private.beta_staff_assignment_access(contact_id,true) OR private.beta_member_assignment_access(contact_id,'workout')) WITH CHECK(private.beta_staff_assignment_access(contact_id,true) OR private.beta_member_assignment_access(contact_id,'workout'));

DO $$ DECLARE p record; BEGIN FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='workout_completions' AND permissive='PERMISSIVE' LOOP EXECUTE format('DROP POLICY %I ON public.workout_completions',p.policyname); END LOOP; END $$;
CREATE POLICY beta_read ON public.workout_completions FOR SELECT TO authenticated USING(private.beta_staff_assignment_access(contact_id) OR private.beta_member_assignment_access(contact_id,'workout'));
CREATE POLICY beta_insert ON public.workout_completions FOR INSERT TO authenticated WITH CHECK(private.beta_staff_assignment_access(contact_id,true) OR private.beta_member_assignment_access(contact_id,'workout'));
CREATE POLICY beta_update ON public.workout_completions FOR UPDATE TO authenticated USING(private.beta_staff_assignment_access(contact_id,true) OR private.beta_member_assignment_access(contact_id,'workout')) WITH CHECK(private.beta_staff_assignment_access(contact_id,true) OR private.beta_member_assignment_access(contact_id,'workout'));

DO $$ DECLARE p record; BEGIN FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='client_grocery_lists' AND permissive='PERMISSIVE' LOOP EXECUTE format('DROP POLICY %I ON public.client_grocery_lists',p.policyname); END LOOP; END $$;
CREATE POLICY beta_read ON public.client_grocery_lists FOR SELECT TO authenticated USING(private.beta_staff_assignment_access(contact_id) OR private.beta_member_assignment_access(contact_id,'meal'));
CREATE POLICY beta_insert ON public.client_grocery_lists FOR INSERT TO authenticated WITH CHECK(private.beta_staff_assignment_access(contact_id,true));
CREATE POLICY beta_update ON public.client_grocery_lists FOR UPDATE TO authenticated USING(private.beta_staff_assignment_access(contact_id,true)) WITH CHECK(private.beta_staff_assignment_access(contact_id,true));

DO $$ DECLARE p record; BEGIN FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='nutrition_logs' AND permissive='PERMISSIVE' LOOP EXECUTE format('DROP POLICY %I ON public.nutrition_logs',p.policyname); END LOOP; END $$;
CREATE POLICY beta_read ON public.nutrition_logs FOR SELECT TO authenticated USING(private.beta_staff_assignment_access(contact_id) OR private.beta_member_assignment_access(contact_id,'meal'));
CREATE POLICY beta_insert ON public.nutrition_logs FOR INSERT TO authenticated WITH CHECK(private.beta_staff_assignment_access(contact_id,true) OR private.beta_member_assignment_access(contact_id,'meal'));
CREATE POLICY beta_update ON public.nutrition_logs FOR UPDATE TO authenticated USING(private.beta_staff_assignment_access(contact_id,true) OR private.beta_member_assignment_access(contact_id,'meal')) WITH CHECK(private.beta_staff_assignment_access(contact_id,true) OR private.beta_member_assignment_access(contact_id,'meal'));

DO $$ DECLARE p record; BEGIN FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='client_exercise_restrictions' AND permissive='PERMISSIVE' LOOP EXECUTE format('DROP POLICY %I ON public.client_exercise_restrictions',p.policyname); END LOOP; END $$;
CREATE POLICY beta_read ON public.client_exercise_restrictions FOR SELECT TO authenticated USING(private.beta_staff_assignment_access(contact_id) OR private.beta_member_assignment_access(contact_id,'workout'));
CREATE POLICY beta_insert ON public.client_exercise_restrictions FOR INSERT TO authenticated WITH CHECK(private.beta_staff_assignment_access(contact_id,true));
CREATE POLICY beta_update ON public.client_exercise_restrictions FOR UPDATE TO authenticated USING(private.beta_staff_assignment_access(contact_id,true)) WITH CHECK(private.beta_staff_assignment_access(contact_id,true));

DO $$ DECLARE p record; BEGIN FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='meal_plan_template_items' AND permissive='PERMISSIVE' LOOP EXECUTE format('DROP POLICY %I ON public.meal_plan_template_items',p.policyname); END LOOP; END $$;
CREATE POLICY beta_content_read ON public.meal_plan_template_items FOR SELECT TO authenticated USING(private.staff_has_permission(auth.uid(),'learning.manage') OR EXISTS(SELECT 1 FROM public.meal_plan_templates p WHERE p.id=template_id AND p.status='published'));
CREATE POLICY beta_content_write ON public.meal_plan_template_items FOR ALL TO authenticated USING(private.staff_has_permission(auth.uid(),'learning.manage')) WITH CHECK(private.staff_has_permission(auth.uid(),'learning.manage'));

DO $$ DECLARE p record; BEGIN FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='workout_template_exercises' AND permissive='PERMISSIVE' LOOP EXECUTE format('DROP POLICY %I ON public.workout_template_exercises',p.policyname); END LOOP; END $$;
CREATE POLICY beta_content_read ON public.workout_template_exercises FOR SELECT TO authenticated USING(private.staff_has_permission(auth.uid(),'learning.manage') OR EXISTS(SELECT 1 FROM public.workout_templates p WHERE p.id=workout_id AND p.status='published'));
CREATE POLICY beta_content_write ON public.workout_template_exercises FOR ALL TO authenticated USING(private.staff_has_permission(auth.uid(),'learning.manage')) WITH CHECK(private.staff_has_permission(auth.uid(),'learning.manage'));

DO $$ DECLARE p record; BEGIN FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='fitness_program_workouts' AND permissive='PERMISSIVE' LOOP EXECUTE format('DROP POLICY %I ON public.fitness_program_workouts',p.policyname); END LOOP; END $$;
CREATE POLICY beta_content_read ON public.fitness_program_workouts FOR SELECT TO authenticated USING(private.staff_has_permission(auth.uid(),'learning.manage') OR EXISTS(SELECT 1 FROM public.fitness_programs p WHERE p.id=program_id AND p.status='published'));
CREATE POLICY beta_content_write ON public.fitness_program_workouts FOR ALL TO authenticated USING(private.staff_has_permission(auth.uid(),'learning.manage')) WITH CHECK(private.staff_has_permission(auth.uid(),'learning.manage'));

CREATE FUNCTION private.guard_beta_assignment() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,private AS $$
DECLARE v_contact uuid; v_allowed text[];
BEGIN
 IF TG_TABLE_NAME='client_meal_plan_items' THEN
  SELECT contact_id INTO v_contact FROM public.client_meal_plans WHERE id=NEW.meal_plan_id;
  v_allowed:=ARRAY['status','adherence_percent','completed_at'];
 ELSIF TG_TABLE_NAME='client_workout_assignments' THEN
  SELECT contact_id INTO v_contact FROM public.client_fitness_plans WHERE id=NEW.fitness_plan_id;
  v_allowed:=ARRAY['status','updated_at'];
 ELSE
  SELECT contact_id INTO v_contact FROM public.client_workout_assignments WHERE id=NEW.assignment_id;
  v_allowed:=ARRAY['duration_minutes','effort_rating','note','completed_at'];
 END IF;
 IF v_contact IS DISTINCT FROM NEW.contact_id THEN RAISE EXCEPTION 'Assignment contact mismatch' USING ERRCODE='42501'; END IF;
 IF TG_OP='UPDATE' AND auth.uid() IS NOT NULL AND NOT private.beta_staff_assignment_access(OLD.contact_id,true)
 AND (to_jsonb(OLD)-v_allowed) IS DISTINCT FROM (to_jsonb(NEW)-v_allowed) THEN
  RAISE EXCEPTION 'Protected assignment fields cannot be changed' USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.guard_beta_assignment() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER beta_assignment_guard BEFORE INSERT OR UPDATE ON public.client_meal_plan_items FOR EACH ROW EXECUTE FUNCTION private.guard_beta_assignment();
CREATE TRIGGER beta_assignment_guard BEFORE INSERT OR UPDATE ON public.client_workout_assignments FOR EACH ROW EXECUTE FUNCTION private.guard_beta_assignment();
CREATE TRIGGER beta_assignment_guard BEFORE INSERT OR UPDATE ON public.workout_completions FOR EACH ROW EXECUTE FUNCTION private.guard_beta_assignment();

CREATE OR REPLACE FUNCTION private.assign_meal_plan_template(p_contact_id uuid, p_template_id uuid, p_starts_on date, p_title text DEFAULT NULL::text, p_notes text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare
  v_membership_id uuid;
  v_plan_id uuid;
  v_title text;
begin
  IF NOT private.beta_staff_assignment_access(p_contact_id,true) THEN RAISE EXCEPTION 'Assignment permission or contact scope denied' USING ERRCODE='42501'; END IF;
  IF p_starts_on IS NULL THEN RAISE EXCEPTION 'Start date required'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_contact_id::text || 'meal',0));
  IF EXISTS(SELECT 1 FROM public.meal_plan_template_items i JOIN public.meal_plan_templates t ON t.id=i.template_id LEFT JOIN public.recipes r ON r.id=i.recipe_id WHERE t.id=p_template_id AND (i.day_number>t.days_count OR (i.recipe_id IS NOT NULL AND (r.status<>'published' OR r.methodology_id<>t.methodology_id)))) THEN RAISE EXCEPTION 'Meal plan contains unavailable content or an invalid day'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.meal_plan_template_items WHERE template_id=p_template_id) THEN RAISE EXCEPTION 'Add content before assigning this plan'; END IF;

  select ca.membership_id into v_membership_id
  from public.client_access ca
  where ca.contact_id=p_contact_id AND ca.status='active' AND NOT ca.needs_onboarding_claim
  limit 1;

  if v_membership_id is null then
    raise exception 'Active client membership not found';
  end if;

  select coalesce(p_title,t.title) into v_title
  from public.meal_plan_templates t
  where t.id=p_template_id and t.status='published';

  if v_title is null then
    raise exception 'Published meal plan template not found';
  end if;

  update public.client_meal_plans
  set status='completed',updated_at=now()
  where contact_id=p_contact_id and status='active';

  insert into public.client_meal_plans(
    contact_id,membership_id,template_id,assigned_by,title,starts_on,ends_on,status,notes
  )
  select
    p_contact_id,
    v_membership_id,
    t.id,
    (select auth.uid()),
    v_title,
    p_starts_on,
    p_starts_on + (t.days_count - 1),
    'active',
    p_notes
  from public.meal_plan_templates t
  where t.id=p_template_id
  returning id into v_plan_id;

  insert into public.client_meal_plan_items(
    meal_plan_id,contact_id,scheduled_date,meal_slot,recipe_id,custom_title,notes,status,sort_order
  )
  select
    v_plan_id,
    p_contact_id,
    p_starts_on + (i.day_number - 1),
    i.meal_slot,
    i.recipe_id,
    i.custom_title,
    i.notes,
    'planned',
    i.sort_order
  from public.meal_plan_template_items i
  where i.template_id=p_template_id
  order by i.day_number,i.sort_order;

  insert into public.contact_activity(
    contact_id,activity_type,title,detail,actor_user_id,metadata
  )
  values(
    p_contact_id,'meal_plan_assigned','Meal plan assigned',v_title,(select auth.uid()),
    jsonb_build_object('meal_plan_id',v_plan_id,'template_id',p_template_id,'starts_on',p_starts_on)
  );

  return v_plan_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.assign_meal_plan_template(p_contact_id uuid,p_template_id uuid,p_starts_on date,p_title text DEFAULT NULL,p_notes text DEFAULT NULL)
RETURNS uuid LANGUAGE sql SECURITY INVOKER SET search_path=pg_catalog,private AS $$ SELECT private.assign_meal_plan_template(p_contact_id,p_template_id,p_starts_on,p_title,p_notes); $$;
REVOKE ALL ON FUNCTION private.assign_meal_plan_template(uuid,uuid,date,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.assign_meal_plan_template(uuid,uuid,date,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION private.assign_fitness_program(p_contact_id uuid, p_program_id uuid, p_starts_on date, p_title text DEFAULT NULL::text, p_notes text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare
  v_membership_id uuid;
  v_plan_id uuid;
  v_title text;
begin
  IF NOT private.beta_staff_assignment_access(p_contact_id,true) THEN RAISE EXCEPTION 'Assignment permission or contact scope denied' USING ERRCODE='42501'; END IF;
  IF p_starts_on IS NULL THEN RAISE EXCEPTION 'Start date required'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_contact_id::text || 'workout',0));
  IF EXISTS(SELECT 1 FROM public.fitness_program_workouts x JOIN public.fitness_programs p ON p.id=x.program_id JOIN public.workout_templates w ON w.id=x.workout_id WHERE p.id=p_program_id AND (w.status<>'published' OR w.methodology_id<>p.methodology_id OR x.week_number>p.weeks OR NOT EXISTS(SELECT 1 FROM public.workout_template_exercises e JOIN public.exercise_catalog c ON c.id=e.exercise_id WHERE e.workout_id=w.id AND c.status='published'))) THEN RAISE EXCEPTION 'Fitness program contains unavailable or empty workouts'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.fitness_program_workouts WHERE program_id=p_program_id) THEN RAISE EXCEPTION 'Add content before assigning this plan'; END IF;

  select ca.membership_id into v_membership_id
  from public.client_access ca
  where ca.contact_id=p_contact_id AND ca.status='active' AND NOT ca.needs_onboarding_claim
  limit 1;

  if v_membership_id is null then
    raise exception 'Active client membership not found';
  end if;

  select coalesce(p_title,p.title) into v_title
  from public.fitness_programs p
  where p.id=p_program_id and p.status='published';

  if v_title is null then
    raise exception 'Published fitness program not found';
  end if;

  update public.client_fitness_plans
  set status='completed',updated_at=now()
  where contact_id=p_contact_id and status='active';

  insert into public.client_fitness_plans(
    contact_id,membership_id,program_id,assigned_by,title,starts_on,status,notes
  )
  values(
    p_contact_id,v_membership_id,p_program_id,(select auth.uid()),
    v_title,p_starts_on,'active',p_notes
  )
  returning id into v_plan_id;

  insert into public.client_workout_assignments(
    fitness_plan_id,contact_id,workout_id,scheduled_date,status,assigned_by,notes
  )
  select
    v_plan_id,
    p_contact_id,
    pw.workout_id,
    p_starts_on + ((pw.week_number-1)*7 + (pw.day_number-1)),
    'assigned',
    (select auth.uid()),
    pw.notes
  from public.fitness_program_workouts pw
  where pw.program_id=p_program_id
  order by pw.week_number,pw.day_number;

  insert into public.contact_activity(
    contact_id,activity_type,title,detail,actor_user_id,metadata
  )
  values(
    p_contact_id,'fitness_program_assigned','Fitness program assigned',v_title,(select auth.uid()),
    jsonb_build_object('fitness_plan_id',v_plan_id,'program_id',p_program_id,'starts_on',p_starts_on)
  );

  return v_plan_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.assign_fitness_program(p_contact_id uuid,p_program_id uuid,p_starts_on date,p_title text DEFAULT NULL,p_notes text DEFAULT NULL)
RETURNS uuid LANGUAGE sql SECURITY INVOKER SET search_path=pg_catalog,private AS $$ SELECT private.assign_fitness_program(p_contact_id,p_program_id,p_starts_on,p_title,p_notes); $$;
REVOKE ALL ON FUNCTION private.assign_fitness_program(uuid,uuid,date,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.assign_fitness_program(uuid,uuid,date,text,text) TO authenticated;

CREATE FUNCTION public.get_my_assigned_meal(p_assignment_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public,private AS $$
DECLARE v_result jsonb;
BEGIN
 SELECT jsonb_build_object('title',coalesce(r.title,i.custom_title),'scheduled_date',i.scheduled_date,'meal_slot',i.meal_slot,'notes',i.notes,'instructions',r.instructions,'servings',r.servings,'nutrition',r.nutrition,'ingredients',coalesce((SELECT jsonb_agg(jsonb_build_object('ingredient',ri.ingredient,'quantity',ri.quantity,'unit',ri.unit,'notes',ri.note) ORDER BY ri.sort_order) FROM public.recipe_ingredients ri WHERE ri.recipe_id=r.id),'[]'::jsonb)) INTO v_result
 FROM public.client_meal_plan_items i LEFT JOIN public.recipes r ON r.id=i.recipe_id AND r.status='published'
 WHERE i.id=p_assignment_id AND private.beta_member_assignment_access(i.contact_id,'meal');
 IF v_result IS NULL THEN RAISE EXCEPTION 'Assigned meal unavailable' USING ERRCODE='42501'; END IF;
 RETURN v_result;
END $$;
CREATE FUNCTION public.get_my_assigned_workout(p_assignment_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public,private AS $$
DECLARE v_result jsonb;
BEGIN
 SELECT jsonb_build_object('title',w.title,'scheduled_date',a.scheduled_date,'notes',a.notes,'description',w.description,'duration_minutes',w.duration_minutes,'environment',w.environment,'exercises',coalesce((SELECT jsonb_agg(jsonb_build_object('name',e.name,'instructions',e.instructions,'sets',x.sets,'reps',x.reps,'duration_seconds',x.duration_seconds,'rest_seconds',x.rest_seconds,'notes',x.notes) ORDER BY x.sort_order) FROM public.workout_template_exercises x JOIN public.exercise_catalog e ON e.id=x.exercise_id AND e.status='published' WHERE x.workout_id=w.id),'[]'::jsonb)) INTO v_result
 FROM public.client_workout_assignments a JOIN public.workout_templates w ON w.id=a.workout_id AND w.status='published'
 WHERE a.id=p_assignment_id AND private.beta_member_assignment_access(a.contact_id,'workout');
 IF v_result IS NULL THEN RAISE EXCEPTION 'Assigned workout unavailable' USING ERRCODE='42501'; END IF;
 RETURN v_result;
END $$;
REVOKE ALL ON FUNCTION public.get_my_assigned_meal(uuid),public.get_my_assigned_workout(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_my_assigned_meal(uuid),public.get_my_assigned_workout(uuid) TO authenticated;

-- Grocery rows inherit the same scoped parent; member updates are checkboxes only.
DO $$ DECLARE p record; BEGIN FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='grocery_list_items' AND permissive='PERMISSIVE' LOOP EXECUTE format('DROP POLICY %I ON public.grocery_list_items',p.policyname); END LOOP; END $$;
CREATE POLICY beta_grocery_read ON public.grocery_list_items FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.client_grocery_lists g WHERE g.id=grocery_list_id));
CREATE POLICY beta_grocery_insert ON public.grocery_list_items FOR INSERT TO authenticated WITH CHECK(EXISTS(SELECT 1 FROM public.client_grocery_lists g WHERE g.id=grocery_list_id AND private.beta_staff_assignment_access(g.contact_id,true)));
CREATE POLICY beta_grocery_update ON public.grocery_list_items FOR UPDATE TO authenticated USING(EXISTS(SELECT 1 FROM public.client_grocery_lists g WHERE g.id=grocery_list_id AND (private.beta_staff_assignment_access(g.contact_id,true) OR private.beta_member_assignment_access(g.contact_id,'meal')))) WITH CHECK(EXISTS(SELECT 1 FROM public.client_grocery_lists g WHERE g.id=grocery_list_id AND (private.beta_staff_assignment_access(g.contact_id,true) OR private.beta_member_assignment_access(g.contact_id,'meal'))));
CREATE FUNCTION private.guard_beta_grocery_item() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,private AS $$
BEGIN
 IF auth.uid() IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.client_grocery_lists g WHERE g.id=OLD.grocery_list_id AND private.beta_staff_assignment_access(g.contact_id,true))
 AND (to_jsonb(OLD)-'checked') IS DISTINCT FROM (to_jsonb(NEW)-'checked') THEN RAISE EXCEPTION 'Protected grocery assignment fields cannot be changed' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.guard_beta_grocery_item() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER beta_grocery_guard BEFORE UPDATE ON public.grocery_list_items FOR EACH ROW EXECUTE FUNCTION private.guard_beta_grocery_item();

-- Staff grocery generation uses the same permission and scoped parent as assignment.
CREATE OR REPLACE FUNCTION public.generate_grocery_list_for_meal_plan(p_meal_plan_id uuid, p_title text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_contact_id uuid;
  v_list_id uuid;
  v_title text;
begin
  select contact_id,title into v_contact_id,v_title
  from public.client_meal_plans
  where id=p_meal_plan_id;

  if v_contact_id is null then
    raise exception 'Meal plan not found';
  end if;

  IF NOT private.beta_staff_assignment_access(v_contact_id,true) THEN RAISE EXCEPTION 'Grocery assignment permission or contact scope denied' USING ERRCODE='42501'; END IF;

  update public.client_grocery_lists
  set status='archived',updated_at=now()
  where contact_id=v_contact_id and status='active';

  insert into public.client_grocery_lists(
    contact_id,meal_plan_id,title,status,created_by
  )
  values(
    v_contact_id,p_meal_plan_id,
    coalesce(p_title,v_title || ' Grocery List'),
    'active',
    (select auth.uid())
  )
  returning id into v_list_id;

  insert into public.grocery_list_items(
    grocery_list_id,item,quantity,unit,category,checked,sort_order
  )
  select
    v_list_id,
    ri.ingredient,
    sum(coalesce(ri.quantity,0)),
    ri.unit,
    null,
    false,
    min(ri.sort_order)
  from public.client_meal_plan_items mi
  join public.recipe_ingredients ri on ri.recipe_id=mi.recipe_id
  where mi.meal_plan_id=p_meal_plan_id
  group by ri.ingredient,ri.unit
  order by min(ri.sort_order),ri.ingredient;

  return v_list_id;
end;
$function$;
