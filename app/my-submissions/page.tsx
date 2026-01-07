import { supabaseServer } from "@/lib/supabase/server";
import { headers } from "next/headers";
import Link from "next/link";

export default async function MySubmissionsPage() {
  const h = await headers();

  const raw =
    h.get("x-whop-user") ||
    h.get("X-Whop-User");

  let worker_whop_user_id = "local-dev-user";

  if (raw) {
    try {
      const user = JSON.parse(raw);
      worker_whop_user_id = user?.id || "local-dev-user";
    } catch {}
  }

  const { data: submissions } = await supabaseServer
    .from("submissions")
    .select(`
      id,
      status,
      proof_url,
      created_at,
      jobs (
        id,
        title,
        payout_cents
      )
    `)
    .eq("worker_whop_user_id", worker_whop_user_id)
    .order("created_at", { ascending: false });

	 return (
		<div className="mx-auto max-w-xl px-4 py-6 space-y-6">
		  <Link
			 href="/jobs"
			 className="text-sm underline"
		  >
			 ← Back
		  </Link>
	 
		  <h1 className="text-2xl font-semibold">My Submissions</h1>
	 

      {submissions?.length === 0 && (
        <p className="text-muted-foreground">
          You haven’t submitted any work yet.
        </p>
      )}

      {submissions?.map((sub) => (
        <div
          key={sub.id}
          className="rounded-lg border p-4 space-y-2"
        >
          <div className="font-medium">
            {sub.jobs?.title}
          </div>

          <div className="text-sm text-muted-foreground">
            Status: <span className="font-medium">{sub.status}</span>
          </div>

          <div className="text-sm">
            💰 ${(sub.jobs?.payout_cents / 100).toFixed(2)}
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
