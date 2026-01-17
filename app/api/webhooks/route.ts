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
    console.error("[WEBHOOK] Invalid signature", err);
    return new Response("Invalid webhook", { status: 400 });
  }

  if (webhookData.type === "payment.succeeded") {
    waitUntil(handlePaymentSucceeded(webhookData.data));
  }

  return new Response("OK", { status: 200 });
}

async function handlePaymentSucceeded(
  payment: Payment & { metadata?: Record<string, any> }
) {
  try {
    const md = payment.metadata ?? {};

    const jobId = md.jobId as string | undefined;
    const submissionId = md.submissionId as string | undefined;
    const workerWhopUserId = md.workerWhopUserId as string | undefined;
    const deployment_id = md.deployment_id as string | undefined;
    const payoutCents = Number(md.payoutCents ?? 0);

    if (!jobId || !submissionId || !workerWhopUserId || !deployment_id) {
      console.error("[PAYMENT SUCCEEDED] Missing metadata", md);
      return;
    }

    /* -------------------------------------------------
     * Idempotency check
     * ------------------------------------------------- */
    const { data: job } = await supabaseServer
      .from("jobs")
      .select("id, payment_status, whop_payment_id, deployment_id")
      .eq("id", jobId)
      .single();

    if (!job || job.deployment_id !== deployment_id) {
      console.error("[PAYMENT] job not found or wrong deployment", jobId);
      return;
    }

    if (
      job.payment_status === "paid" ||
      job.whop_payment_id === payment.id
    ) {
      console.log("[PAYMENT] already processed", jobId);
      return;
    }

    /* -------------------------------------------------
     * 1️⃣ Close job + mark paid
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
      .eq("id", jobId);

    if (jobErr) {
      console.error("[PAYMENT] job update failed", jobErr);
      return;
    }

    /* -------------------------------------------------
     * 2️⃣ Approve winning submission
     * ------------------------------------------------- */
    await supabaseServer
      .from("submissions")
      .update({ status: "approved" })
      .eq("id", submissionId)
      .eq("job_id", jobId);

    await supabaseServer
      .from("submissions")
      .update({ status: "rejected" })
      .eq("job_id", jobId)
      .neq("id", submissionId)
      .eq("status", "pending");

    /* -------------------------------------------------
     * 3️⃣ Transfer payout to worker
     * ------------------------------------------------- */
    const payoutUsd = Number((payoutCents / 100).toFixed(2));

    try {
      const transfer = await whopsdk.transfers.create({
        amount: payoutUsd,
        currency: "usd",
        destination_id: workerWhopUserId,
        origin_id: process.env.WHOP_COMPANY_ID!,
        idempotence_key: payment.id,
        metadata: {
          jobId,
          submissionId,
          whopPaymentId: payment.id,
        },
      } as any);

      console.log("[PAYOUT SENT]", {
        jobId,
        transferId: transfer.id,
      });
    } catch (transferErr) {
      console.error(
        "[PAYOUT FAILED] worker may not be payout-enabled",
        transferErr
      );
    }
  } catch (err) {
    console.error("[PAYMENT SUCCEEDED] handler crashed", err);
  }
}

