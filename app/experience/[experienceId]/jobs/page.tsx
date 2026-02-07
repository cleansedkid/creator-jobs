"use client";

import { supabaseClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function JobsPage() {
  const params = useParams();

  // 🚨 normalize + hard-guard experienceId
  const rawExperienceId = params?.experienceId;
  const experienceId =
    typeof rawExperienceId === "string" &&
    rawExperienceId !== "undefined"
      ? rawExperienceId
      : null;

  const [jobs, setJobs] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!experienceId) return;

    setLoading(true);

    supabaseClient
      .from("jobs")
      .select("*")
      .eq("status", "open")
      .eq("experience_id", experienceId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error("[JOBS PAGE] query error", error);
          setJobs([]);
        } else {
          setJobs(data ?? []);
        }
        setLoading(false);
      });
  }, [experienceId]);

  // 🛡️ ABSOLUTE GUARD — never render links with bad IDs
  if (!experienceId || loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Loading experience…
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
		<Link
  href={`/experience/${experienceId}/onboarding`}
  className="text-sm text-muted-foreground hover:underline"
>
  ← Back to home
</Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Jobs</h1>
		  <p className="text-sm text-muted-foreground">
  Paid jobs posted by members of this community.
</p>


        <Link
          href={`/experience/${experienceId}/my-submissions`}
          className="text-sm underline"
        >
          My Submissions →
        </Link>
      </div>

      
		{jobs?.length === 0 && (
        <p className="text-muted-foreground">
		  No jobs yet. Community members can post paid jobs here.
		</p>
		
      )}

      {jobs?.map((job) => (
        <div key={job.id} className="border rounded-lg p-4 bg-background">
          <h2 className="font-medium">
            <Link
              href={`/experience/${experienceId}/jobs/${job.id}`}
              className="hover:underline cursor-pointer"
            >
              {job.title}
            </Link>
          </h2>
			 <p className="text-sm text-muted-foreground">
  {job.description}
</p>
          <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
  <span className="rounded-full border px-2 py-0.5">
    Open
  </span>

  <span className="rounded-full border px-2 py-0.5">
    Paid task
  </span>
</div>


          <p className="mt-2 text-sm">
            💰 ${(job.payout_cents / 100).toFixed(2)}
          </p>
        </div>
      ))}
    </div>
  );
}
