import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { whopsdk } from "@/lib/whop-sdk";

export async function POST(
  req: Request,
  {
    params,
  }: {
    params: { experienceId: string; id: string };
  }
) {
  const { experienceId, id: jobId } = params;

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
   * 2. Load job + enforce SAME experience + open status
   * ----------------------------------------------------- */
  const { data: job, error: jobError } = await supabaseServer
    .from("jobs")
    .select("id, status, experience_id")
    .eq("id", jobId)
    .eq("experience_id", experienceId)
    .single();

  if (jobError || !job) {
    return NextResponse.json(
      { error: "Job not found" },
      { status: 404 }
    );
  }

  if (job.status !== "open") {
    return NextResponse.json(
      { error: "Job is closed" },
      { status: 403 }
    );
  }

  /* -------------------------------------------------------
   * 3. Read form data
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
   * 4. Upload file
   * ----------------------------------------------------- */
  const fileExt = file.name.split(".").pop();
  const filePath = `experience-${experienceId}/job-${jobId}/${crypto.randomUUID()}.${fileExt}`;

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
   * 5. Insert submission (experience-scoped)
   * ----------------------------------------------------- */
  const { error: insertError } = await supabaseServer
    .from("submissions")
    .insert({
      job_id: jobId,
      experience_id: experienceId,
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
   * 6. Redirect back to job page (experience-safe)
   * ----------------------------------------------------- */
  return NextResponse.redirect(
    new URL(
      `/experience/${experienceId}/jobs/${jobId}?submitted=1`,
      req.url
    ),
    303
  );
}
