import { createClient } from "npm:@supabase/supabase-js@2.57.4";

// Use the verified caller JWT for permission RPCs. Never let service-role auth
// become the actor: auth.uid() must remain the person making this request.
export function callerClient(url: string, key: string, bearer: string) {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${bearer}` } },
  });
}
export async function assertStaffAction(
  caller: ReturnType<typeof callerClient>, permission: string, contactId?: string,
) {
  const { data, error } = await caller.rpc("staff_action_allowed", {
    p_permission_key: permission, p_contact_id: contactId ?? null,
  });
  if (error || data !== true) {
    throw Object.assign(new Error("Active staff permission and contact access required."), { status: 403 });
  }
}
