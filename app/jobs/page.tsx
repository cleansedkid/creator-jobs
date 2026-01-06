import { supabaseServer } from "@/lib/supabase/server";
import Link from "next/link";
import { headers } from "next/headers";



export default async function JobsPage() {
	const h = await headers();
	const community_id =
	  h.get("x-whop-community") ||
	  h.get("X-Whop-Community") ||
	  "local-dev-community";
	
	const { data: jobs } = await supabaseServer
	  .from("jobs")
	  .select("*")
	  .eq("community_id", community_id)
	  .eq("status", "open")
	  .order("created_at", { ascending: false });
	
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Creator Jobs</h1>

      {jobs?.length === 0 && (
        <p className="text-muted-foreground">No jobs yet.</p>
      )}

      {jobs?.map(job => (
        <div
          key={job.id}
          className="border rounded-lg p-4 bg-background"
        >
          <h2 className="font-medium">
  <Link
    href={`/jobs/${job.id}`}
    className="hover:underline cursor-pointer"
  >
    {job.title}
  </Link>
</h2>

          <p className="text-sm text-muted-foreground">{job.description}</p>
          <p className="mt-2 text-sm">
            💰 ${(job.payout_cents / 100).toFixed(2)}
          </p>
        </div>
      ))}
    </div>
  );
}
