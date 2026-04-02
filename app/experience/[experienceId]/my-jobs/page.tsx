"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";
import { useParams, useSearchParams } from "next/navigation";
import PaymentNoticeBanner from "@/app/components/PaymentNoticeBanner";

export default function MyJobsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
const paymentState = searchParams?.get("payment");
  const experienceId = params?.experienceId as string | undefined;

  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
	let cancelled = false;
 
	async function loadMe() {
		if (!experienceId || experienceId === "undefined") {
		  setMeLoading(false);
		  return;
		}
	 
		try {
		  const res = await fetch(
			 `/api/me?experienceId=${encodeURIComponent(experienceId)}`,
			 { cache: "no-store" }
		  );
	 
		  if (!res.ok) return;
	 
		  const data = await res.json();
	 
		  if (!cancelled) {
			 setCurrentUserId(data.userId ?? null);
			 setIsAdmin(data.isAdmin ?? false);
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
}, [experienceId]);
 

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
  if (!experienceId || meLoading || loading || isAdmin === null) {
	return (
	  <div className="mx-auto max-w-xl px-4 py-6 text-sm text-muted-foreground">
		 Loading experience…
	  </div>
	);
 }
 if (!isAdmin) {
	return (
	  <div className="mx-auto max-w-xl px-4 py-6 text-sm text-muted-foreground">
		 You don’t have permission to access this page.
	  </div>
	);
 }

 return (
	<div className="space-y-6">
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
<style>
  {`
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      font-size: 11px;
      font-weight: 600;
      border-radius: 9999px;
      letter-spacing: 0.2px;
    }

    .badge-blue {
      background: rgba(59, 130, 246, 0.15);
      color: #93c5fd;
      box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.25);
    }

    .badge-green {
      background: rgba(34, 197, 94, 0.15);
      color: #86efac;
      box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.25);
    }

    .badge-yellow {
      background: rgba(234, 179, 8, 0.15);
      color: #fde047;
      box-shadow: 0 0 0 1px rgba(234, 179, 8, 0.25);
    }

    .badge-red {
      background: rgba(239, 68, 68, 0.15);
      color: #fca5a5;
      box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.25);
    }
  `}
</style>


	  {/* Header */}
<div className="pb-2 space-y-3">

{/* 🔔 Payment notifications */}
{paymentState === "success" && (
  <PaymentNoticeBanner
	 tone="success"
	 title="Payment sent successfully"
	 message="The approved worker can access funds through their Whop payout account."
  />
)}

{paymentState === "failed" && (
  <PaymentNoticeBanner
	 tone="warning"
	 title="Payment was not completed"
	 message="No funds were sent. Review the job and try again when ready."
  />
)}

{paymentState === "cancelled" && (
  <PaymentNoticeBanner
	 tone="warning"
	 title="Checkout was cancelled"
	 message="Payment was not completed."
  />
)}

<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
  <div>
	 <h1 className="text-4xl font-bold tracking-tight">My Jobs</h1>
	 <p className="mt-1 text-sm text-muted-foreground">
		Jobs you’ve posted in this community.
	 </p>
  </div>

  <Link
	 href={`/experience/${experienceId}/my-jobs/new`}
	 className="cj-cta whitespace-nowrap self-start"
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
 
					  <span
  className={`badge ${
    job.status === "open" ? "badge-blue" : "badge-red"
  }`}
>
  {job.status === "open" ? "Open" : "Closed"}
</span>

 
					  {job.payment_status === "paid" && (
						 <span className="badge badge-green">
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
					  <span className="badge badge-yellow">
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
