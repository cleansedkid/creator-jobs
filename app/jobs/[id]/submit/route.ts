import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { whopsdk } from "@/lib/whop-sdk";
import { getDeploymentId } from "@/lib/whop/getDeploymentId";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;

  /* -------------------------------------------------------
   * 1. Verify Whop user (ONLY reliable identity here)
   * ----------------------------------------------------- */
  const h = await headers();
  const { userId: worker_whop_user_id } =
    await whopsdk.verifyUserToken(h);

  if (!worker_whop_user_id) {
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
   * 3. Load job + enforce same deployment + open status
   * ----------------------------------------------------- */
  const { data: job, error: jobError } = await supabaseServer
    .from("jobs")
    .select("id, status, deployment_id")
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

  // 🚫 Closed jobs cannot accept submissions
  if (job.status !== "open") {
    return NextResponse.json(
      { error: "Job is closed" },
      { status: 403 }
    );
  }

  /* -------------------------------------------------------
   * 4. Read form data
   * ----------------------------------------------------- */
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const note = formData.get("note") as string | null;

  if (!file) {
    return NextResponse.json(
      { error: "No file uploaded" },
      { status: 400 }
    );
  }

  /* -------------------------------------------------------
   * 5. Upload file
   * ----------------------------------------------------- */
  const fileExt = file.name.split(".").pop();
  const filePath = `job-${jobId}/${crypto.randomUUID()}.${fileExt}`;

  const { error: uploadError } = await supabaseServer.storage
    .from("submissions")
    .upload(filePath, file);

  if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message },
      { status: 500 }
    );
  }

  const { data: publicUrl } = supabaseServer.storage
    .from("submissions")
    .getPublicUrl(filePath);

  /* -------------------------------------------------------
   * 6. Insert submission (CORRECT identity + deployment)
   * ----------------------------------------------------- */
  const { error: insertError } = await supabaseServer
    .from("submissions")
    .insert({
      job_id: jobId,
      deployment_id,
      worker_whop_user_id,
      proof_url: publicUrl.publicUrl,
      note: note || null,
      status: "pending",
    });

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 }
    );
  }

  /* -------------------------------------------------------
   * 7. Redirect back to job page
   * ----------------------------------------------------- */
  return NextResponse.redirect(
	new URL(
	  `/jobs/${jobId}?submitted=1&deployment_id=${deployment_id}`,
	  req.url
	),
	303
 );
 
 
}

