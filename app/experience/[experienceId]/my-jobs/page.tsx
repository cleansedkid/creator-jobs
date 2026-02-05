"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";

export default function MyJobsPage() {
  const params = useParams();
  const experienceId = params?.experienceId as string | undefined;

  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [meLoading, setMeLoading] = useState(true);

  useEffect(() => {
	let cancelled = false;
 
	async function loadMe() {
	  try {
		 const res = await fetch("/api/me", { cache: "no-store" });
		 if (!res.ok) return;
 
		 const data = await res.json();
		 if (!cancelled) {
			setCurrentUserId(data.userId ?? null);
		 }
	  } catch {
		 // fail silently
	  } finally {
		 if (!cancelled) {
			setMeLoading(false);
		 }
	  }
	}
 
	loadMe();
	return () => {
	  cancelled = true;
	};
 }, []);
 

  useEffect(() => {
	if (
		!experienceId ||
		experienceId === "undefined" ||
		!currentUserId
	 ) return;
	 

    supabaseClient
	 .from("jobs")
	 .select("*")
	 .eq("experience_id", experienceId)
	 .eq("creator_whop_user_id", currentUserId)
	 .order("created_at", { ascending: false })	 
  .then(({ data }) => {
    setJobs(data ?? []);
    setLoading(false);
  });

}, [experienceId, currentUserId, meLoading]);


  // 🛡️ Guard
  if (!experienceId || meLoading || loading) {
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

      {jobs.length === 0 && (
        <div className="text-sm text-muted-foreground">
          You haven’t posted any jobs yet.
        </div>
      )}

      {jobs.map((job) => (
        <Link
          key={job.id}
          href={`/experience/${experienceId}/jobs/${job.id}`}
          className="block rounded-lg border p-4 space-y-1 hover:bg-muted transition cursor-pointer"
        >
          <div className="font-medium">{job.title}</div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
  <span>Status: {job.status}</span>

  {job.status === "closed" && job.payment_status === "paid" && (
    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
      Paid
    </span>
  )}
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
