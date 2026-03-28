import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/whop/getAuthContext";
import { headers } from "next/headers";
import { getOrCreateWorkerCompany } from "@/lib/whop/getOrCreateWorkerCompany";
import { createWorkerCheckoutConfiguration } from "@/lib/whop/createWorkerCheckoutConfiguration";

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
   * 1. Verify requester (admin only)
   * ----------------------------------------------------- */
  const auth = await getAuthContext(experienceId);

  if (!auth?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const requester_whop_user_id = auth.userId;

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

  const isJobCreator = job.creator_whop_user_id === requester_whop_user_id;

  if (!isJobCreator && !auth.isAdmin) {
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
   * 4. Get or create worker connected company
   * ----------------------------------------------------- */
  let workerAccount;
  try {
    workerAccount = await getOrCreateWorkerCompany({
      whopUserId: submission.worker_whop_user_id,
    });
  } catch (error) {
    console.error("❌ WORKER COMPANY SETUP FAILED", error);
    return NextResponse.json(
      { error: "Failed to prepare worker payout account" },
      { status: 500 }
    );
  }

  const workerCompanyId = workerAccount.worker_company_id;

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
  const applicationFeeUsd = Number((platformFeeCents / 100).toFixed(2));

  /* -------------------------------------------------------
   * 6. IMPORTANT: Return to SAME iframe origin
   * ----------------------------------------------------- */
  const h = await headers();
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
   * 7. Create Whop checkout on WORKER company
   * ----------------------------------------------------- */
  let checkout;
  try {
    checkout = await createWorkerCheckoutConfiguration({
      workerCompanyId,
      returnUrl,
      jobId,
      submissionId,
      workerWhopUserId: submission.worker_whop_user_id,
      payoutCents,
      platformFeeBps,
      platformFeeCents,
      totalChargeCents,
      experienceId,
    });
  } catch (error) {
    console.error("❌ CHECKOUT CREATION FAILED", error);
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 }
    );
  }

  console.error("🧾 CHECKOUT CREATED", {
    checkoutId: checkout?.id,
    planId: (checkout as any)?.plan?.id,
    purchaseUrl: checkout?.purchase_url,
    workerCompanyId,
    totalChargeUsd,
    applicationFeeUsd,
  });

  /* -------------------------------------------------------
   * 8. Store pending payment state
   * ----------------------------------------------------- */
  const { error: jobErr } = await supabaseServer
    .from("jobs")
    .update({
      approved_submission_id: submissionId,
      worker_company_id: workerCompanyId,
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
   * 9. Redirect to checkout
   * ----------------------------------------------------- */
  return NextResponse.redirect(checkout.purchase_url, 303);
}