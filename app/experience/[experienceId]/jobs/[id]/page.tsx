"use client";


import Link from "next/link";
import { getDevRole } from "@/lib/auth/role";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";


export const dynamic = "force-dynamic";



export default function JobDetailPage() {
	const params = useParams();
	const searchParams = useSearchParams();
 
	const experienceId = params?.experienceId as string | undefined;
	const jobId = params?.id as string | undefined;
	const showSubmitted = searchParams?.get("submitted") === "1";

	const [job, setJob] = useState<any | null>(null);
const [submissions, setSubmissions] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
const [currentUserId, setCurrentUserId] = useState<string | null>(null);

const handleResumePayment = async () => {
	if (!experienceId || !jobId) return;
 
	const res = await fetch(
	  `/api/experience/${experienceId}/jobs/${jobId}/resume-payment`,
	  { method: "POST" }
	);
 
	if (!res.ok) {
	  alert("Unable to resume payment.");
	  return;
	}
 
	const data = await res.json();
	window.location.href = data.purchase_url;
 };
 

useEffect(() => {
	let cancelled = false;
 
	async function loadMe() {
	  try {
		 const res = await fetch("/api/me");
		 if (!res.ok) return;
 
		 const data = await res.json();
		 if (!cancelled) {
			setCurrentUserId(data.userId ?? null);
		 }
	  } catch {
		 // fail silently — user just won't be treated as creator
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
	  !jobId ||
	  experienceId === "undefined" ||
	  jobId === "undefined" ||
	  !currentUserId
	) {
	  return;
	}
 
	let cancelled = false;
 
	async function loadSubmissions() {
	  try {
		const res = await fetch(
			`/api/experience/${experienceId}/jobs/${jobId}/submissions`,
			{
			  cache: "no-store",
			  credentials: "include", // 👈 REQUIRED
			}
		 );
		 
 
		 if (!res.ok) return;
 
		 const data = await res.json();
 
		 if (!cancelled) {
			setSubmissions(data.submissions ?? []);
		 }
	  } catch {
		 // fail silently
	  }
	}
 
	loadSubmissions();
 
	return () => {
	  cancelled = true;
	};
 }, [experienceId, jobId, currentUserId]);
 
 

useEffect(() => {
	if (
	  !experienceId ||
	  !jobId ||
	  experienceId === "undefined" ||
	  jobId === "undefined"
	) {
	  return;
	}
 
	let cancelled = false;
 
	async function load() {
	  const { data: jobData } = await supabaseClient
		 .from("jobs")
		 .select("*")
		 .eq("id", jobId)
		 .eq("experience_id", experienceId)
		 .single();
 
	  if (!jobData) {
		 if (!cancelled) setLoading(false);
		 return;
	  }
 
	  

 
	  if (!cancelled) {
		 setJob(jobData)
		 setLoading(false);
	  }
	}
 
	load();
	return () => {
	  cancelled = true;
	};
}, [experienceId, jobId, currentUserId]);

 

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

  

  // Keep dev role behavior
  const devRole = getDevRole();
  const isDevCreator = devRole === "creator";
  const isDevWorker = devRole === "worker";

  const isCreator =
  currentUserId != null &&
  job.creator_whop_user_id === currentUserId;

const canSubmit =
  !isCreator && job.status === "open";

const canReview = isCreator;

const paymentStarted =
  job.payment_status === "requires_payment" &&
  !!job.whop_checkout_id;

const canApprove =
  isCreator &&
  job.status === "open" &&
  !job.approved_submission_id &&
  !paymentStarted;

const canResumePayment =
  isCreator &&
  paymentStarted;



  

  const backHref = `/experience/${experienceId}/jobs`;


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
        <div className="text-xs text-muted-foreground">
          Status: {job.status}
        </div>
      </div>

      {/* Submit (worker view) */}
      {canSubmit ? (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="font-medium">Submit work</div>

          <form
            action={`/experience/${experienceId}/jobs/${jobId}/submit`}
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

{canApprove && (
                <div className="flex gap-2 pt-2">
                  <form
                    action={`/experience/${experienceId}/jobs/${jobId}/submissions/${s.id}/approve`}
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
                    action={`/experience/${experienceId}/jobs/${jobId}/submissions/${s.id}/reject`}
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
			           {canResumePayment && (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="font-medium">Payment not completed</div>

              <p className="text-sm text-muted-foreground">
                You already approved a submission. Finish payment to close this job.
              </p>

              <button
                onClick={handleResumePayment}
                 className="w-full rounded-md border px-4 py-2 font-medium cursor-pointer hover:bg-muted transition"
              >
                Resume Payment
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
