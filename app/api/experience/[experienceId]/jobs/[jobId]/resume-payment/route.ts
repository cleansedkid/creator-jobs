import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/whop/getAuthContext";
import { whopsdk } from "@/lib/whop-sdk";


export async function POST(
	req: NextRequest,
	context: {
	  params: Promise<{
		 experienceId: string;
		 jobId: string;
	  }>;
	}
 ) {
	const { experienceId, jobId } = await context.params;
 

  /* 1️⃣ Verify user */
  const auth = await getAuthContext(experienceId);

if (!auth?.userId) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const requesterId = auth.userId;

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

  const isJobCreator =
  job.creator_whop_user_id === requesterId;

if (!isJobCreator && !auth.isAdmin) {
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
