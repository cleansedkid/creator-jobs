import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { getWhopUserId } from "@/lib/whop/getUserId";
import { headers } from "next/headers";


export default async function MyJobsPage() {
	let userId = await getWhopUserId();

	// 🧪 Local dev override
	if (process.env.NODE_ENV !== "production") {
	  userId = "local-dev-user";
	}
	
	const h = await headers();

const communityId =
  h.get("x-whop-community") ||
  h.get("X-Whop-Community");

if (!communityId) {
  return (
    <div className="mx-auto max-w-xl px-4 py-6 text-sm">
      Missing community context
    </div>
  );
}


  if (!userId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6 text-sm">
        Not authenticated
      </div>
    );
  }

  const { data: jobs, error } = await supabaseServer
  .from("jobs")
  .select(
    "id, title, status, payout_cents, platform_fee_cents"
  )
  .eq("creator_whop_user_id", userId)
  .eq("community_id", communityId)
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


      {jobs.length === 0 && (
        <div className="text-sm text-muted-foreground">
          You haven’t posted any jobs yet.
        </div>
      )}

      {jobs.map((job) => (
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

          {job.status === "closed" &&
            job.platform_fee_cents != null && (
              <div className="text-xs text-muted-foreground">
                Platform fee: $
                {(job.platform_fee_cents / 100).toFixed(2)}
              </div>
            )}
        </Link>
      ))}
    </div>
  );
}
