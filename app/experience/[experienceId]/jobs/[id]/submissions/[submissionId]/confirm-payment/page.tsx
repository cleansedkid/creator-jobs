import Link from "next/link";
import { getAuthContext } from "@/lib/whop/getAuthContext";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function usd(cents: number | null | undefined) {
  const n = typeof cents === "number" ? cents : 0;
  return `$${(n / 100).toFixed(2)}`;
}

export default async function ConfirmPaymentPage({
  params,
}: {
  params: Promise<{
    experienceId: string;
    id: string;
    submissionId: string;
  }>;
}) {
  const { experienceId, id: jobId, submissionId } = await params;

  const auth = await getAuthContext(experienceId);

  if (!auth?.userId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6 text-sm text-muted-foreground">
        Reloading context… If this persists, refresh the page.
      </div>
    );
  }

  const { data: job, error: jobError } = await supabaseAdmin
    .from("jobs")
    .select(
      `
      id,
      title,
      payout_cents,
      creator_whop_user_id,
      approved_submission_id,
      status,
      payment_status,
      experience_id
      `
    )
    .eq("id", jobId)
    .eq("experience_id", experienceId)
    .single();

  if (jobError || !job) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6 text-sm text-muted-foreground">
        Job not found.
      </div>
    );
  }

  const isJobCreator = job.creator_whop_user_id === auth.userId;

  if (!isJobCreator && !auth.isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6 text-sm text-muted-foreground">
        You don’t have permission to continue.
      </div>
    );
  }

  if (job.status !== "open") {
    return (
      <div className="mx-auto max-w-xl px-4 py-6 text-sm text-muted-foreground">
        This job is already closed.
      </div>
    );
  }

  if (job.approved_submission_id && job.approved_submission_id !== submissionId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6 text-sm text-muted-foreground">
        A different submission has already been selected for payment.
      </div>
    );
  }

  const { data: submission, error: submissionError } = await supabaseAdmin
    .from("submissions")
    .select(
      `
      id,
      worker_whop_user_id,
      proof_url
      `
    )
    .eq("id", submissionId)
    .eq("job_id", jobId)
    .eq("experience_id", experienceId)
    .single();

  if (submissionError || !submission) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6 text-sm text-muted-foreground">
        Submission not found.
      </div>
    );
  }

  const { data: payoutProfile } = await supabaseAdmin
    .from("worker_payout_accounts")
    .select("worker_display_name")
    .eq("whop_user_id", submission.worker_whop_user_id)
    .maybeSingle();

  const workerLabel = payoutProfile?.worker_display_name || "Approved worker";

  const payoutCents = job.payout_cents ?? 0;
  const platformFeeBps = 800;
  const platformFeeCents = Math.round((payoutCents * platformFeeBps) / 10000);
  const totalChargeCents = payoutCents + platformFeeCents;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Confirm payment</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Review the approved submission and payment details before continuing to secure checkout.
            </p>
          </div>

          <Link
            href={`/experience/${experienceId}/jobs/${jobId}`}
            className="text-sm underline"
          >
            ← Back to job
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="font-medium">Payment summary</div>
        <p className="mt-1 text-sm text-muted-foreground">
          This payment will be sent to the approved worker through Whop.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-muted-foreground">Job</div>
            <div className="mt-1 text-sm font-semibold">{job.title}</div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-muted-foreground">Recipient</div>
            <div className="mt-1 text-sm font-semibold">{workerLabel}</div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-muted-foreground">Payout</div>
            <div className="mt-1 text-sm font-semibold">{usd(payoutCents)}</div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-muted-foreground">Platform fee</div>
            <div className="mt-1 text-sm font-semibold">{usd(platformFeeCents)}</div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4 sm:col-span-2">
            <div className="text-xs text-muted-foreground">Total charged</div>
            <div className="mt-1 text-base font-semibold">{usd(totalChargeCents)}</div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4">
          <div className="text-sm font-medium">Before you continue</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Only complete payment after reviewing the submission. Payments are tied to the approved submission and should not be sent for incomplete or unreviewed work.
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {submission.proof_url ? (
            <a
              href={submission.proof_url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-muted-foreground hover:underline"
            >
              View approved submission →
            </a>
          ) : (
            <div />
          )}

          <form
            action={`/experience/${experienceId}/jobs/${jobId}/submissions/${submissionId}/approve`}
            method="post"
          >
            <button
              type="submit"
              className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: "#2563eb" }}
            >
              Continue to secure checkout
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}