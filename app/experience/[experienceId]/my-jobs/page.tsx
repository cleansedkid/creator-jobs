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
	<div className="space-y-6">
	  {/* Header */}
	  <div className="pb-2">
		 <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
			<div>
			  <h1 className="text-4xl font-bold tracking-tight">My Jobs</h1>
			  <p className="mt-1 text-sm text-muted-foreground">
				 Jobs you’ve posted in this community.
			  </p>
			</div>
 
			<Link
			  href={`/experience/${experienceId}/my-jobs/new`}
			  className="rounded-md border border-white/10 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition cursor-pointer whitespace-nowrap self-start"
			>
			  + New Job
			</Link>
		 </div>
	  </div>
 
	  {jobs.length === 0 && (
		 <p className="text-muted-foreground">
			You haven’t posted any jobs yet. Jobs you post will appear here for
			tracking and payment history.
		 </p>
	  )}
 
	  <div className="h-px bg-white/10 my-2" />
 
	  {jobs.map((job) => {
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
					  <h2 className="text-base font-semibold truncate">
						 {job.title}
					  </h2>
 
					  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-muted-foreground">
						 {job.status === "open" ? "Open" : "Closed"}
					  </span>
 
					  {job.payment_status === "paid" && (
						 <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-muted-foreground">
							Paid
						 </span>
					  )}
					</div>
 
					{job.status === "closed" &&
					  job.platform_fee_cents != null && (
						 <p className="mt-1 text-sm text-muted-foreground">
							Platform fee: $
							{(job.platform_fee_cents / 100).toFixed(2)}
						 </p>
					  )}
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
 
					{job.payment_status === "requires_payment" && (
					  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-muted-foreground">
						 Awaiting payment
					  </span>
					)}
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
