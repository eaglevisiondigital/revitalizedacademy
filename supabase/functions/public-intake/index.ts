
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const allowedOrigins = new Set([
  "https://revitalizedacademy.com",
  "https://www.revitalizedacademy.com",
  "http://localhost:3000",
  "http://localhost:5173"
]);

function cors(origin: string | null) {
  const safe = origin && allowedOrigins.has(origin) ? origin : "https://revitalizedacademy.com";
  return {
    "Access-Control-Allow-Origin": safe,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin"
  };
}

function response(origin: string | null, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...cors(origin),
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

const allowedEnrollmentAnswers = new Set([
  "enrollment_for","completed_by_name","age","sex","referral_source",
  "biggest_goals","program_interest","start_timeline"
]);

const stagePriority: Record<string, number> = {
  inactive: -1,
  lead: 0,
  webinar_lead: 1,
  assessment_lead: 2,
  applicant: 3,
  client: 4
};

const intakeTypes = new Set([
  "webinar","vitality_start","vitality_progress","vitality_complete","vsl_viewed",
  "enrollment_start","refuel_notify"
]);

const allowedAssessmentTags = new Set([
  "concern:low-energy","concern:fatigue","concern:pain","concern:sleep",
  "concern:stress","concern:digestion","concern:chronic-condition",
  "goal:energy","goal:weight","goal:strength","goal:mobility",
  "goal:longevity","goal:family-health"
]);

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const headers = cors(origin);

  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (!["GET","POST"].includes(req.method)) return response(origin, { error: "Method not allowed" }, 405);
  if (origin && !allowedOrigins.has(origin)) return response(origin, { error: "Origin not allowed" }, 403);

  try {
    const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
    const secretKey = secretKeys.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!secretKey || !supabaseUrl) throw new Error("Server configuration unavailable");

    const supabase = createClient(supabaseUrl, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    if (req.method === "GET") {
      const url = new URL(req.url);
      const slug = url.searchParams.get("event_slug") || "founders-webinar-2026";

      const { data: event, error: eventError } = await supabase
        .from("webinar_events")
        .select("id,capacity,registration_open")
        .eq("slug", slug)
        .single();
      if (eventError) throw eventError;

      const [{ count: priorityCount }, { count: confirmedCount }] = await Promise.all([
        supabase
          .from("webinar_registrations")
          .select("*", { count: "exact", head: true })
          .eq("event_id", event.id)
          .neq("status", "cancelled"),
        supabase
          .from("webinar_registrations")
          .select("*", { count: "exact", head: true })
          .eq("event_id", event.id)
          .in("status", ["seat_reserved","confirmed","attended"])
      ]);

      return response(origin, {
        ok: true,
        capacity: event.capacity,
        registration_open: event.registration_open,
        priority_count: priorityCount ?? 0,
        confirmed_count: confirmedCount ?? 0
      });
    }

    const body = await req.json();
    if (body.website) return response(origin, { ok: true });

    const type = String(body.type || "");
    if (!intakeTypes.has(type)) return response(origin, { error: "Invalid intake type" }, 400);

    const email = String(body.email || "").trim().toLowerCase();
    const firstName = String(body.first_name || "").trim().slice(0, 120);
    const lastName = String(body.last_name || "").trim().slice(0, 120);
    const phone = String(body.phone || "").trim().slice(0, 50);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return response(origin, { error: "A valid email is required" }, 400);
    }

    const source = String(body.source || type).slice(0, 120);

    const { data: existing, error: existingError } = await supabase
      .from("contacts")
      .select("id,lifecycle_stage")
      .ilike("email", email)
      .maybeSingle();
    if (existingError) throw existingError;

    const proposedStage =
      type === "enrollment_start" ? "applicant" :
      ["vitality_start","vitality_progress","vitality_complete","vsl_viewed"].includes(type) ? "assessment_lead" :
      type === "webinar" ? "webinar_lead" :
      "lead";

    let contactId = existing?.id;

    if (!contactId) {
      const { data, error } = await supabase.from("contacts").insert({
        first_name: firstName || null,
        last_name: lastName || null,
        email,
        phone: phone || null,
        lifecycle_stage: proposedStage,
        first_source: source,
        last_source: source
      }).select("id").single();
      if (error) throw error;
      contactId = data.id;
    } else {
      const nextStage = (stagePriority[proposedStage] ?? 0) > (stagePriority[existing!.lifecycle_stage] ?? 0)
        ? proposedStage
        : existing!.lifecycle_stage;

      const updates: Record<string, unknown> = {
        lifecycle_stage: nextStage,
        last_source: source,
        updated_at: new Date().toISOString()
      };
      if (firstName) updates.first_name = firstName;
      if (lastName) updates.last_name = lastName;
      if (phone) updates.phone = phone;

      const { error } = await supabase.from("contacts").update(updates).eq("id", contactId);
      if (error) throw error;
    }

    async function insertEvent(
      eventType: string,
      journeyId: string | null,
      metadata: Record<string, unknown>,
      dedupeKey: string
    ) {
      const { error } = await supabase.from("journey_events").upsert({
        contact_id: contactId,
        journey_id: journeyId,
        event_type: eventType,
        source,
        metadata,
        dedupe_key: dedupeKey
      }, { onConflict: "dedupe_key", ignoreDuplicates: true });
      if (error) throw error;
    }

    async function activeJourney() {
      const { data, error } = await supabase
        .from("contact_journeys")
        .select("id,journey_key,current_step_key,status")
        .eq("contact_id", contactId)
        .in("status", ["active","paused","nurture"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    }

    async function ensureJourney(journeyKey: string, metadata: Record<string, unknown>) {
      const { data, error } = await supabase.rpc("ensure_contact_journey", {
        p_contact_id: contactId,
        p_journey_key: journeyKey,
        p_metadata: metadata
      });
      if (error) throw error;
      return String(data);
    }

    if (type === "refuel_notify") {
      const { error } = await supabase.from("refuel_interest").upsert({
        contact_id: contactId,
        email,
        first_name: firstName || null,
        source
      }, { onConflict: "contact_id" });
      if (error) throw error;

      await insertEvent(
        "refuel_interest",
        null,
        { source },
        "refuel_interest:" + contactId
      );

      await supabase.from("contact_activity").insert({
        contact_id: contactId,
        activity_type: "refuel_interest",
        title: "Requested ReFuel launch notification",
        detail: "Added to the ReFuel launch interest list."
      });

      return response(origin, { ok: true, type });
    }

    if (type === "webinar") {
      const slug = String(body.event_slug || "founders-webinar-2026");

      const { data: event, error: eventError } = await supabase
        .from("webinar_events")
        .select("id,capacity,registration_open")
        .eq("slug", slug)
        .single();
      if (eventError) throw eventError;
      if (!event.registration_open) return response(origin, { error: "Registration is closed" }, 409);

      const primaryGoal = String(body.primary_goal || "").trim().slice(0, 2500);

      const { error } = await supabase.from("webinar_registrations").upsert({
        event_id: event.id,
        contact_id: contactId,
        referral_source: String(body.referral_source || source).slice(0, 200) || null,
        invited_by: String(body.invited_by || "").slice(0, 200) || null,
        primary_goal: primaryGoal || null
      }, { onConflict: "event_id,contact_id" });
      if (error) throw error;

      await insertEvent(
        "webinar_registered",
        null,
        { event_slug: slug, primary_goal: primaryGoal },
        "webinar_registered:" + event.id + ":" + contactId
      );

      const { count } = await supabase
        .from("webinar_registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", event.id)
        .neq("status", "cancelled");

      return response(origin, {
        ok: true,
        type,
        registration_count: count ?? null,
        capacity: event.capacity
      });
    }

    if (type === "vsl_viewed") {
      let journey = await activeJourney();
      let journeyId: string;
      let journeyKey: string;

      if (journey) {
        journeyId = journey.id;
        journeyKey = journey.journey_key;
      } else {
        journeyKey = "assessment_first";
        journeyId = await ensureJourney(journeyKey, {
          source,
          journey_key: journeyKey
        });
      }

      const { error: stepError } = await supabase
        .from("contact_journey_steps")
        .update({
          status: "completed",
          completion_source: "website_vsl",
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("journey_id", journeyId)
        .eq("step_key", "longevity_vsl")
        .neq("status", "completed");
      if (stepError) throw stepError;

      await insertEvent(
        "vsl_viewed",
        journeyId,
        { source, journey_key: journeyKey },
        "vsl_viewed:" + journeyId
      );

      await supabase.from("contact_activity").insert({
        contact_id: contactId,
        activity_type: "vsl_viewed",
        title: "Longevity Matrix video viewed",
        detail: "Opened the Longevity Matrix next-step video.",
        metadata: { journey_id: journeyId }
      });

      return response(origin, {
        ok: true,
        type,
        journey_key: journeyKey,
        journey_id: journeyId
      });
    }

    const isVitality = ["vitality_start","vitality_progress","vitality_complete"].includes(type);
    const workflowType = isVitality ? "vitality_assessment" : "enrollment";

    const { data: currentWorkflow, error: workflowLookupError } = await supabase
      .from("workflow_records")
      .select("id,status,current_step,completion_percent")
      .eq("contact_id", contactId)
      .eq("workflow_type", workflowType)
      .neq("status", "abandoned")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (workflowLookupError) throw workflowLookupError;

    let workflowId = currentWorkflow?.id;

    if (!workflowId) {
      const startingPercent =
        type === "enrollment_start" ? 20 :
        type === "vitality_progress" ? Math.max(1, Math.min(99, Number(body.completion_percent || 1))) :
        type === "vitality_complete" ? 100 :
        1;

      const { data, error } = await supabase.from("workflow_records").insert({
        contact_id: contactId,
        workflow_type: workflowType,
        status: type === "vitality_complete" ? "completed" : "in_progress",
        current_step: String(body.current_step || "lead_capture").slice(0, 160),
        completion_percent: startingPercent,
        started_at: new Date().toISOString(),
        completed_at: type === "vitality_complete" ? new Date().toISOString() : null,
        last_activity_at: new Date().toISOString()
      }).select("id").single();
      if (error) throw error;
      workflowId = data.id;
    } else {
      const updates: Record<string, unknown> = {
        last_activity_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (type === "vitality_progress") {
        updates.status = currentWorkflow!.status === "completed" ? "completed" : "in_progress";
        updates.current_step = String(body.current_step || currentWorkflow!.current_step || "assessment").slice(0, 160);
        updates.completion_percent = Math.max(
          Number(currentWorkflow!.completion_percent || 0),
          Math.max(1, Math.min(99, Number(body.completion_percent || 1)))
        );
      } else if (type === "vitality_complete") {
        updates.status = "completed";
        updates.current_step = "complete";
        updates.completion_percent = 100;
        updates.completed_at = new Date().toISOString();
      } else if (type === "enrollment_start") {
        updates.status = currentWorkflow!.status === "completed" ? "completed" : "in_progress";
        updates.current_step = currentWorkflow!.current_step || "lead_capture";
        updates.completion_percent = Math.max(Number(currentWorkflow!.completion_percent || 0), 20);
      } else {
        updates.status = currentWorkflow!.status === "completed" ? "completed" : "in_progress";
      }

      const { error } = await supabase.from("workflow_records").update(updates).eq("id", workflowId);
      if (error) throw error;
    }

    if (type === "enrollment_start" && body.answers && typeof body.answers === "object") {
      const rows = Object.entries(body.answers)
        .filter(([key]) => allowedEnrollmentAnswers.has(key))
        .map(([question_key, answer]) => ({
          workflow_id: workflowId,
          question_key,
          answer,
          source: "website_step1",
          confirmed_at: new Date().toISOString()
        }));

      if (rows.length) {
        const { error } = await supabase.from("workflow_answers").upsert(rows, {
          onConflict: "workflow_id,question_key"
        });
        if (error) throw error;

        const keys = rows.map((r) => r.question_key);
        const { data: maps, error: mapError } = await supabase
          .from("question_mappings")
          .select("canonical_key,question_key")
          .eq("workflow_type", "enrollment")
          .in("question_key", keys);
        if (mapError) throw mapError;

        for (const map of maps || []) {
          const row = rows.find((r) => r.question_key === map.question_key);
          if (!row) continue;

          const { error } = await supabase.from("canonical_facts").upsert({
            contact_id: contactId,
            field_key: map.canonical_key,
            value: row.answer,
            source_workflow: "enrollment",
            source_question_key: map.question_key,
            last_confirmed_at: new Date().toISOString()
          }, { onConflict: "contact_id,field_key" });
          if (error) throw error;
        }
      }

      const answers = body.answers as Record<string, unknown>;
      const programInterest = String(answers.program_interest || "");
      const journeyKey = programInterest.toLowerCase().includes("holistic foundations")
        ? "direct_membership"
        : "coaching_application";

      const metadata = {
        source,
        journey_key: journeyKey,
        enrollment_for: String(answers.enrollment_for || ""),
        program_interest: programInterest,
        start_timeline: String(answers.start_timeline || ""),
        biggest_goals: String(answers.biggest_goals || "")
      };

      const journeyId = await ensureJourney(journeyKey, metadata);

      await insertEvent(
        "enrollment_started",
        journeyId,
        metadata,
        "enrollment_started:" + workflowId
      );

      return response(origin, {
        ok: true,
        type,
        journey_key: journeyKey,
        journey_id: journeyId
      });
    }

    if (isVitality) {
      let journey = await activeJourney();
      let journeyId: string;
      let journeyKey: string;

      if (journey) {
        journeyId = journey.id;
        journeyKey = journey.journey_key;
      } else {
        journeyKey = "assessment_first";
        journeyId = await ensureJourney(journeyKey, {
          source,
          journey_key: journeyKey
        });
        journey = await activeJourney();
      }

      if (type === "vitality_start") {
        const { error: stepError } = await supabase
          .from("contact_journey_steps")
          .update({
            status: "in_progress",
            started_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("journey_id", journeyId)
          .eq("step_key", "vitality_assessment")
          .eq("status", "pending");
        if (stepError) throw stepError;

        await insertEvent(
          "vitality_started",
          journeyId,
          { source, journey_key: journeyKey },
          "vitality_started:" + workflowId
        );
      }

      if (type === "vitality_progress") {
        const { error: journeyTouchError } = await supabase
          .from("contact_journeys")
          .update({
            last_activity_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("id", journeyId);
        if (journeyTouchError) throw journeyTouchError;
      }

      if (type === "vitality_complete") {
        const { error: stepError } = await supabase
          .from("contact_journey_steps")
          .update({
            status: "completed",
            completion_source: "website_assessment",
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("journey_id", journeyId)
          .eq("step_key", "vitality_assessment")
          .neq("status", "completed");
        if (stepError) throw stepError;

        await insertEvent(
          "vitality_completed",
          journeyId,
          { source, journey_key: journeyKey },
          "vitality_completed:" + workflowId
        );

        const derivedTags = Array.isArray(body.derived_tags)
          ? [...new Set<string>(body.derived_tags.map((value: unknown) => String(value)).filter((value: string) => allowedAssessmentTags.has(value)))]
          : [];

        if (derivedTags.length) {
          const { error: tagError } = await supabase.from("contact_tags").upsert(
            derivedTags.map((tag: string) => ({
              contact_id: contactId,
              tag,
              source: "automatic",
              rule_key: "assessment-derived",
              updated_at: new Date().toISOString()
            })),
            { onConflict: "contact_id,tag", ignoreDuplicates: true }
          );
          if (tagError) throw tagError;
        }

        await supabase.from("contact_activity").insert({
          contact_id: contactId,
          activity_type: "vitality_completed",
          title: "Vitality Assessment completed",
          detail: "The Vitality Assessment was completed on the website.",
          metadata: { workflow_id: workflowId, journey_id: journeyId, derived_tags: derivedTags }
        });
      }

      return response(origin, {
        ok: true,
        type,
        journey_key: journeyKey,
        journey_id: journeyId,
        workflow_id: workflowId
      });
    }

    return response(origin, { ok: true, type });
  } catch (error) {
    console.error(error);
    return response(origin, { error: "Unable to save right now" }, 500);
  }
});
