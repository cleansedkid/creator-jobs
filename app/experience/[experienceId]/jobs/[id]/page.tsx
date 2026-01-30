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

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: { experienceId: string; id: string };
  searchParams?: { submitted?: string };
}) {
  const { experienceId, id: jobId } = params;
  const showSubmitted = searchParams?.submitted === "1";

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

  // Identity (safe: never throws)
  const currentUserId = await safeGetUserId();
  const isCreator =
    currentUserId != null && job.creator_whop_user_id === currentUserId;

  // Keep dev role behavior
  const devRole = getDevRole();
  const isDevCreator = devRole === "creator";
  const isDevWorker = devRole === "worker";

  const canSubmit =
    (isDevWorker || (!devRole && !isCreator)) && job.status === "open";

  const canReview = isDevCreator || (!devRole && isCreator);

  // 🔒 Submissions — HARD scoped to experience + job
  const { data: submissions, error: subError } = await supabaseAdmin
  .from("submissions")
  .select("*")
  .eq("job_id", jobId)
  .eq("experience_id", experienceId)
  .order("created_at", { ascending: false });

if (subError) {
  console.error("[JOB DETAIL] submissions query error", subError);
}


  // Back link (experience-aware)
  const h = await headers();
  const referer = h.get("referer");
  const backHref = referer?.includes("/my-jobs")
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

      {/* Job info */}
      <div className="rounded-lg border p-4 space-y-2">
        <div className="text-lg font-semibold">{job.title}</div>
        <div className="text-sm text-muted-foreground">{job.description}</div>
        <div className="text-sm">
          💰 ${(job.payout_cents / 100).toFixed(2)} • {job.job_type}
        </div>
        <div className="text-xs text-muted-foreground">
          Status: {job.status}
        </div>
      </div>

      {/* Submit (worker view) */}
      {canSubmit ? (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="font-medium">Submit work</div>

          <form
            action={`/experience/${experienceId}/jobs/${jobId}/submit`}
            method="post"
            encType="multipart/form-data"
            className="space-y-3"
          >
            <label className="block">
              <span className="text-sm text-muted-foreground">Upload file</span>

              <input
                type="file"
                name="file"
                required
                className="mt-2 block w-full text-sm
                  file:mr-4
                  file:rounded-md
                  file:border
                  file:bg-muted
                  file:px-4
                  file:py-2
                  file:text-sm
                  file:font-medium
                  file:cursor-pointer
                  file:hover:bg-muted/80
                  cursor-pointer"
              />
            </label>

            <textarea
              name="note"
              placeholder="Optional note"
              className="w-full rounded-md border px-3 py-2 bg-background"
            />

            <button
              type="submit"
              className="w-full rounded-md border px-4 py-2 font-medium cursor-pointer hover:bg-muted transition"
            >
              Submit
            </button>
          </form>
        </div>
      ) : job.status !== "open" && !canReview ? (
        <div className="rounded-lg border px-4 py-3 text-sm text-muted-foreground">
          This job is closed. Submissions are no longer accepted.
        </div>
      ) : null}

      {/* Submissions (creator view) */}
      {canReview && (
        <div className="space-y-3">
          <div className="font-medium">Submissions</div>

          {(!submissions || submissions.length === 0) && (
            <p className="text-sm text-muted-foreground">No submissions yet.</p>
          )}

          {submissions?.map((s: any) => (
            <div key={s.id} className="rounded-lg border p-4 space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Status:</span>{" "}
                {s.status}
              </div>

              <a
                className="text-sm underline break-all"
                href={s.proof_url}
                target="_blank"
                rel="noreferrer"
              >
                {s.proof_url}
              </a>

              {s.note && (
                <div className="text-sm text-muted-foreground">{s.note}</div>
              )}

              {job.status === "open" && (
                <div className="flex gap-2 pt-2">
                  <form
                    action={`/experience/${experienceId}/jobs/${jobId}/submissions/${s.id}/approve`}
                    method="post"
                  >
                    <button
                      type="submit"
                      className="rounded-md border px-3 py-2 text-sm font-medium cursor-pointer hover:bg-muted"
                    >
                      Approve
                    </button>
                  </form>

                  <form
                    action={`/experience/${experienceId}/jobs/${jobId}/submissions/${s.id}/reject`}
                    method="post"
                  >
                    <button
                      type="submit"
                      className="rounded-md border px-3 py-2 text-sm font-medium cursor-pointer hover:bg-muted"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
