import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      experienceId: string;
      jobId: string;
    }>;
  }
) {
  const { experienceId, jobId } = await context.params;

  const h = await headers();
  const { userId } = await whopsdk.verifyUserToken(h);

  if (!userId) {
    return NextResponse.json({ submissions: [] });
  }

  const { data: submissions, error } = await supabaseServer
    .from("submissions")
    .select("*")
    .eq("job_id", jobId)
    .eq("experience_id", experienceId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ submissions: [] });
  }

  const workerIds = Array.from(
    new Set((submissions ?? []).map((s: any) => s.worker_whop_user_id).filter(Boolean))
  );

  const { data: payoutAccounts } = await supabaseServer
    .from("worker_payout_accounts")
    .select("whop_user_id, worker_display_name, worker_email")
    .in("whop_user_id", workerIds);

  const profileByUserId = new Map(
    (payoutAccounts ?? []).map((p: any) => [p.whop_user_id, p])
  );

  const enrichedSubmissions = (submissions ?? []).map((submission: any) => {
    const profile = profileByUserId.get(submission.worker_whop_user_id);

    return {
      ...submission,
      worker_display_name:
        profile?.worker_display_name?.trim() || "Community member",
      worker_email: profile?.worker_email ?? null,
    };
  });

  return NextResponse.json({
    submissions: enrichedSubmissions,
  });
}