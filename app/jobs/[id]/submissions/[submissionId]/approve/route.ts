import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getWhopUserId } from "@/lib/whop/getUserId";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
  const { id: jobId, submissionId } = await params;



  // Load job to verify creator
  const { data: job } = await supabaseServer
  .from("jobs")
  .select("id, creator_whop_user_id, status, payout_cents")
  .eq("id", jobId)
  .single();


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

  // Approve submission
  const { error: subErr } = await supabaseServer
    .from("submissions")
    .update({ status: "approved" })
    .eq("id", submissionId)
    .eq("job_id", jobId);

  if (subErr) {
    return NextResponse.json({ error: subErr.message }, { status: 500 });
  }

  // 💸 Calculate platform fee (8%)
const platformFeeBps = 800; // 8%
const payoutCents = job.payout_cents ?? 0;
const platformFeeCents = Math.round(
  (payoutCents * platformFeeBps) / 10000
);
const totalChargeCents = payoutCents + platformFeeCents;

// Close job + store transaction metadata
const { error: jobErr } = await supabaseServer
  .from("jobs")
  .update({
    status: "closed",
    approved_submission_id: submissionId,
    platform_fee_bps: platformFeeBps,
    platform_fee_cents: platformFeeCents,
    total_charge_cents: totalChargeCents,
    closed_at: new Date().toISOString(),
  })
  .eq("id", jobId);


  if (jobErr) {
    return NextResponse.json({ error: jobErr.message }, { status: 500 });
  }

  // Optional: auto-reject other pending submissions
  await supabaseServer
    .from("submissions")
    .update({ status: "rejected" })
    .eq("job_id", jobId)
    .neq("id", submissionId)
    .eq("status", "pending");

  return NextResponse.redirect(new URL(`/jobs/${jobId}`, req.url), 303);
}
