import Link from "next/link";
import { getAuthContext } from "@/lib/whop/getAuthContext";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

type AuditEvent = {
  id: string;
  jobId: string;
  jobTitle: string;
  type: "job_posted" | "submission_received" | "submission_approved" | "payment_completed";
  label: string;
  description: string;
  createdAt: string | null;
};

export default async function AdminAuditPage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;

  if (!experienceId || experienceId === "undefined") {
    return (
      <div className="mx-auto max-w-xl px-4 py-6 text-sm text-muted-foreground">
        Loading experience…
      </div>
    );
  }

  const auth = await getAuthContext(experienceId);

  if (!auth?.userId) {
	return (
	  <div className="mx-auto max-w-xl px-4 py-6 space-y-3">
		 <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
			We couldn’t confirm your session. Please refresh the page and try again.
		 </div>
	  </div>
	);
 }
 
 if (!auth.isAdmin) {
	return (
	  <div className="mx-auto max-w-xl px-4 py-6 space-y-3">
		 <Link href={`/experience/${experienceId}/jobs`} className="text-sm underline">
			← Back to jobs
		 </Link>
 
		 <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
			Audit Log is only available to community admins.
		 </div>
	  </div>
	);
 }
  const { data: jobs, error: jobsError } = await supabaseAdmin
    .from("jobs")
    .select(
      `
      id,
      title,
      created_at,
      paid_at,
      approved_submission_id,
      payment_status
      `
    )
    .eq("experience_id", experienceId)
    .order("created_at", { ascending: false });

  if (jobsError) {
    return (
      <div className="space-y-6">
        <div className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Audit Log</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Track key actions across jobs, submissions, and payments.
              </p>
            </div>

            <Link href={`/experience/${experienceId}/admin`} className="text-sm underline">
              ← Back to Admin Tools
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-red-200">
          Failed to load audit log: {jobsError.message}
        </div>
      </div>
    );
  }

  const jobIds = (jobs ?? []).map((job) => job.id);

  const { data: submissions } = jobIds.length
    ? await supabaseAdmin
        .from("submissions")
        .select(
          `
          id,
          job_id,
          worker_whop_user_id,
          status,
          created_at
          `
        )
        .in("job_id", jobIds)
    : { data: [] as any[] };

  const workerIds = Array.from(
    new Set((submissions ?? []).map((s) => s.worker_whop_user_id).filter(Boolean))
  ) as string[];

  const workerDisplayNamesByUserId = new Map<string, string>();

  if (workerIds.length > 0) {
    const { data: payoutProfiles } = await supabaseAdmin
      .from("worker_payout_accounts")
      .select("whop_user_id, worker_display_name")
      .in("whop_user_id", workerIds);

    (payoutProfiles ?? []).forEach((profile) => {
      if (profile.whop_user_id && profile.worker_display_name) {
        workerDisplayNamesByUserId.set(
          profile.whop_user_id,
          profile.worker_display_name
        );
      }
    });
  }

  const submissionsByJobId = new Map<string, any[]>();

  (submissions ?? []).forEach((sub) => {
    const current = submissionsByJobId.get(sub.job_id) ?? [];
    current.push(sub);
    submissionsByJobId.set(sub.job_id, current);
  });

  const events: AuditEvent[] = [];

  (jobs ?? []).forEach((job) => {
    events.push({
      id: `job_posted_${job.id}`,
      jobId: job.id,
      jobTitle: job.title ?? "Job",
      type: "job_posted",
      label: "Job posted",
      description: "A new job listing was created in this community.",
      createdAt: job.created_at,
    });

    const jobSubs = submissionsByJobId.get(job.id) ?? [];

    jobSubs.forEach((sub) => {
      const workerLabel =
        sub.worker_whop_user_id
          ? workerDisplayNamesByUserId.get(sub.worker_whop_user_id) ?? "Worker"
          : "Worker";

      events.push({
        id: `submission_received_${sub.id}`,
        jobId: job.id,
        jobTitle: job.title ?? "Job",
        type: "submission_received",
        label: "Submission received",
        description: `${workerLabel} submitted completed work for review.`,
        createdAt: sub.created_at,
      });

      if (job.approved_submission_id === sub.id) {
        events.push({
          id: `submission_approved_${sub.id}`,
          jobId: job.id,
          jobTitle: job.title ?? "Job",
          type: "submission_approved",
          label: "Submission approved",
          description: `${workerLabel} was selected as the approved worker for this job.`,
          createdAt: sub.created_at,
        });
      }
    });

    if (job.payment_status === "paid") {
      events.push({
        id: `payment_completed_${job.id}`,
        jobId: job.id,
        jobTitle: job.title ?? "Job",
        type: "payment_completed",
        label: "Payment completed",
        description: "Payment was successfully completed for the approved submission.",
        createdAt: job.paid_at,
      });
    }
  });

  events.sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });

  function pillClass(type: AuditEvent["type"]) {
    if (type === "payment_completed") return "cj-pill cj-pill-paid";
    if (type === "submission_approved") return "cj-pill cj-pill-approved";
    if (type === "submission_received") return "cj-pill cj-pill-pending";
    return "cj-pill";
  }

  return (
    <div className="space-y-6">
      <div className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Audit Log</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Review key marketplace actions across jobs, submissions, and payments.
            </p>
          </div>

          <Link href={`/experience/${experienceId}/admin`} className="text-sm underline">
            ← Back to Admin Tools
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <div>
          <div className="font-medium">Activity Timeline</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Use this log to verify what happened, when it happened, and which job it was tied to.
          </p>
        </div>

        <div className="mt-4 h-px bg-white/10" />

        {events.length === 0 ? (
          <div className="mt-4 text-sm text-muted-foreground">
            No audit events yet.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="rounded-xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-base font-semibold">
                        {event.jobTitle}
                      </div>
                      <span className={pillClass(event.type)}>{event.label}</span>
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {event.description}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="text-xs text-muted-foreground">Event time</div>
                    <div className="text-sm font-medium">
                      {fmtDate(event.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <Link
                    href={`/experience/${experienceId}/jobs/${event.jobId}`}
                    className="text-sm text-muted-foreground hover:underline"
                  >
                    View job →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}