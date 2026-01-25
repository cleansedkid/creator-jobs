import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { whopsdk } from "@/lib/whop-sdk";

export async function POST(
  req: Request,
  {
    params,
  }: {
    params: { experienceId: string; id: string; submissionId: string };
  }
) {
  const { experienceId, id: jobId, submissionId } = params;

  /* -------------------------------------------------------
   * 1. Verify requester (ONLY reliable identity)
   * ----------------------------------------------------- */
  const h = await headers();
  const { userId: requester_whop_user_id } =
    await whopsdk.verifyUserToken(h);

  if (!requester_whop_user_id) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  /* -------------------------------------------------------
   * 2. Load job (ownership + EXPERIENCE check)
   * ----------------------------------------------------- */
  const { data: job, error: jobError } = await supabaseServer
    .from("jobs")
    .select("id, creator_whop_user_id, experience_id")
    .eq("id", jobId)
    .eq("experience_id", experienceId)
    .single();

  if (jobError || !job) {
    return NextResponse.json(
      { error: "Job not found" },
      { status: 404 }
    );
  }

  // 🚫 Only job creator can reject
  if (job.creator_whop_user_id !== requester_whop_user_id) {
    return NextResponse.json(
      { error: "Not authorized" },
      { status: 403 }
    );
  }

  /* -------------------------------------------------------
   * 3. Load submission (must belong to job + EXPERIENCE)
   * ----------------------------------------------------- */
  const { data: submission, error: subError } = await supabaseServer
    .from("submissions")
    .select("id, experience_id")
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
   * 4. Reject submission
   * ----------------------------------------------------- */
  const { error } = await supabaseServer
    .from("submissions")
    .update({ status: "rejected" })
    .eq("id", submissionId)
    .eq("job_id", jobId)
    .eq("experience_id", experienceId);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  /* -------------------------------------------------------
   * 5. Redirect back to My Jobs (experience-safe)
   * ----------------------------------------------------- */
  return NextResponse.redirect(
    new URL(
      `/experience/${experienceId}/my-jobs`,
      req.url
    ),
    303
  );
}
