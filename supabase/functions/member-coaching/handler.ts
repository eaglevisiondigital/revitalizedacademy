import { allowedOrigins, edgeEnvironment, configurationError } from "../_shared/environment.ts";
import { callerClient } from "../_shared/authorization.ts";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

function cors(origin: string | null) {
  const safe = origin && allowedOrigins.has(origin) ? origin : edgeEnvironment().appOrigin;
  return {
    "Access-Control-Allow-Origin": safe,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin"
  };
}

function json(origin: string | null, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors(origin), "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

export async function handleRequest(req:Request){
  const configError=configurationError();if(configError)return configError;
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return json(origin, { error: "Method not allowed" }, 405);
  if (origin && !allowedOrigins.has(origin)) return json(origin, { error: "Origin not allowed" }, 403);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
  const secretKey = secretKeys.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !secretKey) return json(origin, { error: "Service configuration unavailable" }, 500);

  const admin = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json(origin, { error: "Authentication required" }, 401);

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return json(origin, { error: "Authentication required" }, 401);

  const user = userData.user;
  const caller=callerClient(supabaseUrl,secretKey,token);
  const {data:paid,error:paidError}=await caller.rpc("member_paid_access_allowed");
  if(paidError||paid!==true)return json(origin,{error:"Full member access is required."},403);

  try {
    const body = await req.json();
    const action = String(body.action || "");

    if (action === "complete_assignment") {
      const assignmentId = String(body.assignment_id || "");
      const memberNote = String(body.member_note || "").trim().slice(0, 3000) || null;

      const { data: assignment, error: assignmentError } = await admin
        .from("client_assignments")
        .select("id,contact_id,title,status")
        .eq("id", assignmentId)
        .maybeSingle();

      if (assignmentError) throw assignmentError;
      if (!assignment) return json(origin, { error: "Assignment not found" }, 404);

      const { data: access, error: accessError } = await admin
        .from("client_access")
        .select("contact_id,status")
        .eq("user_id", user.id)
        .eq("contact_id", assignment.contact_id)
        .maybeSingle();

      if (accessError) throw accessError;
      if (!access || access.status !== "active") {
        return json(origin, { error: "You do not have access to this assignment." }, 403);
      }

      const now = new Date().toISOString();

      const { error: updateError } = await admin
        .from("client_assignments")
        .update({
          status: "completed",
          completed_at: now,
          member_note: memberNote,
          updated_at: now
        })
        .eq("id", assignment.id);

      if (updateError) throw updateError;

      await admin.from("contact_activity").insert({
        contact_id: assignment.contact_id,
        activity_type: "client_assignment_completed",
        title: "Client assignment completed",
        detail: assignment.title,
        actor_user_id: user.id,
        metadata: { assignment_id: assignment.id }
      });

      return json(origin, { ok: true, assignment_id: assignment.id, status: "completed" });
    }

    return json(origin, { error: "Invalid action" }, 400);
  } catch (error) {
    console.error(error);
    return json(origin, { error: "Unable to complete this coaching action right now." }, 500);
  }
}
