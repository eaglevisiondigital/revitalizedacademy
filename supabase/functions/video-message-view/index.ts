import { allowedOrigins, edgeEnvironment, configurationError } from "../_shared/environment.ts";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

function cors(req: Request) {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : edgeEnvironment().appOrigin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, apikey",
    "Vary": "Origin",
    "Cache-Control": "no-store"
  };
}

function json(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...cors(req),
      "Content-Type": "application/json"
    }
  });
}

Deno.serve(async (req: Request) => {
  const configError=configurationError();if(configError)return configError;
  const origin=req.headers.get("origin");if(origin&&!allowedOrigins.has(origin))return json(req,{error:"Origin not allowed"},403);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "GET") return json(req, { error: "Method not allowed" }, 405);

  const url = new URL(req.url);
  const token = (url.searchParams.get("token") || "").trim();

  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return json(req, { error: "Invalid or missing message token" }, 400);
  }

  const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
  const secretKey = secretKeys.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");

  if (!secretKey || !supabaseUrl) {
    return json(req, { error: "Service configuration unavailable" }, 500);
  }

  const admin = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: video, error: videoError } = await admin
    .from("personal_video_messages")
    .select("id,contact_id,title,personal_message,storage_path,status,share_active,share_expires_at")
    .eq("share_token", token)
    .maybeSingle();

  if (videoError) return json(req, { error: "Unable to load message" }, 500);
  if (!video || !video.share_active || video.status !== "ready" || !video.storage_path) {
    return json(req, { error: "This personal message is not available" }, 404);
  }

  if (video.share_expires_at && new Date(video.share_expires_at).getTime() < Date.now()) {
    return json(req, { error: "This personal message link has expired" }, 410);
  }

  const [{ data: contact }, signed] = await Promise.all([
    admin.from("contacts").select("first_name,last_name").eq("id", video.contact_id).maybeSingle(),
    admin.storage.from("personal-videos").createSignedUrl(video.storage_path, 3600)
  ]);

  if (signed.error || !signed.data?.signedUrl) {
    return json(req, { error: "Video is temporarily unavailable" }, 500);
  }

  await admin.from("personal_video_views").insert({
    video_message_id: video.id,
    user_agent: req.headers.get("user-agent"),
    metadata: { source: "personal_video_page" }
  });

  await admin.from("contact_activity").insert({
    contact_id: video.contact_id,
    activity_type: "video_viewed",
    title: "Personal video viewed",
    detail: video.title,
    metadata: { video_message_id: video.id }
  });

  return json(req, {
    title: video.title,
    personal_message: video.personal_message,
    recipient_first_name: contact?.first_name || null,
    signed_url: signed.data.signedUrl,
    signed_url_expires_in: 3600
  });
});