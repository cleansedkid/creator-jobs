import Link from "next/link";
import { getAuthContext } from "@/lib/whop/getAuthContext";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function usd(cents: number | null | undefined) {
  const n = typeof cents === "number" ? cents : 0;
  return `$${(n / 100).toFixed(2)}`;
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default async function AdminToolsPage({
	params,
 }: {
	params: Promise<{ experienceId: string }>;
 }) {
	const { experienceId } = await params;

  // Whop sometimes renders with literal "undefined"
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
      <div className="mx-auto max-w-xl px-4 py-6 text-sm text-muted-foreground">
        Reloading context… If this persists, refresh the page.
      </div>
    );
  }

  if (!auth.isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6 space-y-3">
        <Link href={`/experience/${experienceId}/jobs`} className="text-sm underline">
          ← Back
        </Link>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
          You don’t have permission to access Admin Tools.
        </div>
      </div>
    );
  }

  // ----------------------------
  // PAYMENT HISTORY (Admin-only)
  // ----------------------------
  const { data: jobs, error: jobsError } = await supabaseAdmin
    .from("jobs")
    .select(
      `
      id,
      title,
      status,
      payment_status,
      payout_cents,
      platform_fee_cents,
      total_charge_cents,
      whop_checkout_id,
      approved_submission_id,
      creator_whop_user_id,
      created_at
      `
    )
    .eq("experience_id", experienceId)
    // only show jobs relevant to payment history
    .not("approved_submission_id", "is", null)
    .order("created_at", { ascending: false });

  if (jobsError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-3">
        <h1 className="text-3xl font-bold">Admin Tools</h1>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-red-200">
          Failed to load payment history: {jobsError.message}
        </div>
      </div>
    );
  }

  const submissionIds = Array.from(
    new Set((jobs ?? []).map((j) => j.approved_submission_id).filter(Boolean))
  ) as string[];

  const submissionsById = new Map<string, any>();

  if (submissionIds.length > 0) {
    const { data: subs } = await supabaseAdmin
      .from("submissions")
      .select("id, worker_whop_user_id, status, created_at, proof_url")
      .in("id", submissionIds);

    (subs ?? []).forEach((s) => submissionsById.set(s.id, s));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Admin Tools</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Payments, audit visibility, and platform settings for this community.
            </p>
          </div>
			 <Link
  href={`/experience/${experienceId}/admin/audit`}
  className="cj-cta whitespace-nowrap self-start"
>
  Audit Log →
</Link>
        </div>
      </div>

                                                        

      {/* Payment History */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-medium">Payment History</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Jobs with an approved submission. Shows payout + fee breakdown.
            </p>
          </div>
        </div>

        <div className="mt-4 h-px bg-white/10" />

        {(!jobs || jobs.length === 0) ? (
          <div className="mt-4 text-sm text-muted-foreground">
            No payment history yet.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {jobs.map((job) => {
              const sub = job.approved_submission_id
                ? submissionsById.get(job.approved_submission_id)
                : null;

              const statusLabel =
                job.payment_status === "paid"
                  ? "Paid"
                  : job.payment_status === "requires_payment"
                  ? "Awaiting payment"
                  : job.payment_status ?? "—";

              const pillClass =
                job.payment_status === "paid"
                  ? "cj-pill cj-pill-paid"
                  : job.payment_status === "requires_payment"
                  ? "cj-pill cj-pill-pending"
                  : "cj-pill";

              return (
                <div
                  key={job.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="truncate text-base font-semibold">
                          {job.title ?? "Job"}
                        </div>
                        <span className={pillClass}>{statusLabel}</span>
                      </div>

                      <div className="mt-2 grid gap-1 text-sm text-muted-foreground">
                        <div>
                          <span className="text-foreground/90">Approved submission id:</span>{" "}
                          {job.approved_submission_id ?? "—"}
                        </div>
                        <div>
                          <span className="text-foreground/90">Worker:</span>{" "}
                          {sub?.worker_whop_user_id ?? "—"}
                        </div>
                        <div>
                          <span className="text-foreground/90">Checkout id:</span>{" "}
                          {job.whop_checkout_id ?? "—"}
                        </div>
                        <div>
                          <span className="text-foreground/90">Approved at:</span>{" "}
                          {fmtDate(sub?.created_at)}
                        </div>
                      </div>

                      {sub?.proof_url && (
                        <div className="mt-2">
                          <a
                            className="text-sm text-muted-foreground hover:underline break-all"
                            href={sub.proof_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View submission →
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="text-sm text-muted-foreground">Payout</div>
                      <div className="text-xl font-semibold tracking-tight">
                        {usd(job.payout_cents)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <div className="text-xs text-muted-foreground">Platform fee</div>
                      <div className="text-sm font-semibold">{usd(job.platform_fee_cents)}</div>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <div className="text-xs text-muted-foreground">Total charged</div>
                      <div className="text-sm font-semibold">{usd(job.total_charge_cents)}</div>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <div className="text-xs text-muted-foreground">Job status</div>
                      <div className="text-sm font-semibold">
                        {job.status === "open" ? "Open" : job.status === "closed" ? "Closed" : (job.status ?? "—")}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-muted-foreground">
                    Created: {fmtDate(job.created_at)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      
    </div>
  );
}