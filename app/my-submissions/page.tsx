import { supabaseServer } from "@/lib/supabase/server";
import { headers } from "next/headers";
import Link from "next/link";
import { whopsdk } from "@/lib/whop-sdk";
import { getDeploymentId } from "@/lib/whop/getDeploymentId";

export const dynamic = "force-dynamic";
export const revalidate = 0;


async function getWorkerWhopUserId() {
  // Works reliably in embedded + server components
  const h = await headers();
  const { userId } = await whopsdk.verifyUserToken(h);

  if (!userId) return null;
  return userId;
}

export default async function MySubmissionsPage() {
  const worker_whop_user_id = await getWorkerWhopUserId();
  const deployment_id = await getDeploymentId();

  if (!worker_whop_user_id) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6 text-sm">
        Not authenticated
      </div>
    );
  }

  if (!deployment_id) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6 text-sm">
        Missing deployment context
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
        deployment_id
      )
    `
    )
    .eq("worker_whop_user_id", worker_whop_user_id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6 text-sm">
        Failed to load submissions
      </div>
    );
  }

  // Extra safety: filter out any rows whose job isn't in this deployment
  const filtered = (submissions ?? []).filter(
    (sub: any) => sub.jobs?.deployment_id === deployment_id
  );

  return (
    <div className="mx-auto max-w-xl px-4 py-6 space-y-6">
      <Link href="/jobs" className="text-sm underline">
        ← Back
      </Link>

      <h1 className="text-2xl font-semibold">My Submissions</h1>

      {filtered.length === 0 && (
        <p className="text-muted-foreground">
          You haven’t submitted any work yet.
        </p>
      )}

      {filtered.map((sub: any) => (
        <div key={sub.id} className="rounded-lg border p-4 space-y-2">
          <div className="font-medium">{sub.jobs?.title ?? "Job"}</div>

          <div className="text-sm text-muted-foreground">
            Status: <span className="font-medium">{sub.status}</span>
          </div>

          <div className="text-sm">
            💰 {(((sub.jobs?.payout_cents ?? 0) as number) / 100).toFixed(2)}
          </div>

          <Link href={sub.proof_url} target="_blank" className="text-sm underline">
            View submission
          </Link>
        </div>
      ))}
    </div>
  );
}

