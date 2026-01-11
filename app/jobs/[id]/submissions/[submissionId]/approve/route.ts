import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getWhopUserId } from "@/lib/whop/getUserId";
import { whopsdk } from "@/lib/whop-sdk";


export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
  const { id: jobId, submissionId } = await params;



  // Load job to verify creator
  const { data: job } = await supabaseServer
  .from("jobs")
  .select("id, creator_whop_user_id, status, payout_cents, approved_submission_id")
  .eq("id", jobId)
  .single();

  const { data: submission } = await supabaseServer
  .from("submissions")
  .select("id, worker_whop_user_id")
  .eq("id", submissionId)
  .eq("job_id", jobId)
  .single();

if (!submission) {
  return NextResponse.json({ error: "Submission not found" }, { status: 404 });
}



  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  
  let userId = await getWhopUserId();

// 🧪 Local dev override
if (process.env.NODE_ENV !== "production") {
  userId = job.creator_whop_user_id;
}


  if (job.status !== "open") {
	return NextResponse.json(
	  { error: "Job already closed" },
	  { status: 400 }
	);
 }
 

  if (job.creator_whop_user_id !== userId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

    // 🔒 Prevent double-approval / double-payment
	 if (job.approved_submission_id) {
		return NextResponse.json(
		  { error: "Payment already started for this job" },
		  { status: 400 }
		);
	 }
  
	 // 💸 Calculate platform fee (8%)
	 const platformFeeBps = 800; // 8%
	 const payoutCents = job.payout_cents ?? 0;
	 const platformFeeCents = Math.round(
		(payoutCents * platformFeeBps) / 10000
	 );
	 const totalChargeCents = payoutCents + platformFeeCents;
  
	 // Whop expects USD decimal
	 const totalChargeUsd = Number((totalChargeCents / 100).toFixed(2));
  
	 // After payment, send creator back here
	 const returnUrl =
  process.env.NODE_ENV === "production"
    ? "https://creator-jobs.vercel.app/my-jobs?payment=success"
    : "https://example.com/payment-complete";


	 // ✅ Create Whop checkout
	 const checkout = await whopsdk.checkoutConfigurations.create({
		mode: "payment",
		redirect_url: returnUrl,
		metadata: {
		  jobId,
		  submissionId,
		  workerWhopUserId: submission.worker_whop_user_id,
		  payoutCents,
		  platformFeeBps,
		  platformFeeCents,
		  totalChargeCents,
		},
		plan: {
		  company_id: process.env.WHOP_COMPANY_ID!,
		  currency: "usd",
		  plan_type: "one_time",
		  initial_price: totalChargeUsd,
		},
	 } as any);
	 
  
	 // Store pending payment state on the job
	 const { error: jobErr } = await supabaseServer
		.from("jobs")
		.update({
		  approved_submission_id: submissionId,
		  platform_fee_bps: platformFeeBps,
		  platform_fee_cents: platformFeeCents,
		  total_charge_cents: totalChargeCents,
		  payment_status: "requires_payment",
		  whop_checkout_id: checkout.id,
		})
		.eq("id", jobId);
  
	 if (jobErr) {
		return NextResponse.json({ error: jobErr.message }, { status: 500 });
	 }
  
	 // 🚀 Redirect creator to Whop checkout
	 return NextResponse.redirect(checkout.purchase_url, 303);
  

}
