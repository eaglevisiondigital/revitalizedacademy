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

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function maskEmail(value: string) {
  const [local, domain] = value.split("@");
  if (!local || !domain) return "";
  const visible = local.length <= 2 ? local[0] || "" : local.slice(0,2);
  return visible + "•••@" + domain;
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
      .select("id,contact_id,journey_id,active,expires_at")
      .eq("token_hash", tokenHash)
      .eq("active", true)
      .maybeSingle();

    if (error) throw error;
    if (!data || new Date(data.expires_at).getTime() < Date.now()) return null;
    return data;
  }

  async function activationContext(link: any) {
    const [
      contactResult,
      accessResult
    ] = await Promise.all([
      admin.from("contacts")
        .select("id,first_name,last_name,email")
        .eq("id", link.contact_id)
        .single(),
      admin.from("client_access")
        .select("contact_id,household_id,membership_id,user_id,status,ready_at,activated_at")
        .eq("contact_id", link.contact_id)
        .maybeSingle()
    ]);

    if (contactResult.error) throw contactResult.error;
    if (accessResult.error) throw accessResult.error;

    const access = accessResult.data || null;
    let membership = null;

    if (access?.membership_id) {
      const { data, error } = await admin
        .from("client_memberships")
        .select("id,status,program_code,starts_at,commitment_ends_at")
        .eq("id", access.membership_id)
        .maybeSingle();
      if (error) throw error;
      membership = data;
    }

    return { contact: contactResult.data, access, membership };
  }

  if (req.method === "GET") {
    try {
      const token = String(new URL(req.url).searchParams.get("token") || "").trim();
      const link = await resolveLink(token);
      if (!link) return json(origin, { error: "This member activation link is invalid or expired." }, 404);

      const { contact, access, membership } = await activationContext(link);

      const eligible = Boolean(
        access &&
        ["ready","invited","active"].includes(access.status) &&
        membership &&
        membership.status === "active"
      );

      return json(origin, {
        ok: true,
        eligible,
        already_active: Boolean(access?.user_id && access?.status === "active"),
        first_name: contact.first_name || null,
        last_name: contact.last_name || null,
        email_hint: contact.email ? maskEmail(contact.email) : null,
        access_status: access?.status || null,
        membership_status: membership?.status || null,
        program_code: membership?.program_code || null
      });
    } catch (error) {
      console.error(error);
      return json(origin, { error: "Unable to verify member activation right now." }, 500);
    }
  }

  try {
    const body = await req.json();
    const token = String(body.token || "").trim();
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");

    if (password.length < 10 || password.length > 128) {
      return json(origin, { error: "Choose a password with at least 10 characters." }, 400);
    }

    const link = await resolveLink(token);
    if (!link) return json(origin, { error: "This member activation link is invalid or expired." }, 404);

    const { contact, access, membership } = await activationContext(link);

    if (!access || !membership || membership.status !== "active") {
      return json(origin, { error: "Your ReVitalized membership is not ready for account activation yet." }, 409);
    }

    if (access.user_id) {
      return json(origin, {
        error: "A ReVitalized member account already exists for this client. Please sign in instead.",
        already_active: true
      }, 409);
    }

    if (!contact.email || normalizeEmail(contact.email) !== email) {
      return json(origin, { error: "Use the same email address connected to your ReVitalized enrollment." }, 400);
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: contact.first_name || "",
        last_name: contact.last_name || "",
        account_type: "revitalized_member"
      },
      app_metadata: {
        account_type: "revitalized_member"
      }
    });

    if (createError || !created.user) {
      const message = String(createError?.message || "");
      if (/already|registered|exists/i.test(message)) {
        return json(origin, {
          error: "An account already exists for this email. Please sign in or contact ReVitalized Academy if you need help.",
          already_active: true
        }, 409);
      }
      throw createError || new Error("Unable to create member account");
    }

    const userId = created.user.id;

    const { error: profileError } = await admin.from("profiles").insert({
      user_id: userId,
      contact_id: contact.id
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(userId);
      throw profileError;
    }

    const now = new Date().toISOString();

    const { error: accessError } = await admin.from("client_access").update({
      user_id: userId,
      status: "active",
      invited_at: now,
      activated_at: now,
      updated_at: now
    }).eq("contact_id", contact.id);

    if (accessError) {
      await admin.from("profiles").delete().eq("user_id", userId);
      await admin.auth.admin.deleteUser(userId);
      throw accessError;
    }

    await admin.from("journey_access_links").update({
      last_used_at: now
    }).eq("id", link.id);

    await admin.from("contact_activity").insert({
      contact_id: contact.id,
      activity_type: "member_account_activated",
      title: "ReVitalized member account activated",
      detail: membership.program_code,
      actor_user_id: userId,
      metadata: {
        membership_id: membership.id,
        user_id: userId
      }
    });

    return json(origin, {
      ok: true,
      activated: true,
      login_url: "https://revitalizedacademy.com/member/"
    });
  } catch (error) {
    console.error(error);
    return json(origin, { error: "Unable to activate your ReVitalized member account right now." }, 500);
  }
});