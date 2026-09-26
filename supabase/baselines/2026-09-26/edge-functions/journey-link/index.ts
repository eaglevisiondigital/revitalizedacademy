import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const allowedOrigins = new Set([
  "https://revitalizedacademy.com",
  "https://www.revitalizedacademy.com",
  "http://localhost:3000",
  "http://localhost:5173"
]);

const JOURNEY_BASE = "https://revitalizedacademy.com/journey/?token=";

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
    headers: {
      ...cors(origin),
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(digest));
}


function answerValue(answer: unknown) {
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

function createToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

function safeAction(stepKey: string | null, appointment: any, activation: any, rawToken: string) {
  switch (stepKey) {
    case "vitality_assessment":
      return { type: "link", label: "Continue Your Vitality Assessment", url: "/consult.html" };
    case "longevity_vsl":
      return { type: "link", label: "Watch the Longevity Matrix", url: "/vitality-next.html" };
    case "application_interview_schedule":
      return appointment?.status === "scheduled"
        ? { type: "scheduled", label: "Application Interview Scheduled" }
        : { type: "schedule_request", label: "Request Your Application Interview" };
    case "application_interview":
      return appointment?.status === "scheduled"
        ? { type: "scheduled", label: "Application Interview Scheduled" }
        : {
            type: "waiting",
            label: "Application Interview",
            note: "The ReVitalized team is preparing your application interview."
          };
    case "consultation_schedule":
      return appointment?.status === "scheduled"
        ? { type: "scheduled", label: "Consultation Scheduled" }
        : { type: "schedule_request", label: "Request Your Consultation" };
    case "consultation":
      return appointment?.status === "scheduled"
        ? { type: "scheduled", label: "Consultation Scheduled" }
        : {
            type: "waiting",
            label: "ReVitalized Consultation",
            note: "The ReVitalized team is preparing your consultation."
          };
    case "plan_selection":
      return { type: "link", label: "Review ReVitalized Programs", url: "/plans.html" };
    case "payment_agreement":
      return (activation?.payment_url || activation?.agreement_url)
        ? {
            type: "enrollment",
            label: "Complete Your Enrollment",
            payment_url: activation?.payment_url || null,
            agreement_url: activation?.agreement_url || null,
            payment_status: activation?.payment_status || "pending",
            agreement_status: activation?.agreement_status || "not_sent"
          }
        : {
            type: "waiting",
            label: "Your Enrollment Link Is Being Prepared",
            note: "The ReVitalized team is preparing the correct plan, agreement and payment path."
          };
    case "onboarding_health_questionnaire":
      return {
        type: "link",
        label: "Complete Your New Client Health Questionnaire",
        url: "/health-profile.html?journey_token=" + encodeURIComponent(rawToken),
        note: "This secure questionnaire is part of your new-client onboarding and saves as you go."
      };
    case "report_review":
      return {
        type: "waiting",
        label: "Your Vitality Report Is Being Reviewed",
        note: "A ReVitalized coach is reviewing the information you submitted."
      };
    case "report_send":
      return {
        type: "waiting",
        label: "Your Vitality Report Is Being Prepared",
        note: "Your approved report is being prepared for delivery."
      };
    case "outbound_call":
      return {
        type: "waiting",
        label: "Personal Coach Follow-Up",
        note: "A member of the ReVitalized team will personally follow up with you."
      };
    case "preconsultation_doc":
      return {
        type: "waiting",
        label: "Consultation Preparation",
        note: "ReVitalized will send the information you need before your consultation."
      };
    case "backend_activation":
      return {
        type: "waiting",
        label: "Member Access Is Being Activated",
        note: "Your ReVitalized member access is being prepared."
      };
    case "coach_setup":
      return {
        type: "waiting",
        label: "Coach Setup & First Session",
        note: "Your coach is preparing your first-session priorities and next steps."
      };
    default:
      return {
        type: "waiting",
        label: "Your Next Step Is Being Prepared",
        note: "ReVitalized will guide you through the next part of your journey."
      };
  }
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

  async function authenticatedUser() {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return null;
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user;
  }

  async function staffUser() {
    const user = await authenticatedUser();
    if (!user) return null;

    const { data: staff, error: staffError } = await admin
      .from("staff_access")
      .select("user_id,role,display_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (staffError || !staff) return null;
    return { user, staff };
  }

  async function accessLink(rawToken: string) {
    if (!/^[a-f0-9]{64}$/i.test(rawToken)) return null;
    const hash = await sha256Hex(rawToken);
    const { data, error } = await admin
      .from("journey_access_links")
      .select("*")
      .eq("token_hash", hash)
      .eq("active", true)
      .maybeSingle();
    if (error) throw error;
    if (!data || new Date(data.expires_at).getTime() < Date.now()) return null;
    return data;
  }

  async function buildSnapshot(link: any, rawToken: string) {
    async function safeEnrollmentContext() {
      const { data: workflow, error: workflowError } = await admin
        .from("workflow_records")
        .select("id")
        .eq("contact_id", link.contact_id)
        .eq("workflow_type", "enrollment")
        .neq("status", "abandoned")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (workflowError) throw workflowError;

      const answerMap: Record<string, unknown> = {};
      if (workflow?.id) {
        const { data: rows, error } = await admin
          .from("workflow_answers")
          .select("question_key,answer")
          .eq("workflow_id", workflow.id);
        if (error) throw error;
        for (const row of rows || []) answerMap[row.question_key] = answerValue(row.answer);
      }

      return answerMap;
    }
    const [
      contactResult,
      journeyResult,
      stepsResult,
      definitionResult,
      appointmentResult,
      activationResult,
      reportResult,
      memberAccessResult
    ] = await Promise.all([
      admin.from("contacts").select("first_name,last_name,email,phone").eq("id", link.contact_id).single(),
      admin.from("contact_journeys").select("*").eq("id", link.journey_id).single(),
      admin.from("contact_journey_steps")
        .select("step_key,step_order,name,step_type,required,status,due_at,completed_at")
        .eq("journey_id", link.journey_id)
        .order("step_order"),
      admin.from("journey_definitions").select("name").eq(
        "journey_key",
        (await admin.from("contact_journeys").select("journey_key").eq("id", link.journey_id).single()).data?.journey_key || ""
      ).maybeSingle(),
      admin.from("journey_appointments")
        .select("appointment_type,status,scheduled_start,scheduled_end,time_zone,format,location_url")
        .eq("journey_id", link.journey_id)
        .in("status", ["requested","scheduled"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin.from("journey_enrollment_activations")
        .select("program_name,payment_status,agreement_status,access_status,payment_url,agreement_url")
        .eq("journey_id", link.journey_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin.from("vitality_reports")
        .select("id,status,storage_path,original_filename,client_message,sent_at")
        .eq("journey_id", link.journey_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin.from("client_access")
        .select("status,user_id,membership_id,ready_at,activated_at")
        .eq("contact_id", link.contact_id)
        .maybeSingle()
    ]);

    if (contactResult.error || journeyResult.error || stepsResult.error) {
      throw contactResult.error || journeyResult.error || stepsResult.error;
    }

    const journey = journeyResult.data;
    const steps = stepsResult.data || [];
    const appointment = appointmentResult.data || null;
    const activation = activationResult.data || null;
    const reportRecord = reportResult.data || null;
    let report = null;

    if (reportRecord?.status === "sent" && reportRecord.storage_path) {
      const signed = await admin.storage.from("vitality-reports").createSignedUrl(reportRecord.storage_path, 900);
      if (!signed.error && signed.data?.signedUrl) {
        report = {
          available: true,
          filename: reportRecord.original_filename || "Vitality Report.pdf",
          client_message: reportRecord.client_message || null,
          sent_at: reportRecord.sent_at || null,
          signed_url: signed.data.signedUrl,
          signed_url_expires_in: 900
        };
      }
    }

    const memberAccess = memberAccessResult.data || null;
    const enrollmentAnswers = await safeEnrollmentContext();
    const programInterest = String(enrollmentAnswers.program_interest || "");
    const fullName = [contactResult.data?.first_name, contactResult.data?.last_name].filter(Boolean).join(" ").trim();

    return {
      first_name: contactResult.data?.first_name || null,
      client_context: {
        full_name: fullName,
        first_name: contactResult.data?.first_name || "",
        last_name: contactResult.data?.last_name || "",
        email: contactResult.data?.email || "",
        phone: contactResult.data?.phone || "",
        enrollment_for: String(enrollmentAnswers.enrollment_for || "self"),
        completed_by_name: String(enrollmentAnswers.completed_by_name || ""),
        age: String(enrollmentAnswers.age || ""),
        gender: String(enrollmentAnswers.sex || ""),
        program_interest: programInterest,
        selected_plan_code: planCode(programInterest),
        start_timeline: String(enrollmentAnswers.start_timeline || "")
      },
      journey_name: definitionResult.data?.name || journey.journey_key,
      journey_status: journey.status,
      current_step_key: journey.current_step_key,
      current_step_name: steps.find((s: any) => s.step_key === journey.current_step_key)?.name || "Journey complete",
      progress_percent: journey.progress_percent,
      steps: steps.map((s: any) => ({
        name: s.name,
        step_order: s.step_order,
        status: s.status,
        required: s.required
      })),
      appointment,
      activation: activation ? {
        program_name: activation.program_name,
        payment_status: activation.payment_status,
        agreement_status: activation.agreement_status,
        access_status: activation.access_status
      } : null,
      report,
      member_access: memberAccess ? {
        status: memberAccess.status,
        has_user: Boolean(memberAccess.user_id),
        ready_at: memberAccess.ready_at || null,
        activated_at: memberAccess.activated_at || null,
        activation_url: !memberAccess.user_id && memberAccess.status === "ready"
          ? "https://revitalizedacademy.com/member/activate/?token=" + encodeURIComponent(rawToken)
          : null,
        dashboard_url: memberAccess.user_id && memberAccess.status === "active"
          ? "https://revitalizedacademy.com/member/"
          : null
      } : null,
      action: safeAction(journey.current_step_key, appointment, activation, rawToken)
    };
  }

  if (req.method === "GET") {
    try {
      const url = new URL(req.url);
      const rawToken = String(url.searchParams.get("token") || "").trim();
      const link = await accessLink(rawToken);
      if (!link) return json(origin, { error: "This journey link is invalid or expired." }, 404);

      const snapshot = await buildSnapshot(link, rawToken);

      await admin.from("journey_access_links").update({
        last_used_at: new Date().toISOString(),
        use_count: Number(link.use_count || 0) + 1
      }).eq("id", link.id);

      const day = new Date().toISOString().slice(0, 10);
      await admin.from("journey_events").upsert({
        contact_id: link.contact_id,
        journey_id: link.journey_id,
        event_type: "journey_link_opened",
        source: "client_journey_page",
        metadata: { link_id: link.id },
        dedupe_key: "journey_link_opened:" + link.id + ":" + day
      }, { onConflict: "dedupe_key", ignoreDuplicates: true });

      return json(origin, { ok: true, ...snapshot });
    } catch (error) {
      console.error(error);
      return json(origin, { error: "Unable to open this journey right now." }, 500);
    }
  }

  try {
    const body = await req.json();
    const action = String(body.action || "");


    if (action === "create_self_link") {
      const user = await authenticatedUser();
      if (!user) return json(origin, { error: "Member authentication required." }, 401);

      const { data: access, error: accessError } = await admin
        .from("client_access")
        .select("contact_id,status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (accessError) throw accessError;
      if (!access || access.status !== "active") {
        return json(origin, { error: "Active ReVitalized member access is required." }, 403);
      }

      const { data: journey, error: journeyError } = await admin
        .from("contact_journeys")
        .select("id,contact_id,status")
        .eq("contact_id", access.contact_id)
        .in("status", ["active","paused","nurture"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (journeyError) throw journeyError;
      if (!journey) return json(origin, { error: "No active ReVitalized journey is available." }, 404);

      const rawToken = createToken();
      const tokenHash = await sha256Hex(rawToken);

      const { data: link, error: linkError } = await admin
        .from("journey_access_links")
        .insert({
          contact_id: access.contact_id,
          journey_id: journey.id,
          token_hash: tokenHash,
          active: true,
          expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
          created_by: user.id
        })
        .select("id,expires_at")
        .single();

      if (linkError) throw linkError;

      return json(origin, {
        ok: true,
        link_id: link.id,
        url: JOURNEY_BASE + rawToken,
        expires_at: link.expires_at
      });
    }

    if (action === "create_link") {
      const staff = await staffUser();
      if (!staff) return json(origin, { error: "Staff authentication required." }, 401);

      const contactId = String(body.contact_id || "");
      const journeyId = String(body.journey_id || "");

      const { data: journey, error: journeyError } = await admin
        .from("contact_journeys")
        .select("id,contact_id,status")
        .eq("id", journeyId)
        .eq("contact_id", contactId)
        .maybeSingle();

      if (journeyError) throw journeyError;
      if (!journey) return json(origin, { error: "Journey not found." }, 404);

      const rawToken = createToken();
      const tokenHash = await sha256Hex(rawToken);

      const { data: link, error: linkError } = await admin
        .from("journey_access_links")
        .insert({
          contact_id: contactId,
          journey_id: journeyId,
          token_hash: tokenHash,
          active: true,
          expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
          created_by: staff.user.id
        })
        .select("id,expires_at")
        .single();

      if (linkError) throw linkError;

      return json(origin, {
        ok: true,
        link_id: link.id,
        url: JOURNEY_BASE + rawToken,
        expires_at: link.expires_at
      });
    }

    if (action === "request_appointment") {
      const rawToken = String(body.token || "").trim();
      const link = await accessLink(rawToken);
      if (!link) return json(origin, { error: "This journey link is invalid or expired." }, 404);

      const { data: journey, error: journeyError } = await admin
        .from("contact_journeys")
        .select("id,current_step_key")
        .eq("id", link.journey_id)
        .single();
      if (journeyError) throw journeyError;

      let appointmentType: string | null = null;
      let stepKey: string | null = null;

      if (journey.current_step_key === "application_interview_schedule") {
        appointmentType = "application_interview";
        stepKey = "application_interview_schedule";
      } else if (journey.current_step_key === "consultation_schedule") {
        appointmentType = "consultation";
        stepKey = "consultation_schedule";
      }

      if (!appointmentType || !stepKey) {
        return json(origin, { error: "Scheduling is not the current journey step." }, 409);
      }

      const { data: step, error: stepError } = await admin
        .from("contact_journey_steps")
        .select("id")
        .eq("journey_id", link.journey_id)
        .eq("step_key", stepKey)
        .single();
      if (stepError) throw stepError;

      const requestedAvailability = Array.isArray(body.preferred_times)
        ? body.preferred_times.map((v: unknown) => String(v).slice(0, 200)).slice(0, 6)
        : [];

      const { data: appointment, error: appointmentError } = await admin
        .from("journey_appointments")
        .insert({
          contact_id: link.contact_id,
          journey_id: link.journey_id,
          journey_step_id: step.id,
          appointment_type: appointmentType,
          status: "requested",
          time_zone: String(body.time_zone || "").slice(0, 100) || null,
          requested_availability: requestedAvailability,
          client_notes: String(body.notes || "").slice(0, 2000) || null
        })
        .select("id")
        .single();
      if (appointmentError) throw appointmentError;

      await admin.from("journey_events").insert({
        contact_id: link.contact_id,
        journey_id: link.journey_id,
        step_id: step.id,
        event_type: "appointment_requested",
        source: "client_journey_page",
        metadata: {
          appointment_id: appointment.id,
          appointment_type: appointmentType
        },
        dedupe_key: "appointment_requested:" + appointment.id
      });

      await admin.from("follow_up_tasks").insert({
        contact_id: link.contact_id,
        title: appointmentType === "consultation"
          ? "Schedule requested ReVitalized consultation"
          : "Schedule requested application interview",
        due_at: new Date().toISOString(),
        status: "open",
        priority: "high",
        task_type: "scheduling",
        journey_id: link.journey_id,
        journey_step_id: step.id,
        instructions: "Review the client's requested availability and confirm the appointment."
      });

      return json(origin, { ok: true, appointment_id: appointment.id });
    }

    return json(origin, { error: "Invalid action." }, 400);
  } catch (error) {
    console.error(error);
    return json(origin, { error: "Unable to complete this request." }, 500);
  }
});