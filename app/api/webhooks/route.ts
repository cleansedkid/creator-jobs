import { waitUntil } from "@vercel/functions";
import type { Payment } from "@whop/sdk/resources.js";
import type { NextRequest } from "next/server";
import { whopsdk } from "@/lib/whop-sdk";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(request: NextRequest): Promise<Response> {
  const body = await request.text();
  const headers = Object.fromEntries(request.headers);

  let webhookData;
  try {
    webhookData = whopsdk.webhooks.unwrap(body, { headers });
  } catch (err) {
    console.error("[WEBHOOK] ❌ Invalid signature", err);
    return new Response("Invalid webhook", { status: 400 });
  }

  if (webhookData.type === "payment.succeeded") {
    waitUntil(handlePaymentSucceeded(webhookData.data));
  }

  return new Response("OK", { status: 200 });
}

async function handlePaymentSucceeded(payment: Payment) {
  try {
	const p = payment as unknown as Record<string, any>;

	// Whop sends a checkout identifier, but the SDK typings may not expose it.
	// Try the common possibilities.
	const checkoutId =
	  p.checkout_id ||
	  p.checkoutId ||
	  p.checkout_configuration_id ||
	  p.checkoutConfigurationId ||
	  p.checkout?.id ||
	  null;
	

    if (!checkoutId) {
      console.error("[PAYMENT] ❌ Missing checkout_id", payment.id);
      return;
    }

    /* -------------------------------------------------
     * 1️⃣ Load job by checkout ID (SOURCE OF TRUTH)
     * ------------------------------------------------- */
    const { data: job } = await supabaseServer
      .from("jobs")
      .select(
        `
        id,
        payment_status,
        whop_payment_id,
        approved_submission_id,
        payout_cents
        `
      )
      .eq("whop_checkout_id", checkoutId)
      .single();

    if (!job) {
      console.error("[PAYMENT] ❌ No job found for checkout", checkoutId);
      return;
    }

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
      .update({ status: "approved" })
      .eq("id", submission.id);

    await supabaseServer
      .from("submissions")
      .update({ status: "rejected" })
      .eq("job_id", job.id)
      .neq("id", submission.id)
      .eq("status", "pending");

    /* -------------------------------------------------
     * 5️⃣ Transfer payout to worker
     * ------------------------------------------------- */
    const payoutUsd = Number(((job.payout_cents ?? 0) / 100).toFixed(2));

    try {
      const transfer = await whopsdk.transfers.create({
        amount: payoutUsd,
        currency: "usd",
        destination_id: submission.worker_whop_user_id,
        origin_id: process.env.WHOP_COMPANY_ID!,
        idempotence_key: payment.id,
        metadata: {
          jobId: job.id,
          submissionId: submission.id,
          whopPaymentId: payment.id,
        },
      } as any);

      console.log("[PAYOUT SENT] ✅", {
        jobId: job.id,
        transferId: transfer.id,
      });
    } catch (transferErr) {
      console.error(
        "[PAYOUT FAILED] ❌ Worker may not be payout-enabled",
        transferErr
      );
    }
  } catch (err) {
    console.error("[PAYMENT SUCCEEDED] ❌ Handler crashed", err);
  }
}



