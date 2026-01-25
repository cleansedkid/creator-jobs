import { supabaseServer } from "@/lib/supabase/server";
import { headers } from "next/headers";
import Link from "next/link";
import { whopsdk } from "@/lib/whop-sdk";

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
  params: { experienceId: string };
}) {
  const experienceId = params.experienceId;
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

  const { data: submissions, error } = await supabaseServer
    .from("submissions")
    .select(
      `
      id,
      status,
      proof_url,
      created_at,
      jobs:job_id (
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

  return (
    <div className="mx-auto max-w-xl px-4 py-6 space-y-6">
      <Link
        href={`/experience/${experienceId}/jobs`}
        className="text-sm underline"
      >
        ← Back
      </Link>

      <h1 className="text-2xl font-semibold">My Submissions</h1>

      {(!submissions || submissions.length === 0) && (
        <p className="text-muted-foreground">
          You haven’t submitted any work yet.
        </p>
      )}

      {submissions?.map((sub: any) => (
        <div key={sub.id} className="rounded-lg border p-4 space-y-2">
          <div className="font-medium">{sub.jobs?.title ?? "Job"}</div>

          <div className="text-sm text-muted-foreground">
            Status: <span className="font-medium">{sub.status}</span>
          </div>

          <div className="text-sm">
            💰 {(((sub.jobs?.payout_cents ?? 0) as number) / 100).toFixed(2)}
          </div>

          <Link
            href={sub.proof_url}
            target="_blank"
            className="text-sm underline"
          >
            View submission
          </Link>
        </div>
      ))}
    </div>
  );
}
