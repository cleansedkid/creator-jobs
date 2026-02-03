import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { whopsdk } from "@/lib/whop-sdk";

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: { experienceId: string; jobId: string };
  }
) {
  const { experienceId, jobId } = params;

  /* 1️⃣ Verify user */
  const h = headers();
  let requesterId: string;

  try {
    const verified = await whopsdk.verifyUserToken(h);
    requesterId = verified.userId!;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  /* 2️⃣ Load job */
  const { data: job } = await supabaseServer
    .from("jobs")
    .select(
      `
      creator_whop_user_id,
      payment_status,
      whop_checkout_id,
      experience_id
      `
    )
    .eq("id", jobId)
    .eq("experience_id", experienceId)
    .single();

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.creator_whop_user_id !== requesterId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (job.payment_status !== "requires_payment") {
    return NextResponse.json(
      { error: "Job does not require payment" },
      { status: 400 }
    );
  }

  if (!job.whop_checkout_id) {
    return NextResponse.json(
      { error: "No checkout to resume" },
      { status: 400 }
    );
  }

  /* 3️⃣ Fetch checkout from Whop */
  const checkout = await whopsdk.checkoutConfigurations.retrieve(
    job.whop_checkout_id
  );

  return NextResponse.json({
    purchase_url: checkout.purchase_url,
  });
}
