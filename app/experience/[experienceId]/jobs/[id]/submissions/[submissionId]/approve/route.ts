import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { whopsdk } from "@/lib/whop-sdk";

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      experienceId: string;
      id: string;
      submissionId: string;
    }>;
  }
) {
  const { experienceId, id: jobId, submissionId } = await context.params;

 
  /* -------------------------------------------------------
   * 1. Verify requester (ONLY reliable identity)
   * ----------------------------------------------------- */
  const h = await headers();
  let requester_whop_user_id: string | null = null;

  try {
    const verified = await whopsdk.verifyUserToken(h);
    requester_whop_user_id = verified.userId ?? null;
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!requester_whop_user_id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  /* -------------------------------------------------------
   * 2. Load job (ownership + EXPERIENCE check)
   * ----------------------------------------------------- */
  const { data: job, error: jobError } = await supabaseServer
    .from("jobs")
    .select(
      `
      id,
      creator_whop_user_id,
      status,
      payout_cents,
      approved_submission_id,
      experience_id
      `
    )
    .eq("id", jobId)
    .eq("experience_id", experienceId)
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.creator_whop_user_id !== requester_whop_user_id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  if (job.status !== "open") {
    return NextResponse.json({ error: "Job already closed" }, { status: 400 });
  }

  if (job.approved_submission_id) {
    return NextResponse.json(
      { error: "Payment already started for this job" },
      { status: 400 }
    );
  }

  /* -------------------------------------------------------
   * 3. Load submission (must belong to job + EXPERIENCE)
   * ----------------------------------------------------- */
  const { data: submission, error: subError } = await supabaseServer
    .from("submissions")
    .select("id, worker_whop_user_id, experience_id")
    .eq("id", submissionId)
    .eq("job_id", jobId)
    .eq("experience_id", experienceId)
    .single();

  if (subError || !submission) {
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 }
    );
  }

  /* -------------------------------------------------------
   * 4. Calculate fees
   * ----------------------------------------------------- */
  const platformFeeBps = 800; // 8%
  const payoutCents = job.payout_cents ?? 0;
  const platformFeeCents = Math.round(
    (payoutCents * platformFeeBps) / 10000
  );
  const totalChargeCents = payoutCents + platformFeeCents;
  const totalChargeUsd = Number((totalChargeCents / 100).toFixed(2));

  /* -------------------------------------------------------
 * 5. IMPORTANT: Return to SAME iframe origin
 * ----------------------------------------------------- */
const origin =
h.get("origin") ??
h.get("x-forwarded-origin") ??
h.get("referer")?.split("/").slice(0, 3).join("/");

if (!origin) {
return NextResponse.json(
  { error: "Unable to determine iframe origin" },
  { status: 500 }
);
}

const returnUrl = `${origin}/experience/${experienceId}/my-jobs?payment=success`;


  /* -------------------------------------------------------
   * 6. Create Whop checkout
   * ----------------------------------------------------- */
  const checkout = await whopsdk.checkoutConfigurations.create({
	redirect_url: returnUrl,
	metadata: {
	  jobId,
	  submissionId,
	  workerWhopUserId: submission.worker_whop_user_id,
	  payoutCents,
	  platformFeeBps,
	  platformFeeCents,
	  totalChargeCents,
	  experienceId,
	},
	plan: {
	  company_id: process.env.WHOP_COMPANY_ID!,
	  currency: "usd",
	  plan_type: "one_time",
	  initial_price: totalChargeUsd,
	},
 } as any);

 console.error("🧾 CHECKOUT CREATED", {
	checkoutId: checkout?.id,
	planId: (checkout as any)?.plan?.id,
	purchaseUrl: checkout?.purchase_url,
 });
 
 
 
  /* -------------------------------------------------------
   * 7. Store pending payment state
   * ----------------------------------------------------- */
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
    .eq("id", jobId)
    .eq("experience_id", experienceId);

  if (jobErr) {
    return NextResponse.json({ error: jobErr.message }, { status: 500 });
  }

  /* -------------------------------------------------------
   * 8. Redirect to checkout
   * ----------------------------------------------------- */
  return NextResponse.redirect(checkout.purchase_url, 303);
}
































































































