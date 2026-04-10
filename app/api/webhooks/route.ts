import { waitUntil } from "@vercel/functions";
import type { Payment } from "@whop/sdk/resources.js";
import type { NextRequest } from "next/server";
import { whopsdk } from "@/lib/whop-sdk";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(request: NextRequest): Promise<Response> {
	console.error("🟣 WEBHOOK HIT TOP", {
		vercelEnv: process.env.VERCEL_ENV,
		vercelUrl: process.env.VERCEL_URL,
		commit: process.env.VERCEL_GIT_COMMIT_SHA,
	 });
	 
  const body = await request.text();
  const headers = Object.fromEntries(request.headers);

  let webhookData;
  try {
    webhookData = whopsdk.webhooks.unwrap(body, { headers });
  } catch (err) {
    console.error("[WEBHOOK] ❌ Invalid signature", err);
    return new Response("Invalid webhook", { status: 400 });
  }

  console.error("[WEBHOOK] TYPE", webhookData.type);

if (
  webhookData.type === "payment.succeeded" ||
  webhookData.type === "payment_succeeded"
) {
  waitUntil(handlePaymentSucceeded(webhookData.data));
}

  return new Response("OK", { status: 200 });
}

async function handlePaymentSucceeded(payment: Payment) {
  try {
	const p = payment as unknown as Record<string, any>;

	console.error("🔍 PAYMENT KEYS", Object.keys(p));
console.error("🔍 PAYMENT RAW", p);


	
 /* -------------------------------------------------
 * 1️⃣ Resolve job from metadata first, then checkout fallback
 * ------------------------------------------------- */
const meta = (p.metadata ?? {}) as any;

const metaJobId = meta.jobId ?? null;
const metaExperienceId = meta.experienceId ?? null;
const metaWorkerCompanyId = meta.workerCompanyId ?? null;

const paymentCheckoutId =
  p.checkout_id ??
  p.checkout?.id ??
  p.checkoutId ??
  null;

let job: any = null;

// Try metadata first
if (metaJobId && metaExperienceId) {
  const { data } = await supabaseServer
    .from("jobs")
    .select(
      `
      id,
      experience_id,
      payment_status,
      whop_payment_id,
      approved_submission_id,
      payout_cents,
      worker_company_id,
      whop_checkout_id
      `
    )
    .eq("id", metaJobId)
    .eq("experience_id", metaExperienceId)
    .single();

  job = data ?? null;
}

// Fallback: try checkout id
if (!job && paymentCheckoutId) {
  const { data } = await supabaseServer
    .from("jobs")
    .select(
      `
      id,
      experience_id,
      payment_status,
      whop_payment_id,
      approved_submission_id,
      payout_cents,
      worker_company_id,
      whop_checkout_id
      `
    )
    .eq("whop_checkout_id", paymentCheckoutId)
    .single();

  job = data ?? null;
}

if (!job) {
  console.error("[PAYMENT] ❌ Could not resolve job from payment", {
    paymentId: payment.id,
    metadata: meta,
    paymentCheckoutId,
  });
  return;
}

console.error("[PAYMENT] ✅ JOB RESOLVED", {
  paymentId: payment.id,
  jobId: job.id,
  experienceId: job.experience_id,
  metaJobId,
  metaExperienceId,
  metaWorkerCompanyId,
  paymentCheckoutId,
  storedCheckoutId: job.whop_checkout_id,
  jobWorkerCompanyId: job.worker_company_id,
});


    // Idempotency guard
    if (
      job.payment_status === "paid" ||
      job.whop_payment_id === payment.id
    ) {
      console.log("[PAYMENT] ⏭ Already processed", job.id);
      return;
    }

    if (!job.approved_submission_id) {
      console.error(
        "[PAYMENT] ❌ Job missing approved_submission_id",
        job.id
      );
      return;
    }

    /* -------------------------------------------------
     * 2️⃣ Load winning submission
     * ------------------------------------------------- */
    const { data: submission } = await supabaseServer
      .from("submissions")
      .select("id, worker_whop_user_id")
      .eq("id", job.approved_submission_id)
      .single();

    if (!submission) {
      console.error(
        "[PAYMENT] ❌ Approved submission not found",
        job.approved_submission_id
      );
      return;
    }

    /* -------------------------------------------------
     * 3️⃣ Mark job as paid + closed
     * ------------------------------------------------- */
    const { error: jobErr } = await supabaseServer
      .from("jobs")
      .update({
        payment_status: "paid",
        whop_payment_id: payment.id,
        paid_at: new Date().toISOString(),
        status: "closed",
        closed_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    if (jobErr) {
      console.error("[PAYMENT] ❌ Job update failed", jobErr);
      return;
    }

    /* -------------------------------------------------
     * 4️⃣ Approve winning submission & reject others
     * ------------------------------------------------- */
    await supabaseServer
      .from("submissions")
      .update({ status: "paid" })
      .eq("id", submission.id);

    await supabaseServer
      .from("submissions")
      .update({ status: "rejected" })
      .eq("job_id", job.id)
      .neq("id", submission.id)
      .eq("status", "pending");

    
  } catch (err) {
    console.error("[PAYMENT SUCCEEDED] ❌ Handler crashed", err);
  }
}