import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/whop/getAuthContext";

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
  const auth = await getAuthContext(experienceId);

if (!auth?.userId) {
  return NextResponse.json(
    { error: "Not authenticated" },
    { status: 401 }
  );
}

const requester_whop_user_id = auth.userId;

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

  const isJobCreator =
  job.creator_whop_user_id === requester_whop_user_id;

if (!isJobCreator && !auth.isAdmin) {
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
		request.url

    ),
    303
  );
}
