import Link from "next/link";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { whopsdk } from "@/lib/whop-sdk";
import { getDevRole } from "@/lib/auth/role";

export const dynamic = "force-dynamic";

async function safeGetUserId() {
  try {
    const h = await headers();
    const { userId } = await whopsdk.verifyUserToken(h);
    return userId ?? null;
  } catch {
    return null;
  }
}

function isValidExperienceId(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("exp_");
}

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: { experienceId: string; id: string };
  searchParams?: { submitted?: string };
}) {
  const { experienceId, id: jobId } = params;
  const showSubmitted = searchParams?.submitted === "1";

  const validExperience = isValidExperienceId(experienceId);
  const validJobId = typeof jobId === "string" && jobId.length > 0;

  // 🛡️ HARD GUARD — block ALL invalid navigation
  if (!validExperience || !validJobId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6">
        <p className="text-muted-foreground">Restoring experience…</p>

        {validExperience && (
          <Link
            href={`/experience/${experienceId}/jobs`}
            className="underline text-sm"
          >
            Back to jobs
          </Link>
        )}
      </div>
    );
  }

  const { data: job, error: jobError } = await supabaseAdmin
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .eq("experience_id", experienceId)
    .single();

  if (jobError) {
    console.error("[JOB DETAIL] job query error", jobError);
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6">
        <p className="text-muted-foreground">Job not found.</p>
        <Link
          href={`/experience/${experienceId}/jobs`}
          className="underline text-sm"
        >
          Back to jobs
        </Link>
      </div>
    );
  }

  const currentUserId = await safeGetUserId();
  const isCreator =
    currentUserId != null && job.creator_whop_user_id === currentUserId;

  const devRole = getDevRole();
  const isDevCreator = devRole === "creator";
  const isDevWorker = devRole === "worker";

  const canSubmit =
    (isDevWorker || (!devRole && !isCreator)) && job.status === "open";

  const canReview = isDevCreator || (!devRole && isCreator);

  const { data: submissions, error: subError } = await supabaseAdmin
    .from("submissions")
    .select("*")
    .eq("job_id", jobId)
    .eq("experience_id", experienceId)
    .order("created_at", { ascending: false });

  if (subError) {
    console.error("[JOB DETAIL] submissions query error", subError);
  }

  const h = await headers();
  const referer = h.get("referer");

  const backHref =
    referer?.includes("/my-jobs") && validExperience
      ? `/experience/${experienceId}/my-jobs`
      : `/experience/${experienceId}/jobs`;

  return (
    <div className="mx-auto max-w-xl px-4 py-6 space-y-6">
      <Link href={backHref} className="text-sm underline">
        ← Back
      </Link>

      {showSubmitted && (
        <div className="rounded-lg border px-4 py-3 text-sm">
          <div className="font-medium">✅ Submission sent.</div>
          <div className="text-muted-foreground">
            The creator will review it soon.
          </div>
        </div>
      )}

      <div className="rounded-lg border p-4 space-y-2">
        <div className="text-lg font-semibold">{job.title}</div>
        <div className="text-sm text-muted-foreground">
          {job.description}
        </div>
        <div className="text-sm">
          💰 ${(job.payout_cents / 100).toFixed(2)} • {job.job_type}
        </div>
        <div className="text-xs text-muted-foreground">
          Status: {job.status}
        </div>
      </div>

      {canSubmit && (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="font-medium">Submit work</div>

          <form
            action={`/experience/${experienceId}/jobs/${jobId}/submit`}
            method="post"
            encType="multipart/form-data"
            className="space-y-3"
          >
            <input type="file" name="file" required />
            <textarea name="note" placeholder="Optional note" />
            <button type="submit">Submit</button>
          </form>
        </div>
      )}

      {canReview && (
        <div className="space-y-3">
          <div className="font-medium">Submissions</div>

          {submissions?.map((s: any) => (
            <div key={s.id} className="rounded-lg border p-4">
              <a href={s.proof_url} target="_blank" rel="noreferrer">
                {s.proof_url}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


