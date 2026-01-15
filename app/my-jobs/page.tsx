import Link from "next/link";
import { headers } from "next/headers";
import { getDeploymentId } from "@/lib/whop/getDeploymentId";
import { supabaseServer } from "@/lib/supabase/server";
import { whopsdk } from "@/lib/whop-sdk";

export const dynamic = "force-dynamic";
export const revalidate = 0;


async function getCreatorWhopUserId() {
  // In dev, Whop headers/tokens may not exist.
  // You can optionally keep this fallback if you want local-only testing.
  if (process.env.NODE_ENV !== "production") {
    return "local-dev-user";
  }

  const h = await headers();
  const { userId } = await whopsdk.verifyUserToken(h);

  if (!userId) return null;
  return userId;
}

export default async function MyJobsPage() {
  const userId = await getCreatorWhopUserId();
  const deployment_id = await getDeploymentId();

  if (!userId) {
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

  const { data: jobs, error } = await supabaseServer
    .from("jobs")
    .select("id, title, status, payout_cents, platform_fee_cents")
    .eq("creator_whop_user_id", userId)
    .eq("deployment_id", deployment_id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6 text-sm">
        Failed to load jobs
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">My Jobs</h1>

        <Link
          href="/my-jobs/new"
          className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted transition"
        >
          + New Job
        </Link>
      </div>

      {jobs?.length === 0 && (
        <div className="text-sm text-muted-foreground">
          You haven’t posted any jobs yet.
        </div>
      )}

      {jobs?.map((job) => (
        <Link
          key={job.id}
          href={`/jobs/${job.id}`}
          className="block rounded-lg border p-4 space-y-1 hover:bg-muted transition"
        >
          <div className="font-medium">{job.title}</div>

          <div className="text-sm text-muted-foreground">
            Status: {job.status}
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

