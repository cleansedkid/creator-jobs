"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { getDevRole } from "@/lib/auth/role";

type Job = {
  id: string;
  title: string;
  description: string;
  payout_cents: number;
  job_type: string;
  status: string;
  creator_whop_user_id: string;
};

type Submission = {
  id: string;
  proof_url: string;
  note: string | null;
  status: string;
};

export default function JobDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const experienceId = params?.experienceId as string | undefined;
  const jobId = params?.id as string | undefined;
  const showSubmitted = searchParams?.get("submitted") === "1";

  const [job, setJob] = useState<Job | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const validExperience =
    typeof experienceId === "string" && experienceId.startsWith("exp_");
  const validJobId = typeof jobId === "string" && jobId.length > 0;

  useEffect(() => {
    if (!validExperience || !validJobId) return;

    let cancelled = false;

    async function load() {
      const { data: jobData } = await supabaseClient
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .eq("experience_id", experienceId)
        .single();

      if (!jobData) {
        if (!cancelled) {
          setJob(null);
          setLoading(false);
        }
        return;
      }

      const { data: submissionData } = await supabaseClient
        .from("submissions")
        .select("*")
        .eq("job_id", jobId)
        .eq("experience_id", experienceId)
        .order("created_at", { ascending: false });

      if (!cancelled) {
        setJob(jobData);
        setSubmissions(submissionData ?? []);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [experienceId, jobId, validExperience, validJobId]);

  if (!validExperience || !validJobId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6 text-muted-foreground">
        Restoring experience…
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6 text-muted-foreground">
        Loading job…
      </div>
    );
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

  const devRole = getDevRole();
  const isDevCreator = devRole === "creator";
  const isDevWorker = devRole === "worker";

  const canSubmit =
    (isDevWorker || (!devRole && !isDevCreator)) && job.status === "open";
  const canReview = isDevCreator || !devRole;

  return (
    <div className="mx-auto max-w-xl px-4 py-6 space-y-6">
      <Link
        href={`/experience/${experienceId}/jobs`}
        className="text-sm underline"
      >
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

      {/* Submissions (creator view) */}
      {canReview && (
        <div className="space-y-3">
          <div className="font-medium">Submissions</div>

          {submissions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No submissions yet.
            </p>
          )}

          {submissions.map((s) => (
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
                    <button className="rounded-md border px-3 py-2 text-sm">
                      Approve
                    </button>
                  </form>

                  <form
                    action={`/experience/${experienceId}/jobs/${jobId}/submissions/${s.id}/reject`}
                    method="post"
                  >
                    <button className="rounded-md border px-3 py-2 text-sm">
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

