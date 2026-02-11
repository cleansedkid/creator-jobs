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
	<div className="space-y-6">
 

 <div className="pb-2">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div>
	 <h1 className="text-4xl font-bold tracking-tight">Jobs</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Browse paid jobs posted by members of this community.
      </p>
    </div>

    <div className="self-start">
  <style>
    {`
      .primary-cta {
        background-color: #2563eb;
        color: #ffffff;
        transition: background-color 150ms ease, transform 120ms ease, box-shadow 150ms ease;
        box-shadow: 0 0 0 1px rgba(255,255,255,0.05);
      }

      .primary-cta:hover {
        background-color: #1d4ed8;
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35);
      }

      .primary-cta:active {
        transform: translateY(0px);
        box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
      }
    `}
  </style>

  <Link
    href={`/experience/${experienceId}/my-submissions`}
    className="primary-cta inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold cursor-pointer whitespace-nowrap"
  >
    My Submissions →
  </Link>
</div>

  </div>
</div>


      
		{jobs?.length === 0 && (
        <p className="text-muted-foreground">
		  No jobs yet. Community members can post paid jobs here.
		</p>
		
      )}
<div className="h-px bg-white/10 my-2" />

{jobs?.map((job) => {
  const payout = (job.payout_cents / 100).toFixed(2);

  return (
    <Link
      key={job.id}
      href={`/experience/${experienceId}/jobs/${job.id}`}
      className="block rounded-xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold truncate">{job.title}</h2>
            <span
  style={{
    backgroundColor: "#1e3a8a",
    color: "#dbeafe",
    border: "1px solid rgba(59,130,246,0.4)",
    boxShadow: "0 0 8px rgba(59,130,246,0.25)",
  }}
  className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
>
  Open
</span>

          </div>

          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {job.description}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-sm text-muted-foreground">Payout</div>
          <div className="text-xl font-semibold tracking-tight">
            ${payout}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-muted-foreground">
            Paid task
          </span>
        </div>

        <span className="text-sm text-muted-foreground hover:underline">
          View →
        </span>
      </div>
    </Link>
  );
})}

    </div>
  );
}
