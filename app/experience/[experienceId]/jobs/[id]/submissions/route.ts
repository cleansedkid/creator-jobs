import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { whopsdk } from "@/lib/whop-sdk";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<{ experienceId: string; id: string }> }
) {
  const { experienceId, id: jobId } = await context.params;

  // 1) Verify Whop user
  const h = await headers();
  const { userId } = await whopsdk.verifyUserToken(h);

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // 2) Load job and verify requester is the job creator
  const { data: job, error: jobError } = await supabaseServer
    .from("jobs")
    .select("id, experience_id, creator_whop_user_id")
    .eq("id", jobId)
    .eq("experience_id", experienceId)
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.creator_whop_user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 3) Return submissions
  const { data: submissions, error: subError } = await supabaseServer
    .from("submissions")
    .select("id, proof_url, note, status, created_at")
    .eq("job_id", jobId)
    .eq("experience_id", experienceId)
    .order("created_at", { ascending: false });

  if (subError) {
    return NextResponse.json(
      { error: subError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ submissions: submissions ?? [] });
}
