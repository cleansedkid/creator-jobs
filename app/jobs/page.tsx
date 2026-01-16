import { supabaseServer } from "@/lib/supabase/server";
import Link from "next/link";
import { getDeploymentId } from "@/lib/whop/getDeploymentId";


export const dynamic = "force-dynamic";
export const revalidate = 0;



export default async function JobsPage() {
	const deployment_id = getDeploymentId(
		searchParams?.deployment_id ?? null
	 );
	 


	if (!deployment_id) {
	  return (
		 <div className="p-6 text-sm text-muted-foreground">
			Missing deployment context
		 </div>
	  );
	}
 

	const { data: jobs } = await supabaseServer
	.from("jobs")
	.select("*")
	.eq("deployment_id", deployment_id)
	.eq("status", "open")
	.order("created_at", { ascending: false });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold"> Jobs</h1>

        <Link href="/my-submissions" className="text-sm underline">
          My Submissions
        </Link>
      </div>

      {jobs?.length === 0 && (
        <p className="text-muted-foreground">No jobs yet.</p>
      )}

      {jobs?.map((job) => (
        <div key={job.id} className="border rounded-lg p-4 bg-background">
          <h2 className="font-medium">
            <Link href={`/jobs/${job.id}`} className="hover:underline cursor-pointer">
              {job.title}
            </Link>
          </h2>

          <p className="text-sm text-muted-foreground">{job.description}</p>
          <p className="mt-2 text-sm">💰 ${(job.payout_cents / 100).toFixed(2)}</p>
        </div>
      ))}
    </div>
  );
}
