import { waitUntil } from "@vercel/functions";
import type { Payment } from "@whop/sdk/resources.js";
import type { NextRequest } from "next/server";
import { whopsdk } from "@/lib/whop-sdk";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(request: NextRequest): Promise<Response> {
	console.error("🟣 WEBHOOK POST HIT (RAW)");



  const body = await request.text();
  const headers = Object.fromEntries(request.headers);

  let webhookData;
  try {
    webhookData = whopsdk.webhooks.unwrap(body, { headers });
	 console.error("🟢 WEBHOOK UNWRAP OK", webhookData?.type);
  } catch (err) {
    console.error("[WEBHOOK] ❌ Invalid signature", err);
    return new Response("Invalid webhook", { status: 400 });
  }

  const eventType = webhookData.type as string;

  console.error("🔥🔥🔥 WEBHOOK EVENT RECEIVED:", eventType);

  // TEMP DEBUG: run handler for ALL events so we can see what Whop actually sends
  waitUntil(handlePaymentSucceeded(webhookData.data as any));
  


  return new Response("OK", { status: 200 });
}

async function handlePaymentSucceeded(payment: Payment) {
  try {

	    // ✅ Webhook idempotency (only skip if we already COMPLETED the full workflow)
		 const { data: processed } = await supabaseServer
		 .from("processed_webhooks")
		 .select("id")
		 .eq("id", payment.id)
		 .maybeSingle();
 
	  if (processed) {
		 console.log("[WEBHOOK] ⏭ Already completed", payment.id);
		 return;
	  }
 
	



	  const paymentAny = payment as any;
	  const metadata = paymentAny.metadata;
	  

const jobId = metadata?.jobId;
const experienceId = metadata?.experienceId;

if (!jobId || !experienceId) {
  console.error(
    "[PAYMENT] ❌ Missing jobId or experienceId in payment metadata",
    payment.id,
    metadata
  );
  return;
}




const { data: job } = await supabaseServer
  .from("jobs")
  .select(
    `
    id,
    payment_status,
    whop_payment_id,
    approved_submission_id,
    payout_cents,
    experience_id
    `
  )
  .eq("id", jobId)
.eq("experience_id", experienceId)
  .single();


  if (!job) {
	console.error("[PAYMENT] ❌ Job not found", {
	  jobId,
	  experienceId,
	});
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
	     // ✅ Mark webhook as COMPLETED only after we've finished the workflow
		  const { error: processedErr } = await supabaseServer
		  .from("processed_webhooks")
		  .insert({
			 id: payment.id,
			 type: "payment.succeeded",
		  });
  
		if (processedErr) {
		  console.error("[WEBHOOK] ❌ Failed to record processed webhook", processedErr);
		  // NOTE: Don't return/error here — job is already updated, this is just bookkeeping.
		}
  
  } catch (err) {
    console.error("[PAYMENT SUCCEEDED] ❌ Handler crashed", err);
  }
}



