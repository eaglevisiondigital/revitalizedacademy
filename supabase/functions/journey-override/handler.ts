import { allowedOrigins, edgeEnvironment, configurationError } from "../_shared/environment.ts";
import { callerClient, assertStaffAction } from "../_shared/authorization.ts";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const OWNER_ADMIN = new Set(["owner","admin"]);
const COACH_STEP_TYPES = new Set(["form","assessment","content","scheduling","coach_action","onboarding","system"]);
const SUPPORT_STEP_TYPES = new Set(["content","scheduling","system"]);

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

function cleanText(value: unknown, max = 4000) {
  return String(value || "").trim().slice(0, max);
}

function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function handleRequest(req: Request) {
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
  if (!token) return json(origin, { error: "Staff authentication required" }, 401);

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return json(origin, { error: "Staff authentication required" }, 401);

  const user = userData.user;
  const caller=callerClient(supabaseUrl,secretKey,token);
  const { data: staff, error: staffError } = await admin
    .from("staff_access")
    .select("user_id,role,display_name,status,onboarding_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (staffError || !staff || staff.status !== "active" || (staff.role === "coach" && !["complete","waived"].includes(staff.onboarding_status))) return json(origin, { error: "Staff access required" }, 403);

  async function requirePermission(permission: string, contactId?: string) {
    await assertStaffAction(caller, permission, contactId);
  }

  async function audit(args: {
    contactId: string | null;
    journeyId: string | null;
    stepId?: string | null;
    entityType: string;
    entityId?: string | null;
    action: string;
    permission: string;
    previousValue?: unknown;
    newValue?: unknown;
    completionMethod?: string | null;
    reason: string;
    notes?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    const { error } = await admin.from("manual_override_audit").insert({
      contact_id: args.contactId,
      journey_id: args.journeyId,
      journey_step_id: args.stepId || null,
      entity_type: args.entityType,
      entity_id: args.entityId || null,
      action: args.action,
      permission_key: args.permission,
      actor_user_id: user.id,
      actor_role: staff!.role,
      previous_value: args.previousValue || {},
      new_value: args.newValue || {},
      completion_method: args.completionMethod || null,
      reason: args.reason,
      notes: args.notes || null,
      metadata: args.metadata || {}
    });
    if (error) throw error;
  }

  try {
    const body = await req.json();
    const action = String(body.action || "");
    const reason = cleanText(body.reason, 2000);
    const notes = cleanText(body.notes, 4000) || null;

    if (!reason && action !== "get_capabilities") {
      return json(origin, { error: "A reason is required for every manual override." }, 400);
    }

    if (action === "get_capabilities") {
      const { data, error } = await admin
        .from("staff_role_permissions")
        .select("permission_key,allowed")
        .eq("role", staff.role);
      if (error) throw error;
      return json(origin, {
        ok: true,
        role: staff.role,
        display_name: staff.display_name,
        permissions: Object.fromEntries(await Promise.all((data || []).map(async(row) => {
          const {data:allowed,error}=await caller.rpc("staff_action_allowed",{p_permission_key:row.permission_key,p_contact_id:null});
          return [row.permission_key,!error&&allowed===true];
        })))
      });
    }

    if (action === "step_override") {
      const stepId = String(body.step_id || "");
      const targetStatus = String(body.target_status || "");
      const completionMethod = cleanText(body.completion_method, 120) || "manual_override";

      if (!validUuid(stepId)) return json(origin, { error: "Invalid journey step." }, 400);

      const allowedStatuses = new Set([
        "pending","in_progress","waiting_client","waiting_revit",
        "completed","skipped","waived","blocked","cancelled"
      ]);
      if (!allowedStatuses.has(targetStatus)) return json(origin, { error: "Invalid step status." }, 400);

      const { data: step, error: stepError } = await admin
        .from("contact_journey_steps")
        .select("id,journey_id,step_key,name,step_type,status,required,completed_at,completion_source")
        .eq("id", stepId)
        .maybeSingle();

      if (stepError) throw stepError;
      if (!step) return json(origin, { error: "Journey step not found." }, 404);

      const { data: journey, error: journeyError } = await admin
        .from("contact_journeys")
        .select("id,contact_id,journey_key,status,current_step_key")
        .eq("id", step.journey_id)
        .single();

      if (journeyError) throw journeyError;

      if (step.step_type === "payment" || step.step_key === "payment_agreement") {
        return json(origin, {
          error: "Payment & Agreement must be changed through the financial override controls so the transaction remains auditable."
        }, 409);
      }

      let permission = "journey.step.status";
      if (targetStatus === "waived") permission = "journey.step.waive";
      if (completionMethod === "completed_with_client") permission = "journey.step.complete_assisted";
      await requirePermission(permission,journey.contact_id);

      if (staff.role === "coach" && !COACH_STEP_TYPES.has(step.step_type)) {
        return json(origin, { error: "Coaches cannot override this type of journey step." }, 403);
      }
      if (staff.role === "support" && !SUPPORT_STEP_TYPES.has(step.step_type)) {
        return json(origin, { error: "Support staff cannot override this type of journey step." }, 403);
      }
      if (staff.role === "support" && ["completed","skipped","waived"].includes(targetStatus) && step.step_type !== "scheduling") {
        return json(origin, { error: "Support staff can only complete scheduling steps." }, 403);
      }

      const previous = {
        status: step.status,
        completed_at: step.completed_at,
        completion_source: step.completion_source
      };

      const now = new Date().toISOString();
      const satisfied = ["completed","skipped","waived"].includes(targetStatus);
      const updatePayload: Record<string, unknown> = {
        status: targetStatus,
        completion_source: satisfied ? completionMethod : "manual_override:" + completionMethod,
        completed_at: satisfied ? now : null,
        updated_at: now
      };

      const { data: updated, error: updateError } = await admin
        .from("contact_journey_steps")
        .update(updatePayload)
        .eq("id", step.id)
        .select("id,status,completed_at,completion_source")
        .single();

      if (updateError) throw updateError;

      await audit({
        contactId: journey.contact_id,
        journeyId: journey.id,
        stepId: step.id,
        entityType: "journey_step",
        entityId: step.id,
        action: "step_override",
        permission,
        previousValue: previous,
        newValue: updated,
        completionMethod,
        reason,
        notes,
        metadata: { step_key: step.step_key, step_name: step.name, step_type: step.step_type }
      });

      await admin.from("contact_activity").insert({
        contact_id: journey.contact_id,
        activity_type: "manual_journey_override",
        title: "Journey step manually updated",
        detail: step.name + " → " + targetStatus,
        actor_user_id: user.id,
        metadata: {
          journey_id: journey.id,
          step_id: step.id,
          step_key: step.step_key,
          target_status: targetStatus,
          completion_method: completionMethod,
          reason
        }
      });

      return json(origin, { ok: true, step: updated });
    }


    if (action === "plan_override") {
      await requirePermission("plan.override");

      const journeyId = String(body.journey_id || "");
      const programCode = String(body.program_code || "");
      if (!validUuid(journeyId)) return json(origin, { error: "Invalid journey." }, 400);

      const { data: program, error: programError } = await admin
        .from("program_catalog")
        .select("program_code,name,default_commitment_months,active")
        .eq("program_code", programCode)
        .maybeSingle();

      if (programError) throw programError;
      if (!program || !program.active) return json(origin, { error: "Choose an active ReVitalized program." }, 400);

      const { data: journey, error: journeyError } = await admin
        .from("contact_journeys")
        .select("id,contact_id,journey_key")
        .eq("id", journeyId)
        .single();
      if (journeyError) throw journeyError;
      await requirePermission("plan.override", journey.contact_id);

      const { data: step } = await admin
        .from("contact_journey_steps")
        .select("id")
        .eq("journey_id", journey.id)
        .eq("step_key", "payment_agreement")
        .maybeSingle();

      let { data: activation, error: activationError } = await admin
        .from("journey_enrollment_activations")
        .select("*")
        .eq("journey_id", journey.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activationError) throw activationError;

      const previous = {
        program_code: activation?.program_code || null,
        program_name: activation?.program_name || null,
        commitment_months: activation?.commitment_months || null
      };

      if (!activation) {
        const { data: created, error } = await admin
          .from("journey_enrollment_activations")
          .insert({
            contact_id: journey.contact_id,
            journey_id: journey.id,
            journey_step_id: step?.id || null,
            program_code: program.program_code,
            program_name: program.name,
            commitment_months: program.default_commitment_months,
            payment_status: "pending",
            agreement_status: "not_sent",
            access_status: "pending",
            last_manual_override_at: new Date().toISOString(),
            last_manual_override_by: user.id,
            created_by: user.id
          })
          .select("*")
          .single();
        if (error) throw error;
        activation = created;
      } else {
        const { data: updated, error } = await admin
          .from("journey_enrollment_activations")
          .update({
            program_code: program.program_code,
            program_name: program.name,
            commitment_months: activation.commitment_months || program.default_commitment_months,
            last_manual_override_at: new Date().toISOString(),
            last_manual_override_by: user.id,
            updated_at: new Date().toISOString()
          })
          .eq("id", activation.id)
          .select("*")
          .single();
        if (error) throw error;
        activation = updated;
      }

      const { data: memberships, error: membershipError } = await admin
        .from("client_memberships")
        .select("id,program_code,commitment_months,status")
        .eq("activation_id", activation.id);

      if (membershipError) throw membershipError;

      for (const membership of memberships || []) {
        await admin
          .from("client_memberships")
          .update({
            program_code: program.program_code,
            commitment_months: membership.commitment_months || program.default_commitment_months,
            updated_at: new Date().toISOString()
          })
          .eq("id", membership.id);

        await admin
          .from("membership_entitlements")
          .update({ status: "inactive", updated_at: new Date().toISOString() })
          .eq("membership_id", membership.id);

        const { data: templates, error: templateError } = await admin
          .from("program_entitlement_templates")
          .select("entitlement_key,label,limit_value,reset_cadence,metadata")
          .eq("program_code", program.program_code)
          .eq("active", true);
        if (templateError) throw templateError;

        if ((templates || []).length) {
          const { error: entitlementError } = await admin
            .from("membership_entitlements")
            .upsert(
              templates.map((t) => ({
                membership_id: membership.id,
                entitlement_key: t.entitlement_key,
                label: t.label,
                status: "active",
                limit_value: t.limit_value,
                reset_cadence: t.reset_cadence,
                metadata: t.metadata
              })),
              { onConflict: "membership_id,entitlement_key" }
            );
          if (entitlementError) throw entitlementError;
        }
      }

      await admin
        .from("contact_tags")
        .delete()
        .eq("contact_id", journey.contact_id)
        .like("tag", "program:%");

      await admin
        .from("contact_tags")
        .upsert({
          contact_id: journey.contact_id,
          tag: "program:" + program.program_code,
          source: "automatic",
          rule_key: "manual-plan-override",
          updated_at: new Date().toISOString()
        }, { onConflict: "contact_id,tag" });

      await audit({
        contactId: journey.contact_id,
        journeyId: journey.id,
        stepId: step?.id || null,
        entityType: "enrollment_activation",
        entityId: activation.id,
        action: "plan_override",
        permission: "plan.override",
        previousValue: previous,
        newValue: {
          program_code: activation.program_code,
          program_name: activation.program_name,
          commitment_months: activation.commitment_months
        },
        completionMethod: "owner_admin_override",
        reason,
        notes,
        metadata: { memberships_updated: (memberships || []).length }
      });

      await admin.from("contact_activity").insert({
        contact_id: journey.contact_id,
        activity_type: "plan_overridden",
        title: "ReVitalized program manually corrected",
        detail: program.name,
        actor_user_id: user.id,
        metadata: { activation_id: activation.id, program_code: program.program_code }
      });

      return json(origin, { ok: true, activation, program });
    }

    if (action === "record_payment") {
      await requirePermission("finance.record_payment");

      const journeyId = String(body.journey_id || "");
      if (!validUuid(journeyId)) return json(origin, { error: "Invalid journey." }, 400);

      const paymentMethod = String(body.payment_method || "");
      const methods = new Set([
        "integrated_processor","external_card","interac_etransfer","ach_bank_transfer",
        "wire_transfer","paypal","cash","check","complimentary_waived","other"
      ]);
      if (!methods.has(paymentMethod)) return json(origin, { error: "Choose a valid payment method." }, 400);

      const amountCents = Math.max(0, Math.round(Number(body.amount_cents || 0)));
      const currency = String(body.currency || "USD").toUpperCase() === "CAD" ? "CAD" : "USD";
      const reference = cleanText(body.reference_number, 300) || null;
      const provider = cleanText(body.provider, 200) || null;
      const receivedAt = body.received_at ? new Date(body.received_at).toISOString() : new Date().toISOString();
      const waived = paymentMethod === "complimentary_waived";

      const { data: journey, error: journeyError } = await admin
        .from("contact_journeys")
        .select("id,contact_id,journey_key")
        .eq("id", journeyId)
        .single();
      if (journeyError) throw journeyError;
      await requirePermission("finance.record_payment", journey.contact_id);

      const { data: step } = await admin
        .from("contact_journey_steps")
        .select("id,status")
        .eq("journey_id", journey.id)
        .eq("step_key", "payment_agreement")
        .maybeSingle();

      let { data: activation, error: activationError } = await admin
        .from("journey_enrollment_activations")
        .select("*")
        .eq("journey_id", journey.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (activationError) throw activationError;
      if(waived){
        if(!activation)return json(origin,{error:"Prepare the enrollment before recording a payment waiver."},409);
        const {error:waiverError}=await caller.rpc("set_enrollment_waiver",{p_activation_id:activation.id,p_agreement_id:null,p_gate:"payment",p_waived:true,p_reason:reason});
        if(waiverError)return json(origin,{error:waiverError.message},403);
        return json(origin,{ok:true,activation_id:activation.id,waived:true});
      }
      if(activation&&activation.currency!==currency)return json(origin,{error:"Payment currency must match the enrollment."},400);

      if (!activation) {
        let programCode = null;
        let programName = null;

        const { data: programTag } = await admin
          .from("contact_tags")
          .select("tag")
          .eq("contact_id", journey.contact_id)
          .like("tag", "program:%")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (programTag?.tag) {
          programCode = String(programTag.tag).replace(/^program:/, "");
          const { data: programRow } = await admin
            .from("program_catalog")
            .select("program_code,name")
            .eq("program_code", programCode)
            .maybeSingle();
          programName = programRow?.name || null;
          if (!programRow) programCode = null;
        }

        const { data: created, error } = await admin
          .from("journey_enrollment_activations")
          .insert({
            contact_id: journey.contact_id,
            journey_id: journey.id,
            journey_step_id: step?.id || null,
            program_code: programCode,
            program_name: programName,
            amount_cents: amountCents,
            currency,
            payment_status: waived ? "waived" : "paid",
            agreement_status: "not_sent",
            payment_completion_method: paymentMethod,
            payment_reference: reference,
            paid_at: waived ? null : receivedAt,
            last_manual_override_at: new Date().toISOString(),
            last_manual_override_by: user.id,
            created_by: user.id
          })
          .select("*")
          .single();
        if (error) throw error;
        activation = created;
      } else {
        const previousActivation = {
          payment_status: activation.payment_status,
          amount_cents: activation.amount_cents,
          currency: activation.currency,
          payment_completion_method: activation.payment_completion_method,
          payment_reference: activation.payment_reference,
          paid_at: activation.paid_at
        };

        const { data: updatedActivation, error } = await admin
          .from("journey_enrollment_activations")
          .update({
            payment_status: "paid",
            payment_completion_method: paymentMethod,
            payment_reference: reference,
            paid_at: waived ? activation.paid_at : receivedAt,
            last_manual_override_at: new Date().toISOString(),
            last_manual_override_by: user.id,
            updated_at: new Date().toISOString()
          })
          .eq("id", activation.id)
          .select("*")
          .single();
        if (error) throw error;

        await audit({
          contactId: journey.contact_id,
          journeyId: journey.id,
          stepId: step?.id || null,
          entityType: "enrollment_activation",
          entityId: activation.id,
          action: waived ? "payment_waived" : "payment_recorded",
          permission: "finance.record_payment",
          previousValue: previousActivation,
          newValue: {
            payment_status: updatedActivation.payment_status,
            amount_cents: updatedActivation.amount_cents,
            currency: updatedActivation.currency,
            payment_completion_method: updatedActivation.payment_completion_method,
            payment_reference: updatedActivation.payment_reference,
            paid_at: updatedActivation.paid_at
          },
          completionMethod: paymentMethod,
          reason,
          notes
        });

        activation = updatedActivation;
      }

      const { data: paymentRecord, error: paymentError } = await admin
        .from("payment_records")
        .insert({
          contact_id: journey.contact_id,
          journey_id: journey.id,
          activation_id: activation.id,
          transaction_type: waived ? "waiver" : "payment",
          status: "recorded",
          amount_cents: waived ? 0 : amountCents,
          currency,
          payment_method: paymentMethod,
          provider,
          reference_number: reference,
          received_at: receivedAt,
          recorded_by: user.id,
          notes,
          metadata: { reason }
        })
        .select("*")
        .single();
      if (paymentError) throw paymentError;

      if (!activationError && activation && !activation.created_by) {
        // no-op; activation already audited above
      }

      if (!activation?.id) throw new Error("Payment activation record was not created.");

      if (!activationError && !activation?.last_manual_override_at) {
        await audit({
          contactId: journey.contact_id,
          journeyId: journey.id,
          stepId: step?.id || null,
          entityType: "payment_record",
          entityId: paymentRecord.id,
          action: waived ? "payment_waived" : "payment_recorded",
          permission: "finance.record_payment",
          previousValue: {},
          newValue: {
            transaction_type: paymentRecord.transaction_type,
            amount_cents: paymentRecord.amount_cents,
            currency: paymentRecord.currency,
            payment_method: paymentRecord.payment_method,
            reference_number: paymentRecord.reference_number,
            received_at: paymentRecord.received_at
          },
          completionMethod: paymentMethod,
          reason,
          notes
        });
      } else {
        await audit({
          contactId: journey.contact_id,
          journeyId: journey.id,
          stepId: step?.id || null,
          entityType: "payment_record",
          entityId: paymentRecord.id,
          action: waived ? "payment_waiver_receipt_created" : "payment_receipt_created",
          permission: "finance.record_payment",
          previousValue: {},
          newValue: {
            transaction_type: paymentRecord.transaction_type,
            amount_cents: paymentRecord.amount_cents,
            currency: paymentRecord.currency,
            payment_method: paymentRecord.payment_method,
            reference_number: paymentRecord.reference_number,
            received_at: paymentRecord.received_at
          },
          completionMethod: paymentMethod,
          reason,
          notes
        });
      }

      await admin.from("contact_activity").insert({
        contact_id: journey.contact_id,
        activity_type: waived ? "manual_payment_waived" : "manual_payment_recorded",
        title: waived ? "Payment requirement manually waived" : "External payment recorded",
        detail: waived
          ? "Owner/Admin waiver"
          : currency + " " + (amountCents / 100).toFixed(2) + " · " + paymentMethod,
        actor_user_id: user.id,
        metadata: {
          payment_record_id: paymentRecord.id,
          activation_id: activation.id,
          reference_number: reference
        }
      });

      return json(origin, { ok: true, payment_record: paymentRecord, activation });
    }

    if (action === "reverse_payment") {
      await requirePermission("finance.reverse_payment");

      const paymentId = String(body.payment_id || "");
      if (!validUuid(paymentId)) return json(origin, { error: "Invalid payment record." }, 400);

      const { data: payment, error: paymentError } = await admin
        .from("payment_records")
        .select("*")
        .eq("id", paymentId)
        .maybeSingle();
      if (paymentError) throw paymentError;
      if (!payment) return json(origin, { error: "Payment record not found." }, 404);
      if (payment.status !== "recorded") return json(origin, { error: "This payment record is already reversed or voided." }, 409);

      const now = new Date().toISOString();
      const { data: reversed, error: reverseError } = await admin
        .from("payment_records")
        .update({
          status: "reversed",
          reversed_at: now,
          reversed_by: user.id,
          reversal_reason: reason
        })
        .eq("id", payment.id)
        .select("*")
        .single();
      if (reverseError) throw reverseError;
      await requirePermission("finance.reverse_payment", payment.contact_id);

      let activation = null;
      if (payment.activation_id) {
        const { data: remaining } = await admin
          .from("payment_records")
          .select("id")
          .eq("activation_id", payment.activation_id)
          .eq("status", "recorded")
          .in("transaction_type", ["payment","waiver"])
          .neq("id", payment.id)
          .limit(1);

        if (!(remaining || []).length) {
          const { data: updatedActivation, error } = await admin
            .from("journey_enrollment_activations")
            .update({
              payment_status: "pending",
              payment_completion_method: null,
              payment_reference: null,
              last_manual_override_at: now,
              last_manual_override_by: user.id,
              updated_at: now
            })
            .eq("id", payment.activation_id)
            .select("*")
            .single();
          if (error) throw error;
          activation = updatedActivation;

          const { data: paymentStep } = await admin
            .from("contact_journey_steps")
            .select("id")
            .eq("journey_id", updatedActivation.journey_id)
            .eq("step_key", "payment_agreement")
            .maybeSingle();

          if (paymentStep?.id) {
            await admin
              .from("contact_journey_steps")
              .update({
                status: "in_progress",
                completed_at: null,
                completion_source: "manual_payment_reversal",
                updated_at: now
              })
              .eq("id", paymentStep.id);

            await admin
              .from("contact_journeys")
              .update({
                current_step_key: "payment_agreement",
                status: "active",
                completed_at: null,
                last_activity_at: now,
                updated_at: now
              })
              .eq("id", updatedActivation.journey_id);
          }
        }
      }

      await audit({
        contactId: payment.contact_id,
        journeyId: payment.journey_id,
        entityType: "payment_record",
        entityId: payment.id,
        action: "payment_reversed",
        permission: "finance.reverse_payment",
        previousValue: { status: payment.status },
        newValue: { status: reversed.status, reversed_at: reversed.reversed_at },
        completionMethod: payment.payment_method,
        reason,
        notes
      });

      return json(origin, { ok: true, payment_record: reversed, activation });
    }

    if (action === "agreement_override") {
      await requirePermission("agreement.override");

      const activationId = String(body.activation_id || "");
      const targetStatus = String(body.agreement_status || "");
      if (!validUuid(activationId)) return json(origin, { error: "Invalid enrollment activation." }, 400);
      if (!new Set(["not_sent","sent","signed","waived","declined"]).has(targetStatus)) {
        return json(origin, { error: "Invalid agreement status." }, 400);
      }

      const { data: activation, error } = await admin
        .from("journey_enrollment_activations")
        .select("*")
        .eq("id", activationId)
        .single();
      if (error) throw error;
      await requirePermission("agreement.override", activation.contact_id);
      if(targetStatus==="waived"){
        const agreementId=String(body.client_agreement_id||"");
        if(!validUuid(agreementId))return json(origin,{error:"Select the individual required agreement to waive."},400);
        const {error:waiverError}=await caller.rpc("set_enrollment_waiver",{p_activation_id:activation.id,p_agreement_id:agreementId,p_gate:"agreement",p_waived:true,p_reason:reason});
        if(waiverError)return json(origin,{error:waiverError.message},403);
        return json(origin,{ok:true,activation_id:activation.id,waived:true});
      }

      const previous = {
        agreement_status: activation.agreement_status,
        agreement_signed_at: activation.agreement_signed_at,
        agreement_completion_method: activation.agreement_completion_method
      };
      const now = new Date().toISOString();
      const completionMethod = cleanText(body.completion_method, 120) || "manual_owner_admin";

      const { data: updated, error: updateError } = await admin
        .from("journey_enrollment_activations")
        .update({
          agreement_status: targetStatus,
          agreement_signed_at: targetStatus === "signed" ? (activation.agreement_signed_at || now) : activation.agreement_signed_at,
          agreement_completion_method: completionMethod,
          last_manual_override_at: now,
          last_manual_override_by: user.id,
          updated_at: now
        })
        .eq("id", activation.id)
        .select("*")
        .single();
      if (updateError) throw updateError;

      if (!["signed","waived"].includes(targetStatus)) {
        const { data: paymentStep } = await admin
          .from("contact_journey_steps")
          .select("id")
          .eq("journey_id", activation.journey_id)
          .eq("step_key", "payment_agreement")
          .maybeSingle();

        if (paymentStep?.id) {
          await admin
            .from("contact_journey_steps")
            .update({
              status: "in_progress",
              completed_at: null,
              completion_source: "manual_agreement_correction",
              updated_at: now
            })
            .eq("id", paymentStep.id);

          await admin
            .from("contact_journeys")
            .update({
              current_step_key: "payment_agreement",
              status: "active",
              completed_at: null,
              last_activity_at: now,
              updated_at: now
            })
            .eq("id", activation.journey_id);
        }
      }

      await audit({
        contactId: activation.contact_id,
        journeyId: activation.journey_id,
        stepId: activation.journey_step_id,
        entityType: "enrollment_activation",
        entityId: activation.id,
        action: "agreement_override",
        permission: "agreement.override",
        previousValue: previous,
        newValue: {
          agreement_status: updated.agreement_status,
          agreement_signed_at: updated.agreement_signed_at,
          agreement_completion_method: updated.agreement_completion_method
        },
        completionMethod,
        reason,
        notes
      });

      return json(origin, { ok: true, activation: updated });
    }

    if (action === "access_override") {
      await requirePermission("membership.access_override");

      const activationId = String(body.activation_id || "");
      const targetStatus = String(body.access_status || "");
      if (!validUuid(activationId)) return json(origin, { error: "Invalid enrollment activation." }, 400);
      if (!new Set(["pending","ready","active","suspended"]).has(targetStatus)) {
        return json(origin, { error: "Invalid access status." }, 400);
      }

      const { data: activation, error } = await admin
        .from("journey_enrollment_activations")
        .select("*")
        .eq("id", activationId)
        .single();
      if (error) throw error;
      await requirePermission("membership.access_override", activation.contact_id);

      const previous = {
        access_status: activation.access_status,
        access_completion_method: activation.access_completion_method
      };
      const now = new Date().toISOString();
      const completionMethod = cleanText(body.completion_method, 120) || "manual_owner_admin";

      const { data: updated, error: updateError } = await admin
        .from("journey_enrollment_activations")
        .update({
          access_status: targetStatus,
          access_completion_method: completionMethod,
          last_manual_override_at: now,
          last_manual_override_by: user.id,
          updated_at: now
        })
        .eq("id", activation.id)
        .select("*")
        .single();
      if (updateError) throw updateError;

      await audit({
        contactId: activation.contact_id,
        journeyId: activation.journey_id,
        stepId: activation.journey_step_id,
        entityType: "enrollment_activation",
        entityId: activation.id,
        action: "membership_access_override",
        permission: "membership.access_override",
        previousValue: previous,
        newValue: {
          access_status: updated.access_status,
          access_completion_method: updated.access_completion_method
        },
        completionMethod,
        reason,
        notes
      });

      return json(origin, { ok: true, activation: updated });
    }

    return json(origin, { error: "Invalid override action." }, 400);
  } catch (error) {
    console.error(error);
    const status = Number((error as any)?.status || 500);
    return json(origin, { error: error instanceof Error ? error.message : "Unable to apply this override." }, status);
  }
}
