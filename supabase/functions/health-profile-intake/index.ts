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

function json(origin: string | null, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors(origin), "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(digest));
}

function valueFromAnswer(answer: unknown) {
  if (answer === null || answer === undefined) return "";
  if (typeof answer === "string" || typeof answer === "number" || typeof answer === "boolean") return String(answer);
  return answer;
}

function planCode(program: string) {
  const p = program.toLowerCase();
  if (p.includes("holistic foundations")) return "holistic-foundations";
  if (p.includes("cohort")) return "vitality-accelerator-cohort";
  if (p.includes("vitality accelerator")) return "vitality-accelerator";
  if (p.includes("6-month") || p.includes("6 month")) return "total-wellness-6";
  if (p.includes("12-month") || p.includes("12 month")) return "total-wellness-12";
  return "";
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (!["GET","POST"].includes(req.method)) return json(origin, { error: "Method not allowed" }, 405);
  if (origin && !allowedOrigins.has(origin)) return json(origin, { error: "Origin not allowed" }, 403);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
  const secretKey = secretKeys.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !secretKey) return json(origin, { error: "Service configuration unavailable" }, 500);

  const admin = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  async function resolveLink(rawToken: string) {
    if (!/^[a-f0-9]{64}$/i.test(rawToken)) return null;
    const tokenHash = await sha256Hex(rawToken);
    const { data, error } = await admin
      .from("journey_access_links")
      .select("*")
      .eq("token_hash", tokenHash)
      .eq("active", true)
      .maybeSingle();

    if (error) throw error;
    if (!data || new Date(data.expires_at).getTime() < Date.now()) return null;
    return data;
  }

  async function getEnrollmentContext(contactId: string) {
    const [{ data: contact, error: contactError }, { data: workflow, error: workflowError }] = await Promise.all([
      admin.from("contacts")
        .select("first_name,last_name,email,phone")
        .eq("id", contactId)
        .single(),
      admin.from("workflow_records")
        .select("id")
        .eq("contact_id", contactId)
        .eq("workflow_type", "enrollment")
        .neq("status", "abandoned")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);
    if (contactError) throw contactError;
    if (workflowError) throw workflowError;

    const answerMap: Record<string, unknown> = {};
    if (workflow?.id) {
      const { data: rows, error } = await admin.from("workflow_answers")
        .select("question_key,answer")
        .eq("workflow_id", workflow.id);
      if (error) throw error;
      for (const row of rows || []) answerMap[row.question_key] = valueFromAnswer(row.answer);
    }

    const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(" ").trim();
    const program = String(answerMap.program_interest || "");

    return {
      full_name: fullName,
      first_name: contact.first_name || "",
      last_name: contact.last_name || "",
      email: contact.email || "",
      phone: contact.phone || "",
      enrollment_for: String(answerMap.enrollment_for || "self"),
      completed_by_name: String(answerMap.completed_by_name || ""),
      age: String(answerMap.age || ""),
      gender: String(answerMap.sex || ""),
      program_interest: program,
      selected_plan_code: planCode(program),
      start_timeline: String(answerMap.start_timeline || ""),
      enrollment_session_id: ""
    };
  }

  async function currentJourneyStep(journeyId: string) {
    const { data: journey, error: journeyError } = await admin.from("contact_journeys")
      .select("id,current_step_key,status")
      .eq("id", journeyId)
      .single();
    if (journeyError) throw journeyError;

    const { data: step, error: stepError } = await admin.from("contact_journey_steps")
      .select("id,step_key,status")
      .eq("journey_id", journeyId)
      .eq("step_key", "onboarding_health_questionnaire")
      .maybeSingle();
    if (stepError) throw stepError;

    return { journey, step };
  }

  async function currentProfileWorkflow(contactId: string) {
    const { data, error } = await admin.from("workflow_records")
      .select("*")
      .eq("contact_id", contactId)
      .eq("workflow_type", "health_profile")
      .neq("status", "abandoned")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async function savedAnswers(workflowId: string | null) {
    if (!workflowId) return {};
    const { data, error } = await admin.from("workflow_answers")
      .select("question_key,answer")
      .eq("workflow_id", workflowId);
    if (error) throw error;
    const out: Record<string, unknown> = {};
    for (const row of data || []) out[row.question_key] = row.answer;
    return out;
  }

  if (req.method === "GET") {
    try {
      const rawToken = String(new URL(req.url).searchParams.get("token") || "").trim();
      const link = await resolveLink(rawToken);
      if (!link) return json(origin, { error: "This onboarding link is invalid or expired." }, 404);

      const [{ journey, step }, context, workflow] = await Promise.all([
        currentJourneyStep(link.journey_id),
        getEnrollmentContext(link.contact_id),
        currentProfileWorkflow(link.contact_id)
      ]);

      const answers = await savedAnswers(workflow?.id || null);
      const allowed =
        step &&
        (
          step.status === "completed" ||
          (
            journey.current_step_key === "onboarding_health_questionnaire" &&
            (step.status === "in_progress" || step.status === "pending")
          )
        );

      if (!allowed) {
        return json(origin, {
          error: "The New Client Health Questionnaire is not your current onboarding step."
        }, 409);
      }

      return json(origin, {
        ok: true,
        context,
        workflow: workflow ? {
          status: workflow.status,
          current_step: workflow.current_step,
          completion_percent: workflow.completion_percent
        } : null,
        saved_answers: answers,
        completed: workflow?.status === "completed" || step.status === "completed",
        can_edit: workflow?.status !== "completed" && step.status !== "completed"
      });
    } catch (error) {
      console.error(error);
      return json(origin, { error: "Unable to load your onboarding questionnaire right now." }, 500);
    }
  }

  try {
    const body = await req.json();
    const rawToken = String(body.token || "").trim();
    const link = await resolveLink(rawToken);
    if (!link) return json(origin, { error: "This onboarding link is invalid or expired." }, 404);

    const mode = String(body.mode || "save");
    if (!["start","save","complete"].includes(mode)) {
      return json(origin, { error: "Invalid onboarding action." }, 400);
    }

    const { journey, step } = await currentJourneyStep(link.journey_id);
    if (
      !step ||
      (
        step.status !== "completed" &&
        journey.current_step_key !== "onboarding_health_questionnaire"
      ) ||
      !["pending","in_progress","completed"].includes(step.status)
    ) {
      return json(origin, { error: "The onboarding questionnaire is not available yet." }, 409);
    }
    if (step.status === "completed" && mode !== "start") {
      return json(origin, { error: "This onboarding questionnaire is already complete." }, 409);
    }

    let workflow = await currentProfileWorkflow(link.contact_id);
    const now = new Date().toISOString();

    if (!workflow) {
      const { data, error } = await admin.from("workflow_records").insert({
        contact_id: link.contact_id,
        workflow_type: "health_profile",
        status: "in_progress",
        current_step: String(body.current_step || "section_1").slice(0, 160),
        completion_percent: Math.max(0, Math.min(99, Number(body.completion_percent || 0))),
        started_at: now,
        last_activity_at: now
      }).select("*").single();
      if (error) throw error;
      workflow = data;

      await admin.from("journey_events").upsert({
        contact_id: link.contact_id,
        journey_id: link.journey_id,
        step_id: step.id,
        event_type: "health_profile_started",
        source: "client_onboarding",
        metadata: { workflow_id: workflow.id },
        dedupe_key: "health_profile_started:" + workflow.id
      }, { onConflict: "dedupe_key", ignoreDuplicates: true });

      await admin.from("contact_journey_steps").update({
        status: "in_progress",
        started_at: now,
        updated_at: now
      }).eq("id", step.id).eq("status", "pending");
    }

    const rawAnswers = body.answers && typeof body.answers === "object" ? body.answers : {};
    const entries = Object.entries(rawAnswers).slice(0, 400);
    const rows = [];

    for (const [key, value] of entries) {
      if (!/^[A-Za-z0-9_-]{1,120}$/.test(key)) continue;
      const serialized = JSON.stringify(value);
      if (serialized.length > 12000) continue;
      rows.push({
        workflow_id: workflow.id,
        question_key: key,
        answer: value,
        source: "onboarding_health_profile",
        confirmed_at: mode === "complete" ? now : null,
        updated_at: now
      });
    }

    if (rows.length) {
      const { error } = await admin.from("workflow_answers").upsert(rows, {
        onConflict: "workflow_id,question_key"
      });
      if (error) throw error;
    }

    const percent = mode === "complete"
      ? 100
      : Math.max(Number(workflow.completion_percent || 0), Math.max(0, Math.min(99, Number(body.completion_percent || 0))));

    const workflowUpdates: Record<string, unknown> = {
      status: mode === "complete" ? "completed" : "in_progress",
      current_step: mode === "complete" ? "complete" : String(body.current_step || workflow.current_step || "section_1").slice(0, 160),
      completion_percent: percent,
      last_activity_at: now,
      updated_at: now
    };
    if (mode === "complete") workflowUpdates.completed_at = now;

    const { error: workflowUpdateError } = await admin.from("workflow_records")
      .update(workflowUpdates)
      .eq("id", workflow.id);
    if (workflowUpdateError) throw workflowUpdateError;

    if (mode === "complete") {
      const { error: stepError } = await admin.from("contact_journey_steps").update({
        status: "completed",
        completion_source: "client_onboarding_health_profile",
        completed_at: now,
        updated_at: now
      }).eq("id", step.id).neq("status", "completed");
      if (stepError) throw stepError;

      await admin.from("journey_events").upsert({
        contact_id: link.contact_id,
        journey_id: link.journey_id,
        step_id: step.id,
        event_type: "health_profile_completed",
        source: "client_onboarding",
        metadata: { workflow_id: workflow.id },
        dedupe_key: "health_profile_completed:" + workflow.id
      }, { onConflict: "dedupe_key", ignoreDuplicates: true });

      await admin.from("contact_activity").insert({
        contact_id: link.contact_id,
        activity_type: "health_profile_completed",
        title: "New Client Health Questionnaire completed",
        detail: "The onboarding health questionnaire was completed through the secure ReVitalized journey.",
        metadata: { workflow_id: workflow.id, journey_id: link.journey_id }
      });
    }

    return json(origin, {
      ok: true,
      workflow_id: workflow.id,
      status: mode === "complete" ? "completed" : "in_progress",
      completion_percent: percent
    });
  } catch (error) {
    console.error(error);
    return json(origin, { error: "Unable to save your onboarding questionnaire right now." }, 500);
  }
});