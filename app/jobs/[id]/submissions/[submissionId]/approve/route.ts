import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { whopsdk } from "@/lib/whop-sdk";
import { getDeploymentId } from "@/lib/whop/getDeploymentId";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
  const { id: jobId, submissionId } = await params;

  /* -------------------------------------------------------
   * 1. Verify requester (ONLY reliable identity)
   * ----------------------------------------------------- */
  const h = await headers();

  let requester_whop_user_id: string | null = null;
  try {
    const verified = await whopsdk.verifyUserToken(h);
    requester_whop_user_id = verified.userId ?? null;
  } catch {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  if (!requester_whop_user_id) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  /* -------------------------------------------------------
   * 2. Get deployment context
   * ----------------------------------------------------- */
  const deployment_id = await getDeploymentId();
  if (!deployment_id) {
    return NextResponse.json(
      { error: "Missing deployment context" },
      { status: 400 }
    );
  }

  /* -------------------------------------------------------
   * 3. Load job (ownership + deployment check)
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
      deployment_id
      `
    )
    .eq("id", jobId)
    .single();

  if (jobError || !job) {
    return NextResponse.json(
      { error: "Job not found" },
      { status: 404 }
    );
  }

  if (job.deployment_id !== deployment_id) {
    return NextResponse.json(
      { error: "Unauthorized job access" },
      { status: 403 }
    );
  }

  if (job.creator_whop_user_id !== requester_whop_user_id) {
    return NextResponse.json(
      { error: "Not authorized" },
      { status: 403 }
    );
  }

  if (job.status !== "open") {
    return NextResponse.json(
      { error: "Job already closed" },
      { status: 400 }
    );
  }

  if (job.approved_submission_id) {
    return NextResponse.json(
      { error: "Payment already started for this job" },
      { status: 400 }
    );
  }

  /* -------------------------------------------------------
   * 4. Load submission (must belong to job + deployment)
   * ----------------------------------------------------- */
  const { data: submission, error: subError } = await supabaseServer
    .from("submissions")
    .select("id, worker_whop_user_id, deployment_id")
    .eq("id", submissionId)
    .eq("job_id", jobId)
    .single();

  if (subError || !submission) {
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 }
    );
  }

  if (submission.deployment_id !== deployment_id) {
    return NextResponse.json(
      { error: "Unauthorized submission access" },
      { status: 403 }
    );
  }

  /* -------------------------------------------------------
   * 5. Calculate fees
   * ----------------------------------------------------- */
  const platformFeeBps = 800; // 8%
  const payoutCents = job.payout_cents ?? 0;
  const platformFeeCents = Math.round(
    (payoutCents * platformFeeBps) / 10000
  );
  const totalChargeCents = payoutCents + platformFeeCents;
  const totalChargeUsd = Number((totalChargeCents / 100).toFixed(2));

  /* -------------------------------------------------------
   * 6. IMPORTANT: Return to Whop iframe domain
   * ----------------------------------------------------- */
  const returnUrl =
    process.env.NODE_ENV === "production"
      ? `https://${deployment_id}.apps.whop.com/my-jobs?payment=success`
      : "http://localhost:3000/my-jobs?payment=success";

  /* -------------------------------------------------------
   * 7. Create Whop checkout
   * ----------------------------------------------------- */
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
      deployment_id,
    },
    plan: {
      company_id: process.env.WHOP_COMPANY_ID!,
      currency: "usd",
      plan_type: "one_time",
      initial_price: totalChargeUsd,
    },
  } as any);

  /* -------------------------------------------------------
   * 8. Store pending payment state
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
    .eq("id", jobId);

  if (jobErr) {
    return NextResponse.json(
      { error: jobErr.message },
      { status: 500 }
    );
  }

  /* -------------------------------------------------------
   * 9. Redirect to checkout
   * ----------------------------------------------------- */
  return NextResponse.redirect(checkout.purchase_url, 303);
}
