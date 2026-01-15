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
  const { userId: requester_whop_user_id } =
    await whopsdk.verifyUserToken(h);

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
    .select("id, creator_whop_user_id, deployment_id")
    .eq("id", jobId)
    .single();

  if (jobError || !job) {
    return NextResponse.json(
      { error: "Job not found" },
      { status: 404 }
    );
  }

  // 🚫 Cross-deployment protection
  if (job.deployment_id !== deployment_id) {
    return NextResponse.json(
      { error: "Unauthorized job access" },
      { status: 403 }
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
   * 4. Load submission (must belong to job + deployment)
   * ----------------------------------------------------- */
  const { data: submission, error: subError } = await supabaseServer
    .from("submissions")
    .select("id, deployment_id")
    .eq("id", submissionId)
    .eq("job_id", jobId)
    .single();

  if (subError || !submission) {
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 }
    );
  }

  // 🚫 Cross-deployment protection
  if (submission.deployment_id !== deployment_id) {
    return NextResponse.json(
      { error: "Unauthorized submission access" },
      { status: 403 }
    );
  }

  /* -------------------------------------------------------
   * 5. Reject submission
   * ----------------------------------------------------- */
  const { error } = await supabaseServer
    .from("submissions")
    .update({ status: "rejected" })
    .eq("id", submissionId)
    .eq("job_id", jobId);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  /* -------------------------------------------------------
   * 6. Redirect back to My Jobs
   * ----------------------------------------------------- */
  return NextResponse.redirect(
    new URL("/my-jobs", req.url),
    303
  );
}


