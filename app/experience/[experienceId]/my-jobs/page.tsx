"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabaseServer } from "@/lib/supabase/server";

export default function MyJobsPage() {
  const params = useParams();
  const experienceId = params?.experienceId as string | undefined;

  const [jobs, setJobs] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!experienceId || experienceId === "undefined") return;

    supabaseServer
  .from("jobs")
  .select("id, title, status, payout_cents, platform_fee_cents")
  .eq("experience_id", experienceId)
  .order("created_at", { ascending: false })
  .then(({ data }) => {
    setJobs(data ?? []);
    setLoading(false);
  });

  }, [experienceId]);

  // 🛡️ Guard
  if (!experienceId || loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6 text-sm text-muted-foreground">
        Loading experience…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">My Jobs</h1>

        <Link
          href={`/experience/${experienceId}/my-jobs/new`}
          className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted transition cursor-pointer"
        >
          + New Job
        </Link>
      </div>

      {jobs?.length === 0 && (
        <div className="text-sm text-muted-foreground">
          You haven’t posted any jobs yet.
        </div>
      )}

      {jobs?.map((job) => (
        <Link
          key={job.id}
          href={`/experience/${experienceId}/jobs/${job.id}`}
          className="block rounded-lg border p-4 space-y-1 hover:bg-muted transition cursor-pointer"
        >
          <div className="font-medium">{job.title}</div>

          <div className="text-sm text-muted-foreground">
            Status: {job.status}
          </div>

          <div className="text-sm">
            💰 ${(job.payout_cents / 100).toFixed(2)}
          </div>

          {job.status === "closed" && job.platform_fee_cents != null && (
            <div className="text-xs text-muted-foreground">
              Platform fee: ${(job.platform_fee_cents / 100).toFixed(2)}
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}

