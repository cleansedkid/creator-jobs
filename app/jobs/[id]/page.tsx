import Link from "next/link";
import { headers } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { getDeploymentId } from "@/lib/whop/getDeploymentId";
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
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ submitted?: string }>;
}) {
  const { id: jobId } = await params;
  const sp = (await searchParams) ?? {};
  const showSubmitted = sp.submitted === "1";

  const deployment_id = await getDeploymentId();

  if (!deployment_id) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6 text-sm text-muted-foreground">
        Reloading context… If this persists, refresh the page.
      </div>
    );
  }

  // Load job WITH deployment isolation
  const { data: job } = await supabaseServer
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .eq("deployment_id", deployment_id)
    .single();

  if (!job) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6">
        <p className="text-muted-foreground">Job not found.</p>
        <Link href="/jobs" className="underline text-sm">
          Back to jobs
        </Link>
      </div>
    );
  }

  // Identity (safe: never throws)
  const currentUserId = await safeGetUserId();
  const isCreator = job.creator_whop_user_id === currentUserId;

  // Keep your dev role behavior
  const devRole = getDevRole();
  const isDevCreator = devRole === "creator";
  const isDevWorker = devRole === "worker";

  const canSubmit =
    (isDevWorker || (!devRole && !isCreator)) && job.status === "open";

  const canReview = isDevCreator || (!devRole && isCreator);

  // Submissions are isolated by deployment too (extra safe)
  const { data: submissions } = await supabaseServer
    .from("submissions")
    .select("*")
    .eq("job_id", jobId)
    .eq("deployment_id", deployment_id)
    .order("created_at", { ascending: false });

  const h = await headers();
  const referer = h.get("referer");
  const backHref = referer?.includes("/my-jobs") ? "/my-jobs" : "/jobs";

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
        <div className="text-xs text-muted-foreground">Status: {job.status}</div>
      </div>

      {/* Submit (worker view) */}
      {canSubmit ? (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="font-medium">Submit work</div>

          <form
            action={`/jobs/${jobId}/submit`}
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
                <span className="text-muted-foreground">Status:</span> {s.status}
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
                    action={`/jobs/${jobId}/submissions/${s.id}/approve`}
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
                    action={`/jobs/${jobId}/submissions/${s.id}/reject`}
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

