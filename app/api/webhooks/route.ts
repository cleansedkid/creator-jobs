import { waitUntil } from "@vercel/functions";
import type { Payment } from "@whop/sdk/resources.js";
import type { NextRequest } from "next/server";
import { whopsdk } from "@/lib/whop-sdk";
import { supabaseServer } from "@/lib/supabase/server";


export async function POST(request: NextRequest): Promise<Response> {
	// Validate the webhook to ensure it's from Whop
	const requestBodyText = await request.text();
	const headers = Object.fromEntries(request.headers);
	const webhookData = whopsdk.webhooks.unwrap(requestBodyText, { headers });

	// Handle the webhook event
	if (webhookData.type === "payment.succeeded") {
		waitUntil(handlePaymentSucceeded(webhookData.data));
	}

	// Make sure to return a 2xx status code quickly. Otherwise the webhook will be retried.
	return new Response("OK", { status: 200 });
}

async function handlePaymentSucceeded(payment: Payment) {
	try {
		const md = (payment.metadata || {}) as any;

		const jobId = md.jobId as string | undefined;
		const submissionId = md.submissionId as string | undefined;
		const workerWhopUserId = md.workerWhopUserId as string | undefined;
		const payoutCents = Number(md.payoutCents ?? 0);

		if (!jobId || !submissionId || !workerWhopUserId) {
			console.error("[PAYMENT SUCCEEDED] Missing metadata", md);
			return;
		}

		// ✅ Idempotency: prevent double fulfillment
		const { data: existingJob } = await supabaseServer
			.from("jobs")
			.select("id, whop_payment_id, payment_status")
			.eq("id", jobId)
			.single();

		if (
			existingJob?.whop_payment_id === payment.id ||
			existingJob?.payment_status === "paid"
		) {
			console.log("[PAYMENT SUCCEEDED] already fulfilled", jobId);
			return;
		}

		// 1️⃣ Mark job as paid + closed
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
			console.error("[PAYMENT SUCCEEDED] job update failed", jobErr);
			return;
		}

		// 2️⃣ Approve the winning submission
		const { error: subErr } = await supabaseServer
			.from("submissions")
			.update({ status: "approved" })
			.eq("id", submissionId)
			.eq("job_id", jobId);

		if (subErr) {
			console.error("[PAYMENT SUCCEEDED] submission update failed", subErr);
			return;
		}

		// 3️⃣ Reject all other pending submissions
		await supabaseServer
			.from("submissions")
			.update({ status: "rejected" })
			.eq("job_id", jobId)
			.neq("id", submissionId)
			.eq("status", "pending");

		// 4️⃣ Pay the worker via Whop transfer
		const payoutUsd = Number((payoutCents / 100).toFixed(2));

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
		});

		console.log("[FULFILLED JOB]", {
			jobId,
			transferId: transfer.id,
		});
	} catch (err) {
		console.error("[PAYMENT SUCCEEDED] handler error", err);
	}
}
