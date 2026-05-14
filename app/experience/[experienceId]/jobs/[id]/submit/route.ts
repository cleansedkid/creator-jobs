import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { whopsdk } from "@/lib/whop-sdk";
import { createPayoutSetupToken, verifyPayoutSetupToken } from "@/lib/payoutSetupToken";

export async function POST(
	request: NextRequest,
	context: {
	  params: Promise<{
		 experienceId: string;
		 id: string;
	  }>;
	}
 ) {
	const { experienceId, id: jobId } = await context.params;

  /* -------------------------------------------------------
   * 1. Verify Whop user (ONLY reliable identity here)
   * ----------------------------------------------------- */
  const formData = await request.formData();
  const setupTokenFromForm = String(formData.get("setupToken") || "").trim();
  const setupTokenFromCookie =
	 request.cookies.get("cj_payout_setup_token")?.value || "";
  
  const setupToken = setupTokenFromForm || setupTokenFromCookie;

let worker_whop_user_id: string | null = null;

try {
  const h = await headers();
  const verified = await whopsdk.verifyUserToken(h);
  worker_whop_user_id = verified.userId ?? null;
} catch {
  if (setupToken) {
    try {
      const verifiedToken = verifyPayoutSetupToken(setupToken);

      if (verifiedToken.experienceId === experienceId) {
        worker_whop_user_id = verifiedToken.userId;
      }
    } catch {
      worker_whop_user_id = null;
    }
  }
}

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
 * 3. Check payout readiness BEFORE processing submission
 * ----------------------------------------------------- */
const { data: payoutAccount, error: payoutError } = await supabaseServer
.from("worker_payout_accounts")
.select(
  `
  worker_company_id,
  worker_email,
  worker_display_name
  `
)
.eq("whop_user_id", worker_whop_user_id)
.maybeSingle();

if (payoutError) {
return NextResponse.json(
  { error: `Failed to check payout setup: ${payoutError.message}` },
  { status: 500 }
);
}

const hasPayoutProfile =
!!payoutAccount?.worker_email?.trim() &&
!!payoutAccount?.worker_display_name?.trim();

const hasWorkerCompanyId = !!payoutAccount?.worker_company_id;

if (!hasPayoutProfile || !hasWorkerCompanyId) {
	const returnTo = `/experience/${experienceId}/jobs/${jobId}`;
 
	const token = createPayoutSetupToken({
	  userId: worker_whop_user_id,
	  experienceId,
	  returnTo,
	});
 
	const redirectUrl = new URL(
	  `/experience/${experienceId}/my-submissions/payout-profile`,
	  request.url
	);
 
	redirectUrl.searchParams.set("returnTo", returnTo);
	redirectUrl.searchParams.set("token", token);
 
	return NextResponse.redirect(redirectUrl, 303);
 }

/* -------------------------------------------------------
* 4. Read form data
* ----------------------------------------------------- */
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
   * 6. Insert submission (experience-scoped)
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
   * 7. Redirect back to job page (experience-safe)
   * ----------------------------------------------------- */
  const returnTo = `/experience/${experienceId}/jobs/${jobId}`;

  const token = createPayoutSetupToken({
	 userId: worker_whop_user_id,
	 experienceId,
	 returnTo,
  });
  
  const redirectUrl = new URL(
	 `/experience/${experienceId}/jobs/${jobId}?submitted=1`,
	 request.url
  );
  
  const response = NextResponse.redirect(redirectUrl, 303);
  
  response.cookies.set("cj_payout_setup_token", token, {
	 httpOnly: true,
	 secure: true,
	 sameSite: "none",
	 path: "/",
	 maxAge: 60 * 60 * 24 * 7,
  });
  console.log("🍪 Submission setting fallback cookie", {
	experienceId,
	jobId,
	worker_whop_user_id,
 });
  
  return response;
}
