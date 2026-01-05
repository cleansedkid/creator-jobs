import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getWhopUserId } from "@/lib/whop/getUserId";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
  const { id: jobId, submissionId } = await params;

  const userId = await getWhopUserId();

  const { data: job } = await supabaseServer
    .from("jobs")
    .select("id, creator_whop_user_id")
    .eq("id", jobId)
    .single();

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.creator_whop_user_id !== userId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { error } = await supabaseServer
    .from("submissions")
    .update({ status: "rejected" })
    .eq("id", submissionId)
    .eq("job_id", jobId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.redirect(new URL(`/jobs/${jobId}`, req.url), 303);
}
