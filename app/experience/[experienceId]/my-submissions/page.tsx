import { supabaseAdmin } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import Link from "next/link";
import { whopsdk } from "@/lib/whop-sdk";
import PayoutSetupCta from "@/app/components/PayoutSetupCta";
import ManagePayoutsButton from "@/app/components/ManagePayoutsButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function safeGetWorkerWhopUserId(): Promise<string | null> {
  try {
    const h = await headers();
    const { userId } = await whopsdk.verifyUserToken(h);
    return userId ?? null;
  } catch {
    return null;
  }
}

export default async function MySubmissionsPage({
	params,
 }: {
	params: Promise<{ experienceId: string }>;
 }) {
	const { experienceId } = await params;
  const worker_whop_user_id = await safeGetWorkerWhopUserId();

  if (!worker_whop_user_id) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6 space-y-4">
        <Link
          href={`/experience/${experienceId}/jobs`}
          className="text-sm underline"
        >
          ← Back
        </Link>

        <div className="text-sm text-muted-foreground">
          Reloading context… If this persists, refresh the page.
        </div>
      </div>
    );
  }

  const { data: submissions, error } = await supabaseAdmin
  .from("submissions")
  .select(
	 `
	 id,
	 status,
	 proof_url,
	 created_at,
	 experience_id,
	 jobs:job_id!left (
		id,
		title,
		payout_cents,
		experience_id
	 )
  `
  )
  .eq("worker_whop_user_id", worker_whop_user_id)
  .eq("experience_id", experienceId)
  .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6 text-sm">
        Failed to load submissions
      </div>
    );
  }

  const { data: workerPayoutAccount } = await supabaseAdmin
  .from("worker_payout_accounts")
  .select("worker_company_id, onboarding_status, payouts_enabled")
  .eq("whop_user_id", worker_whop_user_id)
  .maybeSingle();

  const totalEarnedCents = (submissions ?? []).reduce((sum: number, sub: any) => {
	if (sub.status !== "paid") return sum;
	return sum + Number(sub.jobs?.payout_cents ?? 0);
 }, 0);
 
 const totalEarned = (totalEarnedCents / 100).toFixed(2);

 const hasApprovedOrPaidSubmission = (submissions ?? []).some(
	(sub: any) => sub.status === "approved" || sub.status === "paid"
 );
 
 const showPayoutSetupCta =
	hasApprovedOrPaidSubmission &&
	(!workerPayoutAccount || !workerPayoutAccount.payouts_enabled);

  return (
	<div className="space-y-6">
	  {/* Header */}
	  <div className="pb-2">
		 <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
			<div>
			  <h1 className="text-4xl font-bold tracking-tight">
				 My Submissions
			  </h1>
			  <p className="mt-1 text-sm text-muted-foreground">
			  Track the status of your submitted work and completed earnings.
			  </p>
			</div>
		 </div>
	  </div>
	  <div className="flex items-start justify-between border-b border-white/10 pb-4">
  <div>
    <div className="text-sm text-muted-foreground">Total earnings</div>
    <div className="text-2xl font-semibold tracking-tight">
      ${totalEarned}
    </div>
    <div className="mt-1 text-xs text-muted-foreground">
      From paid submissions
    </div>
  </div>

  <ManagePayoutsButton experienceId={experienceId} />
</div>
{showPayoutSetupCta && (
  <>
    {/* Payout explainer */}
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-medium">
        Payout setup required for approved work
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        To receive earnings, complete payout setup through Whop. This includes identity verification and connecting a payout method.
      </p>
    </div>

    {/* CTA */}
    <PayoutSetupCta experienceId={experienceId} />
  </>
)}
 
	  {(!submissions || submissions.length === 0) && (
		 <p className="text-muted-foreground">
			You haven’t submitted any work yet. Submitted work will appear here.
		 </p>
	  )}
 
	  <div className="h-px bg-white/10 my-2" />
 
	  
	  {submissions?.map((sub: any) => {
		 const payout = (
			((sub.jobs?.payout_cents ?? 0) as number) / 100
		 ).toFixed(2);
 
		 const statusLabel =
			sub.status === "pending"
			  ? "Pending review"
			  : sub.status === "approved"
			  ? "Approved"
			  : sub.status === "paid"
			  ? "Paid"
			  : sub.status === "rejected"
			  ? "Rejected"
			  : sub.status;
 
		 const statusHint =
			sub.status === "pending"
			  ? "The job poster will review your submission soon."
			  : sub.status === "approved"
			  ? "Approved — awaiting payment from the job poster."
			  : sub.status === "paid"
			  ? "Payment has been released."
			  : sub.status === "rejected"
			  ? "Not accepted — check the job details for next steps."
			  : null;
 
		 return (
			<div
			  key={sub.id}
			  className="rounded-xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
			>
			  <div className="flex items-start justify-between gap-4">
				 <div className="min-w-0">
					<div className="flex items-center gap-2">
					  <h2 className="text-base font-semibold truncate">
						 {sub.jobs?.title ?? "Job"}
					  </h2>
 
					  <span
  className={`cj-pill ${
    sub.status === "pending"
      ? "cj-pill-pending"
      : sub.status === "approved"
      ? "cj-pill-approved"
      : sub.status === "paid"
      ? "cj-pill-paid"
      : sub.status === "rejected"
      ? "cj-pill-rejected"
      : ""
  }`}
>
  {statusLabel}
</span>

					</div>
 
					{statusHint && (
					  <p className="mt-1 text-sm text-muted-foreground">
						 {statusHint}
					  </p>
					)}
				 </div>
 
				 <div className="shrink-0 text-right">
					<div className="text-sm text-muted-foreground">
					  Payout
					</div>
					<div className="text-xl font-semibold tracking-tight">
					  ${payout}
					</div>
				 </div>
			  </div>
 
			  <div className="mt-4 flex items-center justify-between">
				 <div className="flex gap-2">
					<span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-muted-foreground">
					  Submitted work
					</span>
				 </div>
 
				 {sub.proof_url && (
					<Link
					  href={sub.proof_url}
					  target="_blank"
					  className="text-sm text-muted-foreground hover:underline"
					>
					  View submission →
					</Link>
				 )}
			  </div>
			</div>
		 );
	  })}
	</div>
 );
 
}
